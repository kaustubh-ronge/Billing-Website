export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const teams = await db.team.findMany({
    where: { shopId: ctx.user.shopId },
    include: { department: { select: { id: true, name: true } }, _count: { select: { users: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ teams });
}

export async function POST(req) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { name, departmentId } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Team name is required' }, { status: 400 });
  if (departmentId) {
    const d = await db.department.findFirst({ where: { id: departmentId, shopId: ctx.user.shopId } });
    if (!d) return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
  }
  const team = await db.team.create({
    data: { shopId: ctx.user.shopId, name: name.trim(), departmentId: departmentId || null },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'team.create', entityType: 'Team', entityId: team.id,
    description: `Created team "${team.name}"`,
  });
  return NextResponse.json({ team });
}
