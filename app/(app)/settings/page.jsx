"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, Store, CreditCard, Receipt, Save, Image as ImageIcon,
  Users, Copy, RefreshCw, UserCheck, UserX, Shield, ShieldCheck,
  ShieldAlert, Link as LinkIcon, Plus, Trash2, Building2
} from 'lucide-react';

const TABS = [
  { id: 'profile', label: 'Business Profile', icon: Building2 },
  { id: 'banking', label: 'Banking & UPI', icon: CreditCard },
  { id: 'invoice', label: 'Invoice Config', icon: Receipt },
  { id: 'team', label: 'Team & Access', icon: Users },
];

const ROLE_META = {
  OWNER: { label: 'Owner', color: 'bg-violet-100 text-violet-700', icon: Shield, description: 'Full access to all settings and data' },
  MANAGER: { label: 'Manager', color: 'bg-blue-100 text-blue-700', icon: ShieldCheck, description: 'Can manage invoices, customers, and products' },
  CASHIER: { label: 'Cashier', color: 'bg-emerald-100 text-emerald-700', icon: ShieldAlert, description: 'Can create and view invoices only' },
};

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
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    businessName: '', taxId: '', logoBase64: '', ownerName: '',
    phone: '', email: '', address: '',
    bankName: '', accountNum: '', ifscCode: '', upiId: '',
    invoicePrefix: 'INV', invoiceFormat: 'INV-{YEAR}-{NUMBER}',
    currency: 'INR', footerMessage: 'Thank you for your business!', taxRate: 18,
  });

  const [members, setMembers] = useState([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [inviteCode, setInviteCode] = useState(null);
  const [teamLoading, setTeamLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => { fetchProfile(); }, []);
  useEffect(() => { if (activeTab === 'team') fetchTeam(); }, [activeTab]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          setFormData(prev => ({
            ...prev,
            ...Object.fromEntries(Object.entries(data.shop).filter(([, v]) => v !== null)),
          }));
        }
      }
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const fetchTeam = useCallback(async () => {
    try {
      setTeamLoading(true);
      const [teamRes, inviteRes] = await Promise.all([
        fetch('/api/settings/team'),
        fetch('/api/settings/invite'),
      ]);
      if (teamRes.ok) {
        const d = await teamRes.json();
        setMembers(d.members);
        setCurrentUserId(d.currentUserId);
      }
      if (inviteRes.ok) {
        const d = await inviteRes.json();
        setInviteCode(d.inviteCode);
      }
    } catch { toast.error('Failed to load team'); }
    finally { setTeamLoading(false); }
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
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

  const handleGenerateCode = async () => {
    setGeneratingCode(true);
    try {
      const res = await fetch('/api/settings/invite', { method: 'POST' });
      if (res.ok) { const d = await res.json(); setInviteCode(d.inviteCode); toast.success('New invite code generated'); }
    } catch { toast.error('Failed to generate code'); }
    finally { setGeneratingCode(false); }
  };

  const handleCopyInviteLink = () => {
    if (!inviteCode) return;
    const url = `${window.location.origin}/join/${inviteCode}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied!');
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const res = await fetch(`/api/settings/team/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) { setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m)); toast.success('Role updated'); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch { toast.error('Failed to update role'); }
  };

  const handleToggleActive = async (userId, current) => {
    try {
      const res = await fetch(`/api/settings/team/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) { setMembers(prev => prev.map(m => m.id === userId ? { ...m, isActive: !current } : m)); toast.success(current ? 'Member deactivated' : 'Member reactivated'); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch { toast.error('Failed to update status'); }
  };

  const handleRemoveMember = async (userId, name) => {
    if (!confirm(`Remove ${name} from your team?`)) return;
    try {
      const res = await fetch(`/api/settings/team/${userId}`, { method: 'DELETE' });
      if (res.ok) { setMembers(prev => prev.filter(m => m.id !== userId)); toast.success(`${name} removed`); }
      else { const d = await res.json(); toast.error(d.error || 'Failed'); }
    } catch { toast.error('Failed to remove'); }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your business, billing preferences, and team access.</p>
      </div>

      <div className="flex gap-1 bg-muted/50 rounded-2xl p-1 mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap min-w-[120px] ${
              activeTab === id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'profile' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={Building2} title="Business Profile" description="This information appears on every invoice header and customer-facing documents." iconColor="text-blue-600" iconBg="bg-blue-50" />
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
            </div>
            <FieldGroup label="Business Address"><Textarea value={formData.address} onChange={set('address')} placeholder="123 Main Street, Sector 4, Mumbai, Maharashtra 400001" className="rounded-xl border-border min-h-[80px]" /></FieldGroup>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-full bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Profile
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={CreditCard} title="Banking & UPI Details" description="Payment collection information shown on invoices so customers know how to pay you." iconColor="text-purple-600" iconBg="bg-purple-50" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Bank Name"><Input value={formData.bankName} onChange={set('bankName')} placeholder="e.g. HDFC Bank" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Account Number"><Input value={formData.accountNum} onChange={set('accountNum')} placeholder="50100012345678" className="rounded-xl border-border font-mono" /></FieldGroup>
              <FieldGroup label="IFSC Code"><Input value={formData.ifscCode} onChange={set('ifscCode')} placeholder="HDFC0000241" className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="UPI ID (VPA)" hint="Used to generate Scan & Pay QR codes on invoices."><Input value={formData.upiId} onChange={set('upiId')} placeholder="shopname@okaxis" className="rounded-xl border-border font-mono" /></FieldGroup>
            </div>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-full bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Banking Details
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'invoice' && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            <SectionHeader icon={Receipt} title="Invoice Configuration" description="Customize numbering, taxes, and default footer message on all invoices." iconColor="text-orange-600" iconBg="bg-orange-50" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FieldGroup label="Invoice Number Prefix" hint={`Preview: ${formData.invoicePrefix || 'INV'}-2025-0001`}><Input value={formData.invoicePrefix} onChange={set('invoicePrefix')} placeholder="INV" maxLength={10} className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
              <FieldGroup label="Default GST Rate (%)" hint="Applied when adding new products to the catalog."><Input value={formData.taxRate} onChange={set('taxRate')} type="number" step="0.1" min="0" max="100" className="rounded-xl border-border" /></FieldGroup>
              <FieldGroup label="Currency Code"><Input value={formData.currency} onChange={set('currency')} placeholder="INR" maxLength={3} className="rounded-xl border-border font-mono uppercase" /></FieldGroup>
            </div>
            <FieldGroup label="Invoice Footer Message" hint="Printed at the bottom of all invoices — terms, notes, etc."><Textarea value={formData.footerMessage} onChange={set('footerMessage')} placeholder="Thank you for your business." className="rounded-xl border-border min-h-[80px]" /></FieldGroup>
            <div className="flex justify-end pt-2 border-t border-border">
              <Button type="submit" disabled={saving} className="rounded-full bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Invoice Config
              </Button>
            </div>
          </div>
        )}
      </form>

      {activeTab === 'team' && (
        <div className="space-y-5">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <SectionHeader icon={LinkIcon} title="Team Invite Link" description="Share this link with your employees. They sign up with their own Clerk account, then click the link to join your shop as a Cashier. You can promote them after." iconColor="text-emerald-600" iconBg="bg-emerald-50" />
            {inviteCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3">
                  <code className="flex-1 text-sm font-mono text-foreground truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/join/${inviteCode}` : `/join/${inviteCode}`}
                  </code>
                  <Button type="button" variant="ghost" size="icon" onClick={handleCopyInviteLink} className="shrink-0 h-8 w-8 rounded-lg hover:bg-background">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-medium">Code: <code className="font-mono font-bold text-foreground">{inviteCode}</code></span>
                  <Button type="button" variant="outline" size="sm" onClick={handleGenerateCode} disabled={generatingCode} className="rounded-full border-border text-xs gap-1.5 h-7">
                    {generatingCode ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />} Rotate Code
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Rotating invalidates all previous invite links immediately.</p>
              </div>
            ) : (
              <Button type="button" onClick={handleGenerateCode} disabled={generatingCode} className="rounded-full bg-foreground text-background hover:opacity-90 font-bold px-6 gap-2">
                {generatingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Generate Invite Link
              </Button>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Team Members</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{members.length} member{members.length !== 1 ? 's' : ''} in your shop</p>
              </div>
              {teamLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <div className="divide-y divide-border">
              {members.map((member) => {
                const meta = ROLE_META[member.role] || ROLE_META.CASHIER;
                const RoleIcon = meta.icon;
                const isCurrentUser = member.id === currentUserId;
                return (
                  <div key={member.id} className={`flex items-center gap-4 px-6 py-4 ${!member.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-sm text-foreground uppercase">
                      {member.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">{member.name}</span>
                        {isCurrentUser && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">You</span>}
                        {!member.isActive && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600">Deactivated</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {!isCurrentUser ? (
                        <Select value={member.role} onValueChange={(v) => handleRoleChange(member.id, v)}>
                          <SelectTrigger className={`h-8 w-[120px] rounded-full text-xs font-bold border-0 ${meta.color}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OWNER">Owner</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="CASHIER">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${meta.color}`}>
                          <RoleIcon className="h-3 w-3" /> {meta.label}
                        </span>
                      )}
                      {!isCurrentUser && (
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleToggleActive(member.id, member.isActive)} className={`h-8 w-8 rounded-full ${member.isActive ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`} title={member.isActive ? 'Deactivate' : 'Restore access'}>
                            {member.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveMember(member.id, member.name)} className="h-8 w-8 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-50" title="Remove from team">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-foreground mb-4">Role Permissions</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {Object.entries(ROLE_META).map(([, meta]) => {
                const Icon = meta.icon;
                const [bgClass, textClass] = meta.color.split(' ');
                return (
                  <div key={meta.label} className={`flex items-start gap-3 p-4 rounded-xl border border-border ${bgClass}/10`}>
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${textClass}`} />
                    <div>
                      <p className={`text-sm font-bold ${textClass}`}>{meta.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}