"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Network, Pencil, Trash2, Check, Users, UsersRound } from 'lucide-react';

const NONE = '__none__';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [dRes, bRes] = await Promise.all([
        fetch('/api/organization/departments'),
        fetch('/api/organization/branches'),
      ]);
      if (dRes.ok) setDepartments((await dRes.json()).departments);
      if (bRes.ok) setBranches((await bRes.json()).branches);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const remove = async (d) => {
    if (!confirm(`Delete department "${d.name}"?`)) return;
    const res = await fetch(`/api/organization/departments/${d.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Department deleted'); fetchAll(); }
    else toast.error('Failed to delete');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Departments</h2>
          <p className="text-sm text-muted-foreground">Functional groups like Billing, Inventory, Accounts, Sales.</p>
        </div>
        <Button onClick={() => setEditing({})} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Department
        </Button>
      </div>

      {departments.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center">
          <Network className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mt-2">No departments yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <div key={d.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0"><Network className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{d.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{d.branch?.name || 'No branch'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {d._count?.users ?? 0}</span>
                <span className="inline-flex items-center gap-1"><UsersRound className="h-3 w-3" /> {d._count?.teams ?? 0} teams</span>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setEditing(d)} className="rounded-md gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(d)} className="rounded-md gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 ml-auto"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <DeptEditor dept={editing} branches={branches} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchAll(); }} />}
    </div>
  );
}

function DeptEditor({ dept, branches, onClose, onDone }) {
  const isNew = !dept.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: dept.name || '', branchId: dept.branchId || NONE });

  const save = async () => {
    if (!form.name.trim()) { toast.error('Department name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, branchId: form.branchId === NONE ? null : form.branchId };
      const res = await fetch(isNew ? '/api/organization/departments' : `/api/organization/departments/${dept.id}`, {
        method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) { toast.success(isNew ? 'Department created' : 'Department updated'); onDone(); }
      else toast.error(d.error || 'Failed to save');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black">{isNew ? 'Add Department' : 'Edit Department'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>Department name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Inventory" className="rounded-xl border-border" /></div>
          <div className="space-y-1.5">
            <Label>Branch (optional)</Label>
            <Select value={form.branchId} onValueChange={(v) => setForm((f) => ({ ...f, branchId: v }))}>
              <SelectTrigger className="rounded-xl border-border"><SelectValue placeholder="No branch" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No branch</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg border-border">Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-lg bg-foreground text-background font-bold px-6 gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
