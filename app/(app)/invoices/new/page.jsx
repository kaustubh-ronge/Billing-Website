"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  User, Check, Search, Plus, Trash2, ArrowLeft, ArrowRight,
  ChevronRight, RefreshCw, FileText, QrCode, MessageSquare, Printer, Award, IndianRupee
} from 'lucide-react';
import Link from 'next/link';
import { numberToWords } from '@/lib/utils';
import InvoicePreviewHTML from '@/components/InvoicePreviewHTML';

export default function NewInvoicePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // App Config Settings (UPI, tax, etc.)
  const [vendorShop, setVendorShop] = useState(null);

  // Data pools
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // Selections
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]); // [{ product, quantity, unitPrice }]
  const [discountPercentage, setDiscountPercentage] = useState('0');

  // Payment recording
  const [amountPaid, setAmountPaid] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [notes, setNotes] = useState('Initial Payment');

  // Payment terms / credit sales
  const [paymentTerms, setPaymentTerms] = useState('IMMEDIATE');
  const [customDueDays, setCustomDueDays] = useState('30');

  // Search variables
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });

  // Saved Invoice reference (for Step 4 actions)
  const [savedInvoice, setSavedInvoice] = useState(null);

  useEffect(() => {
    fetchVendorConfig();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchVendorConfig = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setVendorShop(data.shop);
        if (data.shop?.taxRate) {
          // Can preconfigure values
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async (searchVal = '') => {
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(searchVal)}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (searchVal = '') => {
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchVal)}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Step 1: Customer Selection Helpers
  const handleCustomerSearchChange = (e) => {
    const val = e.target.value;
    setCustomerSearch(val);
    fetchCustomers(val);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setStep(2);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      toast.error('Name and mobile number are required');
      return;
    }
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerForm)
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Customer registered successfully');
        setIsCustomerModalOpen(false);
        setSelectedCustomer(data.customer);
        setStep(2);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to register customer');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating customer');
    }
  };

  // Step 2: Item Addition Helpers
  const handleProductSearchChange = (e) => {
    const val = e.target.value;
    setProductSearch(val);
    fetchProducts(val);
  };

  const addItemToInvoice = (product) => {
    // Check if item is already added
    const existing = invoiceItems.find(item => item.product.id === product.id);
    if (existing) {
      setInvoiceItems(invoiceItems.map(item =>
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setInvoiceItems([...invoiceItems, { product, quantity: 1, unitPrice: product.price }]);
    }
    setProductSearch('');
    toast.success(`${product.name} added`);
  };

  const updateItemQty = (prodId, qty) => {
    if (qty === '') {
      setInvoiceItems(invoiceItems.map(item =>
        item.product.id === prodId ? { ...item, quantity: '' } : item
      ));
    } else {
      const parsed = parseInt(qty);
      setInvoiceItems(invoiceItems.map(item =>
        item.product.id === prodId ? { ...item, quantity: isNaN(parsed) ? '' : parsed } : item
      ));
    }
  };

  const updateItemPrice = (prodId, price) => {
    setInvoiceItems(invoiceItems.map(item =>
      item.product.id === prodId ? { ...item, unitPrice: parseFloat(price) || 0 } : item
    ));
  };

  const removeItem = (prodId) => {
    setInvoiceItems(invoiceItems.filter(item => item.product.id !== prodId));
  };

  // Mathematics
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    const discPercent = parseFloat(discountPercentage || 0);

    invoiceItems.forEach(item => {
      const qty = parseFloat(item.quantity) || 0;
      const lineSubtotal = qty * item.unitPrice; // Inclusive subtotal
      const lineDiscountedTotal = lineSubtotal * (1 - discPercent / 100);
      const lineTaxable = lineDiscountedTotal / (1 + (item.product.taxRate / 100));
      const lineTax = lineDiscountedTotal - lineTaxable;

      subtotal += lineSubtotal;
      totalTax += lineTax;
    });

    const totalDiscount = subtotal * (discPercent / 100);
    const grandTotal = Math.round((subtotal - totalDiscount) * 100) / 100;

    return {
      subtotal,
      totalDiscount,
      totalTax,
      grandTotal
    };
  };

  const totals = calculateTotals();

  // Reset all form state to start a fresh invoice
  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerSearch('');
    setProductSearch('');
    setPaymentMethod('CASH');
    setNotes('Initial Payment');
    setPaymentTerms('IMMEDIATE');
    setCustomDueDays('30');
    setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
  };

  // Step 3: Submission & Generation
  const handleSaveInvoice = async () => {
    if (invoiceItems.length === 0) {
      toast.error('Please add at least one item to the invoice.');
      return;
    }

    const invalidItem = invoiceItems.find(item => !item.quantity || parseFloat(item.quantity) <= 0);
    if (invalidItem) {
      toast.error(`Please enter a valid quantity for ${invalidItem.product.name}.`);
      return;
    }

    setLoading(true);
    const itemsPayload = invoiceItems.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    const payload = {
      customerId: selectedCustomer.id,
      items: itemsPayload,
      discountPercentage: parseFloat(discountPercentage),
      amountPaid: parseFloat(amountPaid),
      paymentMethod,
      notes,
      paymentTerms,
      customDueDays: paymentTerms === 'CUSTOM' ? parseInt(customDueDays) : undefined,
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        toast.success('Invoice generated successfully!');
        setSavedInvoice(data.invoice);
        setStep(4);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save invoice');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error creating invoice');
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp Message Formatter
  const getWhatsAppLink = () => {
    if (!savedInvoice || !selectedCustomer || !vendorShop) return '#';

    const publicInvoiceUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/public/invoices/${savedInvoice.id}`
      : '';

    const message = `Hello ${selectedCustomer.name},

Thank you for your purchase.

Invoice Number: ${savedInvoice.invoiceNum}
Amount: \u20B9${savedInvoice.grandTotal.toFixed(2)}
Payment Status: ${savedInvoice.status}

View and Download PDF Invoice:
${publicInvoiceUrl}

Regards,
${vendorShop.businessName}`;

    // Clear non-digit chars from mobile
    const formattedPhone = selectedCustomer.phone.replace(/\D/g, '');
    // Ensure country code is present (Indian default 91 if length is 10 digits)
    const phoneWithCode = formattedPhone.length === 10 ? `91${formattedPhone}` : formattedPhone;

    return `https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`;
  };

  // UPI URL Creator for QR Code Payment
  const getUpiQrCodeUrl = () => {
    if (!savedInvoice || !vendorShop?.upiId) return null;

    const upiId = vendorShop.upiId;
    const bizName = vendorShop.businessName;
    const unpaidAmt = savedInvoice.grandTotal - savedInvoice.amountPaid;

    if (unpaidAmt <= 0) return null;

    // upi://pay?pa=address&pn=name&am=amount&cu=INR
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(bizName)}&am=${unpaidAmt.toFixed(2)}&cu=INR&tn=${encodeURIComponent(savedInvoice.invoiceNum)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
  };

  const qrCodeUrl = getUpiQrCodeUrl();

  return (
    <div className="mx-auto max-w-5xl px-4 py-0 sm:px-6 lg:px-8">
      {/* Wizard Header Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground font-bold">
          <Link href="/invoices" className="hover:text-foreground flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Invoices
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span>New Invoice</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">Create Invoice</h1>
      </div>

      {/* Progress Steps Indicators */}
      <div className="grid grid-cols-4 gap-2 mb-8 text-center text-xs font-bold text-muted-foreground">
        <div className={`pb-2 border-b-2 ${step >= 1 ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-border'}`}>1. Customer</div>
        <div className={`pb-2 border-b-2 ${step >= 2 ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-border'}`}>2. Items</div>
        <div className={`pb-2 border-b-2 ${step >= 3 ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-border'}`}>3. Payments</div>
        <div className={`pb-2 border-b-2 ${step >= 4 ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400' : 'border-border'}`}>4. Dispatch</div>
      </div>

      {/* Step 1: Select Customer */}
      {step === 1 && (
        <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search customers..."
                value={customerSearch}
                onChange={handleCustomerSearchChange}
                className="pl-9 rounded-full border-border bg-background text-foreground"
              />
            </div>
            <Button onClick={() => setIsCustomerModalOpen(true)} className="w-full sm:w-auto font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 flex items-center gap-1 shadow-sm">
              <Plus className="h-4 w-4" /> Quick Add Customer
            </Button>
          </div>

          <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
            {customers.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No customers found matching that search. Click Quick Add to create one.
              </div>
            ) : (
              customers.slice(0, 5).map(c => (
                <div
                  key={c.id}
                  onClick={() => selectCustomer(c)}
                  className="p-4 hover:bg-muted/40 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-bold text-xs">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{c.name}</h4>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Add Items */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Item picker */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-4 space-y-4">
              <h3 className="font-bold text-sm text-foreground">Add Products/Services</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter inventory..."
                  value={productSearch}
                  onChange={handleProductSearchChange}
                  className="pl-9 rounded-full border-border bg-background text-foreground"
                />
              </div>

              <div className="divide-y divide-border max-h-87.5 overflow-y-auto pr-1">
                {products.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    No matching items in catalog.
                  </div>
                ) : (
                  products.map(p => (
                    <div
                      key={p.id}
                      onClick={() => addItemToInvoice(p)}
                      className="py-2.5 flex items-center justify-between cursor-pointer group"
                    >
                      <div className="pr-2">
                        <h4 className="font-semibold text-xs text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name} {p.actualValue ? `(${p.actualValue}${p.unit || ''})` : ''}</h4>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{"\u20B9"}{p.price.toFixed(2)} | Tax: {p.taxRate}%</p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </div>
                  ))
                )}
              </div>
            </Card>

            {selectedCustomer && (
              <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Selected Customer</h4>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-sm text-foreground">{selectedCustomer.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{selectedCustomer.phone}</p>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline p-0 h-auto font-bold">
                  Change Customer
                </Button>
              </Card>
            )}
          </div>

          {/* Cart Table */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-x-auto">
              <Table className="min-w-[500px]">
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs text-muted-foreground">Item Name</TableHead>
                    <TableHead className="font-bold text-xs text-center w-24 text-muted-foreground">Price ({"\u20B9"})</TableHead>
                    <TableHead className="font-bold text-xs text-center w-20 text-muted-foreground">Qty</TableHead>
                    <TableHead className="font-bold text-xs text-center text-muted-foreground">Tax %</TableHead>
                    <TableHead className="font-bold text-xs text-right text-muted-foreground">Total</TableHead>
                    <TableHead className="font-bold text-xs text-right w-10 text-muted-foreground"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                        Invoice is empty. Select products from the left to populate the bill.
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoiceItems.map((item, idx) => {
                      const qty = parseFloat(item.quantity) || 0;
                      const totalLine = qty * item.unitPrice;
                      return (
                        <TableRow key={idx} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-semibold text-foreground text-xs">
                            {item.product.name} {item.product.actualValue ? `(${item.product.actualValue}${item.product.unit || ''})` : ''}
                            {item.product.isService && <span className="ml-1.5 inline-block text-[9px] px-1 py-0.2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300 rounded">Service</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItemPrice(item.product.id, e.target.value)}
                              className="h-8 text-center rounded-lg border-border bg-background text-foreground text-xs px-1"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQty(item.product.id, e.target.value)}
                              className="h-8 text-center rounded-lg border-border bg-background text-foreground text-xs px-1"
                            />
                          </TableCell>
                          <TableCell className="text-center text-xs font-semibold text-muted-foreground">{item.product.taxRate}%</TableCell>
                          <TableCell className="text-right font-bold text-foreground text-xs">{"\u20B9"}{totalLine.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.product.id)} className="h-7 w-7 rounded-full hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>

            {invoiceItems.length > 0 && (
              <div className="flex justify-between items-center bg-muted/50 p-4 rounded-2xl border border-border">
                <div className="text-sm font-semibold text-foreground">
                  Total Items: {invoiceItems.reduce((acc, item) => acc + (parseFloat(item.quantity) || 0), 0)}
                </div>
                <Button onClick={() => setStep(3)} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 flex items-center gap-1.5 shadow-sm">
                  Next: Financials <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Math and Initial Payment */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Bill summary and discount settings */}
          <div className="md:col-span-7 space-y-6">
            <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-6 space-y-6">
              <h3 className="font-bold text-lg text-foreground">Tax & Discounts</h3>

              <div className="space-y-2">
                <Label htmlFor="discountPercentage" className="text-foreground">Discount Percentage (%)</Label>
                <Input
                  id="discountPercentage"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <h4 className="font-bold text-sm text-foreground">Payment Terms</h4>
                <div className="space-y-1.5">
                  <Label htmlFor="paymentTerms" className="text-foreground">Due Date Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger id="paymentTerms" className="rounded-xl border-border bg-background text-foreground">
                      <SelectValue placeholder="Select terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">Immediate — Paid on delivery</SelectItem>
                      <SelectItem value="NET_7">Net 7 — Due in 7 days</SelectItem>
                      <SelectItem value="NET_15">Net 15 — Due in 15 days</SelectItem>
                      <SelectItem value="NET_30">Net 30 — Due in 30 days</SelectItem>
                      <SelectItem value="NET_45">Net 45 — Due in 45 days</SelectItem>
                      <SelectItem value="CUSTOM">Custom — Specify days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentTerms === 'CUSTOM' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="customDueDays" className="text-foreground">Due in (days)</Label>
                    <Input
                      id="customDueDays"
                      type="number"
                      min="1"
                      max="365"
                      value={customDueDays}
                      onChange={(e) => setCustomDueDays(e.target.value)}
                      className="rounded-xl border-border bg-background text-foreground"
                      placeholder="e.g. 60"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h4 className="font-bold text-sm text-foreground">Record Initial Payment</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="amountPaid" className="text-foreground">Amount Collected Today ({"\u20B9"})</Label>
                    <Input
                      id="amountPaid"
                      type="number"
                      min="0"
                      max={totals.grandTotal}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="rounded-xl border-border bg-background text-foreground font-bold"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAmountPaid(totals.grandTotal.toString())}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 p-0 h-auto font-black flex items-center gap-0.5"
                    >
                      Collect Full Amount
                    </Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="paymentMethod" className="text-foreground">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val)}>
                      <SelectTrigger id="paymentMethod" className="rounded-xl border-border bg-background text-foreground">
                        <SelectValue placeholder="Payment Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="UPI">UPI / Digital</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="CARD">Debit / Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-foreground">Payment Notes</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference num, invoice note..."
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>
              </div>
            </Card>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full border-border px-6 font-bold flex items-center gap-1.5 text-foreground hover:bg-muted">
                <ArrowLeft className="h-4 w-4" /> Back to Items
              </Button>
            </div>
          </div>

          {/* Checkout Totals Card */}
          <div className="md:col-span-5 space-y-6">
            <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-6 space-y-4">
              <h3 className="font-bold text-muted-foreground text-sm uppercase tracking-wider pb-2 border-b border-border">Bill Breakdown</h3>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-foreground">{"\u20B9"}{totals.subtotal.toFixed(2)}</span>
                </div>
                {totals.totalDiscount > 0 && (
                  <div className="flex justify-between text-sm text-rose-600 dark:text-rose-400 font-medium">
                    <span>Discount ({discountPercentage}%)</span>
                    <span>-{"\u20B9"}{totals.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>GST Taxes</span>
                  <span className="text-foreground">{"\u20B9"}{totals.totalTax.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between font-black text-foreground text-lg">
                  <span>Grand Total</span>
                  <span>{"\u20B9"}{totals.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between font-semibold text-blue-800 dark:text-blue-200">
                  <span>Amount Paid:</span>
                  <span>&#8377;{parseFloat(amountPaid || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-blue-900 dark:text-blue-100 border-t border-blue-200/50 dark:border-blue-800/50 pt-1.5">
                  <span>Balance Outstanding:</span>
                  <span>&#8377;{(totals.grandTotal - parseFloat(amountPaid || 0)).toFixed(2)}</span>
                </div>
              </div>

              {/* Credit limit warning */}
              {selectedCustomer?.creditLimit > 0 && (() => {
                const outstanding = totals.grandTotal - parseFloat(amountPaid || 0);
                const newCreditUsed = (selectedCustomer.creditUsed || 0) + outstanding;
                const overLimit = newCreditUsed > selectedCustomer.creditLimit;
                if (!overLimit) return null;
                return (
                  <div className="bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200">
                    <p className="font-bold">⚠ Credit Limit Warning</p>
                    <p className="mt-0.5">
                      This sale puts {selectedCustomer.name} at &#8377;{newCreditUsed.toFixed(0)} credit used,
                      exceeding their &#8377;{selectedCustomer.creditLimit.toFixed(0)} limit.
                      Consider collecting more upfront.
                    </p>
                  </div>
                );
              })()}

              <Button
                onClick={handleSaveInvoice}
                disabled={loading}
                className="w-full font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full py-6 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                Generate & Save Bill
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Step 4: Dispatch Actions (Print, Share, WhatsApp, QR Code) */}
      {step === 4 && savedInvoice && (
        <Card className="border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden p-8 space-y-8">
          <div className="text-center space-y-2 max-w-md mx-auto">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800 mb-2">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black text-foreground">Invoice {savedInvoice.invoiceNum} Saved!</h2>
            <p className="text-sm text-muted-foreground">The invoice has been logged. Use the options below to share it or collect payments.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-border">
            {/* WhatsApp sending */}
            <Card className="border border-border shadow-none rounded-xl p-6 text-center space-y-4 hover:border-emerald-500/50 bg-card text-card-foreground transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Send Invoice via WhatsApp</h4>
                <p className="text-xs text-muted-foreground mt-1">Open WhatsApp Web to send a templated message to {selectedCustomer.name}.</p>
              </div>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-full h-10 text-sm gap-1.5 transition-colors shadow-sm"
              >
                Send WhatsApp
              </a>
            </Card>

            {/* Print and Save */}
            <Card className="border border-border shadow-none rounded-xl p-6 text-center space-y-4 hover:border-blue-500/50 bg-card text-card-foreground transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <Printer className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Print or Download PDF</h4>
                <p className="text-xs text-muted-foreground mt-1">Open a printable browser view of the bill statement to save it as a PDF or print it.</p>
              </div>
              <Button
                onClick={() => window.print()}
                className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 text-sm gap-1.5 shadow-sm"
              >
                Print Invoice
              </Button>
            </Card>

            {/* QR Code Scan and Pay */}
            <Card className="border border-border shadow-none rounded-xl p-6 text-center space-y-4 hover:border-purple-500/50 bg-card text-card-foreground transition-colors">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">UPI Scan & Pay QR</h4>
                <p className="text-xs text-muted-foreground mt-1">Generate a quick QR code for this bill to let the customer scan and pay with any UPI app.</p>
              </div>
              {vendorShop?.upiId ? (
                savedInvoice.grandTotal - savedInvoice.amountPaid > 0 ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-full h-10 text-sm gap-1.5">
                        Show QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-xs text-center p-6 bg-card text-card-foreground border border-border">
                      <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-foreground">Scan & Pay</DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                          Scan using GPay, PhonePe, Paytm, etc.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="my-4 flex justify-center">
                        {qrCodeUrl && <img src={qrCodeUrl} alt="UPI Payment QR Code" className="h-44 w-44 object-contain" />}
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-950/60 p-2.5 rounded-xl border border-purple-100 dark:border-purple-800">
                        <p className="text-xs font-bold text-purple-900 dark:text-purple-200">Outstanding: {"\u20B9"}{(savedInvoice.grandTotal - savedInvoice.amountPaid).toFixed(2)}</p>
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">UPI: {vendorShop.upiId}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-2 rounded-full border border-emerald-200 dark:border-emerald-800 block">Bill Fully Settled</span>
                )
              ) : (
                <div className="space-y-2">
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Add UPI ID in Settings to enable QR.</p>
                  <Link href="/settings" className="inline-flex w-full items-center justify-center font-bold border border-border text-foreground hover:bg-muted rounded-full h-10 text-sm">
                    Configure UPI
                  </Link>
                </div>
              )}
            </Card>
          </div>

          <div className="flex justify-between pt-6 border-t border-border">
            <Link href="/invoices" className="font-bold border border-border hover:bg-muted text-foreground rounded-full px-6 py-2.5 text-sm flex items-center gap-1.5">
              <ArrowLeft className="h-4 w-4" /> Go to Invoices List
            </Link>
            <Button onClick={() => { setStep(1); resetForm(); setInvoiceItems([]); setSavedInvoice(null); setDiscountPercentage('0'); setAmountPaid('0'); }} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 py-2.5 text-sm shadow-sm">
              Create Another Invoice
            </Button>
          </div>

          {/* Print Layout (Only visible when printing) */}
          {savedInvoice && selectedCustomer && vendorShop && (
            <div className="hidden print:block print-area bg-white text-black font-sans leading-normal">
              <InvoicePreviewHTML
                invoice={savedInvoice}
                shop={vendorShop}
                customer={selectedCustomer}
                items={invoiceItems}
                statusBadge={null}
              />
            </div>
          )}
        </Card>
      )}

      {/* Inline Quick Add Customer Dialog */}
      <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
        <DialogContent className="rounded-2xl sm:max-w-100 bg-card text-card-foreground border border-border">
          <form onSubmit={handleCreateCustomer}>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Add Customer Inline</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Create a quick profile to link to this invoice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-3">
              <div className="space-y-1.5">
                <Label htmlFor="custName" className="text-foreground">Customer Name</Label>
                <Input
                  id="custName"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custPhone" className="text-foreground">Mobile Number</Label>
                <Input
                  id="custPhone"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                  required
                  placeholder="e.g. 9876543210"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custEmail" className="text-foreground">Email Address (Optional)</Label>
                <Input
                  id="custEmail"
                  type="email"
                  value={newCustomerForm.email}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="e.g. rahul@gmail.com"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custAddress" className="text-foreground">Address (Optional)</Label>
                <Input
                  id="custAddress"
                  value={newCustomerForm.address}
                  onChange={(e) => setNewCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="e.g. Vashi, Mumbai"
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>
            </div>
            <DialogFooter className="mt-4 gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsCustomerModalOpen(false)} className="rounded-full border-border px-5 font-bold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-5 shadow-sm">
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

