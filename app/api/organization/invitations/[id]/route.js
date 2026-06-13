export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

// Revoke a pending invitation.
export async function DELETE(req, { params }) {
  const ctx = await requirePermission('employees:invite');
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  const invitation = await db.invitation.findFirst({ where: { id, shopId: ctx.user.shopId } });
  if (!invitation) return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });

  await db.invitation.update({ where: { id }, data: { status: 'REVOKED' } });

  await logActivity({
    shopId: ctx.user.shopId, userId: ctx.user.id,
    action: 'invitation.revoked', entityType: 'Invitation', entityId: id,
    description: `Revoked invitation for ${invitation.email}`,
  });

  return NextResponse.json({ success: true });
}
