import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export async function GET(req, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'asc' }
        },
        shop: true
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Verify ownership and load items (for inventory refund if desired)
    const invoice = await db.invoice.findFirst({
      where: { id, shopId: user.shopId },
      include: { items: { include: { product: true } } }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Perform refund of inventory stock and delete invoice in transaction
    await db.$transaction(async (tx) => {
      // Refund items stock
      for (const item of invoice.items) {
        if (item.product.trackInventory && item.product.stockCount !== null) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockCount: item.product.stockCount + item.quantity
            }
          });
        }
      }

      // Delete invoice (cascades to payments and invoice items)
      await tx.invoice.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted and inventory refunded' });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
