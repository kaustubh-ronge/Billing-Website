"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Clock, Users, ArrowRight, ShieldAlert,
  Calendar, Phone, Mail, Search, Edit2, Loader2, ArrowLeft, ArrowRight as ArrowRightIcon
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ pending: 0, active: 0, users: 0 });
  const [shops, setShops] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [plans, setPlans] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [shopsLoading, setShopsLoading] = useState(true);
  
  // Pagination & Search
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // Edit Plan Modal
  const [selectedShop, setSelectedShop] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('none');
  const [customExpiry, setCustomExpiry] = useState('');
  const [shopActive, setShopActive] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchShops();
  }, [page, search]);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/plans'); // We can reuse this auth check
      if (res.ok) {
        // Let's load queue requests to show pending count
        const queueRes = await fetch('/api/admin/shops'); // Just dummy fetch or simple query
        // Wait, let's load stats from the API directly. We can construct statistical summaries
      }
    } catch {}
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {}
  };

  const fetchShops = async () => {
    try {
      setShopsLoading(true);
      const res = await fetch(`/api/admin/shops?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        setAlerts(data.alerts || []);
        setTotalPages(data.totalPages || 1);
        
        // Sum counts for visual stats block
        setStats({
          active: data.total || 0,
          pending: data.alerts?.length || 0, // Number of expiring alerts
          users: (data.shops || []).reduce((acc, s) => acc + (s.users?.length || 1), 0),
        });
      }
    } catch (err) {
      toast.error('Failed to load shops');
    } finally {
      setShopsLoading(false);
      setLoading(false);
    }
  };

  const handleOpenEdit = (shop) => {
    setSelectedShop(shop);
    setSelectedPlanId(shop.planId || 'none');
    setShopActive(shop.isActive !== false);
    if (shop.planExpiresAt) {
      setCustomExpiry(new Date(shop.planExpiresAt).toISOString().split('T')[0]);
    } else {
      setCustomExpiry('');
    }
    setIsEditOpen(true);
  };

  const handlePlanChange = (planId) => {
    setSelectedPlanId(planId);
    if (planId && planId !== 'none') {
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + plan.durationDays);
        setCustomExpiry(targetDate.toISOString().split('T')[0]);
      }
    } else {
      setCustomExpiry('');
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    if (!selectedShop) return;

    setUpdating(true);
    try {
      // Find selected plan duration to calculate expiry
      let expiryDate = customExpiry ? new Date(customExpiry).toISOString() : null;
      
      const res = await fetch('/api/admin/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: selectedShop.id,
          planId: selectedPlanId === 'none' ? null : selectedPlanId || null,
          planExpiresAt: expiryDate,
          isActive: shopActive,
        }),
      });

      if (res.ok) {
        toast.success('Subscription plan updated successfully');
        setIsEditOpen(false);
        fetchShops();
      } else {
        toast.error('Failed to update subscription plan');
      }
    } catch {
      toast.error('Error updating plan');
    } finally {
      setUpdating(false);
    }
  };

  const getDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const getPlanStatusBadge = (expiryDate) => {
    const days = getDaysRemaining(expiryDate);
    if (days === null) return <Badge variant="secondary">No Active Plan</Badge>;
    if (days < 0) return <Badge variant="destructive">Expired</Badge>;
    if (days <= 10) return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-1">Warning: {days} Days Left</Badge>;
    return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">{days} Days Active</Badge>;
  };

  // Filter shops by search query client-side for ultra-fast UX
  const filteredShops = shops.filter(s => 
    s.businessName?.toLowerCase().includes(search.toLowerCase()) ||
    s.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor registered businesses, check subscription alerts, and manage tiers.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-full">
          <Link href="/admin/requests" className="gap-1.5 font-bold">
            View Registration Queue <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Businesses</p>
                <p className="text-2xl font-black text-foreground">{stats.active}</p>
                <p className="text-[10px] text-muted-foreground">Registered on platform</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subscription Alerts</p>
                <p className="text-2xl font-black text-amber-600">{alerts.length}</p>
                <p className="text-[10px] text-muted-foreground">Expiring within 10 days</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm rounded-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Estimated Accounts</p>
                <p className="text-2xl font-black text-emerald-600">{stats.users}</p>
                <p className="text-[10px] text-muted-foreground">Active platform operators</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription Expiration Alerts */}
      {alerts.length > 0 && (
        <Card className="border border-amber-200 bg-amber-50/20 rounded-2xl overflow-hidden shadow-sm">
          <CardHeader className="bg-amber-50/50 py-3.5 border-b border-amber-100 flex flex-row items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
            <div>
              <CardTitle className="text-sm font-black text-amber-900">Critical Expiration Alerts</CardTitle>
              <CardDescription className="text-[10px] text-amber-700">The following businesses have 10 days or less remaining on their membership plans.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-amber-100/50">
            {alerts.map((alert) => {
              const days = getDaysRemaining(alert.planExpiresAt);
              return (
                <div key={alert.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900 text-sm">{alert.businessName}</h4>
                    <p className="text-gray-500 flex items-center gap-1.5">
                      <span className="font-semibold text-gray-700">{alert.ownerName || 'Unknown Owner'}</span>
                      {alert.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {alert.phone}</span>}
                      {alert.email && <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" /> {alert.email}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-black text-amber-700">{days <= 0 ? 'Expired' : `${days} Days Remaining`}</p>
                      <p className="text-[10px] text-gray-500">Plan: {alert.plan?.name || 'Standard'}</p>
                    </div>
                    <Button size="sm" onClick={() => handleOpenEdit(alert)} className="rounded-full bg-amber-600 text-white hover:bg-amber-700 font-bold px-4 gap-1">
                      <Edit2 className="h-3 w-3" /> Renew Plan
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Businesses Management Panel */}
      <Card className="border border-border rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <CardTitle className="text-md font-bold">Registered Businesses</CardTitle>
            <CardDescription>View, search, and update client subscriptions on the platform.</CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search business, owner..."
              className="pl-9 rounded-xl border-border w-full text-xs"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {shopsLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground font-sans">
              <Building2 className="h-12 w-12 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-bold">No registered businesses found</p>
              <p className="text-xs mt-1">Once registration requests are approved, they will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-sans">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-muted-foreground font-bold">
                    <th className="p-4">Business Name</th>
                    <th className="p-4">Owner / Contact</th>
                    <th className="p-4">Membership Plan</th>
                    <th className="p-4">Expiration Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredShops.map((shop) => (
                    <tr key={shop.id} className="hover:bg-muted/10 transition-colors">
                      <td className="p-4 font-bold text-foreground">{shop.businessName}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-semibold text-foreground">{shop.ownerName || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{shop.phone || 'No Phone'} · {shop.email || 'No Email'}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-gray-700">{shop.plan?.name || '1 Month Trial (Default)'}</span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {shop.planExpiresAt ? new Date(shop.planExpiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {shop.isActive === false ? (
                            <Badge variant="destructive" className="font-bold">Suspended</Badge>
                          ) : (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Active</Badge>
                          )}
                          {getPlanStatusBadge(shop.planExpiresAt)}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button size="xs" variant="outline" onClick={() => handleOpenEdit(shop)} className="rounded-xl font-bold gap-1 text-[10px] px-2.5 py-1">
                          <Edit2 className="h-3 w-3" /> Edit Plan
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <span className="text-[11px] text-muted-foreground font-sans">Page {page} of {totalPages}</span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="rounded-xl px-3 text-xs gap-1 font-bold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="rounded-xl px-3 text-xs gap-1 font-bold"
                >
                  Next <ArrowRightIcon className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Update Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-2xl max-w-sm bg-white font-sans">
          <form onSubmit={handleUpdatePlan}>
            <DialogHeader>
              <DialogTitle className="text-md font-bold text-gray-900">Manage Shop Subscription</DialogTitle>
              <DialogDescription className="text-xs">
                Update subscription plan or manually override expiration for {selectedShop?.businessName}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <Label htmlFor="planSelect">Select Membership Tier</Label>
                <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                  <SelectTrigger id="planSelect" className="rounded-xl border-gray-250 bg-background text-xs">
                    <SelectValue placeholder="Select Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select Plan (None / Custom)</SelectItem>
                    {plans.filter(p => p.isActive || p.id === selectedPlanId).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.durationDays} Days - ₹{p.price}){!p.isActive ? ' (Inactive)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Custom Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={customExpiry}
                  onChange={(e) => setCustomExpiry(e.target.value)}
                  className="rounded-xl border-gray-250 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shopActiveSelect">Account Status</Label>
                <Select value={shopActive ? "active" : "inactive"} onValueChange={(val) => setShopActive(val === "active")}>
                  <SelectTrigger id="shopActiveSelect" className="rounded-xl border-gray-250 bg-background text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active (Full Access)</SelectItem>
                    <SelectItem value="inactive">Inactive (Suspended)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="rounded-full px-5 text-xs font-bold border-gray-200">
                Cancel
              </Button>
              <Button type="submit" disabled={updating} className="rounded-full px-5 text-xs font-bold bg-black text-white hover:bg-gray-900">
                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Subscription'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
