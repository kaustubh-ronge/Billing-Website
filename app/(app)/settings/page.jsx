"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Link from 'next/link';
import { Loader2, CreditCard, Receipt, Save, Image as ImageIcon, Building2, Lock, Users, ArrowRight } from 'lucide-react';
import { useCan } from '@/lib/permissions/PermissionContext';
import InvoicePreviewHTML from '@/components/InvoicePreviewHTML';

const MOCK_INVOICE = {
  invoiceNum: 'INV-2026-0001',
  issuedAt: new Date().toISOString(),
  dueDate: new Date(Date.now() + 15*24*60*60*1000).toISOString(),
  grandTotal: 1250,
  amountPaid: 1250,
  discountPercentage: 0,
  paymentTerms: 'NET 15',
  items: [
    {
      quantity: 2,
      unitPrice: 500,
      product: {
        name: 'Sample Product A',
        hsnSac: '3101',
        unit: 'ml',
        actualValue: '500',
        taxRate: 18,
        isService: false
      }
    },
    {
      quantity: 1,
      unitPrice: 250,
      product: {
        name: 'Sample Service B',
        hsnSac: '9983',
        unit: 'HRS',
        actualValue: '',
        taxRate: 0,
        isService: true
      }
    }
  ]
};

const MOCK_CUSTOMER = {
  name: 'John Doe',
  address: '123 Main St, Mumbai, MH',
  phone: '9876543210',
  taxId: '27AAAAA0000A1Z5'
};

const TABS = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'banking', label: 'Banking & UPI', icon: CreditCard },
  { id: 'invoice', label: 'Invoice Config', icon: Receipt },
];

function SectionHeader({ icon: Icon, title, description, iconColor = 'text-blue-600', iconBg = 'bg-blue-50' }) {
  return (
    <div className="flex items-start gap-4 pb-5 mb-6 border-b border-border">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FieldGroup({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const can = useCan();
  const allowed = can('settings:manage');

  const standardTypes = [
    'General Store / All',
    'Agro Store',
    'Clothing Store',
    'Hardware Store',
    'Poultry Store',
    'Grocery / Kirana Store',
    'Pharmacy / Medical',
    'Electronics / Electricals',
    'Dairy / Milk Parlour',
    'Automobile / Garage'
  ];

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '', taxId: '', logoBase64: '', ownerName: '',
    phone: '', email: '', address: '',
    bankName: '', accountNum: '', ifscCode: '', upiId: '',
    invoicePrefix: 'INV', invoiceFormat: 'INV-{YEAR}-{NUMBER}',
    currency: 'INR', footerMessage: 'Thank you for your business!', taxRate: 18,
    businessType: 'General Store / All',
    licenseNum: '',
    aushadhLicenseNum: '',
    khateLicenseNum: '',
    showPaymentTerms: true,
    showQrCode: true,
    showBankDetails: true,
    showFooterMessage: true,
    showLicense: true,
    showGst: true,
    invoiceTemplate: 'classic',
    showColHsn: true,
    showColUnit: true,
    showColRate: true,
    showColTaxable: true,
    showColGst: true,
    showColExpiry: true,
    showColBatch: true,
    showColCompany: true,
    showColMinOrder: true,
    showColBulkPrice: true,
  });

  const isAgro = formData.businessType === 'Agro Store' || formData.businessType?.toLowerCase().includes('agro') || formData.businessType?.toLowerCase().includes('krishi');
  const isMedical = formData.businessType === 'Pharmacy / Medical' || formData.businessType?.toLowerCase().includes('medical') || formData.businessType?.toLowerCase().includes('pharmacy');
  const isWholesale = formData.businessType?.toLowerCase().includes('wholesale') || formData.businessType?.toLowerCase().includes('distributor');

  useEffect(() => { if (allowed) fetchProfile(); else setLoading(false); }, [allowed]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          setFormData(prev => ({ ...prev, ...Object.fromEntries(Object.entries(data.shop).filter(([, v]) => v !== null)) }));
        }
      }
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData),
      });
      if (res.ok) toast.success('Settings saved');
      else { const d = await res.json(); toast.error(d.error || 'Failed to save'); }
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { toast.error('Logo must be under 1 MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFormData(prev => ({ ...prev, logoBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (!allowed) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-muted"><Lock className="h-6 w-6 text-muted-foreground" /></div>
        <h1 className="text-xl font-black text-foreground mt-4">No access to settings</h1>
        <p className="text-sm text-muted-foreground mt-1">You do not have permission to manage business settings. Contact your organization owner.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex h-[calc(100vh-6rem)] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your business profile, banking, and invoice preferences.</p>
        </div>
        <Link href="/organization/employees" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline">
          <Users className="h-4 w-4" /> Manage team & access <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-w-[120px] ${activeTab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={Building2} title="Business Profile" description="Appears on every invoice header and customer-facing document." iconColor="text-blue-600 dark:text-blue-400" iconBg="bg-blue-500/10" />
            <div className="flex items-start gap-5 p-4 bg-muted/30 rounded-xl border border-border">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border bg-background overflow-hidden">
                {formData.logoBase64 ? <img src={formData.logoBase64} alt="Logo" className="h-full w-full object-cover" /> : <ImageIcon className="h-7 w-7 text-muted-foreground" />}
              </div>
              <div className="space-y-2 flex-1">
                <p className="text-sm font-semibold text-foreground">Business Logo</p>
                <p className="text-xs text-muted-foreground">Shown on invoices and PDFs. Max 1 MB.</p>
                <Input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm max-w-xs rounded-xl border-border" />
                {formData.logoBase64 && <button type="button" onClick={() => setFormData(p => ({ ...p, logoBase64: '' }))} className="text-xs text-rose-500 font-semibold hover:underline">Remove logo</button>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Business / Shop Name *"><Input value={formData.businessName} onChange={set('businessName')} required placeholder="e.g. Kaustubh Traders" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Owner Name"><Input value={formData.ownerName} onChange={set('ownerName')} placeholder="e.g. Kaustubh Ronge" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Phone Number"><Input value={formData.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Email Address"><Input value={formData.email} onChange={set('email')} type="email" placeholder="billing@business.com" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="GST / Tax Number" hint="GSTIN appears on all tax invoices."><Input value={formData.taxId} onChange={set('taxId')} placeholder="27AAAAA1111A1Z1" className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="Business Type / Main Category" hint="Filters product categories.">
                <Select 
                  value={formData.businessType && !standardTypes.includes(formData.businessType) ? 'Custom' : (formData.businessType || 'General Store / All')} 
                  onValueChange={(val) => {
                    if (val === 'Custom') {
                      setFormData(p => ({ ...p, businessType: 'Custom Business Type' }));
                    } else {
                      setFormData(p => ({ ...p, businessType: val }));
                    }
                  }}
                >
                  <SelectTrigger className="rounded-xl border-border bg-background">
                    <SelectValue placeholder="Select Business Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {standardTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                    <SelectItem value="Custom">Other / Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {((formData.businessType && !standardTypes.includes(formData.businessType)) || formData.businessType === 'Custom Business Type') && (
                  <div className="mt-2.5">
                    <Input
                      value={formData.businessType === 'Custom Business Type' ? '' : formData.businessType}
                      onChange={(e) => setFormData(p => ({ ...p, businessType: e.target.value || 'Custom Business Type' }))}
                      placeholder="Enter custom business type (e.g. Toy Store)"
                      className="rounded-xl border-border mt-1.5"
                    />
                  </div>
                )}
              </FieldGroup>

              {/* License Number Fields */}
              <FieldGroup label="License Number" hint="General business license (Optional)">
                <Input value={formData.licenseNum || ''} onChange={set('licenseNum')} placeholder="e.g. LIC-12345678" className="rounded-xl border-border font-mono uppercase" />
              </FieldGroup>

              {(formData.businessType === 'Agro Store' || formData.businessType?.toLowerCase().includes('agro') || formData.businessType?.toLowerCase().includes('krishi')) && (
                <>
                  <FieldGroup label="Aushadh License Number" hint="Medicinal / Drug license (Optional)">
                    <Input value={formData.aushadhLicenseNum || ''} onChange={set('aushadhLicenseNum')} placeholder="e.g. DL-20B-1234" className="rounded-xl border-border font-mono uppercase" />
                  </FieldGroup>
                  <FieldGroup label="Khate License Number" hint="Seed/Fertilizer dealer license (Optional)">
                    <Input value={formData.khateLicenseNum || ''} onChange={set('khateLicenseNum')} placeholder="e.g. FERT-9876" className="rounded-xl border-border font-mono uppercase" />
                  </FieldGroup>
                </>
              )}
            </div>
            <FieldGroup label="Business Address"><Textarea value={formData.address} onChange={set('address')} placeholder="123 Main Street, Mumbai, Maharashtra 400001" className="rounded-xl border-border min-h-[80px]" /></FieldGroup>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile</Button>
            </div>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={CreditCard} title="Banking & UPI Details" description="Payment collection info shown on invoices." iconColor="text-purple-600 dark:text-purple-400" iconBg="bg-purple-500/10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Bank Name"><Input value={formData.bankName} onChange={set('bankName')} placeholder="e.g. HDFC Bank" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Account Number"><Input value={formData.accountNum} onChange={set('accountNum')} placeholder="50100012345678" className="rounded-xl border-border font-mono" /></FieldGroup>
              <FieldGroup label="IFSC Code"><Input value={formData.ifscCode} onChange={set('ifscCode')} placeholder="HDFC0000241" className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="UPI ID (VPA)" hint="Used to generate Scan & Pay QR codes on invoices."><Input value={formData.upiId} onChange={set('upiId')} placeholder="shopname@okaxis" className="rounded-xl border-border font-mono" /></FieldGroup>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Banking Details</Button>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={Receipt} title="Invoice Configuration" description="Numbering, taxes, and footer message on all invoices." iconColor="text-orange-600 dark:text-orange-400" iconBg="bg-orange-500/10" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Invoice Number Prefix" hint={`Preview: ${formData.invoicePrefix || 'INV'}-2025-0001`}><Input value={formData.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" maxLength={10} className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="Default GST Rate (%)" hint="Applied when adding new products."><Input value={formData.taxRate} onChange={set('taxRate')} type="number" step="0.1" min="0" max="100" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Currency Code"><Input value={formData.currency} onChange={set('currency')} placeholder="INR" maxLength={3} className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="Invoice PDF Template Layout" hint="Choose the layout design for your printed/PDF invoices.">
                <Select value={formData.invoiceTemplate || 'classic'} onValueChange={(val) => setFormData(p => ({ ...p, invoiceTemplate: val }))}>
                  <SelectTrigger className="rounded-xl border-border bg-background">
                    <SelectValue placeholder="Select Layout Design" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classic">Classic Premium (Default)</SelectItem>
                    <SelectItem value="retail">Retail Grid / Agro Invoice (Pink Style)</SelectItem>
                    <SelectItem value="thermal">Thermal Slip Receipt (80mm Printer)</SelectItem>
                    <SelectItem value="minimal">Modern Minimalist</SelectItem>
                    <SelectItem value="landscape">Compact Landscape (A5)</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>
            <FieldGroup label="Invoice Footer Message" hint="Printed at the bottom of all invoices."><Textarea value={formData.footerMessage} onChange={set('footerMessage')} placeholder="Thank you for your business." className="rounded-xl border-border min-h-[80px]" /></FieldGroup>
            
            {/* Invoice Details Visibility Options */}
            <div className="pt-5 border-t border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Invoice Section Visibility</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle visibility of specific items displayed on the generated invoice.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showPaymentTerms}
                    onChange={(e) => setFormData(p => ({ ...p, showPaymentTerms: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show Payment Terms</span>
                    <p className="text-[10px] text-muted-foreground">Display payment terms & due date</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showQrCode}
                    onChange={(e) => setFormData(p => ({ ...p, showQrCode: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show Scan & Pay QR Code</span>
                    <p className="text-[10px] text-muted-foreground">UPI QR code for instant scan payment</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showBankDetails}
                    onChange={(e) => setFormData(p => ({ ...p, showBankDetails: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show Bank Account Details</span>
                    <p className="text-[10px] text-muted-foreground">Display bank name, account number, and IFSC</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showFooterMessage}
                    onChange={(e) => setFormData(p => ({ ...p, showFooterMessage: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show Footer Message</span>
                    <p className="text-[10px] text-muted-foreground">Display thank you / terms note at the bottom</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showLicense}
                    onChange={(e) => setFormData(p => ({ ...p, showLicense: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show License Info</span>
                    <p className="text-[10px] text-muted-foreground">Display business / drug / khate license numbers</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showGst}
                    onChange={(e) => setFormData(p => ({ ...p, showGst: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show GSTIN Number</span>
                    <p className="text-[10px] text-muted-foreground">Display shop GST / tax identifier</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Invoice Column Visibility Options */}
            <div className="pt-5 border-t border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Invoice Item Column Visibility</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Toggle visibility of specific item columns in the main table.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard columns relevant to all (like HSN and Unit) */}
                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showColHsn}
                    onChange={(e) => setFormData(p => ({ ...p, showColHsn: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show HSN/SAC Column</span>
                    <p className="text-[10px] text-muted-foreground">Display product HSN/SAC tax code</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.showColUnit}
                    onChange={(e) => setFormData(p => ({ ...p, showColUnit: e.target.checked }))}
                    className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground">Show Unit Column</span>
                    <p className="text-[10px] text-muted-foreground">Display unit measurement (e.g. ml, kg)</p>
                  </div>
                </label>

                {/* Agro Specific columns */}
                {isAgro && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColExpiry}
                        onChange={(e) => setFormData(p => ({ ...p, showColExpiry: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Expiry Date Column</span>
                        <p className="text-[10px] text-muted-foreground">Display item expiry date warning</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColCompany}
                        onChange={(e) => setFormData(p => ({ ...p, showColCompany: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Company Name Column</span>
                        <p className="text-[10px] text-muted-foreground">Display brand manufacturer name</p>
                      </div>
                    </label>
                  </>
                )}

                {/* Medical Specific columns */}
                {isMedical && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColExpiry}
                        onChange={(e) => setFormData(p => ({ ...p, showColExpiry: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Expiry Date Column</span>
                        <p className="text-[10px] text-muted-foreground">Display medicine expiry warning</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColBatch}
                        onChange={(e) => setFormData(p => ({ ...p, showColBatch: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Batch Number Column</span>
                        <p className="text-[10px] text-muted-foreground">Display drug batch allocation number</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColCompany}
                        onChange={(e) => setFormData(p => ({ ...p, showColCompany: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Manufacturer Column</span>
                        <p className="text-[10px] text-muted-foreground">Display pharmaceutical firm details</p>
                      </div>
                    </label>
                  </>
                )}

                {/* Wholesale Specific columns */}
                {isWholesale && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColMinOrder}
                        onChange={(e) => setFormData(p => ({ ...p, showColMinOrder: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Min Order Qty Column</span>
                        <p className="text-[10px] text-muted-foreground">Display minimum package quantity requirement</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColBulkPrice}
                        onChange={(e) => setFormData(p => ({ ...p, showColBulkPrice: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Bulk Price Column</span>
                        <p className="text-[10px] text-muted-foreground">Display reduced pricing for wholesalers</p>
                      </div>
                    </label>
                  </>
                )}

                {/* General / default Specific columns */}
                {!isAgro && !isMedical && !isWholesale && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColRate}
                        onChange={(e) => setFormData(p => ({ ...p, showColRate: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Rate (Excl.) Column</span>
                        <p className="text-[10px] text-muted-foreground">Display base unit price excluding tax</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColTaxable}
                        onChange={(e) => setFormData(p => ({ ...p, showColTaxable: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show Taxable Value Column</span>
                        <p className="text-[10px] text-muted-foreground">Display line subtotal before GST</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={formData.showColGst}
                        onChange={(e) => setFormData(p => ({ ...p, showColGst: e.target.checked }))}
                        className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500/30"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground">Show GST Column (% & Amt)</span>
                        <p className="text-[10px] text-muted-foreground">Display line tax percentage and split amount</p>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Live Template Preview Section */}
            <div className="pt-6 border-t border-border space-y-4">
              <div>
                <h3 className="text-sm font-bold text-foreground">Live Template Preview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">See how your invoices look with the current configuration in real-time.</p>
              </div>
              <div className="border border-border rounded-2xl p-4 bg-muted/5 overflow-hidden flex flex-col items-center">
                <div className="w-full overflow-auto max-h-[400px] border border-border rounded-xl bg-background shadow-inner">
                  <div className="scale-95 origin-top p-2 md:scale-100">
                    <InvoicePreviewHTML
                      invoice={MOCK_INVOICE}
                      shop={{
                        businessName: formData.businessName || 'Your Business Name',
                        description: 'Quality Products & Services',
                        address: formData.address || 'Business Address, City, State',
                        phone: formData.phone || '9999999999',
                        email: formData.email || 'business@email.com',
                        taxId: formData.taxId || '27AAAAA0000A1Z5',
                        bankName: formData.bankName || 'Sample Bank Name',
                        accountNum: formData.accountNum || '1234567890',
                        ifscCode: formData.ifscCode || 'IFSC0001234',
                        upiId: formData.upiId || 'upi@id',
                        invoiceTemplate: formData.invoiceTemplate,
                        showColHsn: formData.showColHsn,
                        showColUnit: formData.showColUnit,
                        showColRate: formData.showColRate,
                        showColTaxable: formData.showColTaxable,
                        showColGst: formData.showColGst,
                        showBankDetails: formData.showBankDetails,
                        showQrCode: formData.showQrCode,
                        showPaymentTerms: formData.showPaymentTerms,
                        showFooterMessage: formData.showFooterMessage,
                        showLicense: formData.showLicense,
                        showGst: formData.showGst
                      }}
                      customer={MOCK_CUSTOMER}
                      items={MOCK_INVOICE.items}
                      statusBadge={
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-green-50 text-green-700 border border-green-150">
                          PAID
                        </span>
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Invoice Config</Button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}