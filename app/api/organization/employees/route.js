export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { resolvePermissions } from '@/lib/permissions/resolve';

// Unified roster: active members + pending invitations, plus the org entity
// maps needed to render the invite wizard and member editor.
export async function GET() {
  const ctx = await requirePermission('employees:view');
  if (ctx instanceof NextResponse) return ctx;
  const shopId = ctx.user.shopId;

  const [users, invitations, branches, departments, teams, roles] = await Promise.all([
    db.user.findMany({
      where: { shopId },
      include: { role: true, branch: true, department: true, team: true, permissionOverrides: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.invitation.findMany({ where: { shopId, status: 'PENDING' }, orderBy: { createdAt: 'desc' } }),
    db.branch.findMany({ where: { shopId }, orderBy: { name: 'asc' } }),
    db.department.findMany({ where: { shopId }, orderBy: { name: 'asc' } }),
    db.team.findMany({ where: { shopId }, orderBy: { name: 'asc' } }),
    db.role.findMany({ where: { shopId, isArchived: false }, orderBy: { name: 'asc' } }),
  ]);

  const branchMap = Object.fromEntries(branches.map((b) => [b.id, b.name]));
  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const teamMap = Object.fromEntries(teams.map((t) => [t.id, t.name]));
  const roleMap = Object.fromEntries(roles.map((r) => [r.id, r.name]));

  const members = users.map((u) => ({
    type: 'member',
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    isOwner: u.isOwner,
    status: u.status,
    roleId: u.roleId,
    roleName: u.role?.name ?? null,
    branchId: u.branchId,
    branchName: u.branch?.name ?? null,
    departmentId: u.departmentId,
    departmentName: u.department?.name ?? null,
    teamId: u.teamId,
    teamName: u.team?.name ?? null,
    overrides: u.permissionOverrides.map((o) => ({ permission: o.permission, granted: o.granted })),
    permissions: resolvePermissions(u),
    createdAt: u.createdAt,
  }));

  const pending = invitations.map((inv) => ({
    type: 'invitation',
    id: inv.id,
    name: inv.name,
    email: inv.email,
    phone: inv.phone,
    isOwner: inv.isOwner,
    status: 'PENDING',
    roleId: inv.roleId,
    roleName: inv.roleId ? roleMap[inv.roleId] ?? null : null,
    branchId: inv.branchId,
    branchName: inv.branchId ? branchMap[inv.branchId] ?? null : null,
    departmentId: inv.departmentId,
    departmentName: inv.departmentId ? deptMap[inv.departmentId] ?? null : null,
    teamId: inv.teamId,
    teamName: inv.teamId ? teamMap[inv.teamId] ?? null : null,
    permissions: inv.permissions,
    token: inv.token,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  }));

  return NextResponse.json({
    members,
    pending,
    currentUserId: ctx.user.id,
    canManage: ctx.can('employees:manage'),
    canInvite: ctx.can('employees:invite'),
    org: { branches, departments, teams, roles },
  });
}
