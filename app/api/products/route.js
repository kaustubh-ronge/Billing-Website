export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const ctx = await requirePermission('products:view');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const isService = searchParams.get('isService');

    let whereClause = {
      shopId: user.shopId,
      name: { contains: search, mode: 'insensitive' }
    };

    if (category) {
      whereClause.category = category;
    }

    if (isService !== undefined && isService !== null && isService !== '') {
      whereClause.isService = isService === 'true';
    }

    const products = await db.product.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ctx = await requirePermission('products:create');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const body = await req.json();
    const { 
      name, price, taxRate, trackInventory, stockCount, lowStockAlert, 
      category, unit, isService, description, imageBase64, hsnSac, actualValue,
      expiryDate, companyName, batchNumber, minOrderQty, bulkPrice 
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    const product = await db.product.create({
      data: {
        name,
        price: parseFloat(price),
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        trackInventory: isService ? false : (trackInventory || false),
        stockCount: isService ? null : (stockCount !== undefined ? parseInt(stockCount) : null),
        lowStockAlert: isService ? null : (lowStockAlert !== undefined ? parseInt(lowStockAlert) : null),
        category: category || null,
        unit: isService ? null : (unit || 'pcs'),
        isService: isService || false,
        description: description || null,
        imageBase64: imageBase64 || null,
        hsnSac: hsnSac || null,
        actualValue: actualValue || null,
        expiryDate: expiryDate || null,
        companyName: companyName || null,
        batchNumber: batchNumber || null,
        minOrderQty: minOrderQty !== undefined && minOrderQty !== null && minOrderQty !== '' ? parseInt(minOrderQty) : null,
        bulkPrice: bulkPrice !== undefined && bulkPrice !== null && bulkPrice !== '' ? parseFloat(bulkPrice) : null,
        shopId: user.shopId
      }
    });

    await logActivity({
      shopId: user.shopId, userId: user.id,
      action: 'product.create', entityType: 'Product', entityId: product.id,
      description: `Added ${product.isService ? 'service' : 'product'} ${product.name}`,
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

