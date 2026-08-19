"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Plus, Calendar, CreditCard, Shield, RefreshCw } from 'lucide-react';

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [price, setPrice] = useState('');
  const [editingPriceId, setEditingPriceId] = useState(null);
  const [editPriceValue, setEditPriceValue] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/plans');
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      } else {
        toast.error('Failed to load subscription plans');
      }
    } catch (err) {
      toast.error('Error fetching plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    if (!name || !durationDays) {
      toast.error('Please enter name and duration');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, durationDays, price: price || 0 }),
      });
      if (res.ok) {
        toast.success('Subscription plan created successfully');
        setName('');
        setDurationDays('');
        setPrice('');
        fetchPlans();
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create plan');
      }
    } catch {
      toast.error('Failed to create subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const togglePlanActive = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });
      if (res.ok) {
        toast.success(`Plan ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchPlans();
      } else {
        toast.error('Failed to update plan status');
      }
    } catch {
      toast.error('Error toggling plan status');
    }
  };

  const handleSavePrice = async (id) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price: parseFloat(editPriceValue || "0") }),
      });
      if (res.ok) {
        toast.success('Subscription plan price updated successfully');
        setEditingPriceId(null);
        fetchPlans();
      } else {
        toast.error('Failed to update plan price');
      }
    } catch {
      toast.error('Error updating plan price');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Subscription Plans</h1>
        <p className="text-sm text-muted-foreground mt-1 font-sans">
          Create and manage membership packages available to platform businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Plan Form */}
        <div className="lg:col-span-1">
          <Card className="border border-border rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-md font-bold">New Plan</CardTitle>
              <CardDescription>Define a new membership duration and price tier.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreatePlan} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="planName">Plan Name</Label>
                  <Input
                    id="planName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. 1 Year Premium"
                    required
                    className="rounded-xl border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="planDuration">Duration (Days)</Label>
                  <Input
                    id="planDuration"
                    type="number"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="e.g. 365"
                    min="1"
                    required
                    className="rounded-xl border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="planPrice">Price (INR)</Label>
                  <Input
                    id="planPrice"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 9999"
                    min="0"
                    className="rounded-xl border-border"
                  />
                </div>
                <Button type="submit" disabled={saving} className="w-full rounded-full font-bold gap-2 bg-primary text-primary-foreground">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Plan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Plans List */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-border rounded-2xl shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold">Active Plans</CardTitle>
                <CardDescription>Available membership packages on the platform.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchPlans} className="rounded-xl gap-1">
                <RefreshCw className="h-3 w-3" /> Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : plans.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground font-sans">
                  <CreditCard className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm font-semibold">No subscription plans created yet</p>
                  <p className="text-xs mt-1">Use the panel on the left to add a plan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((p) => (
                    <div key={p.id} className="border border-border p-4 rounded-xl flex flex-col justify-between space-y-4 bg-muted/10 hover:bg-muted/20 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-foreground">{p.name}</span>
                          <div className="flex items-center gap-1.5">
                            {p.price === 0 && <Badge variant="secondary">Trial / Free</Badge>}
                            {p.isActive ? (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Active</Badge>
                            ) : (
                              <Badge variant="destructive">Inactive</Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {p.durationDays} Days Duration
                        </p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        {editingPriceId === p.id ? (
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <span className="text-xs text-muted-foreground font-bold">₹</span>
                            <Input 
                              type="number" 
                              value={editPriceValue} 
                              onChange={(e) => setEditPriceValue(e.target.value)} 
                              className="h-7 w-20 text-xs px-2 rounded-lg border-border font-bold text-foreground bg-background"
                              min="0"
                            />
                            <Button 
                              size="xs" 
                              onClick={() => handleSavePrice(p.id)} 
                              className="rounded-lg h-7 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Save
                            </Button>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              onClick={() => setEditingPriceId(null)} 
                              className="rounded-lg h-7 px-2 text-[10px]"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="flex items-baseline gap-1">
                              <span className="text-lg font-black text-foreground">₹{p.price}</span>
                              <span className="text-[10px] text-muted-foreground font-semibold">one-time</span>
                            </div>
                            <button
                              onClick={() => {
                                setEditingPriceId(p.id);
                                setEditPriceValue(p.price.toString());
                              }}
                              className="text-blue-600 hover:text-blue-700 text-[10px] font-bold hover:underline"
                            >
                              Edit Price
                            </button>
                          </div>
                        )}
                        <Button 
                          size="xs" 
                          variant={p.isActive ? "destructive" : "default"} 
                          onClick={() => togglePlanActive(p.id, p.isActive)}
                          className="rounded-xl text-[10px] font-bold h-7 px-2.5 shrink-0"
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
