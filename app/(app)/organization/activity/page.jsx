"use client";
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Loader2, ScrollText, RefreshCw, FileText, Users, Package, ShieldCheck,
  Building, UserPlus, Trash2, CreditCard, Activity
} from 'lucide-react';

function iconFor(action) {
  if (action.startsWith('invoice')) return { Icon: FileText, cls: 'bg-blue-50 text-blue-600' };
  if (action.startsWith('payment')) return { Icon: CreditCard, cls: 'bg-emerald-50 text-emerald-600' };
  if (action.startsWith('customer')) return { Icon: Users, cls: 'bg-violet-50 text-violet-600' };
  if (action.startsWith('product')) return { Icon: Package, cls: 'bg-amber-50 text-amber-600' };
  if (action.startsWith('role')) return { Icon: ShieldCheck, cls: 'bg-indigo-50 text-indigo-600' };
  if (action.startsWith('employee') || action.startsWith('invitation')) return { Icon: UserPlus, cls: 'bg-teal-50 text-teal-600' };
  if (action.startsWith('branch') || action.startsWith('department') || action.startsWith('team')) return { Icon: Building, cls: 'bg-orange-50 text-orange-600' };
  return { Icon: Activity, cls: 'bg-gray-100 text-gray-600' };
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-IN');
}

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/organization/activity');
      if (res.ok) { const d = await res.json(); setLogs(d.logs); }
      else toast.error('Failed to load activity');
    } catch { toast.error('Failed to load activity'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchLogs(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Activity Log</h2>
          <p className="text-sm text-muted-foreground">Who did what across your organization.</p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchLogs} className="rounded-full border-border"><RefreshCw className="h-4 w-4" /></Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-card border border-dashed border-border rounded-2xl py-12 text-center">
          <ScrollText className="h-8 w-8 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground mt-2">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="divide-y divide-border">
            {logs.map((log) => {
              const { Icon, cls } = iconFor(log.action);
              return (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{log.description || log.action}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {log.user?.name || 'System'} · <span className="font-mono">{log.action}</span>
                    </p>
                  </div>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{timeAgo(log.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
