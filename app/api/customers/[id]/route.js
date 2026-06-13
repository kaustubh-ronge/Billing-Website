export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

export async function PUT(req, { params }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, phone, email, address, gstNumber, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Customer Name and Mobile Number are required.' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.customer.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Check phone unique constraint excluding current customer
    const phoneConflict = await db.customer.findFirst({
      where: {
        phone,
        shopId: user.shopId,
        id: { not: id },
        isDeleted: false
      }
    });

    if (phoneConflict) {
      return NextResponse.json({ error: 'Another customer with this phone number already exists' }, { status: 400 });
    }

    const updated = await db.customer.update({
      where: { id },
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        gstNumber: gstNumber || null,
        notes: notes || null,
      }
    });

    return NextResponse.json({ success: true, customer: updated });
  } catch (error) {
    console.error("Error updating customer:", error);
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

    // Verify ownership
    const existing = await db.customer.findFirst({
      where: { id, shopId: user.shopId }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Soft delete
    await db.customer.update({
      where: { id },
      data: { isDeleted: true }
    });

    return NextResponse.json({ success: true, message: 'Customer soft deleted successfully' });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
