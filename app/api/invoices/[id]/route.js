export const dynamic = 'force-dynamic';
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

    // Perform refund of inventory stock, credit correction, and delete in a single transaction
    await db.$transaction(async (tx) => {
      // 1. Atomically return stock — avoid stale-read overwrite with raw INCREMENT
      for (const item of invoice.items) {
        if (item.product.trackInventory && item.product.stockCount !== null) {
          await tx.$executeRaw`
            UPDATE "Product"
            SET "stockCount" = "stockCount" + ${item.quantity}
            WHERE id = ${item.productId}
          `;
        }
      }

      // 2. Decrement creditUsed by the outstanding balance so the customer is not
      //    permanently locked out after an invoice they never paid is deleted
      const outstanding = invoice.grandTotal - invoice.amountPaid;
      if (outstanding > 0) {
        await tx.$executeRaw`
          UPDATE "Customer"
          SET "creditUsed" = GREATEST(0, "creditUsed" - ${outstanding})
          WHERE id = ${invoice.customerId}
        `;
      }

      // 3. Delete invoice (cascades to payments and invoice items)
      await tx.invoice.delete({ where: { id } });
    });

    return NextResponse.json({ success: true, message: 'Invoice deleted and inventory refunded' });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
