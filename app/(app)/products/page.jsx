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
import { Plus, Search, Edit2, Trash2, Package, Tag, Layers, Settings, FileText, AlertTriangle, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { downloadCSV } from '@/lib/csv';
import { useCan } from '@/lib/permissions/PermissionContext';

const CATEGORIES = [
  // General
  'Grocery',
  'Hardware',
  'Electronics',
  'Medical / Pharma',
  'Clothing & Apparel',
  'Stationery',
  'Furniture',
  'Food & Beverages',
  // Agriculture & Farming
  'Seeds & Planting',
  'Fertilizers',
  'Pesticides & Insecticides',
  'Herbicides & Weedicides',
  'Fungicides',
  'Crop Protection',
  'Irrigation Equipment',
  'Farm Tools & Equipment',
  'Animal Feed & Fodder',
  'Veterinary Medicines',
  'Organic Products',
  'Soil Amendments',
  'Biofertilizer',
  // Services
  'Services',
  'Repair & Maintenance',
  'Transport & Delivery',
  'Consulting',
  // Other
  'Other',
];

const CATEGORY_COLORS = {
  'Seeds & Planting': 'bg-lime-50 text-lime-700',
  'Fertilizers': 'bg-emerald-50 text-emerald-700',
  'Biofertilizer': 'bg-green-50 text-green-700',
  'Pesticides & Insecticides': 'bg-orange-50 text-orange-700',
  'Herbicides & Weedicides': 'bg-yellow-50 text-yellow-700',
  'Fungicides': 'bg-amber-50 text-amber-700',
  'Crop Protection': 'bg-green-50 text-green-700',
  'Irrigation Equipment': 'bg-sky-50 text-sky-700',
  'Farm Tools & Equipment': 'bg-stone-50 text-stone-700',
  'Animal Feed & Fodder': 'bg-teal-50 text-teal-700',
  'Veterinary Medicines': 'bg-cyan-50 text-cyan-700',
  'Organic Products': 'bg-green-100 text-green-800',
  'Soil Amendments': 'bg-brown-50 text-yellow-800',
  'Grocery': 'bg-blue-50 text-blue-700',
  'Hardware': 'bg-gray-100 text-gray-700',
  'Electronics': 'bg-violet-50 text-violet-700',
  'Medical / Pharma': 'bg-rose-50 text-rose-700',
  'Clothing & Apparel': 'bg-pink-50 text-pink-700',
  'Stationery': 'bg-indigo-50 text-indigo-700',
  'Furniture': 'bg-orange-100 text-orange-800',
  'Food & Beverages': 'bg-red-50 text-red-700',
  'Services': 'bg-indigo-50 text-indigo-700',
  'Repair & Maintenance': 'bg-purple-50 text-purple-700',
  'Transport & Delivery': 'bg-blue-100 text-blue-800',
  'Consulting': 'bg-slate-50 text-slate-700',
  'Other': 'bg-gray-50 text-gray-600',
};

export default function ProductsPage() {
  const can = useCan();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('products');

  const getFilteredCategories = () => {
    const businessType = vendorShop?.businessType || 'General Store / All';
    
    const generalCategories = ['Grocery', 'Hardware', 'Electronics', 'Medical / Pharma', 'Clothing & Apparel', 'Stationery', 'Furniture', 'Food & Beverages'];
    const agroCategories = ['Seeds & Planting', 'Fertilizers', 'Biofertilizer', 'Pesticides & Insecticides', 'Herbicides & Weedicides', 'Fungicides', 'Crop Protection', 'Irrigation Equipment', 'Farm Tools & Equipment', 'Animal Feed & Fodder', 'Veterinary Medicines', 'Organic Products', 'Soil Amendments'];
    const serviceCategories = ['Services', 'Repair & Maintenance', 'Transport & Delivery', 'Consulting'];
    
    if (activeTab === 'services') {
      return {
        groups: [
          { name: 'Services', items: serviceCategories, color: 'text-indigo-500' }
        ]
      };
    }
    
    if (businessType === 'Agro Store') {
      return {
        groups: [
          { name: 'Agriculture & Farming', items: agroCategories, color: 'text-green-600' }
        ]
      };
    } else if (businessType === 'Clothing Store') {
      return {
        groups: [
          { name: 'Clothing', items: ['Clothing & Apparel'], color: 'text-pink-500' }
        ]
      };
    } else if (businessType === 'Hardware Store') {
      return {
        groups: [
          { name: 'Hardware', items: ['Hardware'], color: 'text-gray-500' }
        ]
      };
    } else if (businessType === 'Poultry Store') {
      return {
        groups: [
          { name: 'Poultry & Animals', items: ['Animal Feed & Fodder', 'Veterinary Medicines'], color: 'text-teal-600' }
        ]
      };
    }
    
    // Default / General Store / All
    return {
      groups: [
        { name: 'General', items: generalCategories, color: 'text-gray-400' },
        { name: 'Agriculture & Farming', items: agroCategories, color: 'text-green-600' },
        { name: 'Services', items: serviceCategories, color: 'text-indigo-500' }
      ]
    };
  };

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

  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [vendorShop, setVendorShop] = useState(null);

  useEffect(() => {
    fetchVendorConfig();
  }, []);

  const fetchVendorConfig = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setVendorShop(data.shop);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
      imageBase64: '',
      hsnSac: '',
      actualValue: ''
    });
    setCustomCategory('');
    setCustomUnit('');
    setEditingItem(null);
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingItem(item);

    const standardCategories = [
      'Grocery', 'Hardware', 'Electronics', 'Medical / Pharma', 'Clothing & Apparel', 'Stationery', 'Furniture', 'Food & Beverages',
      'Seeds & Planting', 'Fertilizers', 'Pesticides & Insecticides', 'Herbicides & Weedicides', 'Fungicides', 'Crop Protection',
      'Irrigation Equipment', 'Farm Tools & Equipment', 'Animal Feed & Fodder', 'Veterinary Medicines', 'Organic Products', 'Soil Amendments',
      'Biofertilizer', 'Services', 'Repair & Maintenance', 'Transport & Delivery', 'Consulting'
    ];
    const isStandardCategory = standardCategories.includes(item.category);
    const categoryVal = isStandardCategory ? (item.category || 'Other') : 'Other';
    setCustomCategory(isStandardCategory ? '' : (item.category || ''));

    const standardUnits = ['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'nos', 'bag', 'mtr', 'doz', 'pac'];
    const isStandardUnit = standardUnits.includes(item.unit);
    const unitVal = item.isService ? '' : (isStandardUnit ? (item.unit || 'pcs') : 'Other');
    setCustomUnit(isStandardUnit ? '' : (item.unit || ''));

    setFormData({
      name: item.name,
      price: item.price.toString(),
      taxRate: item.taxRate.toString(),
      trackInventory: item.trackInventory,
      stockCount: item.stockCount !== null ? item.stockCount.toString() : '',
      lowStockAlert: item.lowStockAlert !== null ? item.lowStockAlert.toString() : '',
      category: categoryVal,
      unit: unitVal,
      isService: item.isService,
      description: item.description || '',
      imageBase64: item.imageBase64 || '',
      hsnSac: item.hsnSac || '',
      actualValue: item.actualValue || ''
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
      category: formData.category === 'Other' ? customCategory : formData.category,
      unit: activeTab === 'services' ? null : (formData.unit === 'Other' ? customUnit : formData.unit)
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
    <div className="mx-auto max-w-6xl px-4 py-0 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Inventory & Catalog</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage physical products and service charges sold to customers.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const rows = products.map((p) => ({
                Name: p.name,
                Category: p.category ?? '',
                Unit: p.unit ?? '',
                Price: p.price.toFixed(2),
                'Tax Rate %': p.taxRate,
                'Cost Price': p.costPrice?.toFixed(2) ?? '',
                SKU: p.sku ?? '',
                Barcode: p.barcode ?? '',
                'Track Inventory': p.trackInventory ? 'Yes' : 'No',
                'Stock Count': p.stockCount ?? '',
                'Low Stock Alert': p.lowStockAlert ?? '',
                'Is Service': p.isService ? 'Yes' : 'No',
              }));
              downloadCSV(rows, 'products');
            }}
            className="rounded-full border-gray-200 font-bold text-sm flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {can('products:create') && (
          <Button onClick={openAddDialog} className="font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Filters Panel */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-muted/40 p-4 rounded-2xl border border-border">
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-border bg-background"
            />
          </form>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
              <Layers className="h-4 w-4 text-gray-400" />
              Category:
            </div>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
              <SelectTrigger className="w-50 rounded-full bg-background border-border">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="ALL">All Categories</SelectItem>
                {getFilteredCategories().groups.map(group => (
                  <React.Fragment key={group.name}>
                    <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${group.color || 'text-gray-400'} mt-1`}>— {group.name} —</div>
                    {group.items.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </React.Fragment>
                ))}
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">— Other —</div>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchProducts} className="rounded-full bg-background border-border">
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
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No products found.
                </div>
              ) : products.map((item) => {
                const isLowStock = item.trackInventory && item.stockCount !== null && item.stockCount <= (item.lowStockAlert ?? 5);
                return (
                  <div key={item.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 text-sm">
                          {item.name} {item.actualValue ? `(${item.actualValue}${item.unit || ''})` : ''}
                        </div>
                        {item.hsnSac && <p className="text-[10px] text-gray-500 font-medium">HSN/SAC: {item.hsnSac}</p>}
                        {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800'}`}>
                            {item.category || 'Grocery'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                            {item.unit || 'pcs'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-gray-900">{"\u20B9"}{item.price.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">GST {item.taxRate}%</div>
                        {item.trackInventory && (
                          <div className="mt-1">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-600">
                                <AlertTriangle className="h-3 w-3" /> {item.stockCount} Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-600">
                                <CheckCircle className="h-3 w-3" /> {item.stockCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                      {can('products:edit') && (
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {can('products:delete') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <Card className="hidden md:block border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
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
                              <span>{item.name} {item.actualValue ? `(${item.actualValue}${item.unit || ''})` : ''}</span>
                              {item.hsnSac && <p className="text-[10px] text-gray-500 font-medium mt-0.5">HSN/SAC: {item.hsnSac}</p>}
                              {item.description && (
                                <p className="text-xs text-gray-400 font-normal truncate max-w-xs mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-800'}`}>
                              {item.category || 'Grocery'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900">{"\u20B9"}{item.price.toFixed(2)}</TableCell>
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
                              {can('products:edit') && (
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              )}
                              {can('products:delete') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              )}
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
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-10 text-gray-500">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                  Loading services...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Tag className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  No service items found.
                </div>
              ) : products.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-150 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-sm">{item.name}</div>
                      {item.description && <p className="text-xs text-gray-400 truncate mt-0.5">{item.description}</p>}
                      <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-indigo-50 text-indigo-700'}`}>
                        {item.category || 'Services'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-gray-900">{"\u20B9"}{item.price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">GST {item.taxRate}%</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                    {can('products:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {can('products:delete') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden md:block border border-gray-150 shadow-sm rounded-2xl bg-white overflow-hidden">
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
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-indigo-50 text-indigo-700'}`}>
                            {item.category || 'Services'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">{"\u20B9"}{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-gray-600 font-medium">{item.taxRate}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {can('products:edit') && (
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            )}
                            {can('products:delete') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-gray-600 hover:text-rose-600 hover:bg-rose-50 rounded-full">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            )}
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
        <DialogContent className="rounded-2xl sm:max-w-106.25 overflow-hidden bg-white">
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
                  <Label htmlFor="price">Price ({"\u20B9"})</Label>
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
                    <SelectTrigger className="rounded-xl border-gray-200 bg-background">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {getFilteredCategories().groups.map(group => (
                        <React.Fragment key={group.name}>
                          <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${group.color || 'text-gray-400'} mt-1`}>— {group.name} —</div>
                          {group.items.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                      <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-gray-400 mt-1">— Other —</div>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeTab === 'products' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="unit">Unit Measure</Label>
                    <Select
                      value={formData.unit}
                      onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                    >
                      <SelectTrigger className="rounded-xl border-gray-200 bg-background">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'nos', 'bag', 'mtr', 'doz', 'pac', 'Other'].map(u => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* HSN/SAC and Actual Value Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hsnSac">HSN / SAC (Optional)</Label>
                  <Input
                    id="hsnSac"
                    value={formData.hsnSac || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hsnSac: e.target.value }))}
                    placeholder="e.g. 3101, 3808"
                    className="rounded-xl border-gray-200"
                  />
                </div>
                {activeTab === 'products' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="actualValue">Actual Value (Optional)</Label>
                    <Input
                      id="actualValue"
                      value={formData.actualValue || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualValue: e.target.value }))}
                      placeholder={formData.unit && formData.unit !== 'Other' ? `e.g. 250 (displays as 250${formData.unit})` : 'e.g. 250'}
                      className="rounded-xl border-gray-200"
                    />
                  </div>
                )}
              </div>

              {/* Custom Category and Custom Unit text boxes */}
              {(formData.category === 'Other' || (activeTab === 'products' && formData.unit === 'Other')) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.category === 'Other' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="customCategory">Custom Category Name</Label>
                      <Input
                        id="customCategory"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category"
                        className="rounded-xl border-gray-200"
                        required
                      />
                    </div>
                  ) : <div />}

                  {activeTab === 'products' && formData.unit === 'Other' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="customUnit">Custom Unit Name</Label>
                      <Input
                        id="customUnit"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="Enter custom unit (e.g. roll)"
                        className="rounded-xl border-gray-200"
                        required
                      />
                    </div>
                  ) : <div />}
                </div>
              )}

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
                  className="rounded-xl border-gray-200 min-h-15"
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

