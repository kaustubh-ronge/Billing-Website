"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Store, CreditCard, Receipt, Save, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    taxId: '',
    logoBase64: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    bankName: '',
    accountNum: '',
    ifscCode: '',
    upiId: '',
    invoicePrefix: 'INV',
    invoiceFormat: 'INV-{YEAR}-{NUMBER}',
    currency: 'INR',
    footerMessage: 'Thank you for your business!',
    taxRate: 18,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          // Merge retrieved data, keeping defaults if null
          setFormData(prev => ({
            ...prev,
            ...Object.keys(data.shop).reduce((acc, key) => {
              acc[key] = data.shop[key] !== null ? data.shop[key] : prev[key];
              return acc;
            }, {})
          }));
        }
      } else {
        toast.error('Failed to load profile settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Logo image must be smaller than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logoBase64: reader.result }));
      toast.success('Logo loaded. Click Save to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success('Settings updated successfully!');
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-28 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure your business profile, banking details, and invoice layouts.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Card */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Business Profile</CardTitle>
                <CardDescription>Primary vendor metadata displayed on invoice headers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Shop/Business Name</Label>
              <Input
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                required
                placeholder="e.g. ABC Traders"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input
                id="ownerName"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleInputChange}
                placeholder="e.g. John Doe"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="e.g. +91 98765 43210"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="e.g. vendor@example.com"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">GST / Tax Identification Number (Optional)</Label>
              <Input
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                placeholder="e.g. 27AAAAA1111A1Z1"
                className="rounded-xl border-gray-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="logo">Business Logo</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden relative">
                  {formData.logoBase64 ? (
                    <img src={formData.logoBase64} alt="Shop logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="rounded-xl border-gray-200 text-sm max-w-xs"
                />
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="e.g. 123 Main Street, Sector 4, Mumbai, Maharashtra"
                className="rounded-xl border-gray-200 min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Banking and UPI Card */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Bank & UPI Details</CardTitle>
                <CardDescription>Payment collection details for generated invoices</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="e.g. HDFC Bank"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNum">Account Number</Label>
              <Input
                id="accountNum"
                name="accountNum"
                value={formData.accountNum}
                onChange={handleInputChange}
                placeholder="e.g. 50100012345678"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleInputChange}
                placeholder="e.g. HDFC0000241"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upiId">UPI ID (VPA)</Label>
              <Input
                id="upiId"
                name="upiId"
                value={formData.upiId}
                onChange={handleInputChange}
                placeholder="e.g. shopname@okaxis"
                className="rounded-xl border-gray-200"
              />
              <p className="text-xs text-gray-400 mt-1">Required to generate "Scan & Pay" QR codes directly on invoices.</p>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Settings */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white/70 backdrop-blur-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Invoice Configuration</CardTitle>
                <CardDescription>Default taxes, currencies, numbering prefixes, and footers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">Invoice Number Prefix</Label>
              <Input
                id="invoicePrefix"
                name="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={handleInputChange}
                placeholder="e.g. INV"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxRate">Default Tax (GST) Rate %</Label>
              <Input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.1"
                value={formData.taxRate}
                onChange={handleInputChange}
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency Code</Label>
              <Input
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                placeholder="e.g. INR"
                className="rounded-xl border-gray-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="footerMessage">Footer Message / Note</Label>
              <Input
                id="footerMessage"
                name="footerMessage"
                value={formData.footerMessage}
                onChange={handleInputChange}
                placeholder="Terms and conditions, footer notes..."
                className="rounded-xl border-gray-200"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50/50 border-t border-gray-100 px-6 py-4 flex justify-end">
            <Button type="submit" disabled={saving} className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
