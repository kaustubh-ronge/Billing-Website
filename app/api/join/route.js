export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

// POST /api/join — join an existing shop using an invite code
export async function POST(req) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { inviteCode } = await req.json();
  if (!inviteCode) return NextResponse.json({ error: 'Invite code is required' }, { status: 400 });

  const targetShop = await db.shop.findUnique({
    where: { inviteCode: inviteCode.trim().toUpperCase() },
    include: { users: { select: { id: true } } },
  });

  if (!targetShop) {
    return NextResponse.json({ error: 'Invalid invite code. Please check and try again.' }, { status: 404 });
  }

  if (targetShop.id === user.shopId) {
    return NextResponse.json({ error: 'You are already a member of this team' }, { status: 400 });
  }

  // Move the user to the target shop as CASHIER
  // If their current shop has no other users and no real data, clean it up
  const currentShopUserCount = await db.user.count({ where: { shopId: user.shopId } });
  const currentShopInvoiceCount = await db.invoice.count({ where: { shopId: user.shopId } });
  const currentShopCustomerCount = await db.customer.count({ where: { shopId: user.shopId } });

  await db.$transaction(async (tx) => {
    // Move user to target shop
    await tx.user.update({
      where: { id: user.id },
      data: { shopId: targetShop.id, role: 'CASHIER' },
    });

    // Clean up orphaned solo shop if it has no data and no other members
    if (currentShopUserCount === 1 && currentShopInvoiceCount === 0 && currentShopCustomerCount === 0) {
      await tx.product.deleteMany({ where: { shopId: user.shopId } });
      await tx.shop.delete({ where: { id: user.shopId } });
    }
  });

  return NextResponse.json({ success: true, shopName: targetShop.businessName });
}
