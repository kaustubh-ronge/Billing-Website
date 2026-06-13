export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { sanitizePermissions } from '@/lib/permissions/registry';
import { logActivity } from '@/lib/activity';

export async function GET() {
  const ctx = await requirePermission('employees:view');
  if (ctx instanceof NextResponse) return ctx;

  const invitations = await db.invitation.findMany({
    where: { shopId: ctx.user.shopId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ invitations });
}

export async function POST(req) {
  const ctx = await requirePermission('employees:invite');
  if (ctx instanceof NextResponse) return ctx;

  const body = await req.json();
  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 });
  }

  // Already a member of this shop?
  const existingMember = await db.user.findFirst({ where: { email, shopId: ctx.user.shopId } });
  if (existingMember) {
    return NextResponse.json({ error: 'This person is already a member of your team' }, { status: 409 });
  }

  // Only the owner can grant owner-level access via an invite.
  const isOwner = Boolean(body.isOwner) && ctx.user.isOwner;
  const permissions = sanitizePermissions(body.permissions || []);

  // Validate any referenced org entities belong to this shop.
  const { branchId, departmentId, teamId, roleId } = body;
  const checks = await Promise.all([
    branchId ? db.branch.findFirst({ where: { id: branchId, shopId: ctx.user.shopId } }) : null,
    departmentId ? db.department.findFirst({ where: { id: departmentId, shopId: ctx.user.shopId } }) : null,
    teamId ? db.team.findFirst({ where: { id: teamId, shopId: ctx.user.shopId } }) : null,
    roleId ? db.role.findFirst({ where: { id: roleId, shopId: ctx.user.shopId } }) : null,
  ]);
  if (branchId && !checks[0]) return NextResponse.json({ error: 'Invalid branch' }, { status: 400 });
  if (departmentId && !checks[1]) return NextResponse.json({ error: 'Invalid department' }, { status: 400 });
  if (teamId && !checks[2]) return NextResponse.json({ error: 'Invalid team' }, { status: 400 });
  if (roleId && !checks[3]) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  const token = crypto.randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

  const data = {
    email,
    name: body.name?.trim() || null,
    phone: body.phone?.trim() || null,
    token,
    status: 'PENDING',
    shopId: ctx.user.shopId,
    branchId: branchId || null,
    departmentId: departmentId || null,
    teamId: teamId || null,
    roleId: roleId || null,
    isOwner,
    permissions,
    invitedById: ctx.user.id,
    expiresAt,
  };

  // Replace any existing pending invite for the same email in this shop.
  const prior = await db.invitation.findFirst({
    where: { email, shopId: ctx.user.shopId, status: 'PENDING' },
  });

  const invitation = prior
    ? await db.invitation.update({ where: { id: prior.id }, data })
    : await db.invitation.create({ data });

  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'employee.invited', entityType: 'Invitation', entityId: invitation.id,
    description: `Invited ${email}`,
  });

  return NextResponse.json({ invitation });
}
