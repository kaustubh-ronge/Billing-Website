"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin, Receipt, ArrowRight, Download, Printer, RefreshCw, ChevronRight, MessageSquare, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { downloadCSV } from '@/lib/csv';
import { useCan } from '@/lib/permissions/PermissionContext';

export default function CustomersPage() {
  const can = useCan();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorShop, setVendorShop] = useState(null);

  // Active Customer profile drill-down
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerInvoices, setCustomerInvoices] = useState([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  // Dialog/Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Settle Payment Dialog State
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);
  const [settleForm, setSettleForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    notes: '',
    paymentDate: new Date().toISOString().substring(0, 10),
    referenceNumber: ''
  });
  const [settlingPayment, setSettlingPayment] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstNumber: '',
    notes: ''
  });

  const printRef = useRef(null);

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    const amt = parseFloat(settleForm.amount);
    if (isNaN(amt) || amt <= 0 || amt > selectedCustomer.totalPending) {
      toast.error(`Please enter a valid amount between 0 and \u20B9${selectedCustomer.totalPending.toFixed(2)}`);
      return;
    }

    setSettlingPayment(true);
    try {
      const res = await fetch(`/api/customers/${selectedCustomer.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settleForm),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Settled \u20B9${amt.toFixed(2)} across customer invoices!`);
        setIsSettleDialogOpen(false);
        await fetchCustomers();
        if (data.customer) {
          await fetchCustomerLedger(data.customer);
        }
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to settle payment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error recording settlement');
    } finally {
      setSettlingPayment(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchVendorProfile();
  }, []);

  const fetchVendorProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setVendorShop(data.shop);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);

        // If a customer was selected, update their stats
        if (selectedCustomer) {
          const updatedSelected = data.customers.find(c => c.id === selectedCustomer.id);
          if (updatedSelected) {
            setSelectedCustomer(updatedSelected);
          }
        }
      } else {
        toast.error('Failed to load customers');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerLedger = async (customer) => {
    try {
      setLoadingLedger(true);
      setSelectedCustomer(customer);
      const res = await fetch(`/api/invoices?customerId=${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerInvoices(data.invoices || []);
      } else {
        toast.error('Failed to load customer transactions');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error loading ledger history');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      gstNumber: '',
      notes: ''
    });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (e, item) => {
    e.stopPropagation(); // Avoid selecting the customer card
    setEditingItem(item);
    setFormData({
      name: item.name,
      phone: item.phone,
      email: item.email || '',
      address: item.address || '',
      gstNumber: item.gstNumber || '',
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Customer Name and Phone Number are required');
      return;
    }

    try {
      const url = editingItem ? `/api/customers/${editingItem.id}` : '/api/customers';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingItem ? 'Updated customer details' : 'Customer created');
        setIsDialogOpen(false);
        fetchCustomers();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save customer');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving customer');
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Avoid selecting the customer card
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Customer deleted');
        if (selectedCustomer?.id === id) {
          setSelectedCustomer(null);
        }
        fetchCustomers();
      } else {
        toast.error('Failed to delete customer');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting customer');
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const getWhatsAppLedgerLink = () => {
    if (!selectedCustomer || !vendorShop) return '#';

    const totalPending = customerInvoices.reduce((sum, inv) => sum + Math.max(0, inv.grandTotal - inv.amountPaid), 0);
    const pendingInvoices = customerInvoices.filter(inv => inv.status !== 'PAID');

    const publicLedgerUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/public/customers/${selectedCustomer.id}`
      : '';

    const lines = pendingInvoices.slice(0, 5).map(inv => {
      const bal = inv.grandTotal - inv.amountPaid;
      return `  \u2022 ${inv.invoiceNum} | ${new Date(inv.issuedAt).toLocaleDateString()} | Due: \u20B9${bal.toFixed(2)}`;
    }).join('\n');

    const message = `Dear ${selectedCustomer.name},

This is a payment reminder from ${vendorShop.businessName}.

You have ${pendingInvoices.length} unpaid invoice(s) totaling \u20B9${totalPending.toFixed(2)}.

Pending Bills:
${lines || '  (no pending invoices)'}

View your full statement here:
${publicLedgerUrl}

Please clear the dues at your earliest convenience. Thank you!

Regards,
${vendorShop.businessName}`;

    const formattedPhone = selectedCustomer.phone.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Customer Directory</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage customer registry, view financial ledgers, and track bills.</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-1">💡 <strong>Backup Tip:</strong> Periodically download and save your customer records locally using the Export CSV button.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = customers.map((c) => {
                const totalAmount = c.totalPaid + c.totalPending;
                return {
                  Name: c.name,
                  Phone: c.phone,
                  Email: c.email ?? '',
                  Address: c.address ?? '',
                  GSTIN: c.gstNumber ?? '',
                  'Total Amount': totalAmount.toFixed(2),
                  'Paid Amount': c.totalPaid.toFixed(2),
                  'Due Amount': c.totalPending.toFixed(2),
                  Status: c.totalPending > 0 ? 'Pending' : 'Settled',
                  Notes: c.notes ?? '',
                };
              });
              downloadCSV(rows, 'customers');
            }}
            className="rounded-lg border-border font-bold text-sm flex items-center gap-1.5 bg-background text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {can('customers:create') && (
          <Button onClick={openAddDialog} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 flex items-center gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Customer
          </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Customer Listing — hidden on mobile when ledger is open */}
        <div className={`lg:col-span-5 space-y-6 ${selectedCustomer ? 'hidden lg:block' : 'block'}`}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-border bg-background text-foreground"
            />
          </form>

          <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden max-h-150 overflow-y-auto">
            <CardHeader className="bg-muted/50 border-b border-border py-4">
              <CardTitle className="text-sm font-bold text-foreground">Customers ({customers.length})</CardTitle>
            </CardHeader>
            <div className="divide-y divide-border">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground mb-2" />
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No customers found. Click Add Customer to start.
                </div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => fetchCustomerLedger(c)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50/40 dark:bg-blue-950/40 border-l-4 border-blue-600 dark:border-blue-400 pl-3' : 'hover:bg-muted/40'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${selectedCustomer?.id === c.id ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-muted text-muted-foreground'
                        }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{c.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.totalPending > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                          {c.totalPending > 0 ? `\u20B9${c.totalPending.toFixed(0)}` : '\u2714'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {can('customers:edit') && (
                        <Button variant="ghost" size="icon" onClick={(e) => openEditDialog(e, c)} className="h-7 w-7 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        )}
                        {can('customers:delete') && (
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, c.id)} className="h-7 w-7 hover:bg-rose-500/10 rounded-full text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Side: Ledger Detail View */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="space-y-6">
              {/* Mobile back button */}
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                onClick={() => setSelectedCustomer(null)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" /> Back to Customers
              </button>
              {/* Ledger Summary Card */}
              <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden print:shadow-none print:border-none">
                <CardHeader className="bg-muted/40 border-b border-border py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-bold flex items-center gap-2 text-foreground">
                      <User className="h-5 w-5 text-muted-foreground" />
                      {selectedCustomer.name}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {selectedCustomer.gstNumber && <span className="font-medium text-foreground">GST: {selectedCustomer.gstNumber}</span>}
                      {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedCustomer.email}</span>}
                      {selectedCustomer.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedCustomer.address}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={handlePrintLedger} className="rounded-lg border-border font-bold flex items-center gap-1 text-xs px-3 text-foreground hover:bg-muted">
                      <Printer className="h-3.5 w-3.5" />
                      Print / PDF
                    </Button>
                    {selectedCustomer.totalPending > 0 && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSettleForm({
                              amount: selectedCustomer.totalPending.toFixed(2),
                              paymentMethod: 'CASH',
                              notes: '',
                              paymentDate: new Date().toISOString().substring(0, 10),
                              referenceNumber: ''
                            });
                            setIsSettleDialogOpen(true);
                          }}
                          className="rounded-full font-bold flex items-center gap-1 text-xs px-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                          <DollarSign className="h-3.5 w-3.5" />
                          Settle Balance
                        </Button>
                        <a
                          href={getWhatsAppLedgerLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          Send Reminder
                        </a>
                      </>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Ledger Stats Row */}
                  <div className="grid grid-cols-3 gap-4 bg-muted/50 p-4 rounded-xl border border-border">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Bills</p>
                      <h3 className="text-lg font-black text-foreground mt-1">{selectedCustomer.totalBills}</h3>
                    </div>
                    <div className="text-center border-x border-border">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Paid</p>
                      <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{"\u20B9"}{selectedCustomer.totalPaid.toFixed(2)}</h3>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Balance Due</p>
                      <h3 className={`text-lg font-black mt-1 ${selectedCustomer.totalPending > 0 ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-foreground'}`}>
                        {"\u20B9"}{selectedCustomer.totalPending.toFixed(2)}
                      </h3>
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="bg-amber-50/50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 p-3.5 rounded-xl">
                      <h5 className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider mb-1">Vendor Notes</h5>
                      <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">{selectedCustomer.notes}</p>
                    </div>
                  )}

                  {/* Customer Bills list */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      Invoice Ledger Timeline
                    </h4>

                    <div className="border border-border rounded-xl overflow-x-auto">
                      <Table className="min-w-[560px]">
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="font-bold text-xs text-muted-foreground">Inv Num</TableHead>
                            <TableHead className="font-bold text-xs text-muted-foreground">Date</TableHead>
                            <TableHead className="font-bold text-xs text-center text-muted-foreground">Status</TableHead>
                            <TableHead className="font-bold text-xs text-right text-muted-foreground">Billed</TableHead>
                            <TableHead className="font-bold text-xs text-right text-muted-foreground">Paid</TableHead>
                            <TableHead className="font-bold text-xs text-right text-muted-foreground">Due</TableHead>
                            <TableHead className="font-bold text-xs text-right print:hidden text-muted-foreground">View</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingLedger ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground text-xs">
                                <RefreshCw className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ) : customerInvoices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                                No invoice history found for this customer.
                              </TableCell>
                            </TableRow>
                          ) : (
                            customerInvoices.map((inv) => {
                              const bal = inv.grandTotal - inv.amountPaid;
                              return (
                                <TableRow key={inv.id} className="hover:bg-muted/40 text-xs transition-colors">
                                  <TableCell className="font-semibold text-foreground">{inv.invoiceNum}</TableCell>
                                  <TableCell className="text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' :
                                        inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' :
                                          'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                      }`}>
                                      {inv.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-foreground">{"\u20B9"}{inv.grandTotal.toFixed(0)}</TableCell>
                                  <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">{"\u20B9"}{inv.amountPaid.toFixed(0)}</TableCell>
                                  <TableCell className="text-right text-rose-600 dark:text-rose-400 font-semibold">{"\u20B9"}{bal.toFixed(0)}</TableCell>
                                  <TableCell className="text-right print:hidden">
                                    <Link href={`/invoices?search=${inv.invoiceNum}`} className="inline-flex h-6 w-6 items-center justify-center bg-background hover:bg-muted rounded-full border border-border text-muted-foreground hover:text-foreground">
                                      <ChevronRight className="h-3.5 w-3.5" />
                                    </Link>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Printable Ledger Representation (Visible only in print mode) */}
              <div ref={printRef} className="hidden print:block print-area p-8 space-y-6 text-black bg-white">
                <div className="flex justify-between items-start border-b-2 border-gray-900 pb-4">
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">{selectedCustomer.name} - Ledger Report</h1>
                    <p className="text-sm text-gray-600 mt-1">Generated Date: {new Date().toLocaleDateString()}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold">Contact: {selectedCustomer.phone}</p>
                    {selectedCustomer.email && <p>Email: {selectedCustomer.email}</p>}
                    {selectedCustomer.gstNumber && <p>GSTIN: {selectedCustomer.gstNumber}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 border-2 border-gray-900 p-4 rounded-lg bg-gray-50">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Bills</p>
                    <h3 className="text-xl font-black mt-1">{selectedCustomer.totalBills}</h3>
                  </div>
                  <div className="text-center border-x-2 border-gray-300">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Paid</p>
                    <h3 className="text-xl font-black mt-1">{"\u20B9"}{selectedCustomer.totalPaid.toFixed(2)}</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Outstanding</p>
                    <h3 className="text-xl font-black mt-1 text-red-600">{"\u20B9"}{selectedCustomer.totalPending.toFixed(2)}</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider border-b border-gray-200 pb-1">Statement of Transactions</h3>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-900 bg-gray-100">
                        <th className="py-2 font-bold">Invoice ID</th>
                        <th className="py-2 font-bold">Date</th>
                        <th className="py-2 font-bold text-center">Status</th>
                        <th className="py-2 font-bold text-right">Billed Amt</th>
                        <th className="py-2 font-bold text-right">Paid Amt</th>
                        <th className="py-2 font-bold text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-gray-200">
                          <td className="py-2 font-semibold">{inv.invoiceNum}</td>
                          <td className="py-2">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                          <td className="py-2 text-center uppercase font-bold">{inv.status}</td>
                          <td className="py-2 text-right">{"\u20B9"}{inv.grandTotal.toFixed(2)}</td>
                          <td className="py-2 text-right">{"\u20B9"}{inv.amountPaid.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold">{"\u20B9"}{(inv.grandTotal - inv.amountPaid).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <Card className="border border-border border-dashed rounded-2xl bg-card/50 p-12 text-center h-100 flex flex-col justify-center items-center">
              <User className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
              <h3 className="font-bold text-foreground text-lg">No Customer Selected</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">Select a customer from the sidebar to inspect their billing history, active transactions ledger, and download reports.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-106.25 overflow-hidden bg-card text-card-foreground border border-border">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                {editingItem ? 'Edit Customer Details' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a permanent customer profile. Mobile number is required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Customer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-foreground">Mobile Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="e.g. 9876543210"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@example.com"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstNumber" className="text-foreground">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-foreground">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Flat 302, Sector 15, Vashi"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-foreground">Notes / Observations</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Credit limits, custom rates, delivery notes..."
                  className="rounded-xl border-border bg-background text-foreground min-h-15"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg border-border px-6 font-bold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 shadow-sm">
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settle Balance Dialog */}
      <Dialog open={isSettleDialogOpen} onOpenChange={setIsSettleDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-100 bg-card text-card-foreground border border-border">
          <form onSubmit={handleSettlePayment}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-foreground">Settle Balance</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Record a lump-sum payment of X amount for {selectedCustomer?.name} to settle their oldest outstanding invoices first.
              </DialogDescription>
            </DialogHeader>

            {selectedCustomer && (
              <div className="space-y-4 py-2">
                <div className="bg-muted/50 p-3 rounded-xl border border-border text-xs space-y-1.5 font-medium">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Billed:</span>
                    <span className="text-foreground font-bold">{"\u20B9"}{(selectedCustomer.totalPaid + selectedCustomer.totalPending).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{"\u20B9"}{selectedCustomer.totalPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <span>Balance Outstanding:</span>
                    <span>{"\u20B9"}{selectedCustomer.totalPending.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settleAmount" className="text-foreground">Settlement Amount ({"\u20B9"})</Label>
                  <Input
                    id="settleAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedCustomer.totalPending}
                    value={settleForm.amount}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="rounded-xl border-border bg-background text-foreground font-bold"
                    placeholder={`e.g. ${selectedCustomer.totalPending.toFixed(0)}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="settlePaymentMethod" className="text-foreground">Method</Label>
                    <Select
                      value={settleForm.paymentMethod}
                      onValueChange={(val) => setSettleForm(prev => ({ ...prev, paymentMethod: val }))}
                    >
                      <SelectTrigger id="settlePaymentMethod" className="rounded-xl border-border bg-background text-foreground">
                        <SelectValue placeholder="Select Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CHEQUE">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="settlePaymentDate" className="text-foreground">Date</Label>
                    <Input
                      id="settlePaymentDate"
                      type="date"
                      value={settleForm.paymentDate}
                      onChange={(e) => setSettleForm(prev => ({ ...prev, paymentDate: e.target.value }))}
                      required
                      className="rounded-xl border-border bg-background text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settleReferenceNumber" className="text-foreground">Reference Number (Optional)</Label>
                  <Input
                    id="settleReferenceNumber"
                    value={settleForm.referenceNumber}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Transaction ID, Cheque No, etc."
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settleNotes" className="text-foreground">Notes / Remarks</Label>
                  <Input
                    id="settleNotes"
                    value={settleForm.notes}
                    onChange={(e) => setSettleForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Paid in full / Part payment"
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSettleDialogOpen(false)} className="rounded-lg border-border px-6 font-bold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={settlingPayment} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-6 gap-1.5 shadow-sm">
                {settlingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Settling...
                  </>
                ) : (
                  'Settle Dues'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

