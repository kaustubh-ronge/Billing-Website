export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';

const GST_STATES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh"
};

export async function GET(req) {
  const ctx = await requirePermission('dashboard:view');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    const now = new Date();
    const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const currentMonth = monthParam ? parseInt(monthParam) : now.getMonth() + 1; // 1-indexed

    // Range dates
    const startDate = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
    const endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const shopId = user.shopId;

    // Fetch Shop Profile Details (to get shop GSTIN & state code)
    const shop = await db.shop.findUnique({
      where: { id: shopId },
      select: {
        taxId: true,
        businessName: true,
        businessType: true,
        currency: true,
        address: true,
        taxRate: true,
      },
    });

    const shopGst = shop?.taxId?.trim() || "";
    const shopStateCode = shopGst.substring(0, 2);

    // Fetch all products in the shop catalog to resolve purchase tax rates & HSN codes
    const catalogProducts = await db.product.findMany({
      where: { shopId },
      select: {
        name: true,
        taxRate: true,
        hsnSac: true,
        unit: true,
        description: true,
      },
    });

    const nameToTaxRateMap = new Map();
    const nameToHsnMap = new Map();
    const nameToUnitMap = new Map();
    const nameToDescMap = new Map();

    catalogProducts.forEach((p) => {
      const key = p.name.toLowerCase().trim();
      nameToTaxRateMap.set(key, p.taxRate);
      nameToHsnMap.set(key, p.hsnSac || "");
      nameToUnitMap.set(key, p.unit || "PCS");
      nameToDescMap.set(key, p.description || "");
    });

    // Fetch all invoices for this month
    const invoices = await db.invoice.findMany({
      where: {
        shopId,
        isDeleted: false,
        issuedAt: { gte: startDate, lte: endDate },
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { issuedAt: 'asc' },
    });

    // HSN/SAC group aggregates map
    const hsnSummaryMap = {};

    const salesRegister = [];

    // Process Sales Register with precise Indian GST splits (CGST + SGST vs IGST)
    invoices.forEach((inv) => {
      const discountPercentage = inv.discountPercentage || 0;

      // Determine Inter-state (IGST) vs Intra-state (CGST + SGST)
      const customerGst = inv.customer?.gstNumber?.trim() || "";
      let customerStateCode = "";
      let customerStateName = "";

      if (customerGst && customerGst.length >= 2) {
        customerStateCode = customerGst.substring(0, 2);
        customerStateName = GST_STATES[customerStateCode] || "";
      } else {
        // Resolve state from address to support automatic B2C interstate detection
        const addressLower = (inv.customer?.address || "").toLowerCase();
        for (const [code, name] of Object.entries(GST_STATES)) {
          if (addressLower.includes(name.toLowerCase())) {
            customerStateCode = code;
            customerStateName = name;
            break;
          }
        }
      }

      let isInterstate = false;
      if (shopStateCode && customerStateCode) {
        isInterstate = shopStateCode !== customerStateCode;
      }

      const placeOfSupply = customerStateName 
        ? `${customerStateName} (${customerStateCode})` 
        : (inv.customer?.address || "Local");

      // Group items by tax rate slab
      const taxRateGroups = {};

      inv.items.forEach((item) => {
        const qty = item.quantity;
        const unitPrice = item.unitPrice;
        const taxRate = item.product?.taxRate || 0;
        const hsn = item.product?.hsnSac?.trim() || "UNCLASSIFIED";

        const itemSubtotal = qty * unitPrice; // tax inclusive price
        const itemDiscounted = itemSubtotal * (1 - discountPercentage / 100);
        const taxableVal = itemDiscounted / (1 + (taxRate / 100));
        const taxAmt = itemDiscounted - taxableVal;

        // Group by tax slab (for GSTR-1 rate slab reporting)
        if (!taxRateGroups[taxRate]) {
          taxRateGroups[taxRate] = {
            taxRate,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
            grandTotal: 0,
          };
        }

        taxRateGroups[taxRate].taxableValue += taxableVal;
        taxRateGroups[taxRate].totalTax += taxAmt;
        taxRateGroups[taxRate].grandTotal += itemDiscounted;

        // Calculate splits
        let cgst = 0;
        let sgst = 0;
        let igst = 0;

        if (isInterstate) {
          taxRateGroups[taxRate].igst += taxAmt;
          igst = taxAmt;
        } else {
          taxRateGroups[taxRate].cgst += taxAmt / 2;
          taxRateGroups[taxRate].sgst += taxAmt / 2;
          cgst = taxAmt / 2;
          sgst = taxAmt / 2;
        }

        // Add to HSN summary map (group by HSN + taxRate)
        const hsnKey = `${hsn}-${taxRate}`;
        if (!hsnSummaryMap[hsnKey]) {
          hsnSummaryMap[hsnKey] = {
            hsnSac: hsn,
            description: item.product?.description || item.product?.name || "Product Supply",
            unit: item.product?.unit || "PCS",
            quantity: 0,
            totalValue: 0,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            totalTax: 0,
            gstRate: `${taxRate}%`
          };
        }
        hsnSummaryMap[hsnKey].quantity += qty;
        hsnSummaryMap[hsnKey].totalValue += itemDiscounted;
        hsnSummaryMap[hsnKey].taxableValue += taxableVal;
        hsnSummaryMap[hsnKey].cgst += cgst;
        hsnSummaryMap[hsnKey].sgst += sgst;
        hsnSummaryMap[hsnKey].igst += igst;
        hsnSummaryMap[hsnKey].totalTax += taxAmt;
      });

      // Split invoice into multiple salesRegister entries (one for each tax slab)
      Object.values(taxRateGroups).forEach((g) => {
        salesRegister.push({
          id: `${inv.id}-${g.taxRate}`,
          invoiceNum: inv.invoiceNum,
          issuedAt: inv.issuedAt,
          customerName: inv.customer?.name || "Cash Customer",
          customerGst: customerGst || "",
          placeOfSupply,
          isInterstate,
          taxableValue: Math.round(g.taxableValue * 100) / 100,
          cgst: Math.round(g.cgst * 100) / 100,
          sgst: Math.round(g.sgst * 100) / 100,
          igst: Math.round(g.igst * 100) / 100,
          totalTax: Math.round(g.totalTax * 100) / 100,
          grandTotal: Math.round(g.grandTotal * 100) / 100,
          gstRate: `${g.taxRate}%`,
          gstRateDetails: [{
            taxRate: g.taxRate,
            taxableValue: Math.round(g.taxableValue * 100) / 100,
            cgst: Math.round(g.cgst * 100) / 100,
            sgst: Math.round(g.sgst * 100) / 100,
            igst: Math.round(g.igst * 100) / 100,
            totalTax: Math.round(g.totalTax * 100) / 100,
            grandTotal: Math.round(g.grandTotal * 100) / 100,
          }]
        });
      });
    });

    // Fetch all purchase ledger notes in that month
    const purchaseNotes = await db.purchaseNote.findMany({
      where: {
        shopId,
        isPurchase: true,
        noteDate: { gte: startDate, lte: endDate },
      },
      orderBy: { noteDate: 'asc' },
    });

    // Process Purchases with estimated ITC calculation splits (splitting by individual product row)
    let totalPurchaseValue = 0;
    let totalPurchaseTaxable = 0;
    let totalPurchaseCgst = 0;
    let totalPurchaseSgst = 0;
    let totalPurchaseIgst = 0;
    let totalPurchaseTax = 0;

    const purchaseRegister = [];

    purchaseNotes.forEach((note) => {
      const supplierGst = note.gstNumber?.trim() || "";
      const supplierStateCode = supplierGst.substring(0, 2);

      let isInterstate = false;
      if (shopStateCode && supplierStateCode && supplierStateCode.length === 2) {
        isInterstate = shopStateCode !== supplierStateCode;
      }

      try {
        if (note.productsBought && note.productsBought.startsWith("[")) {
          const products = JSON.parse(note.productsBought);
          products.forEach((prod, index) => {
            const amt = parseFloat(prod.amount || 0);
            const nameKey = (prod.name || "").toLowerCase().trim();
            const rate = prod.gstRate ? parseFloat(prod.gstRate) : (nameToTaxRateMap.get(nameKey) ?? shop?.taxRate ?? 18);

            const taxable = amt / (1 + (rate / 100));
            const tax = amt - taxable;

            let cgst = 0;
            let sgst = 0;
            let igst = 0;

            if (isInterstate) {
              igst = tax;
            } else {
              cgst = tax / 2;
              sgst = tax / 2;
            }

            totalPurchaseValue += amt;
            totalPurchaseTaxable += taxable;
            totalPurchaseCgst += cgst;
            totalPurchaseSgst += sgst;
            totalPurchaseIgst += igst;
            totalPurchaseTax += tax;

            purchaseRegister.push({
              id: `${note.id}-${index}`,
              companyName: note.companyName,
              gstNumber: supplierGst || "N/A",
              productName: prod.name || "Product Supply",
              productQty: prod.qty || "-",
              totalAmount: amt,
              noteDate: note.noteDate,
              remarks: note.remarks,
              taxableValue: Math.round(taxable * 100) / 100,
              cgst: Math.round(cgst * 100) / 100,
              sgst: Math.round(sgst * 100) / 100,
              igst: Math.round(igst * 100) / 100,
              totalTax: Math.round(tax * 100) / 100,
              gstRate: `${rate}%`,
            });
          });
        } else {
          // Fallback: entire amount at shop default tax rate
          const rate = shop?.taxRate ?? 18;
          const taxable = note.totalAmount / (1 + (rate / 100));
          const tax = note.totalAmount - taxable;
          let cgst = 0, sgst = 0, igst = 0;
          if (isInterstate) {
            igst = tax;
          } else {
            cgst = tax / 2;
            sgst = tax / 2;
          }

          totalPurchaseValue += note.totalAmount;
          totalPurchaseTaxable += taxable;
          totalPurchaseCgst += cgst;
          totalPurchaseSgst += sgst;
          totalPurchaseIgst += igst;
          totalPurchaseTax += tax;

          purchaseRegister.push({
            id: note.id,
            companyName: note.companyName,
            gstNumber: supplierGst || "N/A",
            productName: note.productsBought || "Product Supply",
            productQty: note.quantityBought || "-",
            totalAmount: note.totalAmount,
            noteDate: note.noteDate,
            remarks: note.remarks,
            taxableValue: Math.round(taxable * 100) / 100,
            cgst: Math.round(cgst * 100) / 100,
            sgst: Math.round(sgst * 100) / 100,
            igst: Math.round(igst * 100) / 100,
            totalTax: Math.round(tax * 100) / 100,
            gstRate: `${rate}%`,
          });
        }
      } catch (e) {
        // Fallback
        const rate = shop?.taxRate ?? 18;
        const taxable = note.totalAmount / (1 + (rate / 100));
        const tax = note.totalAmount - taxable;
        let cgst = 0, sgst = 0, igst = 0;
        if (isInterstate) {
          igst = tax;
        } else {
          cgst = tax / 2;
          sgst = tax / 2;
        }

        totalPurchaseValue += note.totalAmount;
        totalPurchaseTaxable += taxable;
        totalPurchaseCgst += cgst;
        totalPurchaseSgst += sgst;
        totalPurchaseIgst += igst;
        totalPurchaseTax += tax;

        purchaseRegister.push({
          id: note.id,
          companyName: note.companyName,
          gstNumber: supplierGst || "N/A",
          productName: note.productsBought || "Product Supply",
          productQty: note.quantityBought || "-",
          totalAmount: note.totalAmount,
          noteDate: note.noteDate,
          remarks: note.remarks,
          taxableValue: Math.round(taxable * 100) / 100,
          cgst: Math.round(cgst * 100) / 100,
          sgst: Math.round(sgst * 100) / 100,
          igst: Math.round(igst * 100) / 100,
          totalTax: Math.round(tax * 100) / 100,
          gstRate: `${rate}%`,
        });
      }
    });

    // Format HSN Summary array
    const hsnSummary = Object.values(hsnSummaryMap).map((h) => ({
      hsnSac: h.hsnSac,
      description: h.description,
      unit: h.unit,
      quantity: h.quantity,
      totalValue: Math.round(h.totalValue * 100) / 100,
      taxableValue: Math.round(h.taxableValue * 100) / 100,
      cgst: Math.round(h.cgst * 100) / 100,
      sgst: Math.round(h.sgst * 100) / 100,
      igst: Math.round(h.igst * 100) / 100,
      totalTax: Math.round(h.totalTax * 100) / 100,
      gstRate: h.gstRate,
    }));

    // Aggregates for Sales output summary
    const salesSummary = salesRegister.reduce((acc, row) => {
      acc.totalSalesValue += row.grandTotal;
      acc.totalTaxableSales += row.taxableValue;
      acc.totalCgst += row.cgst;
      acc.totalSgst += row.sgst;
      acc.totalIgst += row.igst;
      acc.totalTaxSales += row.totalTax;
      return acc;
    }, {
      totalSalesValue: 0,
      totalTaxableSales: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTaxSales: 0,
    });

    return NextResponse.json({
      shopName: shop?.businessName || "My Shop",
      shopGst,
      year: currentYear,
      month: currentMonth,
      sales: salesRegister,
      purchases: purchaseRegister,
      hsnSummary,
      summary: {
        totalSalesValue: Math.round(salesSummary.totalSalesValue * 100) / 100,
        totalTaxableSales: Math.round(salesSummary.totalTaxableSales * 100) / 100,
        totalCgst: Math.round(salesSummary.totalCgst * 100) / 100,
        totalSgst: Math.round(salesSummary.totalSgst * 100) / 100,
        totalIgst: Math.round(salesSummary.totalIgst * 100) / 100,
        totalTaxSales: Math.round(salesSummary.totalTaxSales * 100) / 100,
      },
      itcSummary: {
        totalPurchaseValue: Math.round(totalPurchaseValue * 100) / 100,
        totalPurchaseTaxable: Math.round(totalPurchaseTaxable * 100) / 100,
        totalCgst: Math.round(totalPurchaseCgst * 100) / 100,
        totalSgst: Math.round(totalPurchaseSgst * 100) / 100,
        totalIgst: Math.round(totalPurchaseIgst * 100) / 100,
        totalTaxPurchases: Math.round(totalPurchaseTax * 100) / 100,
      },
      netLiability: {
        cgst: Math.round((salesSummary.totalCgst - totalPurchaseCgst) * 100) / 100,
        sgst: Math.round((salesSummary.totalSgst - totalPurchaseSgst) * 100) / 100,
        igst: Math.round((salesSummary.totalIgst - totalPurchaseIgst) * 100) / 100,
        netTaxPayable: Math.round((salesSummary.totalTaxSales - totalPurchaseTax) * 100) / 100,
      }
    });

  } catch (error) {
    console.error('Error generating CA report data:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
