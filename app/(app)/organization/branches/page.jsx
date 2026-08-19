"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Building, Pencil, Trash2, Check, Users, Network, MapPin } from 'lucide-react';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/branches');
      if (res.ok) { const d = await res.json(); setBranches(d.branches); }
      else toast.error('Failed to load branches');
    } catch { toast.error('Failed to load branches'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchBranches(); }, []);

  const remove = async (b) => {
    if (!confirm(`Delete branch "${b.name}"? Members and departments will be detached from it.`)) return;
    const res = await fetch(`/api/organization/branches/${b.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Branch deleted'); fetchBranches(); }
    else toast.error('Failed to delete branch');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Branches</h2>
          <p className="text-sm text-muted-foreground">Physical locations — head office, warehouses, retail outlets.</p>
        </div>
        <Button onClick={() => setEditing({})} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState icon={Building} text="No branches yet. Add your head office to get started." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 shrink-0"><Building className="h-4 w-4" /></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                      {b.name}
                      {b.isHeadquarters && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">HQ</span>}
                    </p>
                    {b.address && <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-2.5 w-2.5" /> {b.address}</p>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {b._count?.users ?? 0}</span>
                <span className="inline-flex items-center gap-1"><Network className="h-3 w-3" /> {b._count?.departments ?? 0} depts</span>
                {b.phone && <span>· {b.phone}</span>}
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setEditing(b)} className="rounded-md gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(b)} className="rounded-md gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 ml-auto"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <BranchEditor branch={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchBranches(); }} />}
    </div>
  );
}

function BranchEditor({ branch, onClose, onDone }) {
  const isNew = !branch.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: branch.name || '', address: branch.address || '', phone: branch.phone || '', isHeadquarters: branch.isHeadquarters || false,
  });

  const save = async () => {
    if (!form.name.trim()) { toast.error('Branch name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(isNew ? '/api/organization/branches' : `/api/organization/branches/${branch.id}`, {
        method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) { toast.success(isNew ? 'Branch created' : 'Branch updated'); onDone(); }
      else toast.error(d.error || 'Failed to save');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black">{isNew ? 'Add Branch' : 'Edit Branch'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>Branch name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Branch" className="rounded-xl border-border" /></div>
          <div className="space-y-1.5"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="rounded-xl border-border min-h-[60px]" /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="rounded-xl border-border" /></div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isHeadquarters} onChange={(e) => setForm((f) => ({ ...f, isHeadquarters: e.target.checked }))} className="h-4 w-4 accent-orange-600" />
            <span className="text-sm font-semibold text-foreground">This is the headquarters</span>
          </label>
        </div>
        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg border-border">Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-lg bg-foreground text-background font-bold px-6 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center">
      <Icon className="h-8 w-8 mx-auto text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground mt-2">{text}</p>
    </div>
  );
}
