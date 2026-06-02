"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  FileText, Search, Plus, Printer, DollarSign, MessageSquare, Bell, 
  RefreshCw, CheckCircle, AlertCircle, HelpCircle, Calendar 
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function InvoicesPage() {
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
      toast.error(`Please enter a valid amount between 0 and ₹${balance.toFixed(2)}`);
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
    
    const message = `Dear ${inv.customer.name},

Your invoice ${inv.invoiceNum} for ₹${balance.toFixed(2)} is pending.

Please make the payment at your earliest convenience. Thank you.

Regards,
${vendorShop.businessName}`;

    const formattedPhone = inv.customer.phone.replace(/\D/g, '');
    const phoneWithCode = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  const getWhatsAppShareLink = (inv) => {
    if (!inv.customer || !vendorShop) return '#';
    
    const message = `Hello ${inv.customer.name},

Thank you for your purchase.

Invoice Number: ${inv.invoiceNum}
Amount: ₹${inv.grandTotal.toFixed(2)}
Payment Status: ${inv.status}

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
    <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Invoices Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Review all sales transactions, record payments, and send customer reminders.</p>
        </div>
        <Link href="/invoices/new" className="font-bold bg-black text-white hover:bg-gray-900 rounded-full px-6 py-2.5 text-sm flex items-center gap-2 self-start sm:self-center">
          <Plus className="h-4 w-4" /> Create Bill
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search and Filters panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by invoice # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-gray-200 bg-white"
            />
          </form>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
              <SelectTrigger className="w-[180px] rounded-full bg-white border-gray-200">
                <SelectValue placeholder="Filter Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="PAID">Fully Paid</SelectItem>
                <SelectItem value="PARTIAL">Partially Paid</SelectItem>
                <SelectItem value="PENDING">Pending / Unpaid</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchInvoices} className="rounded-full bg-white border-gray-200">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Invoice list table */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
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
                      <TableCell className="text-right font-bold text-gray-900">₹{inv.grandTotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">₹{inv.amountPaid.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-rose-600 font-semibold">₹{bal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1.5 flex-wrap md:flex-nowrap">
                          {bal > 0 && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => openPaymentDialog(inv)} 
                                className="h-8 rounded-full border-gray-200 font-bold hover:bg-gray-100 flex items-center gap-1 text-xs"
                              >
                                <DollarSign className="h-3 w-3" /> Record
                              </Button>
                              <a 
                                href={getReminderLink(inv)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex h-8 items-center px-3 border border-amber-200 hover:bg-amber-50 text-amber-700 rounded-full font-bold text-xs gap-1"
                              >
                                <Bell className="h-3 w-3" /> Alert
                              </a>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => { setSelectedInvoice(inv); setTimeout(() => window.print(), 100); }} 
                            className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteInvoice(inv.id)} 
                            className="h-8 w-8 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
        <DialogContent className="rounded-2xl sm:max-w-[400px] bg-white">
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
                    <span className="font-bold text-gray-900">₹{selectedInvoice.grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Previously Paid:</span>
                    <span className="font-bold text-green-600">₹{selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200/60 pt-1.5 font-bold text-rose-600">
                    <span>Due Balance:</span>
                    <span>₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payAmount">Amount Collected (₹)</Label>
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
        <div className="hidden print:block p-8 bg-white text-black font-sans leading-normal">
          <div className="flex justify-between items-start border-b border-gray-300 pb-6 mb-6">
            <div>
              {vendorShop.logoBase64 && (
                <img src={vendorShop.logoBase64} alt="Logo" className="h-12 w-auto mb-3 object-contain" />
              )}
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{vendorShop.businessName}</h1>
              {vendorShop.ownerName && <p className="text-sm font-semibold text-gray-700 mt-1">Owner: {vendorShop.ownerName}</p>}
              <p className="text-xs text-gray-500 mt-1">
                {vendorShop.address && <span>{vendorShop.address}<br /></span>}
                {vendorShop.phone && <span>Phone: {vendorShop.phone} | </span>}
                {vendorShop.email && <span>Email: {vendorShop.email}</span>}
              </p>
              {vendorShop.taxId && (
                <p className="text-xs font-bold text-gray-900 mt-1.5">GSTIN: {vendorShop.taxId}</p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black uppercase text-gray-500">Tax Invoice</h2>
              <p className="text-xl font-bold text-gray-900 mt-1">{selectedInvoice.invoiceNum}</p>
              <p className="text-xs text-gray-500 mt-1">Date: {new Date(selectedInvoice.issuedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6 text-xs">
            <div>
              <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-1">Bill To</h3>
              <p className="font-bold text-sm text-gray-900">{selectedInvoice.customer.name}</p>
              <p className="text-gray-600 mt-1">Phone: {selectedInvoice.customer.phone}</p>
              {selectedInvoice.customer.email && <p className="text-gray-600">Email: {selectedInvoice.customer.email}</p>}
              {selectedInvoice.customer.address && <p className="text-gray-600">Address: {selectedInvoice.customer.address}</p>}
              {selectedInvoice.customer.gstNumber && <p className="font-bold text-gray-900 mt-1">GSTIN: {selectedInvoice.customer.gstNumber}</p>}
            </div>
            <div className="text-right">
              <h3 className="font-bold uppercase tracking-wider text-gray-400 mb-1">Payment Details</h3>
              <p className="font-semibold text-gray-900">Status: {selectedInvoice.status}</p>
              {selectedInvoice.payments?.length > 0 && (
                <p className="text-[10px] text-gray-500 mt-1">Last payment: {new Date(selectedInvoice.payments[selectedInvoice.payments.length - 1].paymentDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          <table className="w-full text-left text-xs border-collapse mb-6">
            <thead>
              <tr className="border-b-2 border-gray-900 bg-gray-50">
                <th className="py-2.5 font-bold">Item & Description</th>
                <th className="py-2.5 font-bold text-right">Unit Price</th>
                <th className="py-2.5 font-bold text-center w-16">Qty</th>
                <th className="py-2.5 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedInvoice.items?.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 font-semibold text-gray-900">
                    {item.product?.name || 'Unnamed Product'}
                    {item.product?.isService && <span className="ml-1 text-[8px] px-1 bg-gray-100 rounded">Service</span>}
                  </td>
                  <td className="py-2 text-right">₹{item.unitPrice.toFixed(2)}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">₹{(item.quantity * item.unitPrice).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-between items-start text-xs">
            <div>
              {vendorShop.footerMessage && (
                <div className="max-w-sm mt-8 border-t border-gray-200 pt-3">
                  <p className="text-[10px] text-gray-500 italic">{vendorShop.footerMessage}</p>
                </div>
              )}
            </div>
            <div className="w-64 space-y-1.5 border-t border-gray-200 pt-3">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal:</span>
                <span>₹{(selectedInvoice.grandTotal / (1 + (vendorShop.taxRate / 100))).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>GST Tax ({vendorShop.taxRate}%):</span>
                <span>₹{selectedInvoice.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-gray-900 border-t border-gray-900 pt-1.5 text-sm">
                <span>Grand Total:</span>
                <span>₹{selectedInvoice.grandTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-green-600">
                <span>Amount Paid:</span>
                <span>₹{selectedInvoice.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600 border-t border-gray-200 pt-1.5 text-xs">
                <span>Balance Due:</span>
                <span>₹{(selectedInvoice.grandTotal - selectedInvoice.amountPaid).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-16 flex justify-end text-xs">
            <div className="text-center w-48 border-t border-gray-400 pt-2">
              <p className="font-bold">{vendorShop.businessName}</p>
              <p className="text-gray-500 text-[10px] mt-0.5">Authorized Signatory</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
