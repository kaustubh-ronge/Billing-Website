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
  'Seeds & Planting': 'bg-lime-50 text-lime-700 dark:bg-lime-950/60 dark:text-lime-300 border border-lime-200 dark:border-lime-800',
  'Fertilizers': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
  'Biofertilizer': 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800',
  'Pesticides & Insecticides': 'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  'Herbicides & Weedicides': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
  'Fungicides': 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
  'Crop Protection': 'bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800',
  'Irrigation Equipment': 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
  'Farm Tools & Equipment': 'bg-stone-50 text-stone-700 dark:bg-stone-900/60 dark:text-stone-300 border border-stone-200 dark:border-stone-800',
  'Animal Feed & Fodder': 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
  'Veterinary Medicines': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
  'Organic Products': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700',
  'Soil Amendments': 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-200 border border-amber-300 dark:border-amber-700',
  'Grocery': 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
  'Hardware': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
  'Electronics': 'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800',
  'Medical / Pharma': 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
  'Clothing & Apparel': 'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
  'Stationery': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  'Furniture': 'bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-200 border border-orange-300 dark:border-orange-700',
  'Food & Beverages': 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800',
  'Services': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800',
  'Repair & Maintenance': 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
  'Transport & Delivery': 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-200 border border-blue-300 dark:border-blue-700',
  'Consulting': 'bg-slate-50 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border border-slate-200 dark:border-slate-800',
  'Other': 'bg-muted text-muted-foreground border border-border',
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
    imageBase64: '',
    hsnSac: '',
    actualValue: '',
    expiryDate: '',
    companyName: '',
    batchNumber: '',
    minOrderQty: '',
    bulkPrice: ''
  });

  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [vendorShop, setVendorShop] = useState(null);

  const isAgro = vendorShop?.businessType === 'Agro Store' || vendorShop?.businessType?.toLowerCase().includes('agro') || vendorShop?.businessType?.toLowerCase().includes('krishi');
  const isMedical = vendorShop?.businessType === 'Pharmacy / Medical' || vendorShop?.businessType?.toLowerCase().includes('medical') || vendorShop?.businessType?.toLowerCase().includes('pharmacy');
  const isWholesale = vendorShop?.businessType?.toLowerCase().includes('wholesale') || vendorShop?.businessType?.toLowerCase().includes('distributor');

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
      actualValue: '',
      expiryDate: '',
      companyName: '',
      batchNumber: '',
      minOrderQty: '',
      bulkPrice: ''
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
      stockCount: item.stockCount != null ? item.stockCount.toString() : '',
      lowStockAlert: item.lowStockAlert != null ? item.lowStockAlert.toString() : '',
      category: categoryVal,
      unit: unitVal,
      isService: item.isService,
      description: item.description || '',
      imageBase64: item.imageBase64 || '',
      hsnSac: item.hsnSac || '',
      actualValue: item.actualValue || '',
      expiryDate: item.expiryDate || '',
      companyName: item.companyName || '',
      batchNumber: item.batchNumber || '',
      minOrderQty: item.minOrderQty != null ? item.minOrderQty.toString() : '',
      bulkPrice: item.bulkPrice != null ? item.bulkPrice.toString() : ''
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
      unit: activeTab === 'services' ? null : (formData.unit === 'Other' ? customUnit : formData.unit),
      expiryDate: formData.expiryDate || null,
      companyName: formData.companyName || null,
      batchNumber: formData.batchNumber || null,
      minOrderQty: formData.minOrderQty ? parseInt(formData.minOrderQty) : null,
      bulkPrice: formData.bulkPrice ? parseFloat(formData.bulkPrice) : null,
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
            className="rounded-lg border-border font-bold text-sm flex items-center gap-1.5 bg-background text-foreground hover:bg-muted"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {can('products:create') && (
          <Button onClick={openAddDialog} className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 flex items-center gap-2 shadow-sm">
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
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full border-border bg-background text-foreground"
            />
          </form>
          <div className="flex gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <Layers className="h-4 w-4 text-muted-foreground" />
              Category:
            </div>
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val)}>
              <SelectTrigger className="w-50 rounded-full bg-background border-border text-foreground">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="ALL">All Categories</SelectItem>
                {getFilteredCategories().groups.map(group => (
                  <React.Fragment key={group.name}>
                    <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${group.color || 'text-muted-foreground'} mt-1`}>— {group.name} —</div>
                    {group.items.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </React.Fragment>
                ))}
                <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground mt-1">— Other —</div>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchProducts} className="rounded-full bg-background border-border text-foreground">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Catalog Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setCategoryFilter('ALL'); }} className="w-full">
          <TabsList className="grid grid-cols-2 max-w-sm rounded-full bg-muted p-1 mb-4 border border-border">
            <TabsTrigger value="products" className="rounded-full font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
              <Package className="h-4 w-4 mr-2" />
              Products
            </TabsTrigger>
            <TabsTrigger value="services" className="rounded-full font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground">
              <Tag className="h-4 w-4 mr-2" />
              Services
            </TabsTrigger>
          </TabsList>

          {/* Products List Content */}
          <TabsContent value="products">
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {loading ? (
                <div className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No products found.
                </div>
              ) : products.map((item) => {
                const isLowStock = item.trackInventory && item.stockCount !== null && item.stockCount <= (item.lowStockAlert ?? 5);
                return (
                  <div key={item.id} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-foreground text-sm">
                          {item.name} {item.actualValue ? `(${item.actualValue}${item.unit || ''})` : ''}
                        </div>
                        {item.hsnSac && <p className="text-[10px] text-muted-foreground font-medium">HSN/SAC: {item.hsnSac}</p>}
                        {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-muted text-muted-foreground'}`}>
                            {item.category || 'Grocery'}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {item.unit || 'pcs'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-foreground">{"\u20B9"}{item.price.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">GST {item.taxRate}%</div>
                        {item.trackInventory && (
                          <div className="mt-1">
                            {isLowStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                <AlertTriangle className="h-3 w-3" /> {item.stockCount} Low
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                <CheckCircle className="h-3 w-3" /> {item.stockCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                      {can('products:edit') && (
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {can('products:delete') && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Desktop table */}
            <Card className="hidden md:block border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-muted-foreground">Product Name</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Category</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-right">Price</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-center">Tax (GST)</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-center">Unit</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-center">Inventory Stock</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading products...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No products found in the catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => {
                      const isLowStock = item.trackInventory && item.stockCount !== null && item.stockCount <= (item.lowStockAlert ?? 5);
                      return (
                        <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                          <TableCell className="font-semibold text-foreground">
                            <div>
                              <span>{item.name} {item.actualValue ? `(${item.actualValue}${item.unit || ''})` : ''}</span>
                              {item.hsnSac && <p className="text-[10px] text-muted-foreground font-medium mt-0.5">HSN/SAC: {item.hsnSac}</p>}
                              {item.description && (
                                <p className="text-xs text-muted-foreground font-normal truncate max-w-xs mt-0.5">{item.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-muted text-muted-foreground'}`}>
                              {item.category || 'Grocery'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-foreground">{"\u20B9"}{item.price.toFixed(2)}</TableCell>
                          <TableCell className="text-center text-muted-foreground font-medium">{item.taxRate}%</TableCell>
                          <TableCell className="text-center text-muted-foreground font-medium">{item.unit || 'pcs'}</TableCell>
                          <TableCell className="text-center">
                            {item.trackInventory ? (
                              <div className="flex items-center justify-center gap-1.5">
                                {isLowStock ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
                                    <AlertTriangle className="h-3 w-3" />
                                    {item.stockCount} (Low)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                    <CheckCircle className="h-3 w-3" />
                                    {item.stockCount}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">Untracked</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {can('products:edit') && (
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              )}
                              {can('products:delete') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
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
                <div className="text-center py-10 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  Loading services...
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No service items found.
                </div>
              ) : products.map((item) => (
                <div key={item.id} className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-foreground text-sm">{item.name}</div>
                      {item.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{item.description}</p>}
                      <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'}`}>
                        {item.category || 'Services'}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-bold text-foreground">{"\u20B9"}{item.price.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">GST {item.taxRate}%</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-border">
                    {can('products:edit') && (
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    {can('products:delete') && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden md:block border border-border shadow-sm rounded-2xl bg-card text-card-foreground overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-muted-foreground">Service Name</TableHead>
                    <TableHead className="font-bold text-muted-foreground">Category</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-right">Price</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-center">Tax (GST)</TableHead>
                    <TableHead className="font-bold text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                        Loading services...
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No service items found in the catalog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-semibold text-foreground">
                          <div>
                            <span>{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground font-normal truncate max-w-xs">{item.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${CATEGORY_COLORS[item.category] || 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'}`}>
                            {item.category || 'Services'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">{"\u20B9"}{item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-center text-muted-foreground font-medium">{item.taxRate}%</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {can('products:edit') && (
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(item)} className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            )}
                            {can('products:delete') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="h-8 w-8 text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-full">
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
        <DialogContent className="rounded-2xl sm:max-w-106.25 overflow-hidden bg-card text-card-foreground border border-border">
          <form onSubmit={handleSave}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl font-bold text-foreground">
                {editingItem ? 'Edit Catalog Item' : `Add New ${activeTab === 'services' ? 'Service' : 'Product'}`}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Fill in the details for the {activeTab === 'services' ? 'service fee charge' : 'inventory product item'} below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 overflow-y-auto max-h-[65vh] pr-2">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder={activeTab === 'services' ? 'e.g. Consulting Fee, AC Repair' : 'e.g. Rice, Sugar, LED Bulbs'}
                  className="rounded-xl border-border bg-background text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="price" className="text-foreground">Price ({"\u20B9"})</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                    placeholder="500.00"
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taxRate" className="text-foreground">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.taxRate}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                    placeholder="18"
                    className="rounded-xl border-border bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Dynamic Form Sections based on Business Type */}
              {isAgro && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-foreground">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {getFilteredCategories().groups.map(group => (
                            <React.Fragment key={group.name}>
                              <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${group.color || 'text-muted-foreground'} mt-1`}>— {group.name} —</div>
                              {group.items.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </React.Fragment>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="unit" className="text-foreground">Unit Measure</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {['pcs', 'kg', 'g', 'ltr', 'ml', 'box', 'nos', 'bag', 'mtr', 'doz', 'pac', 'Other'].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="actualValue" className="text-foreground">Actual Value</Label>
                      <Input
                        id="actualValue"
                        value={formData.actualValue || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, actualValue: e.target.value }))}
                        placeholder={formData.unit && formData.unit !== 'Other' ? `e.g. 250${formData.unit} or 500${formData.unit}` : 'e.g. 250'}
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="hsnSac" className="text-foreground">HSN / SAC</Label>
                      <Input
                        id="hsnSac"
                        value={formData.hsnSac || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hsnSac: e.target.value }))}
                        placeholder="e.g. 3101"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expiryDate" className="text-foreground">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-foreground">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="e.g. Bayer, Syngenta"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              {isMedical && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-foreground">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          <SelectItem value="Tablets">Tablets</SelectItem>
                          <SelectItem value="Syrups">Syrups</SelectItem>
                          <SelectItem value="Capsules">Capsules</SelectItem>
                          <SelectItem value="Injections">Injections</SelectItem>
                          <SelectItem value="Ointments">Ointments</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="unit" className="text-foreground">Unit Measure</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {['strips', 'tab', 'bottle', 'box', 'nos', 'Other'].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hsnSac" className="text-foreground">HSN / SAC</Label>
                      <Input
                        id="hsnSac"
                        value={formData.hsnSac || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hsnSac: e.target.value }))}
                        placeholder="e.g. 3004"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batchNumber" className="text-foreground">Batch Number</Label>
                      <Input
                        id="batchNumber"
                        value={formData.batchNumber || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                        placeholder="e.g. BATCH-991A"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="expiryDate" className="text-foreground">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        type="date"
                        value={formData.expiryDate || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="companyName" className="text-foreground">Manufacturer / Company</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="e.g. Cipla, Sun Pharma"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              {isWholesale && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-foreground">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          <SelectItem value="Bulk Goods">Bulk Goods</SelectItem>
                          <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                          <SelectItem value="Finished Goods">Finished Goods</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="unit" className="text-foreground">Unit Measure</Label>
                      <Select
                        value={formData.unit}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {['box', 'bag', 'kg', 'ltr', 'mtr', 'nos', 'Other'].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hsnSac" className="text-foreground">HSN / SAC</Label>
                      <Input
                        id="hsnSac"
                        value={formData.hsnSac || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hsnSac: e.target.value }))}
                        placeholder="e.g. 8471"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="minOrderQty" className="text-foreground">Min Order Qty</Label>
                      <Input
                        id="minOrderQty"
                        type="number"
                        min="1"
                        value={formData.minOrderQty || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, minOrderQty: e.target.value }))}
                        placeholder="e.g. 50"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="bulkPrice" className="text-foreground">Bulk Price (per unit)</Label>
                      <Input
                        id="bulkPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.bulkPrice || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, bulkPrice: e.target.value }))}
                        placeholder="e.g. 120.00"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Default / Retail Form fields */}
              {!isAgro && !isMedical && !isWholesale && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="category" className="text-foreground">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                      >
                        <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {getFilteredCategories().groups.map(group => (
                            <React.Fragment key={group.name}>
                              <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${group.color || 'text-muted-foreground'} mt-1`}>— {group.name} —</div>
                              {group.items.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                              ))}
                            </React.Fragment>
                          ))}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {activeTab === 'products' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="unit" className="text-foreground">Unit Measure</Label>
                        <Select
                          value={formData.unit}
                          onValueChange={(val) => setFormData(prev => ({ ...prev, unit: val }))}
                        >
                          <SelectTrigger className="rounded-xl border-border bg-background text-foreground">
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="hsnSac" className="text-foreground">HSN / SAC (Optional)</Label>
                      <Input
                        id="hsnSac"
                        value={formData.hsnSac || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, hsnSac: e.target.value }))}
                        placeholder="e.g. 3101"
                        className="rounded-xl border-border bg-background text-foreground"
                      />
                    </div>
                    {activeTab === 'products' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="actualValue" className="text-foreground">Actual Value (Optional)</Label>
                        <Input
                          id="actualValue"
                          value={formData.actualValue || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, actualValue: e.target.value }))}
                          placeholder="e.g. 250"
                          className="rounded-xl border-border bg-background text-foreground"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Custom Category and Custom Unit text boxes */}
              {(formData.category === 'Other' || (activeTab === 'products' && formData.unit === 'Other')) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.category === 'Other' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="customCategory" className="text-foreground">Custom Category Name</Label>
                      <Input
                        id="customCategory"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter custom category"
                        className="rounded-xl border-border bg-background text-foreground"
                        required
                      />
                    </div>
                  ) : <div />}

                  {activeTab === 'products' && formData.unit === 'Other' ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="customUnit" className="text-foreground">Custom Unit Name</Label>
                      <Input
                        id="customUnit"
                        value={customUnit}
                        onChange={(e) => setCustomUnit(e.target.value)}
                        placeholder="Enter custom unit (e.g. roll)"
                        className="rounded-xl border-border bg-background text-foreground"
                        required
                      />
                    </div>
                  ) : <div />}
                </div>
              )}

              {activeTab === 'products' && (
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trackInventory"
                      checked={formData.trackInventory}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackInventory: !!checked }))}
                    />
                    <label
                      htmlFor="trackInventory"
                      className="text-sm font-bold text-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Track Inventory Levels
                    </label>
                  </div>

                  {formData.trackInventory && (
                    <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                      <div className="space-y-1.5">
                        <Label htmlFor="stockCount" className="text-foreground">Current Stock</Label>
                        <Input
                          id="stockCount"
                          type="number"
                          min="0"
                          value={formData.stockCount}
                          onChange={(e) => setFormData(prev => ({ ...prev, stockCount: e.target.value }))}
                          className="rounded-xl border-border bg-background text-foreground"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="lowStockAlert" className="text-foreground">Low Stock Alert</Label>
                        <Input
                          id="lowStockAlert"
                          type="number"
                          min="0"
                          value={formData.lowStockAlert}
                          onChange={(e) => setFormData(prev => ({ ...prev, lowStockAlert: e.target.value }))}
                          className="rounded-xl border-border bg-background text-foreground"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1.5 pt-2 border-t border-border">
                <Label htmlFor="description" className="text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional brief description..."
                  className="rounded-xl border-border bg-background text-foreground min-h-15"
                />
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-lg border-border px-6 font-bold text-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button type="submit" className="font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 shadow-sm">
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

