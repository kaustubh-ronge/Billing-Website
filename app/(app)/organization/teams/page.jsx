"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, UsersRound, Pencil, Trash2, Check, Users } from 'lucide-react';

const NONE = '__none__';

export default function TeamsPage() {
  const [teams, setTeams] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tRes, dRes] = await Promise.all([
        fetch('/api/organization/teams'),
        fetch('/api/organization/departments'),
      ]);
      if (tRes.ok) setTeams((await tRes.json()).teams);
      if (dRes.ok) setDepartments((await dRes.json()).departments);
    } catch { toast.error('Failed to load teams'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const remove = async (t) => {
    if (!confirm(`Delete team "${t.name}"?`)) return;
    const res = await fetch(`/api/organization/teams/${t.id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Team deleted'); fetchAll(); }
    else toast.error('Failed to delete');
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Teams</h2>
          <p className="text-sm text-muted-foreground">Working groups like Billing Team, Collection Team, Warehouse Team.</p>
        </div>
        <Button onClick={() => setEditing({})} className="rounded-lg bg-foreground text-background hover:opacity-90 font-bold gap-2">
          <Plus className="h-4 w-4" /> Add Team
        </Button>
      </div>

      {teams.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center">
          <UsersRound className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mt-2">No teams yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((t) => (
            <div key={t.id} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600 shrink-0"><UsersRound className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{t.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{t.department?.name || 'No department'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t._count?.users ?? 0} members</span>
              </div>
              <div className="flex items-center gap-1 mt-4 pt-3 border-t border-border">
                <Button variant="ghost" size="sm" onClick={() => setEditing(t)} className="rounded-md gap-1.5 text-xs"><Pencil className="h-3.5 w-3.5" /> Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => remove(t)} className="rounded-md gap-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 ml-auto"><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && <TeamEditor team={editing} departments={departments} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchAll(); }} />}
    </div>
  );
}

function TeamEditor({ team, departments, onClose, onDone }) {
  const isNew = !team.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: team.name || '', departmentId: team.departmentId || NONE });

  const save = async () => {
    if (!form.name.trim()) { toast.error('Team name is required'); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, departmentId: form.departmentId === NONE ? null : form.departmentId };
      const res = await fetch(isNew ? '/api/organization/teams' : `/api/organization/teams/${team.id}`, {
        method: isNew ? 'POST' : 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) { toast.success(isNew ? 'Team created' : 'Team updated'); onDone(); }
      else toast.error(d.error || 'Failed to save');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px] rounded-2xl">
        <DialogHeader><DialogTitle className="text-xl font-black">{isNew ? 'Add Team' : 'Edit Team'}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5"><Label>Team name *</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Collection Team" className="rounded-xl border-border" /></div>
          <div className="space-y-1.5">
            <Label>Department (optional)</Label>
            <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}>
              <SelectTrigger className="rounded-xl border-border"><SelectValue placeholder="No department" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>No department</SelectItem>
                {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
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
