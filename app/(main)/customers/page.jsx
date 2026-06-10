"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, User, Phone, Mail, MapPin, Receipt, ArrowRight, Download, Printer, RefreshCw, ChevronRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function CustomersPage() {
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
      return `  • ${inv.invoiceNum} | ${new Date(inv.issuedAt).toLocaleDateString()} | Due: ₹${bal.toFixed(2)}`;
    }).join('\n');

    const message = `Dear ${selectedCustomer.name},

This is a payment reminder from ${vendorShop.businessName}.

You have ${pendingInvoices.length} unpaid invoice(s) totaling ₹${totalPending.toFixed(2)}.

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
    <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Customer Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customer registry, view financial ledgers, and track bills.</p>
        </div>
        <Button onClick={openAddDialog} className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 flex items-center gap-2 self-start sm:self-center">
          <Plus className="h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Customer Listing */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-gray-200 bg-white"
            />
          </form>

          <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden max-h-[600px] overflow-y-auto">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
              <CardTitle className="text-sm font-bold text-gray-700">Customers ({customers.length})</CardTitle>
            </CardHeader>
            <div className="divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <RefreshCw className="h-5 w-5 animate-spin mx-auto text-gray-400 mb-2" />
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  No customers found. Click Add Customer to start.
                </div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => fetchCustomerLedger(c)}
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      selectedCustomer?.id === c.id ? 'bg-blue-50/40 border-l-4 border-blue-600 pl-3' : 'hover:bg-gray-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                        selectedCustomer?.id === c.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900">{c.name}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          c.totalPending > 0 ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {c.totalPending > 0 ? `Pending: ₹${c.totalPending.toFixed(0)}` : 'Cleared'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={(e) => openEditDialog(e, c)} className="h-7 w-7 hover:bg-gray-100 rounded-full text-gray-400 hover:text-black">
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => handleDelete(e, c.id)} className="h-7 w-7 hover:bg-rose-50 rounded-full text-gray-400 hover:text-rose-600">
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
              {/* Ledger Summary Card */}
              <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden print:shadow-none print:border-none">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 py-6 flex flex-row items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
                      <User className="h-5 w-5 text-gray-500" />
                      {selectedCustomer.name}
                    </CardTitle>
                    <CardDescription className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {selectedCustomer.gstNumber && <span className="font-medium text-gray-700">GST: {selectedCustomer.gstNumber}</span>}
                      {selectedCustomer.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {selectedCustomer.email}</span>}
                      {selectedCustomer.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedCustomer.address}</span>}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 print:hidden">
                    <Button variant="outline" size="sm" onClick={handlePrintLedger} className="rounded-full border-gray-200 font-bold flex items-center gap-1 text-xs px-3">
                      <Printer className="h-3.5 w-3.5" />
                      Print / PDF
                    </Button>
                    {selectedCustomer.totalPending > 0 && (
                      <a
                        href={getWhatsAppLedgerLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Send Reminder
                      </a>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Ledger Stats Row */}
                  <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Bills</p>
                      <h3 className="text-lg font-black text-gray-900 mt-1">{selectedCustomer.totalBills}</h3>
                    </div>
                    <div className="text-center border-x border-gray-200">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Paid</p>
                      <h3 className="text-lg font-black text-green-600 mt-1">₹{selectedCustomer.totalPaid.toFixed(2)}</h3>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Balance Due</p>
                      <h3 className={`text-lg font-black mt-1 ${selectedCustomer.totalPending > 0 ? 'text-rose-600 animate-pulse' : 'text-gray-900'}`}>
                        ₹{selectedCustomer.totalPending.toFixed(2)}
                      </h3>
                    </div>
                  </div>

                  {selectedCustomer.notes && (
                    <div className="bg-amber-50/50 border border-amber-100 p-3.5 rounded-xl">
                      <h5 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">Vendor Notes</h5>
                      <p className="text-sm text-amber-900 font-medium">{selectedCustomer.notes}</p>
                    </div>
                  )}

                  {/* Customer Bills list */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                      <Receipt className="h-4 w-4 text-gray-400" />
                      Invoice Ledger Timeline
                    </h4>
                    
                    <div className="border border-gray-100 rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50/50">
                          <TableRow>
                            <TableHead className="font-bold text-xs">Inv Num</TableHead>
                            <TableHead className="font-bold text-xs">Date</TableHead>
                            <TableHead className="font-bold text-xs text-center">Status</TableHead>
                            <TableHead className="font-bold text-xs text-right">Billed</TableHead>
                            <TableHead className="font-bold text-xs text-right">Paid</TableHead>
                            <TableHead className="font-bold text-xs text-right">Due</TableHead>
                            <TableHead className="font-bold text-xs text-right print:hidden">View</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loadingLedger ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-gray-400 text-xs">
                                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
                              </TableCell>
                            </TableRow>
                          ) : customerInvoices.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-xs">
                                No invoice history found for this customer.
                              </TableCell>
                            </TableRow>
                          ) : (
                            customerInvoices.map((inv) => {
                              const bal = inv.grandTotal - inv.amountPaid;
                              return (
                                <TableRow key={inv.id} className="hover:bg-gray-50/30 text-xs">
                                  <TableCell className="font-semibold text-gray-900">{inv.invoiceNum}</TableCell>
                                  <TableCell>{new Date(inv.issuedAt).toLocaleDateString()}</TableCell>
                                  <TableCell className="text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                      inv.status === 'PAID' ? 'bg-green-50 text-green-700' :
                                      inv.status === 'PARTIAL' ? 'bg-amber-50 text-amber-700' :
                                      'bg-rose-50 text-rose-700'
                                    }`}>
                                      {inv.status}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-gray-900">₹{inv.grandTotal.toFixed(0)}</TableCell>
                                  <TableCell className="text-right text-green-600 font-semibold">₹{inv.amountPaid.toFixed(0)}</TableCell>
                                  <TableCell className="text-right text-rose-600 font-semibold">₹{bal.toFixed(0)}</TableCell>
                                  <TableCell className="text-right print:hidden">
                                    <Link href={`/invoices?search=${inv.invoiceNum}`} className="inline-flex h-6 w-6 items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-full border border-gray-100 text-gray-500 hover:text-black">
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
                    <h3 className="text-xl font-black mt-1">₹{selectedCustomer.totalPaid.toFixed(2)}</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Outstanding</p>
                    <h3 className="text-xl font-black mt-1 text-red-600">₹{selectedCustomer.totalPending.toFixed(2)}</h3>
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
                          <td className="py-2 text-right">₹{inv.grandTotal.toFixed(2)}</td>
                          <td className="py-2 text-right">₹{inv.amountPaid.toFixed(2)}</td>
                          <td className="py-2 text-right font-bold">₹{(inv.grandTotal - inv.amountPaid).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <Card className="border border-gray-150 border-dashed rounded-2xl bg-gray-50/50 p-12 text-center h-[400px] flex flex-col justify-center items-center">
              <User className="h-10 w-10 text-gray-300 mb-3" />
              <h3 className="font-bold text-gray-700 text-lg">No Customer Selected</h3>
              <p className="text-sm text-gray-500 max-w-sm mt-1">Select a customer from the sidebar to inspect their billing history, active transactions ledger, and download reports.</p>
            </Card>
          )}
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] overflow-hidden bg-white">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Customer Details' : 'Add New Customer'}
              </DialogTitle>
              <DialogDescription>
                Create a permanent customer profile. Mobile number is required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Customer Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="e.g. 9876543210"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@example.com"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstNumber: e.target.value }))}
                  placeholder="e.g. 27AAAAA1111A1Z1"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Flat 302, Sector 15, Vashi"
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes / Observations</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Credit limits, custom rates, delivery notes..."
                  className="rounded-xl border-gray-200 min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full border-gray-200 px-6 font-bold">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6">
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
