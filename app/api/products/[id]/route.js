export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';

export async function PUT(req, { params }) {
  const ctx = await requirePermission('products:edit');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { id } = await params;
    const body = await req.json();
    const { 
      name, price, taxRate, trackInventory, stockCount, lowStockAlert, 
      category, unit, isService, description, imageBase64, hsnSac, actualValue,
      expiryDate, companyName, batchNumber, minOrderQty, bulkPrice 
    } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: 'Product name and price are required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.product.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await db.product.update({
      where: { id },
      data: {
        name,
        price: parseFloat(price),
        taxRate: taxRate !== undefined ? parseFloat(taxRate) : 0,
        trackInventory: isService ? false : (trackInventory || false),
        stockCount: isService ? null : (stockCount !== undefined ? (stockCount === null ? null : parseInt(stockCount)) : existing.stockCount),
        lowStockAlert: isService ? null : (lowStockAlert !== undefined ? (lowStockAlert === null ? null : parseInt(lowStockAlert)) : existing.lowStockAlert),
        category: category !== undefined ? category : existing.category,
        unit: isService ? null : (unit !== undefined ? unit : existing.unit),
        isService: isService !== undefined ? isService : existing.isService,
        description: description !== undefined ? description : existing.description,
        imageBase64: imageBase64 !== undefined ? imageBase64 : existing.imageBase64,
        hsnSac: hsnSac !== undefined ? hsnSac : existing.hsnSac,
        actualValue: actualValue !== undefined ? actualValue : existing.actualValue,
        expiryDate: expiryDate !== undefined ? expiryDate : existing.expiryDate,
        companyName: companyName !== undefined ? companyName : existing.companyName,
        batchNumber: batchNumber !== undefined ? batchNumber : existing.batchNumber,
        minOrderQty: minOrderQty !== undefined ? (minOrderQty === null || minOrderQty === '' ? null : parseInt(minOrderQty)) : existing.minOrderQty,
        bulkPrice: bulkPrice !== undefined ? (bulkPrice === null || bulkPrice === '' ? null : parseFloat(bulkPrice)) : existing.bulkPrice,
      }
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('products:delete');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await db.product.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete item
    await db.product.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
