"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { toast } from 'sonner';
import { 
  TrendingUp, Users, DollarSign, AlertTriangle, FileText, 
  ArrowRight, ShieldAlert, BadgeCheck, Lightbulb, RefreshCw, ShoppingCart
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
      const res = await fetch('/api/reports');
      if (res.ok) {
        const reportData = await res.json();
        setData(reportData);
      } else {
        toast.error('Failed to load dashboard metrics');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const metrics = data?.metrics || {
    todaySales: 0,
    monthlySales: 0,
    totalCustomers: 0,
    pendingPayments: 0,
    paidInvoicesCount: 0,
    unpaidInvoicesCount: 0
  };

  const charts = data?.charts || { daily: [], monthly: [] };
  const reports = data?.reports || { topPendingCustomers: [], topProducts: [], lowStockAlerts: [] };
  const insights = data?.insights || { expectedMonthlyRevenue: 0, bestCategory: 'N/A', collectionRatio: 100 };

  return (
    <div className="mx-auto max-w-7xl px-4 py-28 sm:px-6 lg:px-8">
      {/* Dashboard Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time business performance, collection statuses, and sales analytics.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new" className="font-bold bg-black text-white hover:bg-gray-900 rounded-full px-5 py-2 text-sm flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> New Bill
          </Link>
          <Button variant="outline" onClick={fetchDashboardData} className="rounded-full border-gray-200 font-bold text-sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Today's Sales */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Sales</p>
                <h3 className="text-2xl font-black text-gray-900 mt-2">₹{metrics.todaySales.toFixed(2)}</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-semibold">Updated in real-time</p>
          </CardContent>
        </Card>

        {/* Monthly Sales */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Sales</p>
                <h3 className="text-2xl font-black text-gray-900 mt-2">₹{metrics.monthlySales.toFixed(2)}</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-semibold">For the current calendar month</p>
          </CardContent>
        </Card>

        {/* Outstanding Receivables */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outstanding Due</p>
                <h3 className="text-2xl font-black text-rose-600 mt-2">₹{metrics.pendingPayments.toFixed(2)}</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-rose-500 mt-4 font-semibold">Uncollected customer invoices</p>
          </CardContent>
        </Card>

        {/* Total Customers */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden hover:shadow-md transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Clients</p>
                <h3 className="text-2xl font-black text-gray-900 mt-2">{metrics.totalCustomers}</h3>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-semibold">Registered active vendor customers</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Notifications Row */}
      {(insights.expectedMonthlyRevenue > 0 || reports.lowStockAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          {/* AI Insights */}
          <div className="md:col-span-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-sm border border-indigo-600 flex flex-col justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
                <Lightbulb className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-base font-bold">AI Billing Insights</h4>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Based on your transaction velocity, your projected revenue for next month is estimated at **₹{insights.expectedMonthlyRevenue.toFixed(2)}**. Your collection efficiency ratio is at **{insights.collectionRatio}%**, showing solid cash collection patterns.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-4 text-xs font-bold text-white/90">
              {insights.bestCategory && <div>Best Category: <span className="underline">{insights.bestCategory}</span></div>}
              <div>Invoice Ratio: {metrics.paidInvoicesCount} Paid / {metrics.unpaidInvoicesCount} Pending</div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="md:col-span-4">
            <Card className="border border-rose-100 shadow-sm rounded-2xl bg-rose-50/20 overflow-hidden h-full">
              <CardHeader className="bg-rose-50/50 border-b border-rose-100 py-3.5 flex flex-row items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-rose-600" />
                <CardTitle className="text-sm font-bold text-rose-900">Low Stock Warnings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs overflow-y-auto max-h-[140px]">
                {reports.lowStockAlerts.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 font-medium">All item inventory healthy.</div>
                ) : (
                  reports.lowStockAlerts.map(p => (
                    <div key={p.id} className="flex justify-between items-center bg-white p-2 rounded-lg border border-rose-100">
                      <span className="font-semibold text-gray-800 truncate pr-2">{p.name}</span>
                      <span className="font-black text-rose-600 shrink-0 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Stock: {p.stockCount}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Recharts Graphical Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Daily Sales Chart */}
        <div className="lg:col-span-8">
          <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 py-5">
              <CardTitle className="text-base font-bold text-gray-900">30-Day Sales Performance</CardTitle>
              <CardDescription>Daily revenue trends and collection frequency</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Area type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Sales Performance Chart */}
        <div className="lg:col-span-4">
          <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b border-gray-100 py-5">
              <CardTitle className="text-base font-bold text-gray-900">Monthly Sales Trends</CardTitle>
              <CardDescription>Aggregate monthly bill sums</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.monthly} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                    <Tooltip formatter={(value) => [`₹${value.toFixed(2)}`, 'Sales']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="sales" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Top Pending Customers & Best Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Outstanding Receivables list */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Top Outstanding Accounts</CardTitle>
              <CardDescription>Customers with unpaid balances</CardDescription>
            </div>
            <Link href="/customers" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Follow up <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-150">
            {reports.topPendingCustomers.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-medium">No outstanding customer balances. All clear!</div>
            ) : (
              reports.topPendingCustomers.map((c) => (
                <div key={c.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 text-xs font-black">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{c.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{c.phone} | {c.invoiceCount} bills</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                      ₹{c.outstanding.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Best Selling Products catalog */}
        <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-gray-100 py-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-gray-900">Best Selling Products</CardTitle>
              <CardDescription>Top sales volume contributors</CardDescription>
            </div>
            <Link href="/products" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
              Catalog <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="divide-y divide-gray-150">
            {reports.topProducts.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-400 font-medium">No products sold yet. Create an invoice to begin tracking volume.</div>
            ) : (
              reports.topProducts.map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 text-xs font-black">
                      <ShoppingCart className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">{p.name}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Category: {p.category} | {p.isService ? 'Service' : 'Product'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900">{p.quantity} units sold</div>
                    <div className="text-xs text-green-600 font-semibold mt-0.5">₹{p.revenue.toFixed(2)} rev</div>
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
