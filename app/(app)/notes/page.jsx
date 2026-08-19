"use client";
import React, { useState, useEffect } from "react";
import { 
  Plus, Search, Edit2, Trash2, Mail, MapPin, NotebookPen, 
  ShoppingBag, ClipboardList, TrendingUp, DollarSign, Wallet,
  Calendar, Building, ArrowLeft, ArrowRight, RefreshCw, AlertCircle,
  FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function NotesPage() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("purchase");

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
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full font-bold border border-border">
                  {item.qty}
                </span>
              )}
              {item.gstRate && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  {item.gstRate}% GST
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
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog State
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [originalPaid, setOriginalPaid] = useState(0);
  const [settleAmount, setSettleAmount] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    productsBought: "",
    quantityBought: "",
    totalAmount: "",
    amountPaid: "",
    amountRemaining: "",
    noteDate: new Date().toISOString().split('T')[0],
    remarks: "",
    isPurchase: true,
    title: "",
    gstNumber: ""
  });

  const [formProducts, setFormProducts] = useState([
    { name: "", qty: "", amount: "", gstRate: "" }
  ]);

  // Calculate stats
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalPaid: 0,
    totalOutstanding: 0
  });

  useEffect(() => {
    fetchNotes();
  }, [page, activeTab]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const isPurchase = activeTab === "purchase";
      const res = await fetch(`/api/notes?search=${encodeURIComponent(search)}&isPurchase=${isPurchase}&page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setNotes(data.notes || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);

        // Fetch stats if viewing purchases
        if (isPurchase) {
          // Let's fetch all purchase notes for summary calculation
          const allRes = await fetch(`/api/notes?isPurchase=true&limit=1000`);
          if (allRes.ok) {
            const allData = await allRes.json();
            const list = allData.notes || [];
            const tAmt = list.reduce((acc, item) => acc + item.totalAmount, 0);
            const pAmt = list.reduce((acc, item) => acc + item.amountPaid, 0);
            setStats({
              totalPurchases: tAmt,
              totalPaid: pAmt,
              totalOutstanding: tAmt - pAmt
            });
          }
        }
      } else {
        toast.error("Failed to load notes");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error loading notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotes();
  };

  const resetForm = () => {
    setFormData({
      companyName: "",
      productsBought: "",
      quantityBought: "",
      totalAmount: "",
      amountPaid: "",
      amountRemaining: "",
      noteDate: new Date().toISOString().split('T')[0],
      remarks: "",
      isPurchase: activeTab === "purchase",
      title: "",
      gstNumber: ""
    });
    setFormProducts([{ name: "", qty: "", amount: "", gstRate: "" }]);
    setEditingItem(null);
    setOriginalPaid(0);
    setSettleAmount("");
  };

  const openAddDialog = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      companyName: item.companyName || "",
      productsBought: item.productsBought || "",
      quantityBought: item.quantityBought || "",
      totalAmount: item.totalAmount.toString(),
      amountPaid: item.amountPaid.toString(),
      amountRemaining: item.amountRemaining.toString(),
      noteDate: new Date(item.noteDate).toISOString().split('T')[0],
      remarks: item.remarks || "",
      isPurchase: item.isPurchase,
      title: item.title || "",
      gstNumber: item.gstNumber || ""
    });
    setOriginalPaid(item.amountPaid || 0);
    setSettleAmount("");

    let parsed = [{ name: "", qty: "", amount: "", gstRate: "" }];
    try {
       if (item.productsBought && item.productsBought.startsWith('[')) {
         parsed = JSON.parse(item.productsBought).map(p => ({
           name: p.name || "",
           qty: p.qty || "",
           amount: p.amount !== undefined ? p.amount.toString() : "",
           gstRate: p.gstRate !== undefined ? p.gstRate.toString() : ""
         }));
       } else if (item.productsBought) {
         parsed = [{ name: item.productsBought, qty: item.quantityBought || "", amount: item.totalAmount || "", gstRate: "" }];
       }
    } catch (e) {
       console.error(e);
       if (item.productsBought) {
         parsed = [{ name: item.productsBought, qty: item.quantityBought || "", amount: item.totalAmount || "", gstRate: "" }];
       }
    }
    setFormProducts(parsed);
    setIsOpen(true);
  };

  const handlePaidChange = (paidVal) => {
    const total = parseFloat(formData.totalAmount || "0");
    const paid = parseFloat(paidVal || "0");
    setFormData(prev => ({
      ...prev,
      amountPaid: paidVal,
      amountRemaining: (total - paid).toFixed(2)
    }));
    setSettleAmount(""); // Clear quick settlement input on manual override
  };

  const handleSettleAmountChange = (val) => {
    setSettleAmount(val);
    const parsedVal = parseFloat(val || "0");
    const total = parseFloat(formData.totalAmount || "0");
    const newPaid = originalPaid + parsedVal;
    setFormData(prev => ({
      ...prev,
      amountPaid: newPaid.toFixed(2),
      amountRemaining: (total - newPaid).toFixed(2)
    }));
  };

  const handleSettleFull = () => {
    const total = parseFloat(formData.totalAmount || "0");
    const remaining = total - originalPaid;
    setSettleAmount(remaining.toFixed(2));
    setFormData(prev => ({
      ...prev,
      amountPaid: total.toFixed(2),
      amountRemaining: "0.00"
    }));
    toast.success("Outstanding balance marked for full settlement!");
  };

  const handleProductChange = (index, field, value) => {
    const updated = [...formProducts];
    updated[index][field] = value;
    setFormProducts(updated);

    const overallTotal = updated.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paid = parseFloat(formData.amountPaid || "0");
    setFormData(prev => ({
      ...prev,
      totalAmount: overallTotal.toString(),
      amountRemaining: (overallTotal - paid).toFixed(2)
    }));
  };

  const addProductRow = () => {
    setFormProducts(prev => [...prev, { name: "", qty: "", amount: "", gstRate: "" }]);
  };

  const removeProductRow = (index) => {
    if (formProducts.length === 1) return;
    const updated = formProducts.filter((_, i) => i !== index);
    setFormProducts(updated);

    const overallTotal = updated.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    const paid = parseFloat(formData.amountPaid || "0");
    setFormData(prev => ({
      ...prev,
      totalAmount: overallTotal.toString(),
      amountRemaining: (overallTotal - paid).toFixed(2)
    }));
  };

  const exportToCSV = async () => {
    try {
      const isPurchase = activeTab === "purchase";
      const res = await fetch(`/api/notes?isPurchase=${isPurchase}&limit=10000`);
      if (!res.ok) {
        toast.error("Failed to fetch data for export");
        return;
      }
      const data = await res.json();
      const list = data.notes || [];
      if (list.length === 0) {
        toast.error("No records available to export");
        return;
      }

      let csvContent = "";
      if (isPurchase) {
        csvContent += "Date,Supplier/Company,Products Bought Details,Total Quantity,Total Amount,Amount Paid,Outstanding Balance,Remarks\n";
        list.forEach(item => {
          let prodDetails = item.productsBought;
          if (prodDetails && prodDetails.startsWith('[')) {
            try {
              const parsed = JSON.parse(prodDetails);
              prodDetails = parsed.map(p => `${p.name} (Qty: ${p.qty || '-'}, GST: ${p.gstRate ? p.gstRate + '%' : '-'}, Price: ${p.amount || '-'})`).join(" | ");
            } catch (e) {}
          }
          const company = `"${(item.companyName || '').replace(/"/g, '""')}"`;
          const prods = `"${(prodDetails || '').replace(/"/g, '""')}"`;
          const qty = `"${(item.quantityBought || '').replace(/"/g, '""')}"`;
          const remarks = `"${(item.remarks || '').replace(/"/g, '""')}"`;
          const date = new Date(item.noteDate).toLocaleDateString('en-IN');
          csvContent += `${date},${company},${prods},${qty},${item.totalAmount},${item.amountPaid},${item.amountRemaining},${remarks}\n`;
        });
      } else {
        csvContent += "Date,Title,Note Content\n";
        list.forEach(item => {
          const title = `"${(item.title || '').replace(/"/g, '""')}"`;
          const remarks = `"${(item.remarks || '').replace(/"/g, '""')}"`;
          const date = new Date(item.noteDate).toLocaleDateString('en-IN');
          csvContent += `${date},${title},${remarks}\n`;
        });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${isPurchase ? 'purchase_ledger' : 'general_notes'}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Error exporting CSV");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isPurchase = formData.isPurchase;

    if (isPurchase) {
      const hasValidProduct = formProducts.some(p => p.name.trim() !== "");
      if (!formData.companyName || !hasValidProduct) {
        toast.error("Company Name and at least one Product Name are required.");
        return;
      }
    } else {
      if (!formData.title || !formData.remarks) {
        toast.error("Title and Content remarks are required.");
        return;
      }
    }

    const productsBoughtStr = isPurchase ? JSON.stringify(formProducts) : formData.productsBought;
    const quantityBoughtStr = isPurchase 
      ? formProducts.map(p => `${p.qty || ""} ${p.name || ""}`.trim()).filter(Boolean).join(", ")
      : formData.quantityBought;

    const payload = {
      ...formData,
      productsBought: productsBoughtStr,
      quantityBought: quantityBoughtStr,
      totalAmount: isPurchase ? parseFloat(formData.totalAmount || "0") : 0,
      amountPaid: isPurchase ? parseFloat(formData.amountPaid || "0") : 0,
      amountRemaining: isPurchase ? parseFloat(formData.amountRemaining || "0") : 0,
    };

    try {
      const url = editingItem ? `/api/notes/${editingItem.id}` : "/api/notes";
      const method = editingItem ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? "Updated note successfully" : "Added note successfully");
        setIsOpen(false);
        fetchNotes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save note");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error saving note");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Record deleted");
        fetchNotes();
      } else {
        toast.error("Failed to delete record");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting record");
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2.5">
            <NotebookPen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Notes & Purchase Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Keep secure records of general business notes and product purchasing accounts.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button onClick={exportToCSV} variant="outline" className="rounded-full border-border text-foreground hover:bg-muted font-bold gap-1.5 shadow-sm text-xs px-5 h-9 bg-background">
            <FileDown className="h-4 w-4 text-muted-foreground" /> Export CSV
          </Button>
          <Button onClick={openAddDialog} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold gap-1.5 shadow-sm text-xs px-5 h-9">
            <Plus className="h-4 w-4" /> Add Record
          </Button>
        </div>
      </div>

      {/* Summary Widgets for Purchase Ledger */}
      {activeTab === "purchase" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs hover:border-border transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Total Purchases</span>
                <span className="text-lg font-black text-foreground mt-0.5">{"\u20B9"}{stats.totalPurchases.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs hover:border-border transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold">Total Amount Paid</span>
                <span className="text-lg font-black text-foreground mt-0.5">{"\u20B9"}{stats.totalPaid.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border bg-card text-card-foreground shadow-xs hover:border-border transition-all">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50/80 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-xs text-muted-foreground font-semibold font-bold text-rose-600 dark:text-rose-400">Total Outstanding Balance</span>
                <span className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">{"\u20B9"}{stats.totalOutstanding.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <Tabs defaultValue="purchase" onValueChange={(val) => { setActiveTab(val); setPage(1); }} className="space-y-4">
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <TabsList className="bg-muted border border-border rounded-full p-1 self-start">
            <TabsTrigger value="purchase" className="rounded-full px-5 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-xs">
              <ClipboardList className="h-3.5 w-3.5 mr-1" /> Purchase Ledger
            </TabsTrigger>
            <TabsTrigger value="general" className="rounded-full px-5 py-1.5 text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground text-muted-foreground data-[state=active]:shadow-xs">
              <NotebookPen className="h-3.5 w-3.5 mr-1" /> General Notes
            </TabsTrigger>
          </TabsList>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={activeTab === "purchase" ? "Search suppliers or products..." : "Search title or remarks..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full bg-background border-border text-foreground text-xs h-9"
              />
            </div>
            <Button type="submit" size="sm" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 h-9 font-bold text-xs shadow-sm">
              Search
            </Button>
          </form>
        </div>

        {/* Tab 1: Purchase Ledger */}
        <TabsContent value="purchase">
          <Card className="rounded-2xl border-border shadow-xs overflow-hidden bg-card text-card-foreground">
            <div className="overflow-x-auto w-full">
              <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold text-muted-foreground">Supplier / Company</TableHead>
                  <TableHead className="font-bold text-muted-foreground">Products Bought</TableHead>
                  <TableHead className="font-bold text-center text-muted-foreground">Quantity</TableHead>
                  <TableHead className="font-bold text-center text-muted-foreground">Date</TableHead>
                  <TableHead className="font-bold text-right text-muted-foreground">Total ({"\u20B9"})</TableHead>
                  <TableHead className="font-bold text-right text-muted-foreground">Paid ({"\u20B9"})</TableHead>
                  <TableHead className="font-bold text-right text-rose-600 dark:text-rose-400">Balance ({"\u20B9"})</TableHead>
                  <TableHead className="font-bold text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-xs">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
                      Loading ledger records...
                    </TableCell>
                  </TableRow>
                ) : notes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                      <ClipboardList className="h-7 w-7 mx-auto mb-2 opacity-50" />
                      No purchase records found. Click 'Add Record' to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  notes.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/40 transition-colors text-xs">
                      <TableCell className="font-bold text-foreground align-top pt-3">{item.companyName}</TableCell>
                      <TableCell className="max-w-[280px] align-top py-3">{renderProductsBought(item.productsBought)}</TableCell>
                      <TableCell className="text-center text-muted-foreground font-medium align-top pt-3">{item.quantityBought || "—"}</TableCell>
                      <TableCell className="text-center text-muted-foreground font-medium">
                        {new Date(item.noteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">{"\u20B9"}{item.totalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-bold">{"\u20B9"}{item.amountPaid.toFixed(2)}</TableCell>
                      <TableCell className={`text-right font-bold ${item.amountRemaining > 0 ? "text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/30" : "text-muted-foreground"}`}>
                        {"\u20B9"}{item.amountRemaining.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Tab 2: General Notes */}
        <TabsContent value="general">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-muted-foreground" />
              Loading general notes...
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-xs border border-dashed border-border rounded-2xl bg-card">
              <NotebookPen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No general notes created. Add one now!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notes.map((item) => (
                <Card key={item.id} className="rounded-2xl border-border bg-card text-card-foreground shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
                  <CardHeader className="p-5 pb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase">
                        <Calendar className="h-3.5 w-3.5 text-blue-500" />
                        {new Date(item.noteDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </span>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-sm font-bold text-foreground mt-2">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.remarks}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border border-border bg-card text-card-foreground rounded-2xl shadow-3xs mt-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-sans">
            Showing Page {page} of {totalPages || 1} ({totalCount} records)
          </span>
          <span className="text-[11px] text-border">•</span>
          <span className="text-[11px] text-muted-foreground font-sans font-bold">
            10 rows per page
          </span>
        </div>
        <div className="flex gap-1.5 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="rounded-full px-4 text-xs font-bold border-border bg-background text-foreground hover:bg-muted h-8"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || totalPages <= 1}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="rounded-full px-4 text-xs font-bold border-border bg-background text-foreground hover:bg-muted h-8"
          >
            Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </div>

      {/* Dialog overlay for Add / Edit */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent style={{ maxWidth: "672px", width: "95vw" }} className="rounded-2xl bg-card text-card-foreground border border-border font-sans p-6 overflow-hidden">
          <form onSubmit={handleSave} className="w-full max-w-full min-w-0 flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-sm font-black text-foreground">
                {editingItem ? "Edit Note / Record" : "Add New Note / Record"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Provide details for your purchase registry or quick general note.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4 text-xs overflow-y-auto overflow-x-hidden max-h-[68vh] pr-2 w-full max-w-full min-w-0">
              
              {/* Type Select Toggle & Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground font-bold">Record Type</Label>
                  <div className="flex gap-1.5 bg-muted p-1.5 rounded-xl border border-border">
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, isPurchase: true }))}
                      className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${formData.isPurchase ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      Purchase Ledger
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, isPurchase: false }))}
                      className={`flex-1 text-center py-1.5 rounded-lg text-xs font-bold transition-all ${!formData.isPurchase ? "bg-background text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      General Note
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="noteDate" className="text-foreground font-bold">Record Date</Label>
                  <Input
                    id="noteDate"
                    type="date"
                    value={formData.noteDate}
                    onChange={(e) => setFormData(p => ({ ...p, noteDate: e.target.value }))}
                    className="rounded-xl border-border bg-background text-foreground h-10 shadow-3xs"
                    required
                  />
                </div>
              </div>

              {/* Conditional Inputs: Purchase Ledger fields */}
              {formData.isPurchase ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-foreground font-bold">Company / Supplier Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(p => ({ ...p, companyName: e.target.value }))}
                        placeholder="e.g. ADVIKS Software Solutions"
                        className="rounded-xl border-border bg-background text-foreground h-10 shadow-3xs"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gstNumber" className="text-foreground font-bold">Supplier GSTIN (Optional)</Label>
                      <Input
                        id="gstNumber"
                        value={formData.gstNumber || ""}
                        onChange={(e) => setFormData(p => ({ ...p, gstNumber: e.target.value }))}
                        placeholder="e.g. 27AAAAA1111A1Z1"
                        className="rounded-xl border-border bg-background text-foreground h-10 shadow-3xs font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Multi-product bought row list */}
                  <div className="space-y-3 border border-border rounded-2xl p-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="font-extrabold text-[13px] text-foreground">Products Bought *</Label>
                        <p className="text-[10px] text-muted-foreground">Add products and purchase details</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addProductRow}
                        className="h-8 rounded-xl text-[10px] font-bold border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 px-4 shadow-3xs bg-background"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Product
                      </Button>
                    </div>

                    <div className="overflow-x-auto w-full pb-1">
                      <div className="min-w-[550px] space-y-2 mt-3">
                        {/* Column Header Labels */}
                        <div className="grid grid-cols-[1fr_110px_90px_90px_36px] gap-2 items-center text-[10px] uppercase font-bold text-muted-foreground px-2 tracking-wider">
                          <div>Product Name</div>
                          <div>Quantity</div>
                          <div className="text-center">GST Rate (%)</div>
                          <div className="text-right">Price (₹)</div>
                          <div></div>
                        </div>

                        {formProducts.map((prod, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_110px_90px_90px_36px] gap-2 items-center bg-card p-1.5 rounded-xl border border-border shadow-3xs">
                            <div>
                              <Input
                                placeholder="Product Name *"
                                value={prod.name}
                                onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                                className="rounded-lg border-border bg-background text-foreground text-[11px] h-9"
                                required
                              />
                            </div>
                            <div>
                              <Input
                                placeholder="e.g. 50 bags"
                                value={prod.qty}
                                onChange={(e) => handleProductChange(idx, 'qty', e.target.value)}
                                className="rounded-lg border-border bg-background text-foreground text-[11px] h-9"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                placeholder="18%"
                                value={prod.gstRate || ""}
                                onChange={(e) => handleProductChange(idx, 'gstRate', e.target.value)}
                                className="rounded-lg border-border bg-background text-foreground text-[11px] h-9 text-center font-medium"
                              />
                            </div>
                            <div>
                              <Input
                                type="number"
                                step="any"
                                min="0"
                                placeholder="0.00"
                                value={prod.amount}
                                onChange={(e) => handleProductChange(idx, 'amount', e.target.value)}
                                className="rounded-lg border-border bg-background text-foreground text-[11px] h-9 text-right font-medium"
                                required
                              />
                            </div>
                            <div className="flex justify-center">
                              {formProducts.length > 1 ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeProductRow(idx)}
                                  className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : (
                                <div className="w-8 h-8" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Financial calculation details */}
                  <div className="border border-border rounded-2xl p-4 bg-card text-card-foreground space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="totalAmount" className="text-muted-foreground font-bold">Total Purchase Amt (₹)</Label>
                        <div className="relative">
                          <Input
                            id="totalAmount"
                            type="number"
                            value={formData.totalAmount}
                            disabled
                            className="rounded-xl border-border bg-muted text-foreground font-bold h-10 pl-3 pr-2"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="amountPaid" className="text-foreground font-bold">Amount Paid (₹)</Label>
                        <Input
                          id="amountPaid"
                          type="number"
                          step="any"
                          min="0"
                          value={formData.amountPaid}
                          onChange={(e) => handlePaidChange(e.target.value)}
                          placeholder="0.00"
                          className="rounded-xl border-border bg-background text-emerald-600 dark:text-emerald-400 font-bold h-10 shadow-3xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="amountRemaining" className="text-foreground font-bold">Outstanding Balance (₹)</Label>
                        <Input
                          id="amountRemaining"
                          type="number"
                          value={formData.amountRemaining}
                          disabled
                          className="rounded-xl border-border bg-muted text-rose-600 dark:text-rose-400 font-black h-10"
                        />
                      </div>
                    </div>

                    {editingItem && (parseFloat(editingItem.totalAmount || 0) - parseFloat(originalPaid || 0)) > 0 && (
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-3 mt-1">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="block text-[11px] font-bold text-emerald-800 dark:text-emerald-200 uppercase tracking-wider">Settle Outstanding Balance</span>
                            <span className="block text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Original Paid: ₹{parseFloat(originalPaid).toFixed(2)}</span>
                          </div>
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                            Dues: ₹{(parseFloat(formData.totalAmount || 0) - parseFloat(originalPaid || 0)).toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-bold">₹</span>
                            <Input
                              type="number"
                              step="any"
                              min="0"
                              placeholder="Enter amount paid now..."
                              value={settleAmount}
                              onChange={(e) => handleSettleAmountChange(e.target.value)}
                              className="rounded-xl border-border bg-background h-10 pl-7 shadow-3xs font-semibold text-emerald-700 dark:text-emerald-300 text-xs"
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleSettleFull}
                            className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 shadow-sm"
                          >
                            Settle Full
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="remarks" className="text-foreground font-bold">Remarks / Payment reference</Label>
                      <Input
                        id="remarks"
                        value={formData.remarks}
                        onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                        placeholder="e.g. Paid online, transaction ID, bill ref..."
                        className="rounded-xl border-border bg-background text-foreground h-10 shadow-3xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* Conditional Inputs: General Note fields */
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="title" className="text-foreground font-bold">Note Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                      placeholder="e.g. Shop Closing hours list"
                      className="rounded-xl border-border bg-background h-10 shadow-3xs font-medium text-foreground"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="remarks" className="text-foreground font-bold">Note Content *</Label>
                    <Textarea
                      id="remarks"
                      value={formData.remarks}
                      onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                      placeholder="Write your note description here..."
                      className="rounded-xl border-border bg-background text-foreground min-h-36 shadow-3xs"
                      required
                    />
                  </div>
                </>
              )}

            </div>

            <div className="flex flex-row items-center justify-end gap-3 pt-4 border-t border-border mt-4 px-1">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-full border-border px-6 font-bold h-10 text-xs text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 h-10 text-xs shadow-sm">
                Save Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
