export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const branches = await db.branch.findMany({
    where: { shopId: ctx.user.shopId },
    include: { _count: { select: { users: true, departments: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ branches });
}

export async function POST(req) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { name, address, phone, isHeadquarters } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Branch name is required' }, { status: 400 });
  const branch = await db.branch.create({
    data: {
      shopId: ctx.user.shopId,
      name: name.trim(),
      address: address || null,
      phone: phone || null,
      isHeadquarters: Boolean(isHeadquarters),
    },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'branch.create', entityType: 'Branch', entityId: branch.id,
    description: `Created branch "${branch.name}"`,
  });
  return NextResponse.json({ branch });
}
