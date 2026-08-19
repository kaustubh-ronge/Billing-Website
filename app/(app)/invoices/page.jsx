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
import InvoicePreviewHTML from '@/components/InvoicePreviewHTML';

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleted, setShowDeleted] = useState(false);

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
    fetchInvoices(1);
  }, [statusFilter, showDeleted]);

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

  const fetchInvoices = async (pageNumber = page) => {
    try {
      setLoading(true);
      let url = `/api/invoices?search=${encodeURIComponent(search)}&page=${pageNumber}&limit=10`;
      if (statusFilter !== 'ALL') {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      if (showDeleted) {
        url += `&showDeleted=true`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
        setPage(data.page || 1);
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
    fetchInvoices(1);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle className="h-3 w-3" /> PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <AlertCircle className="h-3 w-3" /> PARTIAL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
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
            onClick={async () => {
              try {
                let url = `/api/invoices?all=true&search=${encodeURIComponent(search)}`;
                if (statusFilter !== 'ALL') {
                  url += `&status=${encodeURIComponent(statusFilter)}`;
                }
                if (showDeleted) {
                  url += `&showDeleted=true`;
                }
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch export data');
                const data = await response.json();
                const allInvoices = data.invoices || [];

                const rows = allInvoices.map((inv) => ({
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
              } catch (err) {
                console.error(err);
                toast.error('Failed to export invoices');
              }
            }}
            className="rounded-lg border-border font-bold text-sm flex items-center gap-1.5 bg-background text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {can('invoices:create') && (
            <Link href="/invoices/new" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2.5 text-sm flex items-center gap-2 shadow-sm">
              <Plus className="h-4 w-4" /> Create Bill
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search and Filters panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/40 p-4 rounded-2xl border border-border">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by invoice # or customer name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 rounded-full border-border bg-background"
              />
            </form>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-muted-foreground select-none hover:text-foreground transition-colors shrink-0 self-start sm:self-center">
              <input
                type="checkbox"
                checked={showDeleted}
                onChange={(e) => setShowDeleted(e.target.checked)}
                className="h-4 w-4 rounded border-border text-rose-600 focus:ring-rose-500/30"
              />
              <span>Show Deleted Bills</span>
            </label>
          </div>
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
            <Button variant="outline" size="icon" onClick={() => fetchInvoices()} className="rounded-full bg-background border-border">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice list — mobile cards + desktop table */}

        {/* Mobile card list (hidden on md+) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              Loading invoices...
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No invoices found.
            </div>
          ) : (
            invoices.map((inv) => {
              const bal = inv.grandTotal - inv.amountPaid;
              return (
                <div key={inv.id} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-foreground text-sm">{inv.invoiceNum}</div>
                      <div className="font-semibold text-foreground text-sm mt-0.5">{inv.customer.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.customer.phone}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(inv.status)}
                      <span className="text-xs text-muted-foreground">{new Date(inv.issuedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-muted/50 rounded-xl p-3 text-xs border border-border">
                    <div>
                      <div className="text-muted-foreground font-medium mb-0.5">Total</div>
                      <div className="font-bold text-foreground">{"\u20B9"}{inv.grandTotal.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium mb-0.5">Paid</div>
                      <div className="font-bold text-emerald-600 dark:text-emerald-400">{"\u20B9"}{inv.amountPaid.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium mb-0.5">Due</div>
                      <div className={`font-bold ${bal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>{"\u20B9"}{bal.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {bal > 0 && !inv.isDeleted && can('payments:record') && (
                      <Button size="sm" variant="outline" onClick={() => openPaymentDialog(inv)}
                        className="h-7 rounded-full border-border font-bold text-xs flex items-center gap-1 px-2.5 text-foreground hover:bg-muted">
                        <DollarSign className="h-3 w-3" /> Record
                      </Button>
                    )}
                    {bal > 0 && !inv.isDeleted && can('reminders:send') && (
                      <a href={getReminderLink(inv)} target="_blank" rel="noreferrer"
                        className="inline-flex h-7 items-center px-2.5 border border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full font-bold text-xs gap-1">
                        <Bell className="h-3 w-3" /> Alert
                      </a>
                    )}
                    <a href={getWhatsAppShareLink(inv)} target="_blank" rel="noreferrer"
                      className="inline-flex h-7 items-center px-2.5 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-xs gap-1">
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
                    {can('invoices:delete') && !inv.isDeleted && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInvoice(inv.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
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
        <Card className="hidden md:block border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-muted-foreground">Invoice ID</TableHead>
                <TableHead className="font-bold text-muted-foreground">Customer Detail</TableHead>
                <TableHead className="font-bold text-muted-foreground"><span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Date</span></TableHead>
                <TableHead className="font-bold text-muted-foreground text-center">Status</TableHead>
                <TableHead className="font-bold text-muted-foreground text-right">Total Billed</TableHead>
                <TableHead className="font-bold text-muted-foreground text-right">Paid Amount</TableHead>
                <TableHead className="font-bold text-muted-foreground text-right">Outstanding</TableHead>
                <TableHead className="font-bold text-muted-foreground text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No invoices found.
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => {
                  const bal = inv.grandTotal - inv.amountPaid;
                  return (
                    <TableRow key={inv.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-semibold text-foreground">{inv.invoiceNum}</TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{inv.customer.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{inv.customer.phone}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground font-medium">
                        {new Date(inv.issuedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(inv.status)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">{"\u20B9"}{inv.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-emerald-600 dark:text-emerald-400 font-semibold">{"\u20B9"}{inv.amountPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-rose-600 dark:text-rose-400 font-semibold">{"\u20B9"}{bal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap lg:flex-nowrap">
                          {bal > 0 && !inv.isDeleted && (
                            <>
                              {can('payments:record') && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openPaymentDialog(inv)}
                                className="h-8 rounded-full border-border font-bold hover:bg-muted flex items-center gap-1 text-xs text-foreground"
                              >
                                <DollarSign className="h-3 w-3" /> Record
                              </Button>
                              )}
                              {can('reminders:send') && (
                              <a
                                href={getReminderLink(inv)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex h-8 items-center px-3 border border-amber-200 dark:border-amber-900 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded-full font-bold text-xs gap-1"
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
                            className="inline-flex h-8 items-center px-3 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full font-bold text-xs gap-1"
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
                          {can('invoices:delete') && !inv.isDeleted && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full"
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 mt-2 gap-4">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{Math.min(totalCount, (page - 1) * 10 + 1)}</span> to{' '}
              <span className="font-semibold text-foreground">{Math.min(totalCount, page * 10)}</span> of{' '}
              <span className="font-semibold text-foreground">{totalCount}</span> invoices
            </p>
            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 1}
                onClick={() => fetchInvoices(page - 1)}
                className="rounded-full h-8 w-8 border-border"
                aria-label="Previous page"
              >
                ‹
              </Button>
              <span className="text-xs font-bold text-foreground px-2">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages}
                onClick={() => fetchInvoices(page + 1)}
                className="rounded-full h-8 w-8 border-border"
                aria-label="Next page"
              >
                ›
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-100 bg-card text-card-foreground border border-border">
          <form onSubmit={handleRecordPayment}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-foreground">Record Payment</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Add a payment transaction for invoice {selectedInvoice?.invoiceNum}.
              </DialogDescription>
            </DialogHeader>

            {selectedInvoice && (
              <div className="space-y-4 py-2">
                <div className="bg-muted/50 p-3 rounded-xl border border-border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Billed Grand Total:</span>
                    <span className="font-bold text-foreground">{"\u20B9"}{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Previously Paid:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{"\u20B9"}{selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1.5 font-bold text-rose-600 dark:text-rose-400">
                    <span>Due Balance:</span>
                    <span>{"\u20B9"}{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payAmount" className="text-foreground">Amount Collected ({"\u20B9"})</Label>
                  <Input
                    id="payAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice.grandTotal - selectedInvoice.amountPaid}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    className="rounded-xl border-border bg-background text-foreground font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payMethod" className="text-foreground">Payment Method</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm(prev => ({ ...prev, paymentMethod: val }))}
                  >
                    <SelectTrigger id="payMethod" className="rounded-xl border-border bg-background text-foreground">
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
                  <Label htmlFor="payNotes" className="text-foreground">Transaction Notes</Label>
                  <Input
                    id="payNotes"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="rounded-lg border-border px-6 font-bold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" disabled={recordingPayment} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 flex items-center gap-1 shadow-sm">
                {recordingPayment && <RefreshCw className="h-4 w-4 animate-spin" />}
                Log Payment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden print layouts for quick printing single invoice */}
      {selectedInvoice && selectedInvoice.customer && vendorShop && (
        <div className="hidden print:block print-area bg-white text-black font-sans leading-normal">
          <InvoicePreviewHTML
            invoice={selectedInvoice}
            shop={vendorShop}
            customer={selectedInvoice.customer}
            items={selectedInvoice.items || []}
            statusBadge={getStatusBadge(selectedInvoice.status)}
          />
        </div>
      )}
    </div>
  );
}
