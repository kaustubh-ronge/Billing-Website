"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { toast } from 'sonner';
import {
  TrendingUp, Users, DollarSign, AlertTriangle, FileText,
  ArrowRight, ShieldAlert, BadgeCheck, Lightbulb, RefreshCw,
  ShoppingCart, Plus, ArrowUpRight, Package, IndianRupee,
  CircleDollarSign, Activity, BarChart2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reports', { cache: 'no-store' });
      if (res.ok) {
        setData(await res.json());
      } else {
        toast.error('Failed to load dashboard metrics');
      }
    } catch {
      toast.error('Error fetching dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
            <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading analytics…</p>
        </div>
      </div>
    );
  }

  const metrics = data?.metrics || {
    todaySales: 0, monthlySales: 0, totalCustomers: 0,
    pendingPayments: 0, paidInvoicesCount: 0, unpaidInvoicesCount: 0
  };
  const charts = data?.charts || { daily: [], monthly: [] };
  const reports = data?.reports || { topPendingCustomers: [], topProducts: [], lowStockAlerts: [] };
  const insights = data?.insights || { expectedMonthlyRevenue: 0, bestCategory: 'N/A', collectionRatio: 100 };

  const totalInvoices = metrics.paidInvoicesCount + metrics.unpaidInvoicesCount;
  const paidRatio = totalInvoices > 0
    ? Math.round((metrics.paidInvoicesCount / totalInvoices) * 100)
    : 100;

  const metricCards = [
    {
      label: "Today's Revenue",
      value: `₹${metrics.todaySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      sub: "Bills issued today",
      icon: IndianRupee,
      gradient: "from-blue-500 via-blue-600 to-indigo-600",
      iconBg: "bg-white/20",
      link: "/invoices",
    },
    {
      label: "Monthly Sales",
      value: `₹${metrics.monthlySales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      sub: "Current calendar month",
      icon: BarChart2,
      gradient: "from-violet-500 via-purple-600 to-purple-700",
      iconBg: "bg-white/20",
      link: "/invoices",
    },
    {
      label: "Outstanding Due",
      value: `₹${metrics.pendingPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      sub: "Pending collections",
      icon: CircleDollarSign,
      gradient: "from-rose-500 via-rose-600 to-red-600",
      iconBg: "bg-white/20",
      link: "/customers",
      urgent: metrics.pendingPayments > 0,
    },
    {
      label: "Total Clients",
      value: metrics.totalCustomers.toString(),
      sub: "Active customer accounts",
      icon: Users,
      gradient: "from-emerald-500 via-green-600 to-teal-600",
      iconBg: "bg-white/20",
      link: "/customers",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Business Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Real-time sales analytics and collection status</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/invoices/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background font-bold px-5 py-2 text-sm hover:opacity-90 transition-opacity"
          >
            <Plus className="h-3.5 w-3.5" /> New Bill
          </Link>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDashboardData}
            className="rounded-full border-border"
            aria-label="Refresh data"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gradient Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map(({ label, value, sub, icon: Icon, gradient, link, urgent }) => (
          <Link key={label} href={link} className="group block">
            <div className={`relative overflow-hidden rounded-2xl bg-linear-to-br ${gradient} p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{label}</p>
                  <p className="text-2xl font-black text-white leading-tight truncate">{value}</p>
                  <p className="text-[11px] text-white/60 font-medium">{sub}</p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ml-3">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
              {urgent && (
                <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-white/80">
                  <AlertTriangle className="h-3 w-3" /> Needs attention
                </div>
              )}
              <ArrowUpRight className="absolute bottom-3 right-3 h-4 w-4 text-white/30 group-hover:text-white/60 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      {/* Collection ratio + insights strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Collection health */}
        <div className="col-span-1 bg-linear-to-br from-slate-800 to-slate-900 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-sm font-bold text-white/90">Collection Health</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">{paidRatio}%</span>
          </div>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
              style={{ width: `${paidRatio}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-[10px] text-white/50 font-medium">
            <span>{metrics.paidInvoicesCount} paid</span>
            <span>{metrics.unpaidInvoicesCount} pending</span>
          </div>
        </div>

        {/* Projected revenue insight */}
        <div className="col-span-1 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-bold text-white/90">Revenue Forecast</span>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              ₹{insights.expectedMonthlyRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[11px] text-white/60 mt-1">Projected next month (10% trend)</p>
          </div>
          {insights.bestCategory !== 'N/A' && (
            <p className="mt-2 text-[11px] font-semibold text-blue-200">
              Top category: {insights.bestCategory}
            </p>
          )}
        </div>

        {/* Low stock or all-clear */}
        <div className={`col-span-1 rounded-2xl p-5 border ${
          reports.lowStockAlerts.length > 0
            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800'
            : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {reports.lowStockAlerts.length > 0 ? (
              <ShieldAlert className="h-4 w-4 text-rose-600" />
            ) : (
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            )}
            <span className={`text-sm font-bold ${reports.lowStockAlerts.length > 0 ? 'text-rose-800 dark:text-rose-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
              {reports.lowStockAlerts.length > 0 ? `${reports.lowStockAlerts.length} Low Stock Items` : 'Inventory Healthy'}
            </span>
          </div>
          <div className="space-y-1.5 max-h-24 overflow-y-auto">
            {reports.lowStockAlerts.length === 0 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">All products adequately stocked</p>
            ) : (
              reports.lowStockAlerts.slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between items-center text-xs">
                  <span className="font-medium text-rose-900 dark:text-rose-200 truncate pr-2">{p.name}</span>
                  <Badge variant="destructive" className="text-[10px] shrink-0">{p.stockCount} left</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 30-Day Area Chart */}
        <div className="lg:col-span-8">
          <Card className="border-border rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border py-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold">30-Day Sales Performance</CardTitle>
                  <CardDescription>Daily revenue trends</CardDescription>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded-full px-3 py-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Last 30 days
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.daily} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', fontSize: '12px' }}
                      cursor={{ stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2.5} fill="url(#salesGrad)" dot={false} activeDot={{ r: 5, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Bar Chart */}
        <div className="lg:col-span-4">
          <Card className="border-border rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-border py-4 px-6">
              <CardTitle className="text-base font-bold">Monthly Breakdown</CardTitle>
              <CardDescription>12-month revenue history</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                    <Tooltip
                      formatter={(value) => [`₹${Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'Revenue']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', fontSize: '12px' }}
                    />
                    <Bar dataKey="sales" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Outstanding Customers */}
        <Card className="border-border rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Top Outstanding Accounts</CardTitle>
              <CardDescription>Customers with unpaid balances</CardDescription>
            </div>
            <Link href="/customers" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-border">
            {reports.topPendingCustomers.length === 0 ? (
              <div className="p-8 text-center">
                <BadgeCheck className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">All accounts settled!</p>
              </div>
            ) : (
              reports.topPendingCustomers.slice(0, 6).map((c, i) => (
                <div key={c.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 text-xs font-black">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.phone} · {c.invoiceCount} bill{c.invoiceCount > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-600 bg-rose-50 dark:bg-rose-900/40 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-800 shrink-0 ml-3">
                    ₹{c.outstanding.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Best Sellers */}
        <Card className="border-border rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-border py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Best Selling Items</CardTitle>
              <CardDescription>Top revenue contributors</CardDescription>
            </div>
            <Link href="/products" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
              Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-border">
            {reports.topProducts.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">No sales data yet</p>
              </div>
            ) : (
              reports.topProducts.map((p, i) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400 text-xs font-black">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.category} · {p.isService ? 'Service' : 'Product'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-foreground">{p.quantity} units</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">₹{p.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
