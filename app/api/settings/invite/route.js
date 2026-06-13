export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// GET — return existing invite code (or null)
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const shop = await db.shop.findUnique({
    where: { id: user.shopId },
    select: { inviteCode: true },
  });

  return NextResponse.json({ inviteCode: shop?.inviteCode ?? null });
}

// POST — generate (or rotate) invite code, owner only
export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'OWNER') return NextResponse.json({ error: 'Only owners can manage invite codes' }, { status: 403 });

  // Keep generating until we find a unique code
  let inviteCode;
  let attempts = 0;
  do {
    inviteCode = generateCode();
    const conflict = await db.shop.findUnique({ where: { inviteCode } });
    if (!conflict) break;
    attempts++;
  } while (attempts < 10);

  const shop = await db.shop.update({
    where: { id: user.shopId },
    data: { inviteCode },
    select: { inviteCode: true },
  });

  return NextResponse.json({ inviteCode: shop.inviteCode });
}
