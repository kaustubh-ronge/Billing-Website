export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const team = await db.team.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  const { name, departmentId } = await req.json();
  if (departmentId) {
    const d = await db.department.findFirst({ where: { id: departmentId, shopId: ctx.user.shopId } });
    if (!d) return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
  }
  const updated = await db.team.update({
    where: { id },
    data: { name: name?.trim() || team.name, departmentId: departmentId === undefined ? team.departmentId : (departmentId || null) },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'team.update', entityType: 'Team', entityId: id,
    description: `Updated team "${updated.name}"`,
  });
  return NextResponse.json({ team: updated });
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const team = await db.team.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  await db.team.delete({ where: { id } });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'team.delete', entityType: 'Team', entityId: id,
    description: `Deleted team "${team.name}"`,
  });
  return NextResponse.json({ success: true });
}
