export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const departments = await db.department.findMany({
    where: { shopId: ctx.user.shopId },
    include: { branch: { select: { id: true, name: true } }, _count: { select: { users: true, teams: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ departments });
}

export async function POST(req) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { name, branchId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
  if (branchId) {
    const b = await db.branch.findFirst({ where: { id: branchId, shopId: ctx.user.shopId } });
    if (!b) return NextResponse.json({ error: 'Invalid branch' }, { status: 400 });
  }
  const department = await db.department.create({
    data: { shopId: ctx.user.shopId, name: name.trim(), branchId: branchId || null },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'department.create', entityType: 'Department', entityId: department.id,
    description: `Created department "${department.name}"`,
  });
  return NextResponse.json({ department });
}
