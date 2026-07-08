"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  FileText, Search, Plus, DollarSign, MessageSquare, Bell,
  RefreshCw, CheckCircle, AlertCircle, HelpCircle, Calendar, Trash2, Download,
  FileDown, ArrowUpRight, Printer
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { downloadCSV } from '@/lib/csv';
import { useCan } from '@/lib/permissions/PermissionContext';
import { numberToWords } from '@/lib/utils';

export default function InvoicesPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-6xl px-4 py-0 sm:px-6 lg:px-8 text-center text-gray-500">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Loading invoices...</p>
      </div>
    }>
      <InvoicesList />
    </Suspense>
  );
}

function InvoicesList() {
  const can = useCan();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Vendor Shop config for business name/reminders
  const [vendorShop, setVendorShop] = useState(null);

  // Record Payment Dialog state
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
    notes: 'Partial invoice payment',
  });
  const [recordingPayment, setRecordingPayment] = useState(false);

  useEffect(() => {
    fetchVendorConfig();
    fetchInvoices();
  }, [statusFilter]);

  const fetchVendorConfig = async () => {
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

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      let url = `/api/invoices?search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      } else {
        toast.error('Failed to load invoices');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const openPaymentDialog = (invoice) => {
    setSelectedInvoice(invoice);
    const balance = invoice.grandTotal - invoice.amountPaid;
    setPaymentForm({
      amount: balance.toString(),
      paymentMethod: 'UPI',
      notes: 'Balance settlement',
    });
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amt = parseFloat(paymentForm.amount);
    const balance = selectedInvoice.grandTotal - selectedInvoice.amountPaid;
    if (isNaN(amt) || amt <= 0 || amt > balance) {
      toast.error(`Please enter a valid amount between 0 and \u20B9${balance.toFixed(2)}`);
      return;
    }

    setRecordingPayment(true);
    try {
      const res = await fetch(`/api/invoices/${selectedInvoice.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm),
      });

      if (res.ok) {
        toast.success('Payment recorded successfully!');
        setIsPaymentDialogOpen(false);
        fetchInvoices();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error logging transaction');
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Are you sure you want to delete this invoice? This will refund items back to stock inventory.')) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Invoice deleted and stock inventory refunded');
        fetchInvoices();
      } else {
        toast.error('Failed to delete invoice');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting invoice');
    }
  };

  // WhatsApp Reminder Link Generator
  const getReminderLink = (inv) => {
    if (!inv.customer || !vendorShop) return '#';
    const balance = inv.grandTotal - inv.amountPaid;

    const publicInvoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/public/invoices/${inv.id}`
      : '';

    const message = `Dear ${inv.customer.name},

Your invoice ${inv.invoiceNum} for \u20B9${balance.toFixed(2)} is pending.

Please make the payment at your earliest convenience. You can view and download the PDF here:
${publicInvoiceUrl}

Thank you.

Regards,
${vendorShop.businessName}`;

    const formattedPhone = inv.customer.phone.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppShareLink = (inv) => {
    if (!inv.customer || !vendorShop) return '#';

    const publicInvoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/public/invoices/${inv.id}`
      : '';

    const message = `Hello ${inv.customer.name},

Thank you for your purchase.

Invoice Number: ${inv.invoiceNum}
Amount: \u20B9${inv.grandTotal.toFixed(2)}
Payment Status: ${inv.status}

View and Download PDF Invoice:
${publicInvoiceUrl}

Regards,
${vendorShop.businessName}`;

    const formattedPhone = inv.customer.phone.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-green-50 text-green-700 border border-green-100">
            <CheckCircle className="h-3 w-3" /> PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-100">
            <AlertCircle className="h-3 w-3" /> PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-100">
            <HelpCircle className="h-3 w-3" /> UNPAID
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-0 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Review all sales transactions, record payments, and send customer reminders.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = invoices.map((inv) => ({
                Invoice: inv.invoiceNum,
                Customer: inv.customer?.name ?? '',
                Phone: inv.customer?.phone ?? '',
                Date: new Date(inv.issuedAt).toLocaleDateString('en-IN'),
                'Due Date': inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '',
                'Payment Terms': inv.paymentTerms ?? 'IMMEDIATE',
                'Grand Total': inv.grandTotal.toFixed(2),
                'Amount Paid': inv.amountPaid.toFixed(2),
                Outstanding: (inv.grandTotal - inv.amountPaid).toFixed(2),
                Status: inv.status,
              }));
              downloadCSV(rows, 'invoices');
            }}
            className="rounded-full border-gray-200 font-bold text-sm flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {can('invoices:create') && (
            <Link href="/invoices/new" className="font-bold bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2.5 text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create Bill
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search and Filters panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/40 p-4 rounded-2xl border border-border">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by invoice # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-border bg-background"
            />
          </form>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="w-45 rounded-full bg-background border-border">
                <SelectValue placeholder="Filter Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="PAID">Fully Paid</SelectItem>
                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                <SelectItem value="PENDING">Pending / Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchInvoices} className="rounded-full bg-background border-border">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice list — mobile cards + desktop table */}

        {/* Mobile card list (hidden on md+) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center py-10 text-gray-500">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No invoices found.
            </div>
          ) : (
            invoices.map((inv) => {
              const bal = inv.grandTotal - inv.amountPaid;
              return (
                <div key={inv.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{inv.invoiceNum}</div>
                      <div className="font-semibold text-gray-700 text-sm mt-0.5">{inv.customer.name}</div>
                      <div className="text-xs text-gray-400">{inv.customer.phone}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(inv.status)}
                      <span className="text-xs text-gray-400">{new Date(inv.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-xl p-3 text-xs">
                    <div>
                      <div className="text-gray-400 font-medium mb-0.5">Total</div>
                      <div className="font-bold text-gray-900">{"\u20B9"}{inv.grandTotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium mb-0.5">Paid</div>
                      <div className="font-bold text-green-600">{"\u20B9"}{inv.amountPaid.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium mb-0.5">Due</div>
                      <div className={`font-bold ${bal > 0 ? 'text-rose-600' : 'text-green-600'}`}>{"\u20B9"}{bal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {bal > 0 && can('payments:record') && (
                      <Button size="sm" variant="outline" onClick={() => openPaymentDialog(inv)}
                        className="h-7 rounded-full border-gray-200 font-bold text-xs flex items-center gap-1 px-2.5">
                        <DollarSign className="h-3 w-3" /> Record
                      </Button>
                    )}
                    {bal > 0 && can('reminders:send') && (
                      <a href={getReminderLink(inv)} target="_blank" rel="noreferrer"
                        className="inline-flex h-7 items-center px-2.5 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-full font-bold text-xs gap-1">
                        <Bell className="h-3 w-3" /> Alert
                      </a>
                    )}
                    <a href={getWhatsAppShareLink(inv)} target="_blank" rel="noreferrer"
                      className="inline-flex h-7 items-center px-2.5 border border-green-200 hover:bg-green-50 text-green-700 rounded-full font-bold text-xs gap-1">
                      <MessageSquare className="h-3 w-3" /> Share
                    </a>
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" title="Print">
                      <Printer className="h-3.5 w-3.5" />
                    </a>
                    <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer" download
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" title="Download PDF">
                      <FileDown className="h-3.5 w-3.5" />
                    </a>
                    {can('invoices:delete') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(inv.id)}
                        className="h-7 w-7 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop table (hidden on mobile) */}
        <Card className="hidden md:block border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-bold">Invoice ID</TableHead>
                <TableHead className="font-bold">Customer Detail</TableHead>
                <TableHead className="font-bold"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span></TableHead>
                <TableHead className="font-bold text-center">Status</TableHead>
                <TableHead className="font-bold text-right">Total Billed</TableHead>
                <TableHead className="font-bold text-right">Paid Amount</TableHead>
                <TableHead className="font-bold text-right">Outstanding</TableHead>
                <TableHead className="font-bold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const bal = inv.grandTotal - inv.amountPaid;
                  return (
                    <TableRow key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                      <TableCell className="font-semibold text-gray-900">{inv.invoiceNum}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-900">{inv.customer.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{inv.customer.phone}</div>
                      </TableCell>
                      <TableCell className="text-gray-600 font-medium">
                        {new Date(inv.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(inv.status)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900">{"\u20B9"}{inv.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{"\u20B9"}{inv.amountPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-rose-600 font-semibold">{"\u20B9"}{bal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap lg:flex-nowrap">
                          {bal > 0 && (
                            <>
                              {can('payments:record') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentDialog(inv)}
                                className="h-8 rounded-full border-gray-200 font-bold hover:bg-gray-100 flex items-center gap-1 text-xs"
                              >
                                <DollarSign className="h-3 w-3" /> Record
                              </Button>
                              )}
                              {can('reminders:send') && (
                              <a
                                href={getReminderLink(inv)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center px-3 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-full font-bold text-xs gap-1"
                              >
                                <Bell className="h-3 w-3" /> Alert
                              </a>
                              )}
                            </>
                          )}
                          <a
                            href={getWhatsAppShareLink(inv)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 items-center px-3 border border-green-200 hover:bg-green-50 text-green-700 rounded-full font-bold text-xs gap-1"
                          >
                            <MessageSquare className="h-3 w-3" /> Share
                          </a>
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Print Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </a>
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Download PDF"
                          >
                            <FileDown className="h-4 w-4" />
                          </a>
                          {can('invoices:delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-100 bg-white">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">Record Payment</DialogTitle>
              <DialogDescription>
                Add a payment transaction for invoice {selectedInvoice?.invoiceNum}.
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4 py-2">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Billed Grand Total:</span>
                    <span className="font-bold text-gray-900">{"\u20B9"}{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Previously Paid:</span>
                    <span className="font-bold text-green-600">{"\u20B9"}{selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200/60 pt-1.5 font-bold text-rose-600">
                    <span>Due Balance:</span>
                    <span>{"\u20B9"}{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payAmount">Amount Collected ({"\u20B9"})</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.grandTotal - selectedInvoice.amountPaid}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="rounded-xl border-gray-200 font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payMethod">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger id="payMethod" className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Select Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="UPI">UPI / Digital</SelectItem>
                      <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                      <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payNotes">Transaction Notes</Label>
                  <Input
                    id="payNotes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="rounded-full border-gray-200 px-6 font-bold">
                Cancel
              </Button>
              <Button type="submit" disabled={recordingPayment} className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 flex items-center gap-1">
                {recordingPayment && <RefreshCw className="h-4 w-4 animate-spin" />}
                Log Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden print layouts for quick printing single invoice */}
      {selectedInvoice && selectedInvoice.customer && vendorShop && (
        <div className="hidden print:block print-area p-8 bg-white text-black font-sans leading-normal">
          <div className="mx-auto max-w-4xl bg-white border border-gray-300 rounded-lg p-6 sm:p-10 font-sans text-xs text-gray-800">
            {/* Top header row */}
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4 border-b border-gray-200 pb-4">
              <div className="flex-1 col-span-2">
                <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1 uppercase">{vendorShop.businessName}</h1>
                {/* cyan background banner for description/tagline */}
                <div className="bg-[#00a29a] text-white font-bold text-[10px] px-3 py-1.5 rounded uppercase tracking-wider inline-block mb-3">
                  Manufacturing & Supply of Precision Press Tool & Room Component
                </div>
                <div className="text-[10px] text-gray-500 leading-relaxed max-w-md">
                  {vendorShop.address && <p>{vendorShop.address}</p>}
                  <p className="mt-1">
                    {vendorShop.phone && <span>Tel : {vendorShop.phone} </span>}
                    {vendorShop.email && <span>| Web : {vendorShop.email}</span>}
                  </p>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end">
                {vendorShop.logoBase64 ? (
                  <img src={vendorShop.logoBase64} alt="Shop Logo" className="h-16 w-auto object-contain rounded-lg mb-2" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white font-black text-sm mb-2">
                    {vendorShop.businessName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* PAN, TAX INVOICE banner line */}
            <div className="border-t border-b border-gray-300 py-1.5 my-3 grid grid-cols-3 items-center text-[10px] font-bold text-gray-850">
              <div>PAN : {vendorShop.taxId ? vendorShop.taxId.substring(2, 12).toUpperCase() : "N/A"}</div>
              <div className="text-center text-sm font-black tracking-widest text-black">TAX INVOICE</div>
              <div className="text-right text-[8px] text-gray-500 uppercase">Original for Recipient</div>
            </div>

            {/* 2-Column Info Grid: Customer Details vs Invoice Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded overflow-hidden mb-6 text-[10px]">
              {/* Left Column: Customer Details */}
              <div className="p-3 border-r border-gray-300 space-y-1">
                <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Customer Detail</div>
                <div className="flex"><span className="w-24 font-bold shrink-0">M/S</span><span className="text-gray-900 font-bold">{selectedInvoice.customer.name}</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">Address</span><span className="text-gray-600 leading-relaxed">{selectedInvoice.customer.address || "N/A"}</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">Phone</span><span className="text-gray-600">{selectedInvoice.customer.phone}</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">GSTIN</span><span className="text-gray-950 font-bold">{selectedInvoice.customer.gstNumber || "N/A"}</span></div>
                <div className="flex"><span className="w-24 font-bold shrink-0">Place of Supply</span><span className="text-gray-600">{selectedInvoice.customer.address ? selectedInvoice.customer.address.split(',').pop().trim() : "N/A"}</span></div>
              </div>
              
              {/* Right Column: Invoice Details */}
              <div className="p-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="col-span-2 text-[9px] font-black text-gray-400 uppercase tracking-wider pb-1 border-b border-gray-200 mb-1.5">Invoice Details</div>
                <div><span className="font-bold text-gray-500 block">Invoice No.</span><span className="font-bold text-gray-900">{selectedInvoice.invoiceNum}</span></div>
                <div><span className="font-bold text-gray-500 block">Invoice Date</span><span className="font-bold text-gray-900">{new Date(selectedInvoice.issuedAt).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</span></div>
                {vendorShop?.showPaymentTerms !== false && (
                  <>
                    <div><span className="font-bold text-gray-500 block">Payment Terms</span><span className="text-gray-700">{selectedInvoice.paymentTerms}</span></div>
                    <div><span className="font-bold text-gray-500 block">Due Date</span><span className="text-gray-700">{selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}) : "Immediate"}</span></div>
                  </>
                )}
                <div className="col-span-2"><span className="font-bold text-gray-500 block">Status</span><span className="mt-0.5 inline-block">{getStatusBadge(selectedInvoice.status)}</span></div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto mb-6 border border-gray-300 rounded">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-300 font-bold text-gray-700 text-center">
                    <th className="border-r border-gray-300 py-2 px-1 w-10">Sr. No.</th>
                    <th className="border-r border-gray-300 py-2 px-2 text-left">Name of Product / Service</th>
                    <th className="border-r border-gray-300 py-2 px-1 w-20">HSN / SAC</th>
                    <th className="border-r border-gray-300 py-2 px-1 w-10">Qty</th>
                    <th className="border-r border-gray-300 py-2 px-1 w-10">Unit</th>
                    <th className="border-r border-gray-300 py-2 px-2 text-right w-20">Rate</th>
                    <th className="border-r border-gray-300 py-2 px-2 text-right w-24">Taxable Value</th>
                    <th className="border-r border-gray-300 p-0 w-28">
                      <div className="border-b border-gray-300 py-1 font-bold">GST</div>
                      <div className="flex text-[8px] font-bold">
                        <span className="w-1/2 border-r border-gray-300 py-0.5">%</span>
                        <span className="w-1/2 py-0.5">Amount</span>
                      </div>
                    </th>
                    <th className="py-2 px-2 text-right w-24">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {selectedInvoice.items?.map((item, idx) => {
                    const itemTaxRate = item.product?.taxRate ?? 0;
                    const lineTotal = item.quantity * item.unitPrice;
                    const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                    const taxableValue = item.quantity * rateExclusive;
                    const gstAmount = lineTotal - taxableValue;
                    
                    return (
                      <tr key={idx} className="hover:bg-gray-50/20 text-center">
                        <td className="border-r border-gray-300 py-2 px-1 font-medium">{idx + 1}</td>
                        <td className="border-r border-gray-300 py-2 px-2 text-left font-bold text-gray-900">
                          {item.product?.name || "Unnamed Item"} {item.product?.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}
                          {item.product?.isService && (
                            <span className="ml-1.5 text-[8px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-normal">Service</span>
                          )}
                        </td>
                        <td className="border-r border-gray-300 py-2 px-1 text-gray-600">{item.product?.hsnSac || item.product?.sku || item.product?.category || "—"}</td>
                        <td className="border-r border-gray-300 py-2 px-1 font-bold text-gray-900">{item.quantity}</td>
                        <td className="border-r border-gray-300 py-2 px-1 text-gray-605">{item.product?.unit || "NOS"}</td>
                        <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700">₹{rateExclusive.toFixed(2)}</td>
                        <td className="border-r border-gray-300 py-2 px-2 text-right text-gray-700 font-medium">₹{taxableValue.toFixed(2)}</td>
                        <td className="border-r border-gray-300 p-0 text-gray-750">
                          <div className="flex h-full items-stretch">
                            <span className="w-1/2 border-r border-gray-300 py-2 px-1 flex items-center justify-center font-medium">{itemTaxRate}%</span>
                            <span className="w-1/2 py-2 px-1 flex items-center justify-end font-medium">₹{gstAmount.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-right font-black text-gray-900">₹{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  
                  {/* Table Total Row */}
                  <tr className="bg-gray-50 font-black text-gray-950 border-t border-gray-300 text-center">
                    <td className="border-r border-gray-300 py-2 px-2 text-right" colSpan={3}>Total</td>
                    <td className="border-r border-gray-300 py-2 px-1">
                      {selectedInvoice.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                    </td>
                    <td className="border-r border-gray-300 py-2 px-1"></td>
                    <td className="border-r border-gray-300 py-2 px-2"></td>
                    <td className="border-r border-gray-300 py-2 px-2 text-right">
                      ₹{(selectedInvoice.items?.reduce((sum, item) => {
                        const itemTaxRate = item.product?.taxRate ?? 0;
                        const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                        return sum + (item.quantity * rateExclusive);
                      }, 0) || 0).toFixed(2)}
                    </td>
                    <td className="border-r border-gray-300 p-0">
                      <div className="flex h-full items-stretch">
                        <span className="w-1/2 border-r border-gray-300"></span>
                        <span className="w-1/2 py-2 px-1 text-right">
                          ₹{(selectedInvoice.items?.reduce((sum, item) => {
                            const itemTaxRate = item.product?.taxRate ?? 0;
                            const lineTotal = item.quantity * item.unitPrice;
                            const rateExclusive = item.unitPrice / (1 + itemTaxRate / 100);
                            return sum + (lineTotal - (item.quantity * rateExclusive));
                          }, 0) || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right">
                      ₹{(selectedInvoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Details Area */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border border-gray-300 rounded overflow-hidden text-[10px]">
              {/* Left Column: Word Total, Bank Details, Terms, Customer Signature */}
              <div className="p-3 border-b sm:border-b-0 sm:border-r border-gray-300 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div>
                    <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Total In Words</span>
                    <p className="font-bold text-gray-900 bg-gray-50 border border-gray-200 p-2 rounded leading-relaxed">{numberToWords(selectedInvoice.grandTotal)}</p>
                  </div>
                    <div className="flex gap-4">
                    {vendorShop.showBankDetails !== false && (
                      <div className="flex-1 space-y-1">
                        <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Bank Details</span>
                        {vendorShop.bankName ? (
                          <div className="bg-gray-50 border border-gray-200 p-2 rounded space-y-0.5 text-[9px]">
                            <p><span className="font-semibold text-gray-600">Bank:</span> {vendorShop.bankName}</p>
                            {vendorShop.accountNum && <p><span className="font-semibold text-gray-600">A/c No:</span> {vendorShop.accountNum}</p>}
                            {vendorShop.ifscCode && <p><span className="font-semibold text-gray-600">IFSC:</span> {vendorShop.ifscCode}</p>}
                            {vendorShop.upiId && <p><span className="font-semibold text-gray-600">UPI ID:</span> {vendorShop.upiId}</p>}
                          </div>
                        ) : (
                          <p className="text-gray-400 italic">No bank details configured.</p>
                        )}
                      </div>
                    )}
                    {vendorShop.showQrCode !== false && vendorShop.upiId && (selectedInvoice.grandTotal - selectedInvoice.amountPaid) > 0 && (
                      <div className="shrink-0 text-center bg-gray-50 border border-gray-200 p-2 rounded flex flex-col items-center justify-center">
                        <span className="text-[8px] font-black text-blue-700 uppercase tracking-wider block mb-1">Pay using UPI</span>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${vendorShop.upiId}&pn=${encodeURIComponent(vendorShop.businessName)}&am=${(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}&cu=INR&tn=${encodeURIComponent(selectedInvoice.invoiceNum)}`)}`} 
                          alt="UPI QR Code" 
                          className="h-16 w-16 object-contain bg-white border border-gray-200 p-0.5 rounded"
                        />
                      </div>
                    )}
                  </div>

                  {vendorShop.showFooterMessage !== false && (
                    <div>
                      <span className="font-bold text-gray-500 block uppercase text-[8px] tracking-wider mb-1">Terms & Conditions</span>
                      <p className="text-[9px] text-gray-500 leading-relaxed italic border-t border-gray-200 pt-1.5">{vendorShop.footerMessage}</p>
                    </div>
                  )}
                </div>

                <div className="mt-8 pt-4 border-t border-gray-200 w-40 text-center">
                  <p className="font-bold text-gray-400">Customer Signature</p>
                </div>
              </div>

              {/* Right Column: Calculation Summary, Declaration, Authorized Signatory */}
              <div className="p-3 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Summary Calculations */}
                  <div className="space-y-1.5 bg-gray-50/50 p-3 rounded border border-gray-200 text-[10px]">
                    <div className="flex justify-between text-gray-600">
                      <span>Taxable Amount</span>
                      <span className="font-semibold text-gray-900">₹{(selectedInvoice.grandTotal - selectedInvoice.totalTax).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Add : GST Tax</span>
                      <span className="font-semibold text-gray-900">₹{selectedInvoice.totalTax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-1.5">
                      <span>Total Tax</span>
                      <span>₹{selectedInvoice.totalTax.toFixed(2)}</span>
                    </div>
                    
                    {selectedInvoice.discountPercentage > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Less: Discount ({selectedInvoice.discountPercentage}%)</span>
                        <span>-₹{((selectedInvoice.items?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0) * (selectedInvoice.discountPercentage / 100)).toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between font-black text-gray-950 border-t-2 border-gray-900 pt-2 text-xs">
                      <span>Total Amount After Tax</span>
                      <span>₹{selectedInvoice.grandTotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-green-600 font-bold pt-1">
                      <span>Amount Paid</span>
                      <span>₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-rose-600 font-black border-t border-gray-200 pt-1.5">
                      <span>Balance Due</span>
                      <span>₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-[8px] text-gray-500 leading-tight space-y-1">
                    <p className="font-bold text-gray-650 uppercase">Declaration</p>
                    <p>Certified that the particulars given above are true and correct.</p>
                  </div>
                </div>

                <div className="mt-8 pt-4 flex flex-col items-center border-t border-gray-200 text-center">
                  <p className="text-[8px] font-bold text-gray-500 mb-8">For {vendorShop.businessName}</p>
                  <p className="text-[7px] text-gray-400 italic mb-2">This is a computer generated invoice no signature required.</p>
                  <p className="font-bold text-gray-800 text-[9px] border-t border-gray-300 pt-1.5 w-32">Authorised Signatory</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

