export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const dept = await db.department.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  const { name, branchId } = await req.json();
  if (branchId) {
    const b = await db.branch.findFirst({ where: { id: branchId, shopId: ctx.user.shopId } });
    if (!b) return NextResponse.json({ error: 'Invalid branch' }, { status: 400 });
  }
  const updated = await db.department.update({
    where: { id },
    data: { name: name?.trim() || dept.name, branchId: branchId === undefined ? dept.branchId : (branchId || null) },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'department.update', entityType: 'Department', entityId: id,
    description: `Updated department "${updated.name}"`,
  });
  return NextResponse.json({ department: updated });
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const dept = await db.department.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
  await db.department.delete({ where: { id } });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'department.delete', entityType: 'Department', entityId: id,
    description: `Deleted department "${dept.name}"`,
  });
  return NextResponse.json({ success: true });
}
