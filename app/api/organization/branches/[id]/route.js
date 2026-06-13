export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const branch = await db.branch.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  const { name, address, phone, isHeadquarters } = await req.json();
  const updated = await db.branch.update({
    where: { id },
    data: {
      name: name?.trim() || branch.name,
      address: address ?? branch.address,
      phone: phone ?? branch.phone,
      isHeadquarters: isHeadquarters ?? branch.isHeadquarters,
    },
  });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'branch.update', entityType: 'Branch', entityId: id,
    description: `Updated branch "${updated.name}"`,
  });
  return NextResponse.json({ branch: updated });
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('org:manage');
  if (ctx instanceof NextResponse) return ctx;
  const { id } = await params;
  const branch = await db.branch.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!branch) return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
  // Members/departments referencing this branch are detached (schema SetNull).
  await db.branch.delete({ where: { id } });
  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'branch.delete', entityType: 'Branch', entityId: id,
    description: `Deleted branch "${branch.name}"`,
  });
  return NextResponse.json({ success: true });
}
