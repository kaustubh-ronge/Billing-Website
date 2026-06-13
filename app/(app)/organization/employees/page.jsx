"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2, UserPlus, Copy, Trash2, Mail, ShieldCheck, Crown, Settings2,
  Clock, CircleCheck, CircleSlash, Ban, ChevronRight, ChevronLeft, Check, Link2
} from 'lucide-react';
import { usePermissions } from '@/lib/permissions/PermissionContext';
import PermissionMatrix from '@/components/organization/PermissionMatrix';
import OverrideEditor from '@/components/organization/OverrideEditor';

const NONE = '__none__';

const STATUS_META = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-100 text-emerald-700', icon: CircleCheck },
  SUSPENDED: { label: 'Suspended', cls: 'bg-amber-100 text-amber-700', icon: CircleSlash },
  DISABLED: { label: 'Disabled', cls: 'bg-rose-100 text-rose-700', icon: Ban },
  PENDING: { label: 'Pending', cls: 'bg-blue-100 text-blue-700', icon: Clock },
};

function Avatar({ name }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-sm text-foreground uppercase">
      {(name || '?').substring(0, 2)}
    </div>
  );
}

export default function EmployeesPage() {
  const { isOwner } = usePermissions();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/employees');
      if (res.ok) setData(await res.json());
      else toast.error('Failed to load team');
    } catch { toast.error('Failed to load team'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const copyInvite = (token) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    toast.success('Invite link copied');
  };

  const revokeInvite = async (id) => {
    if (!confirm('Revoke this invitation?')) return;
    const res = await fetch(`/api/organization/invitations/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Invitation revoked'); fetchData(); }
    else toast.error('Failed to revoke');
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const { members = [], pending = [], canInvite, canManage, org } = data || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Employees</h2>
          <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? 's' : ''}{pending.length > 0 ? ` · ${pending.length} pending` : ''}</p>
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)} className="rounded-full bg-foreground text-background hover:opacity-90 font-bold gap-2">
            <UserPlus className="h-4 w-4" /> Invite Employee
          </Button>
        )}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Invitations</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {pending.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{inv.email}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {inv.isOwner ? 'Owner' : inv.roleName || 'Custom permissions'}
                    {inv.branchName ? ` · ${inv.branchName}` : ''}
                  </p>
                </div>
                <button onClick={() => copyInvite(inv.token)} title="Copy invite link" className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-muted">
                  <Copy className="h-4 w-4" />
                </button>
                {canInvite && (
                  <button onClick={() => revokeInvite(inv.id)} title="Revoke" className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="divide-y divide-border">
          {members.map((m) => {
            const st = STATUS_META[m.status] || STATUS_META.ACTIVE;
            const StatusIcon = st.icon;
            return (
              <div key={m.id} className={`flex items-center gap-4 px-5 py-4 ${m.status !== 'ACTIVE' ? 'opacity-60' : ''}`}>
                <Avatar name={m.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">{m.name}</span>
                    {m.isOwner && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700">
                        <Crown className="h-2.5 w-2.5" /> Owner
                      </span>
                    )}
                    {m.id === data.currentUserId && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">You</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap text-[11px] text-muted-foreground">
                    {!m.isOwner && <span className="font-medium">{m.roleName || 'No role'}</span>}
                    {m.branchName && <span>· {m.branchName}</span>}
                    {m.departmentName && <span>· {m.departmentName}</span>}
                    {m.teamName && <span>· {m.teamName}</span>}
                    <span className="text-muted-foreground/60">· {m.permissions.length} permissions</span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>
                  <StatusIcon className="h-3 w-3" /> {st.label}
                </span>
                {canManage && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(m)} className="rounded-full border-border gap-1.5">
                    <Settings2 className="h-3.5 w-3.5" /> Manage
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {inviteOpen && (
        <InviteWizard
          org={org}
          allowOwner={isOwner}
          onClose={() => setInviteOpen(false)}
          onDone={() => { setInviteOpen(false); fetchData(); }}
        />
      )}

      {editing && (
        <MemberEditor
          member={editing}
          org={org}
          allowOwner={isOwner}
          isSelf={editing.id === data.currentUserId}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); fetchData(); }}
        />
      )}
    </div>
  );
}

/* ------------------------------- Invite Wizard ------------------------------- */

const STEPS = ['Basics', 'Placement', 'Access'];

function InviteWizard({ org, allowOwner, onClose, onDone }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [createdToken, setCreatedToken] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    branchId: NONE, departmentId: NONE, teamId: NONE,
    roleId: NONE, isOwner: false, permissions: [],
  });

  const selectedRole = org.roles.find((r) => r.id === form.roleId);
  const inheritedPerms = form.isOwner ? [] : (selectedRole?.permissions || []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (step === 0) {
      if (!form.email.trim()) { toast.error('Email is required'); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = {
        name: form.name, email: form.email, phone: form.phone,
        branchId: form.branchId === NONE ? null : form.branchId,
        departmentId: form.departmentId === NONE ? null : form.departmentId,
        teamId: form.teamId === NONE ? null : form.teamId,
        roleId: form.isOwner || form.roleId === NONE ? null : form.roleId,
        isOwner: form.isOwner,
        permissions: form.isOwner ? [] : form.permissions,
      };
      const res = await fetch('/api/organization/invitations', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) {
        setCreatedToken(d.invitation.token);
        toast.success('Invitation created');
      } else {
        toast.error(d.error || 'Failed to create invitation');
      }
    } catch { toast.error('Failed to create invitation'); }
    finally { setSaving(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/join/${createdToken}`);
    toast.success('Invite link copied');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && (createdToken ? onDone() : onClose())}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-y-auto rounded-2xl">
        {createdToken ? (
          <div className="text-center space-y-4 py-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
              <Check className="h-7 w-7 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl font-black">Invitation ready</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Share this link with <strong>{form.email}</strong>. When they sign up with this email,
              they'll be placed and provisioned automatically.
            </p>
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl p-3 text-left">
              <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <code className="flex-1 text-xs font-mono truncate">{`${typeof window !== 'undefined' ? window.location.origin : ''}/join/${createdToken}`}</code>
              <Button size="sm" variant="ghost" onClick={copyLink} className="h-7 rounded-lg"><Copy className="h-3.5 w-3.5" /></Button>
            </div>
            <Button onClick={onDone} className="rounded-full bg-foreground text-background font-bold px-8">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Invite Employee</DialogTitle>
              <DialogDescription>Pre-assign their placement and access — applied the moment they join.</DialogDescription>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center gap-2 py-2">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <div className={`flex items-center gap-2 ${i === step ? 'text-foreground' : 'text-muted-foreground'}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${i < step ? 'bg-emerald-600 text-white' : i === step ? 'bg-foreground text-background' : 'bg-muted'}`}>
                      {i < step ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <span className="text-xs font-bold">{label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border" />}
                </React.Fragment>
              ))}
            </div>

            <div className="py-2 space-y-4">
              {step === 0 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Email address *</Label>
                    <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="employee@example.com" className="rounded-xl border-border" />
                    <p className="text-[11px] text-muted-foreground">The invite is locked to this email — only this address can accept it.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full name</Label>
                      <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Optional" className="rounded-xl border-border" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Optional" className="rounded-xl border-border" />
                    </div>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-4">
                  <p className="text-xs text-muted-foreground">All optional — assign where this person works in the organization.</p>
                  <div className="space-y-1.5">
                    <Label>Branch</Label>
                    <PlacementSelect value={form.branchId} onChange={(v) => set('branchId', v)} options={org.branches} placeholder="No branch" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Department</Label>
                    <PlacementSelect value={form.departmentId} onChange={(v) => set('departmentId', v)} options={org.departments} placeholder="No department" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Team</Label>
                    <PlacementSelect value={form.teamId} onChange={(v) => set('teamId', v)} options={org.teams} placeholder="No team" />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {allowOwner && (
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/40">
                      <input type="checkbox" checked={form.isOwner} onChange={(e) => set('isOwner', e.target.checked)} className="h-4 w-4 accent-violet-600" />
                      <div>
                        <p className="text-sm font-bold text-foreground flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-violet-600" /> Full access (Owner)</p>
                        <p className="text-[11px] text-muted-foreground">Grants every permission and organization administration.</p>
                      </div>
                    </label>
                  )}

                  {!form.isOwner && (
                    <>
                      <div className="space-y-1.5">
                        <Label>Role template (optional)</Label>
                        <Select value={form.roleId} onValueChange={(v) => set('roleId', v)}>
                          <SelectTrigger className="rounded-xl border-border"><SelectValue placeholder="No role — custom permissions" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>No role — custom permissions only</SelectItem>
                            {org.roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        {selectedRole && <p className="text-[11px] text-muted-foreground">Grants {selectedRole.permissions.length} permissions. Add more below.</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label>{selectedRole ? 'Additional permissions' : 'Permissions'}</Label>
                        <PermissionMatrix value={form.permissions} onChange={(v) => set('permissions', v)} inherited={inheritedPerms} />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 border-t border-border pt-4">
              <div>
                {step > 0 && (
                  <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className="rounded-full gap-1"><ChevronLeft className="h-4 w-4" /> Back</Button>
                )}
              </div>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="rounded-full bg-foreground text-background font-bold px-6 gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={submit} disabled={saving} className="rounded-full bg-foreground text-background font-bold px-6 gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Generate Invite
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PlacementSelect({ value, onChange, options, placeholder }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="rounded-xl border-border"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{placeholder}</SelectItem>
        {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/* ------------------------------- Member Editor ------------------------------- */

function MemberEditor({ member, org, allowOwner, isSelf, onClose, onDone }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    status: member.status,
    roleId: member.roleId || NONE,
    branchId: member.branchId || NONE,
    departmentId: member.departmentId || NONE,
    teamId: member.teamId || NONE,
    isOwner: member.isOwner,
    overrides: member.overrides || [],
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedRole = org.roles.find((r) => r.id === form.roleId);
  const rolePerms = form.isOwner ? [] : (selectedRole?.permissions || []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        status: form.status,
        roleId: form.roleId === NONE ? null : form.roleId,
        branchId: form.branchId === NONE ? null : form.branchId,
        departmentId: form.departmentId === NONE ? null : form.departmentId,
        teamId: form.teamId === NONE ? null : form.teamId,
        overrides: form.isOwner ? [] : form.overrides,
      };
      if (allowOwner) payload.isOwner = form.isOwner;
      const res = await fetch(`/api/organization/employees/${member.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const d = await res.json();
      if (res.ok) { toast.success('Member updated'); onDone(); }
      else toast.error(d.error || 'Failed to update');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!confirm(`Remove ${member.name} from the organization? They lose access immediately.`)) return;
    const res = await fetch(`/api/organization/employees/${member.id}`, { method: 'DELETE' });
    const d = await res.json();
    if (res.ok) { toast.success(`${member.name} removed`); onDone(); }
    else toast.error(d.error || 'Failed to remove');
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[640px] max-h-[88vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">{member.name}</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Status + Owner */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)} disabled={isSelf}>
                <SelectTrigger className="rounded-xl border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="DISABLED">Disabled</SelectItem>
                </SelectContent>
              </Select>
              {isSelf && <p className="text-[11px] text-muted-foreground">You can't change your own status.</p>}
            </div>
            {allowOwner && (
              <div className="space-y-1.5">
                <Label>Access level</Label>
                <label className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border cursor-pointer">
                  <input type="checkbox" checked={form.isOwner} onChange={(e) => set('isOwner', e.target.checked)} className="h-4 w-4 accent-violet-600" />
                  <span className="text-sm font-semibold flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-violet-600" /> Owner (full access)</span>
                </label>
              </div>
            )}
          </div>

          {!form.isOwner && (
            <>
              {/* Placement */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Branch</Label>
                  <PlacementSelect value={form.branchId} onChange={(v) => set('branchId', v)} options={org.branches} placeholder="None" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Department</Label>
                  <PlacementSelect value={form.departmentId} onChange={(v) => set('departmentId', v)} options={org.departments} placeholder="None" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Team</Label>
                  <PlacementSelect value={form.teamId} onChange={(v) => set('teamId', v)} options={org.teams} placeholder="None" />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <Label>Role template</Label>
                <Select value={form.roleId} onValueChange={(v) => set('roleId', v)}>
                  <SelectTrigger className="rounded-xl border-border"><SelectValue placeholder="No role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>No role — overrides only</SelectItem>
                    {org.roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Overrides */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" /> Permissions</Label>
                <p className="text-[11px] text-muted-foreground">Inherit follows the role. Allow/Deny override it for this person specifically.</p>
                <OverrideEditor rolePerms={rolePerms} overrides={form.overrides} onChange={(v) => set('overrides', v)} />
              </div>
            </>
          )}

          {form.isOwner && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 text-violet-700 text-sm font-medium">
              <Crown className="h-4 w-4" /> This member has full access to everything.
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={remove} disabled={isSelf} className="rounded-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 gap-1.5">
            <Trash2 className="h-4 w-4" /> Remove
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="rounded-full border-border">Cancel</Button>
            <Button onClick={save} disabled={saving} className="rounded-full bg-foreground text-background font-bold px-6 gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
