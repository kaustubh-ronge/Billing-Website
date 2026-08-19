"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, ShieldCheck, Copy, Pencil, Trash2, Lock, Users, Check } from 'lucide-react';
import PermissionMatrix from '@/components/organization/PermissionMatrix';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // role object or {} for new

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/roles');
      if (res.ok) { const d = await res.json(); setRoles(d.roles); }
      else toast.error('Failed to load roles');
    } catch { toast.error('Failed to load roles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRoles(); }, []);

  const clone = async (role) => {
    const res = await fetch('/api/organization/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cloneFromId: role.id }),
    });
    if (res.ok) { toast.success(`Cloned "${role.name}"`); fetchRoles(); }
    else toast.error('Failed to clone role');
  };

  const remove = async (role) => {
    const verb = role.isSystem ? 'archive' : 'delete';
    if (!confirm(`${verb === 'archive' ? 'Archive' : 'Delete'} role "${role.name}"? Members keep their explicit permissions but lose this role.`)) return;
    const res = await fetch(`/api/organization/roles/${role.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success(`Role ${verb}d`); fetchRoles(); }
    else toast.error('Failed to remove role');
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Roles</h2>
          <p className="text-sm text-muted-foreground">Reusable permission templates — assign them to employees as a starting point.</p>
        </div>
        <Button onClick={() => setEditing({})} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold gap-2">
          <Plus className="h-4 w-4" /> Create Role
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => (
          <div key={role.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                    {role.name}
                    {role.isSystem && <span title="Starter template" className="inline-flex items-center"><Lock className="h-3 w-3 text-muted-foreground" /></span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">{role.description || 'No description'}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <span className="font-semibold">{role.permissions.length} permissions</span>
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {role._count?.users ?? 0} assigned</span>
              {role.isSystem && <span className="px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">Starter</span>}
            </div>
            <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
              <Button variant="ghost" size="sm" onClick={() => setEditing(role)} className="rounded-md gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button variant="ghost" size="sm" onClick={() => clone(role)} className="rounded-md gap-1.5 text-xs"><Copy className="h-3.5 w-3.5" /> Clone</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(role)} className="rounded-md gap-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 ml-auto">
                <Trash2 className="h-3.5 w-3.5" /> {role.isSystem ? 'Archive' : 'Delete'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <RoleEditor role={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchRoles(); }} />
      )}
    </div>
  );
}

function RoleEditor({ role, onClose, onDone }) {
  const isNew = !role.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: role.name || '',
    description: role.description || '',
    permissions: role.permissions || [],
  });

  const save = async () => {
    if (!form.name.trim()) { toast.error('Role name is required'); return; }
    setSaving(true);
    try {
      const res = await fetch(isNew ? '/api/organization/roles' : `/api/organization/roles/${role.id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) { toast.success(isNew ? 'Role created' : 'Role updated'); onDone(); }
      else toast.error(d.error || 'Failed to save role');
    } catch { toast.error('Failed to save role'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">{isNew ? 'Create Role' : `Edit ${role.name}`}</DialogTitle>
          <DialogDescription>Pick the permissions this role grants. You can override per-employee later.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role name *</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Senior Accountant" className="rounded-xl border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short summary" className="rounded-xl border-border" />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Permissions</Label>
              <span className="text-[11px] font-bold text-muted-foreground">{form.permissions.length} selected</span>
            </div>
            <PermissionMatrix value={form.permissions} onChange={(v) => setForm((f) => ({ ...f, permissions: v }))} />
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-4 gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-lg border-border">Cancel</Button>
          <Button onClick={save} disabled={saving} className="rounded-lg bg-foreground text-background font-bold px-6 gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {isNew ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
