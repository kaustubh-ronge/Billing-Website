import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || ''; // PAID, PARTIAL, PENDING, DRAFT
    const customerId = searchParams.get('customerId') || '';

    let whereClause = {
      shopId: user.shopId,
    };

    if (status) {
      whereClause.status = status;
    }

    if (customerId) {
      whereClause.customerId = customerId;
    }

    // Apply customer/invoice details search
    if (search) {
      whereClause.OR = [
        { invoiceNum: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ]
          }
        }
      ];
    }

    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true
      },
      orderBy: { issuedAt: 'desc' }
    });

    return NextResponse.json({ invoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { customerId, items, discountPercentage, amountPaid, paymentMethod, notes, issuedAt } = body;

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Customer ID and Invoice Items are required.' }, { status: 400 });
    }

    // Validate Customer
    const customer = await db.customer.findFirst({
      where: { id: customerId, shopId: user.shopId }
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found.' }, { status: 404 });
    }

    // Calculate totals based on DB products (for safety)
    const dbProductIds = items.map(item => item.productId);
    const dbProducts = await db.product.findMany({
      where: {
        id: { in: dbProductIds },
        shopId: user.shopId
      }
    });

    const productsMap = new Map(dbProducts.map(p => [p.id, p]));

    let calculatedTax = 0;
    let calculatedSubtotal = 0;
    const discountPercent = parseFloat(discountPercentage || 0);

    const invoiceItemsData = [];
    const stockUpdates = [];

    for (const item of items) {
      const prod = productsMap.get(item.productId);
      if (!prod) {
        return NextResponse.json({ error: `Product ID ${item.productId} not found in inventory.` }, { status: 400 });
      }

      const qty = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice || prod.price);
      
      const itemSubtotal = qty * unitPrice;
      const itemDiscount = itemSubtotal * (discountPercent / 100);
      const taxableAmount = itemSubtotal - itemDiscount;
      const itemTax = taxableAmount * (prod.taxRate / 100);

      calculatedSubtotal += itemSubtotal;
      calculatedTax += itemTax;

      invoiceItemsData.push({
        productId: prod.id,
        quantity: qty,
        unitPrice: unitPrice
      });

      // Prepare stock inventory decrease
      if (prod.trackInventory && prod.stockCount !== null) {
        stockUpdates.push({
          id: prod.id,
          newStock: Math.max(0, prod.stockCount - qty)
        });
      }
    }

    const discountAmount = calculatedSubtotal * (discountPercent / 100);
    const grandTotal = Math.round(((calculatedSubtotal - discountAmount) + calculatedTax) * 100) / 100;
    const paidAmt = parseFloat(amountPaid || 0);

    // Determine status
    let status = 'PENDING';
    if (paidAmt >= grandTotal) {
      status = 'PAID';
    } else if (paidAmt > 0) {
      status = 'PARTIAL';
    }

    // Auto-generate invoice number
    // Formats e.g. INV-YYYY-001
    const invoiceCount = await db.invoice.count({
      where: { shopId: user.shopId }
    });
    
    const prefix = user.shop.invoicePrefix || 'INV';
    const year = new Date(issuedAt || Date.now()).getFullYear();
    const formattedCount = String(invoiceCount + 1).padStart(4, '0');
    const invoiceNum = `${prefix}-${year}-${formattedCount}`;

    // Perform database transactions
    const result = await db.$transaction(async (tx) => {
      // 1. Update Inventory Stock levels
      for (const update of stockUpdates) {
        await tx.product.update({
          where: { id: update.id },
          data: { stockCount: update.newStock }
        });
      }

      // 2. Create Invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNum,
          discountPercentage: discountPercent,
          totalTax: calculatedTax,
          grandTotal,
          amountPaid: paidAmt,
          status,
          issuedAt: issuedAt ? new Date(issuedAt) : new Date(),
          customerId,
          shopId: user.shopId,
          items: {
            create: invoiceItemsData
          }
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // 3. Create Payment record if amountPaid > 0
      if (paidAmt > 0) {
        const payment = await tx.payment.create({
          data: {
            amount: paidAmt,
            paymentMethod: paymentMethod || 'CASH',
            notes: notes || 'Initial Payment',
            invoiceId: newInvoice.id,
            paymentDate: issuedAt ? new Date(issuedAt) : new Date(),
          }
        });
        
        return { invoice: newInvoice, payment };
      }

      return { invoice: newInvoice, payment: null };
    });

    return NextResponse.json({ success: true, invoice: result.invoice, payment: result.payment });

  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
