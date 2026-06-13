export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';
import { logActivity } from '@/lib/activity';

/**
 * Accept an invitation by token for the currently signed-in Clerk user.
 *
 * Handles both cases:
 *   - New user (no DB record yet)  → create membership from the invitation.
 *   - Existing user (in another    → move them into the invited org with the
 *     org)                            invitation's role / placement / permissions.
 *
 * Note: brand-new signups whose email matches a pending invite are also
 * auto-provisioned in lib/checkUser.js — this endpoint covers the explicit
 * "click the link" path and the existing-account case.
 */
export async function POST(req) {
  const clerkUser = await currentUser();
  if (!clerkUser) return NextResponse.json({ error: 'Please sign in first' }, { status: 401 });

  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: 'Missing invitation token' }, { status: 400 });

  const invitation = await db.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.status !== 'PENDING') {
    return NextResponse.json({ error: 'This invitation is no longer valid' }, { status: 404 });
  }
  if (invitation.expiresAt && invitation.expiresAt < new Date()) {
    await db.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
    return NextResponse.json({ error: 'This invitation has expired' }, { status: 410 });
  }

  const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;
  if (!email || email !== invitation.email.toLowerCase()) {
    return NextResponse.json(
      { error: `This invitation is for ${invitation.email}. Sign in with that email to accept.` },
      { status: 403 }
    );
  }

  const shop = await db.shop.findUnique({ where: { id: invitation.shopId } });
  if (!shop) return NextResponse.json({ error: 'The inviting organization no longer exists' }, { status: 404 });

  const existing = await db.user.findUnique({ where: { clerkId: clerkUser.id } });

  await db.$transaction(async (tx) => {
    const placement = {
      shopId: invitation.shopId,
      isOwner: invitation.isOwner,
      status: 'ACTIVE',
      branchId: invitation.branchId,
      departmentId: invitation.departmentId,
      teamId: invitation.teamId,
      roleId: invitation.roleId,
    };

    let userId;
    if (existing) {
      const oldShopId = existing.shopId;
      await tx.user.update({ where: { id: existing.id }, data: placement });
      await tx.userPermission.deleteMany({ where: { userId: existing.id } });
      userId = existing.id;

      // Clean up the user's previous solo org if it's now empty and dataless.
      if (oldShopId && oldShopId !== invitation.shopId) {
        const [users, invoices, customers] = await Promise.all([
          tx.user.count({ where: { shopId: oldShopId } }),
          tx.invoice.count({ where: { shopId: oldShopId } }),
          tx.customer.count({ where: { shopId: oldShopId } }),
        ]);
        if (users === 0 && invoices === 0 && customers === 0) {
          await tx.product.deleteMany({ where: { shopId: oldShopId } });
          await tx.shop.delete({ where: { id: oldShopId } });
        }
      }
    } else {
      const created = await tx.user.create({
        data: {
          clerkId: clerkUser.id,
          name: invitation.name || `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User',
          email,
          phone: invitation.phone || null,
          ...placement,
        },
      });
      userId = created.id;
    }

    if (invitation.permissions?.length) {
      await tx.userPermission.createMany({
        data: invitation.permissions.map((p) => ({ userId, permission: p, granted: true })),
        skipDuplicates: true,
      });
    }

    await tx.invitation.update({
      where: { id: invitation.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });
  });

  await logActivity({
    shopId: invitation.shopId,
    action: 'employee.joined',
    entityType: 'Invitation',
    entityId: invitation.id,
    description: `${invitation.name || email} joined the organization`,
  });

  return NextResponse.json({ success: true, shopName: shop.businessName });
}
