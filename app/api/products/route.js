import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export async function GET(req) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, price, taxRate, trackInventory, stockCount, lowStockAlert, category, unit, isService, description, imageBase64 } = body;

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
        shopId: user.shopId
      }
    });

    return NextResponse.json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
