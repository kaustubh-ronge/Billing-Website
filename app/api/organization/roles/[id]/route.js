export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { sanitizePermissions } from '@/lib/permissions/registry';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const ctx = await requirePermission('roles:manage');
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const { name, description, permissions } = await req.json();

  const role = await db.role.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  const updated = await db.role.update({
    where: { id },
    data: {
      name: name?.trim() || role.name,
      description: description ?? role.description,
      permissions: permissions ? sanitizePermissions(permissions) : role.permissions,
    },
  });

  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'role.update', entityType: 'Role', entityId: id,
    description: `Updated role "${updated.name}"`,
  });

  return NextResponse.json({ role: updated });
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('roles:manage');
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const role = await db.role.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

  // System templates are archived, not deleted. Custom roles are removed
  // (assigned users have their roleId set null automatically via the schema).
  if (role.isSystem) {
    await db.role.update({ where: { id }, data: { isArchived: true } });
  } else {
    await db.role.delete({ where: { id } });
  }

  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'role.delete', entityType: 'Role', entityId: id,
    description: `Removed role "${role.name}"`,
  });

  return NextResponse.json({ success: true, archived: role.isSystem });
}
