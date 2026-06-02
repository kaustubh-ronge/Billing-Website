"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, Package, Tag, Layers, Settings, FileText, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const CATEGORIES = ['Grocery', 'Hardware', 'Electronics', 'Medical', 'Clothing', 'Services', 'Other'];

export default function ProductsPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('products');
  
  // Dialog/Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    taxRate: '18',
    trackInventory: false,
    stockCount: '10',
    lowStockAlert: '5',
    category: 'Grocery',
    unit: 'pcs',
    isService: false,
    description: '',
    imageBase64: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, activeTab]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let url = `/api/products?search=${encodeURIComponent(search)}`;
      if (categoryFilter !== 'ALL') {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      url += `&isService=${activeTab === 'services'}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      } else {
        toast.error('Failed to load products');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      taxRate: '18',
      trackInventory: activeTab === 'products', // Default inventory tracking for products
      stockCount: '10',
      lowStockAlert: '5',
      category: activeTab === 'services' ? 'Services' : 'Grocery',
      unit: activeTab === 'services' ? '' : 'pcs',
      isService: activeTab === 'services',
      description: '',
      imageBase64: ''
    });
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      taxRate: item.taxRate.toString(),
      trackInventory: item.trackInventory,
      stockCount: item.stockCount !== null ? item.stockCount.toString() : '',
      lowStockAlert: item.lowStockAlert !== null ? item.lowStockAlert.toString() : '',
      category: item.category || 'Other',
      unit: item.unit || '',
      isService: item.isService,
      description: item.description || '',
      imageBase64: item.imageBase64 || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    const payload = {
      ...formData,
      isService: activeTab === 'services',
      price: parseFloat(formData.price),
      taxRate: parseFloat(formData.taxRate),
      trackInventory: activeTab === 'services' ? false : formData.trackInventory,
      stockCount: (activeTab === 'services' || !formData.trackInventory) ? null : parseInt(formData.stockCount || '0'),
      lowStockAlert: (activeTab === 'services' || !formData.trackInventory) ? null : parseInt(formData.lowStockAlert || '0'),
      unit: activeTab === 'services' ? null : formData.unit
    };

    try {
      const url = editingItem ? `/api/products/${editingItem.id}` : '/api/products';
      const method = editingItem ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success(editingItem ? 'Updated catalog item' : 'Added to catalog');
        setIsDialogOpen(false);
        fetchProducts();
      } else {
        const errData = await res.json();
        toast.error(errData.error || 'Failed to save item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error saving item');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Deleted item successfully');
        fetchProducts();
      } else {
        toast.error('Failed to delete item');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting item');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-28 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Inventory & Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage physical products and service charges sold to customers.</p>
        </div>
        <Button onClick={openAddDialog} className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 flex items-center gap-2 self-start sm:self-center">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-gray-200 bg-white"
            />
          </form>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Layers className="h-4 w-4 text-gray-400" />
              Category:
            </div>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
              <SelectTrigger className="w-[180px] rounded-full bg-white border-gray-200">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchProducts} className="rounded-full bg-white border-gray-200">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Catalog Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCategoryFilter('ALL'); }} className="w-full">
          <TabsList className="grid grid-cols-2 max-w-sm rounded-full bg-gray-100 p-1 mb-4">
            <TabsTrigger value="products" className="rounded-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-full font-bold transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Tag className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          {/* Products List Content */}
          <TabsContent value="products">
            <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Product Name</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold text-right">Price</TableHead>
                    <TableHead className="font-bold text-center">Tax (GST)</TableHead>
                    <TableHead className="font-bold text-center">Unit</TableHead>
                    <TableHead className="font-bold text-center">Inventory Stock</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        No products found in the catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => {
                      const isLowStock = item.trackInventory && item.stockCount !== null && item.stockCount <= (item.lowStockAlert ?? 5);
                      return (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-semibold text-gray-900">
                            <div>
                              <span>{item.name}</span>
                              {item.description && (
                                <p className="text-xs text-gray-400 font-normal truncate max-w-xs">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                              {item.category || 'Grocery'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900">₹{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-gray-600 font-medium">{item.taxRate}%</TableCell>
                          <TableCell className="text-center text-gray-600 font-medium">{item.unit || 'pcs'}</TableCell>
                          <TableCell className="text-center">
                            {item.trackInventory ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {isLowStock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-100">
                                    <AlertTriangle className="h-3 w-3" />
                                    {item.stockCount} (Low)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100">
                                    <CheckCircle className="h-3 w-3" />
                                    {item.stockCount}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Untracked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Services List Content */}
          <TabsContent value="services">
            <Card className="border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow>
                    <TableHead className="font-bold">Service Name</TableHead>
                    <TableHead className="font-bold">Category</TableHead>
                    <TableHead className="font-bold text-right">Price</TableHead>
                    <TableHead className="font-bold text-center">Tax (GST)</TableHead>
                    <TableHead className="font-bold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                        Loading services...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-400">
                        <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        No service items found in the catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => (
                      <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-semibold text-gray-900">
                          <div>
                            <span>{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-gray-400 font-normal truncate max-w-xs">{item.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                            {item.category || 'Services'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">₹{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-gray-600 font-medium">{item.taxRate}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="rounded-2xl sm:max-w-[425px] overflow-hidden bg-white">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-gray-900">
                {editingItem ? 'Edit Catalog Item' : `Add New ${activeTab === 'services' ? 'Service' : 'Product'}`}
              </DialogTitle>
              <DialogDescription>
                Fill in the details for the {activeTab === 'services' ? 'service fee charge' : 'inventory product item'} below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder={activeTab === 'services' ? 'e.g. Consulting Fee, AC Repair' : 'e.g. Rice, Sugar, LED Bulbs'}
                  className="rounded-xl border-gray-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    placeholder="500.00"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                    placeholder="18"
                    className="rounded-xl border-gray-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                  >
                    <SelectTrigger className="rounded-xl border-gray-200">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {activeTab === 'products' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="unit">Unit Measure</Label>
                    <Input
                      id="unit"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g. kg, pcs, box"
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                )}
              </div>

              {activeTab === 'products' && (
                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackInventory: !!checked }))}
                    />
                    <label
                      htmlFor="trackInventory"
                      className="text-sm font-bold text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Track Inventory Levels
                    </label>
                  </div>

                  {formData.trackInventory && (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <div className="space-y-1.5">
                        <Label htmlFor="stockCount">Current Stock</Label>
                        <Input
                          id="stockCount"
                          type="number"
                          min="0"
                          value={formData.stockCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, stockCount: e.target.value }))}
                          className="rounded-xl border-gray-200"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lowStockAlert">Low Stock Alert</Label>
                        <Input
                          id="lowStockAlert"
                          type="number"
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={(e) => setFormData(prev => ({ ...prev, lowStockAlert: e.target.value }))}
                          className="rounded-xl border-gray-200"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-gray-100">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional brief description..."
                  className="rounded-xl border-gray-200 min-h-[60px]"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-full border-gray-200 px-6 font-bold">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6">
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
