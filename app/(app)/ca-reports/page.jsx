"use client";
import React, { useState, useEffect } from "react";
import { 
  FileSpreadsheet, FileDown, Calendar, RefreshCw, AlertCircle, 
  TrendingUp, Wallet, CheckCircle, BarChart3, Users, Scale, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function CaReportsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // 1-indexed
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    shopName: "My Shop",
    shopGst: "",
    sales: [],
    purchases: [],
    hsnSummary: [],
    summary: {
      totalSalesValue: 0,
      totalTaxableSales: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTaxSales: 0,
    },
    itcSummary: {
      totalPurchaseValue: 0,
      totalPurchaseTaxable: 0,
      totalCgst: 0,
      totalSgst: 0,
      totalIgst: 0,
      totalTaxPurchases: 0,
    },
    netLiability: {
      cgst: 0,
      sgst: 0,
      igst: 0,
      netTaxPayable: 0,
    }
  });

  // Range of years to select
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);
  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ca-reports?year=${year}&month=${month}`);
      if (!res.ok) {
        throw new Error("Failed to fetch reports details");
      }
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Could not load CA reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [year, month]);

  const escapeCSV = (str) => {
    if (str === null || str === undefined) return "";
    const stringVal = String(str);
    if (stringVal.includes(",") || stringVal.includes('"') || stringVal.includes("\n") || stringVal.includes("\r")) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const downloadCSV = (csvContent, fileName) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Sales Register CSV
  const handleExportSales = () => {
    if (!data.sales || data.sales.length === 0) {
      toast.error("No sales records available.");
      return;
    }
    const headers = ["Invoice Number", "Invoice Date", "Customer Name", "Customer GSTIN", "Place of Supply", "GST Rate (%)", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total GST (INR)", "Grand Total (INR)"];
    const rows = [headers.join(",")];
    data.sales.forEach(inv => {
      rows.push([
        escapeCSV(inv.invoiceNum),
        escapeCSV(new Date(inv.issuedAt).toLocaleDateString("en-IN")),
        escapeCSV(inv.customerName),
        escapeCSV(inv.customerGst || "N/A"),
        escapeCSV(inv.placeOfSupply),
        escapeCSV(inv.gstRate || "N/A"),
        inv.taxableValue.toFixed(2),
        inv.cgst.toFixed(2),
        inv.sgst.toFixed(2),
        inv.igst.toFixed(2),
        inv.totalTax.toFixed(2),
        inv.grandTotal.toFixed(2)
      ].join(","));
    });
    const monthLabel = months.find(m => m.value === month)?.label || month;
    downloadCSV(rows.join("\n"), `Sales_Register_${monthLabel}_${year}.csv`);
    toast.success("Sales Register exported!");
  };

  // 2. Purchase Register CSV
  const handleExportPurchases = () => {
    if (!data.purchases || data.purchases.length === 0) {
      toast.error("No purchase records available.");
      return;
    }
    const headers = ["Date", "Supplier Name", "Supplier GSTIN", "Product Name", "Quantity", "GST Rate (%)", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total GST (INR)", "Total Amount (INR)", "Remarks"];
    const rows = [headers.join(",")];
    data.purchases.forEach(item => {
      rows.push([
        escapeCSV(new Date(item.noteDate).toLocaleDateString("en-IN")),
        escapeCSV(item.companyName),
        escapeCSV(item.gstNumber || "N/A"),
        escapeCSV(item.productName || "Product Supply"),
        escapeCSV(item.productQty || "-"),
        escapeCSV(item.gstRate || "N/A"),
        item.taxableValue.toFixed(2),
        item.cgst.toFixed(2),
        item.sgst.toFixed(2),
        item.igst.toFixed(2),
        item.totalTax.toFixed(2),
        item.totalAmount.toFixed(2),
        escapeCSV(item.remarks || "")
      ].join(","));
    });
    const monthLabel = months.find(m => m.value === month)?.label || month;
    downloadCSV(rows.join("\n"), `Purchase_Register_${monthLabel}_${year}.csv`);
    toast.success("Purchase Register exported!");
  };

  // 3. GSTR-1 Report CSV (B2B + B2C split)
  const handleExportGSTR1 = (type) => {
    // type can be "B2B" (has GSTIN) or "B2C" (no GSTIN)
    const filtered = data.sales.filter(inv => type === "B2B" ? inv.customerGst : !inv.customerGst);
    if (filtered.length === 0) {
      toast.error(`No outward ${type} supplies found for this month.`);
      return;
    }

    const headers = [
      "Invoice Number", "Invoice Date", "Customer Name", "Customer GSTIN", "Place of Supply",
      "Slab Rate (%)", "Taxable Value (INR)", "CGST Amount (INR)", "SGST Amount (INR)", "IGST Amount (INR)", "Total GST (INR)", "Grand Total (INR)"
    ];
    const rows = [headers.join(",")];

    filtered.forEach(inv => {
      if (inv.gstRateDetails && inv.gstRateDetails.length > 0) {
        inv.gstRateDetails.forEach(slab => {
          rows.push([
            escapeCSV(inv.invoiceNum),
            escapeCSV(new Date(inv.issuedAt).toLocaleDateString("en-IN")),
            escapeCSV(inv.customerName),
            escapeCSV(inv.customerGst || "N/A"),
            escapeCSV(inv.placeOfSupply),
            slab.taxRate,
            slab.taxableValue.toFixed(2),
            slab.cgst.toFixed(2),
            slab.sgst.toFixed(2),
            slab.igst.toFixed(2),
            slab.totalTax.toFixed(2),
            slab.grandTotal.toFixed(2)
          ].join(","));
        });
      } else {
        rows.push([
          escapeCSV(inv.invoiceNum),
          escapeCSV(new Date(inv.issuedAt).toLocaleDateString("en-IN")),
          escapeCSV(inv.customerName),
          escapeCSV(inv.customerGst || "N/A"),
          escapeCSV(inv.placeOfSupply),
          "0",
          inv.taxableValue.toFixed(2),
          inv.cgst.toFixed(2),
          inv.sgst.toFixed(2),
          inv.igst.toFixed(2),
          inv.totalTax.toFixed(2),
          inv.grandTotal.toFixed(2)
        ].join(","));
      }
    });

    const monthLabel = months.find(m => m.value === month)?.label || month;
    downloadCSV(rows.join("\n"), `GSTR1_Report_${type}_${monthLabel}_${year}.csv`);
    toast.success(`GSTR-1 ${type} supplies report exported successfully!`);
  };

  // 4. GSTR-3B Summary CSV
  const handleExportGSTR3B = () => {
    const rows = [
      ["GST Report Type", "GSTR-3B Summary Report"],
      ["Period", `${months.find(m => m.value === month)?.label} ${year}`],
      [],
      ["1. Outward Taxable Supplies (Output Tax Liability)"],
      ["Category", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total GST (INR)"],
      [
        "Outward Taxable Supplies", 
        data.summary.totalTaxableSales.toFixed(2),
        data.summary.totalCgst.toFixed(2),
        data.summary.totalSgst.toFixed(2),
        data.summary.totalIgst.toFixed(2),
        data.summary.totalTaxSales.toFixed(2)
      ],
      [],
      ["2. Eligible Input Tax Credit (ITC from Purchases)"],
      ["Category", "Taxable Purchases (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total ITC (INR)"],
      [
        "Input Tax Credit",
        data.itcSummary.totalPurchaseTaxable.toFixed(2),
        data.itcSummary.totalCgst.toFixed(2),
        data.itcSummary.totalSgst.toFixed(2),
        data.itcSummary.totalIgst.toFixed(2),
        data.itcSummary.totalTaxPurchases.toFixed(2)
      ],
      [],
      ["3. Net GST Liability (Output tax minus Eligible ITC)"],
      ["Tax Head", "Output Tax (INR)", "Input ITC (INR)", "Net Payable / Refund (INR)"],
      ["CGST Liability", data.summary.totalCgst.toFixed(2), data.itcSummary.totalCgst.toFixed(2), data.netLiability.cgst.toFixed(2)],
      ["SGST Liability", data.summary.totalSgst.toFixed(2), data.itcSummary.totalSgst.toFixed(2), data.netLiability.sgst.toFixed(2)],
      ["IGST Liability", data.summary.totalIgst.toFixed(2), data.itcSummary.totalIgst.toFixed(2), data.netLiability.igst.toFixed(2)],
      ["Total Liability", data.summary.totalTaxSales.toFixed(2), data.itcSummary.totalTaxPurchases.toFixed(2), data.netLiability.netTaxPayable.toFixed(2)]
    ];

    const csvContent = rows.map(r => r.map(cell => escapeCSV(cell)).join(",")).join("\n");
    const monthLabel = months.find(m => m.value === month)?.label || month;
    downloadCSV(csvContent, `GSTR3B_Summary_${monthLabel}_${year}.csv`);
    toast.success("GSTR-3B Summary exported!");
  };

  // 5. HSN/SAC Summary CSV
  const handleExportHSN = () => {
    if (!data.hsnSummary || data.hsnSummary.length === 0) {
      toast.error("No HSN/SAC summary records available.");
      return;
    }
    const headers = ["HSN/SAC Code", "Description", "Unit", "GST Rate (%)", "Total Quantity", "Total Value (INR)", "Taxable Value (INR)", "CGST (INR)", "SGST (INR)", "IGST (INR)", "Total GST (INR)"];
    const rows = [headers.join(",")];
    data.hsnSummary.forEach(h => {
      rows.push([
        escapeCSV(h.hsnSac),
        escapeCSV(h.description),
        escapeCSV(h.unit),
        escapeCSV(h.gstRate || "N/A"),
        h.quantity,
        h.totalValue.toFixed(2),
        h.taxableValue.toFixed(2),
        h.cgst.toFixed(2),
        h.sgst.toFixed(2),
        h.igst.toFixed(2),
        h.totalTax.toFixed(2)
      ].join(","));
    });
    const monthLabel = months.find(m => m.value === month)?.label || month;
    downloadCSV(rows.join("\n"), `HSN_SAC_Summary_${monthLabel}_${year}.csv`);
    toast.success("HSN/SAC Summary exported!");
  };

  const renderProductsBought = (text) => {
    try {
      if (text && text.startsWith('[')) {
        const items = JSON.parse(text);
        return (
          <div className="space-y-1">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[11px]">
                <span className="font-bold text-foreground">{item.name}</span>
                {item.qty && (
                  <span className="text-[10px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-full font-bold">
                    {item.qty}
                  </span>
                )}
                {item.amount && (
                  <span className="text-[10px] text-muted-foreground">
                    (₹{parseFloat(item.amount).toFixed(2)})
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      }
    } catch (e) {
      console.error(e);
    }
    return <span className="text-foreground">{text}</span>;
  };

  return (
    <div className="space-y-6 font-sans text-xs">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 h-48 w-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="space-y-1.5 relative z-10">
          <h1 className="text-xl font-black flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
            CA Reports & GST Registers
          </h1>
          <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
            Extract outward sales, inward purchases, GSTR-1 details, GSTR-3B aggregates, and HSN-wise sales summaries.
          </p>
        </div>

        {/* Date Selector Dropdowns */}
        <div className="flex items-center gap-2 bg-white/10 p-2 rounded-xl border border-white/10 shadow-inner z-10 w-full sm:w-auto">
          <Calendar className="h-4 w-4 text-emerald-400 ml-1 shrink-0" />
          <select 
            value={month} 
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer p-1"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value} className="text-gray-900 font-medium">
                {m.label}
              </option>
            ))}
          </select>
          <span className="text-white/40">|</span>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer p-1"
          >
            {years.map((y) => (
              <option key={y} value={y} className="text-gray-900 font-medium">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Outward Supplies</span>
              <span className="text-base font-black text-foreground mt-0.5">
                ₹{data.summary.totalTaxableSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Output Liability</span>
              <span className="text-base font-black text-foreground mt-0.5">
                ₹{data.summary.totalTaxSales.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Input credit (ITC)</span>
              <span className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">
                ₹{data.itcSummary.totalTaxPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className={`rounded-2xl border ${data.netLiability.netTaxPayable >= 0 ? "bg-rose-50/50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" : "bg-emerald-50/50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900"} shadow-xs`}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${data.netLiability.netTaxPayable >= 0 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"}`}>
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Net Tax Payable</span>
              <span className={`text-base font-black mt-0.5 ${data.netLiability.netTaxPayable >= 0 ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                ₹{Math.abs(data.netLiability.netTaxPayable).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                {data.netLiability.netTaxPayable < 0 && " (Credit)"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="sales" className="space-y-4">
        <div className="border-b border-border pb-2">
          <div className="w-full overflow-x-auto no-scrollbar">
            <TabsList className="bg-muted border border-border rounded-xl p-1 flex w-max gap-0.5 whitespace-nowrap">
              <TabsTrigger value="sales" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                Sales Register
              </TabsTrigger>
              <TabsTrigger value="purchases" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                Purchase Register
              </TabsTrigger>
              <TabsTrigger value="gstr1" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                GSTR-1 Report
              </TabsTrigger>
              <TabsTrigger value="gstr3b" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                GSTR-3B Summary
              </TabsTrigger>
              <TabsTrigger value="hsn" className="rounded-lg px-4 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                HSN/SAC Summary
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab 1: Sales Register */}
        <TabsContent value="sales" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-3xs">
            <div>
              <span className="block text-xs font-bold text-foreground">Sales Invoices Registry</span>
              <span className="block text-[10px] text-muted-foreground">All outward billing invoices including tax breakouts</span>
            </div>
            <Button onClick={handleExportSales} disabled={loading || data.sales.length === 0} className="w-full sm:w-auto rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white font-bold h-9 shadow-sm">
              <FileDown className="h-4 w-4 mr-2" /> Export Sales Register
            </Button>
          </div>

          <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Date</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Customer Name</TableHead>
                    <TableHead className="font-bold text-muted-foreground">GSTIN</TableHead>
                    <TableHead className="font-bold text-muted-foreground">POS (Place of Supply)</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">GST Rate (%)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Taxable Amt (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">CGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">SGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">IGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Grand Total (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading sales register...
                      </TableCell>
                    </TableRow>
                  ) : data.sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
                        No sales recorded for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.sales.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold text-foreground">{row.invoiceNum}</TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {new Date(row.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="font-medium text-foreground">{row.customerName}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{row.customerGst || "N/A"}</TableCell>
                        <TableCell className="text-muted-foreground truncate max-w-[120px]">{row.placeOfSupply}</TableCell>
                        <TableCell className="text-center font-bold text-foreground">{row.gstRate || "N/A"}</TableCell>
                        <TableCell className="text-right font-medium">₹{row.taxableValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{row.igst.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-foreground">₹{row.grandTotal.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: Purchase Register */}
        <TabsContent value="purchases" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-3xs">
            <div>
              <span className="block text-xs font-bold text-foreground">Purchases Input Registry</span>
              <span className="block text-[10px] text-muted-foreground">Purchase ledger records with input tax credit estimates</span>
            </div>
            <Button onClick={handleExportPurchases} disabled={loading || data.purchases.length === 0} className="w-full sm:w-auto rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white font-bold h-9 shadow-sm">
              <FileDown className="h-4 w-4 mr-2" /> Export Purchase Register
            </Button>
          </div>

          <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-muted-foreground">Supplier Name</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Supplier GSTIN</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Product Name</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">Qty</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">GST Rate (%)</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">Date</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Taxable Purchases (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">CGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">SGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">IGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Total GST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Total Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading purchase register...
                      </TableCell>
                    </TableRow>
                  ) : data.purchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
                        No purchase entries recorded for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.purchases.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold text-foreground">{row.companyName}</TableCell>
                        <TableCell className="font-mono text-muted-foreground">{row.gstNumber || "N/A"}</TableCell>
                        <TableCell className="font-medium text-foreground">{row.productName || "Product Supply"}</TableCell>
                        <TableCell className="text-center text-muted-foreground font-medium">{row.productQty}</TableCell>
                        <TableCell className="text-center font-bold text-foreground">{row.gstRate || "N/A"}</TableCell>
                        <TableCell className="text-center text-muted-foreground font-medium">
                          {new Date(row.noteDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell className="text-right font-medium">₹{row.taxableValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{row.igst.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium text-purple-600 dark:text-purple-400">₹{row.totalTax.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-foreground">₹{row.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 3: GSTR-1 Report */}
        <TabsContent value="gstr1" className="mt-0 space-y-4">
          <Tabs defaultValue="gstr1b2b" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-3xs">
              <TabsList className="bg-muted border border-border rounded-lg p-0.5 self-start">
                <TabsTrigger value="gstr1b2b" className="rounded-md px-4 py-1 text-[11px] font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                  B2B Supplies (Registered)
                </TabsTrigger>
                <TabsTrigger value="gstr1b2c" className="rounded-md px-4 py-1 text-[11px] font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-2xs">
                  B2C Supplies (Unregistered)
                </TabsTrigger>
              </TabsList>
              <div className="flex flex-row gap-2">
                <Button onClick={() => handleExportGSTR1("B2B")} disabled={loading || data.sales.length === 0} size="sm" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs flex-1 sm:flex-none shadow-sm">
                  <FileDown className="h-4 w-4 mr-2" /> B2B CSV
                </Button>
                <Button onClick={() => handleExportGSTR1("B2C")} disabled={loading || data.sales.length === 0} size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs flex-1 sm:flex-none shadow-sm">
                  <FileDown className="h-4 w-4 mr-2" /> B2C CSV
                </Button>
              </div>
            </div>

            {/* B2B Table */}
            <TabsContent value="gstr1b2b" className="mt-0">
              <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-muted-foreground">Invoice #</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Date</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Customer Name</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Customer GSTIN</TableHead>
                        <TableHead className="font-bold text-center text-muted-foreground">GST Rate (%)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">Taxable Value (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">CGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">SGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">IGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">Grand Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                            Loading GSTR-1 B2B data...
                          </TableCell>
                        </TableRow>
                      ) : data.sales.filter(i => i.customerGst).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
                            No B2B sales registered for this month.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.sales.filter(i => i.customerGst).map((row) => 
                          row.gstRateDetails.map((slab, idx) => (
                            <TableRow key={`${row.id}-${idx}`} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="font-bold text-foreground">{slab.taxRate > 0 && idx > 0 ? "" : row.invoiceNum}</TableCell>
                              <TableCell className="text-muted-foreground">{slab.taxRate > 0 && idx > 0 ? "" : new Date(row.issuedAt).toLocaleDateString("en-IN")}</TableCell>
                              <TableCell className="font-medium text-foreground">{slab.taxRate > 0 && idx > 0 ? "" : row.customerName}</TableCell>
                              <TableCell className="font-mono text-muted-foreground">{slab.taxRate > 0 && idx > 0 ? "" : row.customerGst}</TableCell>
                              <TableCell className="text-center font-bold text-foreground">{slab.taxRate}%</TableCell>
                              <TableCell className="text-right font-medium">₹{slab.taxableValue.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">₹{slab.cgst.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">₹{slab.sgst.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{slab.igst.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-bold text-foreground">₹{slab.grandTotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* B2C Table */}
            <TabsContent value="gstr1b2c" className="mt-0">
              <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold text-muted-foreground">Invoice #</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Date</TableHead>
                        <TableHead className="font-bold text-muted-foreground">Customer Name</TableHead>
                        <TableHead className="font-bold text-center text-muted-foreground">GST Rate (%)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">Taxable Value (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">CGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">SGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">IGST (₹)</TableHead>
                        <TableHead className="font-bold text-right text-muted-foreground">Grand Total (₹)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                            Loading GSTR-1 B2C data...
                          </TableCell>
                        </TableRow>
                      ) : data.sales.filter(i => !i.customerGst).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                            <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
                            No B2C sales registered for this month.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.sales.filter(i => !i.customerGst).map((row) => 
                          row.gstRateDetails.map((slab, idx) => (
                            <TableRow key={`${row.id}-${idx}`} className="hover:bg-muted/40 transition-colors">
                              <TableCell className="font-bold text-foreground">{slab.taxRate > 0 && idx > 0 ? "" : row.invoiceNum}</TableCell>
                              <TableCell className="text-muted-foreground">{slab.taxRate > 0 && idx > 0 ? "" : new Date(row.issuedAt).toLocaleDateString("en-IN")}</TableCell>
                              <TableCell className="font-medium text-foreground">{slab.taxRate > 0 && idx > 0 ? "" : row.customerName}</TableCell>
                              <TableCell className="text-center font-bold text-foreground">{slab.taxRate}%</TableCell>
                              <TableCell className="text-right font-medium">₹{slab.taxableValue.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">₹{slab.cgst.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">₹{slab.sgst.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{slab.igst.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-bold text-foreground">₹{slab.grandTotal.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Tab 4: GSTR-3B Summary */}
        <TabsContent value="gstr3b" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-3xs">
            <div>
              <span className="block text-xs font-bold text-foreground">GSTR-3B Summary Report</span>
              <span className="block text-[10px] text-muted-foreground">Aggregated output tax liability against offset input credit (ITC)</span>
            </div>
            <Button onClick={handleExportGSTR3B} disabled={loading} className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 shadow-sm">
              <FileDown className="h-4 w-4 mr-2" /> Export GSTR-3B Summary
            </Button>
          </div>

          <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-extrabold text-[11px] text-foreground">Category of Supplies</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-right text-muted-foreground">Taxable Value (₹)</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-right text-muted-foreground">CGST (₹)</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-right text-muted-foreground">SGST (₹)</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-right text-rose-600 dark:text-rose-400">IGST (₹)</TableHead>
                    <TableHead className="font-extrabold text-[11px] text-right text-foreground">Total GST Liability (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  {/* Outward Taxable supplies */}
                  <TableRow className="hover:bg-muted/40 font-medium text-foreground">
                    <TableCell className="font-bold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      1. Outward Taxable Supplies (Sales Output)
                    </TableCell>
                    <TableCell className="text-right">₹{data.summary.totalTaxableSales.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{data.summary.totalCgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{data.summary.totalSgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{data.summary.totalIgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">₹{data.summary.totalTaxSales.toFixed(2)}</TableCell>
                  </TableRow>
                  
                  {/* Inward Taxable supplies (ITC) */}
                  <TableRow className="hover:bg-muted/40 font-medium text-foreground">
                    <TableCell className="font-bold flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      2. Eligible Input Tax Credit (Purchases ITC)
                    </TableCell>
                    <TableCell className="text-right">₹{data.itcSummary.totalPurchaseTaxable.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{data.itcSummary.totalCgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right">₹{data.itcSummary.totalSgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{data.itcSummary.totalIgst.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">₹{data.itcSummary.totalTaxPurchases.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* Net Payable / Net Liability summary */}
                  <TableRow className="bg-muted/70 hover:bg-muted font-black text-foreground border-t-2 border-border">
                    <TableCell className="flex items-center gap-2 font-black">
                      <Scale className="h-4 w-4 text-foreground" />
                      3. Net GST Liability (Output liability minus Eligible ITC)
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">—</TableCell>
                    <TableCell className={`text-right ${data.netLiability.cgst >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ₹{Math.abs(data.netLiability.cgst).toFixed(2)} {data.netLiability.cgst < 0 && " (Cr)"}
                    </TableCell>
                    <TableCell className={`text-right ${data.netLiability.sgst >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ₹{Math.abs(data.netLiability.sgst).toFixed(2)} {data.netLiability.sgst < 0 && " (Cr)"}
                    </TableCell>
                    <TableCell className={`text-right ${data.netLiability.igst >= 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      ₹{Math.abs(data.netLiability.igst).toFixed(2)} {data.netLiability.igst < 0 && " (Cr)"}
                    </TableCell>
                    <TableCell className={`text-right font-black text-[13px] ${data.netLiability.netTaxPayable >= 0 ? "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60" : "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60"}`}>
                      ₹{Math.abs(data.netLiability.netTaxPayable).toFixed(2)} {data.netLiability.netTaxPayable < 0 ? "Refund (Cr)" : "Payable"}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 5: HSN/SAC Summary */}
        <TabsContent value="hsn" className="mt-0 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card text-card-foreground p-4 rounded-2xl border border-border shadow-3xs">
            <div>
              <span className="block text-xs font-bold text-foreground">HSN/SAC Sales Aggregates</span>
              <span className="block text-[10px] text-muted-foreground">Monthly outward supplies totals grouped by product HSN/SAC classification</span>
            </div>
            <Button onClick={handleExportHSN} disabled={loading || data.hsnSummary.length === 0} className="w-full sm:w-auto rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold h-9 shadow-sm">
              <FileDown className="h-4 w-4 mr-2" /> Export HSN/SAC Summary
            </Button>
          </div>

          <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-muted-foreground">HSN/SAC Code</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Description</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">UQC (Unit)</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">GST Rate (%)</TableHead>
                    <TableHead className="font-bold text-center text-muted-foreground">Total Quantity</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Total Value (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Taxable Value (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">CGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">SGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-rose-600 dark:text-rose-400">IGST (₹)</TableHead>
                    <TableHead className="font-bold text-right text-muted-foreground">Total GST Tax (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading HSN summary...
                      </TableCell>
                    </TableRow>
                  ) : data.hsnSummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-7 w-7 mx-auto mb-2 opacity-50" />
                        No sales invoices recorded with HSN/SAC information.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.hsnSummary.map((row) => (
                      <TableRow key={`${row.hsnSac}-${row.gstRate}`} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-bold text-foreground font-mono">{row.hsnSac}</TableCell>
                        <TableCell className="font-medium text-foreground max-w-[180px] truncate">{row.description}</TableCell>
                        <TableCell className="text-center font-bold text-muted-foreground">{row.unit}</TableCell>
                        <TableCell className="text-center font-bold text-foreground">{row.gstRate || "N/A"}</TableCell>
                        <TableCell className="text-center font-bold text-foreground">{row.quantity}</TableCell>
                        <TableCell className="text-right font-medium">₹{row.totalValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-medium">₹{row.taxableValue.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{row.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-rose-600 dark:text-rose-400">₹{row.igst.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-black text-foreground">₹{row.totalTax.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
