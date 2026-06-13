export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const ctx = await requirePermission('customers:view');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const customers = await db.customer.findMany({
      where: {
        shopId: user.shopId,
        isDeleted: false,
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      },
      include: {
        invoices: {
          select: {
            grandTotal: true,
            amountPaid: true,
            status: true,
            issuedAt: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    // Format customers to calculate summary analytics
    const formattedCustomers = customers.map(c => {
      let totalBills = c.invoices.length;
      let totalPaid = c.invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      let totalBilled = c.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      let totalPending = totalBilled - totalPaid;
      
      let lastPurchaseDate = null;
      if (c.invoices.length > 0) {
        // Sort by issuedAt desc
        const sorted = [...c.invoices].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
        lastPurchaseDate = sorted[0].issuedAt;
      }

      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        address: c.address,
        gstNumber: c.gstNumber,
        notes: c.notes,
        totalBills,
        totalPaid,
        totalPending,
        lastPurchaseDate,
      };
    });

    return NextResponse.json({ customers: formattedCustomers });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  const ctx = await requirePermission('customers:create');
  if (ctx instanceof NextResponse) return ctx;
  const { user } = ctx;

  try {
    const body = await req.json();
    const { name, phone, email, address, gstNumber, notes } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Customer Name and Mobile Number are required.' }, { status: 400 });
    }

    // Check if an active or deleted customer with this phone number already exists for this shop
    const existing = await db.customer.findFirst({
      where: {
        phone,
        shopId: user.shopId,
      }
    });

    if (existing) {
      // If it was soft-deleted, reactivate it with the new info!
      if (existing.isDeleted) {
        const reactivated = await db.customer.update({
          where: { id: existing.id },
          data: {
            name,
            email: email || null,
            address: address || null,
            gstNumber: gstNumber || null,
            notes: notes || null,
            isDeleted: false,
          }
        });
        return NextResponse.json({ success: true, customer: reactivated, message: 'Reactivated existing customer profile' });
      }
      return NextResponse.json({ error: 'A customer with this phone number already exists.' }, { status: 400 });
    }

    const customer = await db.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        address: address || null,
        gstNumber: gstNumber || null,
        notes: notes || null,
        shopId: user.shopId,
      },
    });

    await logActivity({
      shopId: user.shopId, userId: user.id,
      action: 'customer.create', entityType: 'Customer', entityId: customer.id,
      description: `Added customer ${customer.name}`,
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

