export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { DEFAULT_ROLES, sanitizePermissions, PERMISSION_GROUPS } from '@/lib/permissions/registry';
import { logActivity } from '@/lib/activity';

/** Seed the starter role templates for a shop the first time roles are viewed. */
async function ensureDefaultRoles(shopId) {
  const count = await db.role.count({ where: { shopId } });
  if (count === 0) {
    await db.role.createMany({
      data: DEFAULT_ROLES.map((r) => ({
        shopId,
        name: r.name,
        description: r.description,
        permissions: r.permissions,
        isSystem: true,
      })),
    });
  }
}

export async function GET() {
  const ctx = await requirePermission('roles:manage');
  if (ctx instanceof NextResponse) return ctx;

  await ensureDefaultRoles(ctx.user.shopId);

  const roles = await db.role.findMany({
    where: { shopId: ctx.user.shopId, isArchived: false },
    include: { _count: { select: { users: true } } },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  });

  return NextResponse.json({ roles, groups: PERMISSION_GROUPS });
}

export async function POST(req) {
  const ctx = await requirePermission('roles:manage');
  if (ctx instanceof NextResponse) return ctx;

  const { name, description, permissions, cloneFromId } = await req.json();

  let perms = sanitizePermissions(permissions || []);
  let finalName = name?.trim();
  let finalDesc = description ?? null;

  if (cloneFromId) {
    const src = await db.role.findFirst({ where: { id: cloneFromId, shopId: ctx.user.shopId } });
    if (!src) return NextResponse.json({ error: 'Source role not found' }, { status: 404 });
    perms = src.permissions;
    finalName = finalName || `${src.name} (Copy)`;
    finalDesc = finalDesc ?? src.description;
  }

  if (!finalName) return NextResponse.json({ error: 'Role name is required' }, { status: 400 });

  const role = await db.role.create({
    data: { shopId: ctx.user.shopId, name: finalName, description: finalDesc, permissions: perms, isSystem: false },
  });

  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'role.create', entityType: 'Role', entityId: role.id,
    description: `Created role "${role.name}"`,
  });

  return NextResponse.json({ role });
}
