export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve';
import { ALL_PERMISSIONS } from '@/lib/permissions/registry';
import { logActivity } from '@/lib/activity';

const STATUSES = ['ACTIVE', 'SUSPENDED', 'DISABLED'];
const PERM_SET = new Set(ALL_PERMISSIONS);

export async function PUT(req, { params }) {
  const ctx = await requirePermission('employees:manage');
  if (ctx instanceof NextResponse) return ctx;

  const { userId } = await params;
  const actor = ctx.user;

  const target = await db.user.findFirst({ where: { id: userId, shopId: actor.shopId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Non-owners may not modify an owner.
  if (target.isOwner && !actor.isOwner) {
    return NextResponse.json({ error: 'Only an owner can modify another owner' }, { status: 403 });
  }

  const body = await req.json();
  const data = {};

  // Role template
  if ('roleId' in body) {
    if (body.roleId) {
      const r = await db.role.findFirst({ where: { id: body.roleId, shopId: actor.shopId } });
      if (!r) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    data.roleId = body.roleId || null;
  }

  // Org placement
  for (const [field, model] of [['branchId', 'branch'], ['departmentId', 'department'], ['teamId', 'team']]) {
    if (field in body) {
      if (body[field]) {
        const found = await db[model].findFirst({ where: { id: body[field], shopId: actor.shopId } });
        if (!found) return NextResponse.json({ error: `Invalid ${model}` }, { status: 400 });
      }
      data[field] = body[field] || null;
    }
  }

  // Status
  if ('status' in body && STATUSES.includes(body.status)) {
    if (target.id === actor.id && body.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'You cannot change your own status' }, { status: 400 });
    }
    data.status = body.status;
  }

  // Owner toggle — owner only, and never demote the last owner.
  if ('isOwner' in body) {
    if (!actor.isOwner) {
      return NextResponse.json({ error: 'Only the owner can grant owner access' }, { status: 403 });
    }
    if (target.isOwner && body.isOwner === false) {
      const ownerCount = await db.user.count({ where: { shopId: actor.shopId, isOwner: true } });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: 'There must be at least one owner' }, { status: 400 });
      }
    }
    data.isOwner = Boolean(body.isOwner);
  }

  // Permission overrides — full replacement of the override set.
  let overrides = null;
  if (Array.isArray(body.overrides)) {
    overrides = body.overrides.filter(
      (o) => o && typeof o.permission === 'string' && typeof o.granted === 'boolean' && PERM_SET.has(o.permission)
    );
  }

  await db.$transaction(async (tx) => {
    if (Object.keys(data).length) {
      await tx.user.update({ where: { id: userId }, data });
    }
    if (overrides) {
      await tx.userPermission.deleteMany({ where: { userId } });
      if (overrides.length) {
        await tx.userPermission.createMany({
          data: overrides.map((o) => ({ userId, permission: o.permission, granted: o.granted })),
          skipDuplicates: true,
        });
      }
    }
  });

  await logActivity({
    shopId: actor.shopId, userId: actor.id,
    action: 'employee.update', entityType: 'User', entityId: userId,
    description: `Updated ${target.name}`,
  });

  const updated = await db.user.findUnique({
    where: { id: userId },
    include: { role: true, permissionOverrides: true },
  });
  return NextResponse.json({ success: true, member: { ...updated, permissions: resolvePermissions(updated) } });
}

export async function DELETE(req, { params }) {
  const ctx = await requirePermission('employees:manage');
  if (ctx instanceof NextResponse) return ctx;

  const { userId } = await params;
  const actor = ctx.user;

  if (userId === actor.id) return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });

  const target = await db.user.findFirst({ where: { id: userId, shopId: actor.shopId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  if (target.isOwner && !actor.isOwner) {
    return NextResponse.json({ error: 'Only an owner can remove another owner' }, { status: 403 });
  }
  if (target.isOwner) {
    const ownerCount = await db.user.count({ where: { shopId: actor.shopId, isOwner: true } });
    if (ownerCount <= 1) return NextResponse.json({ error: 'Cannot remove the last owner' }, { status: 400 });
  }

  await db.user.delete({ where: { id: userId } });

  await logActivity({
    shopId: actor.shopId, userId: actor.id,
    action: 'employee.removed', entityType: 'User', entityId: userId,
    description: `Removed ${target.name} from the organization`,
  });

  return NextResponse.json({ success: true });
}
