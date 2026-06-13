import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/prisma';

const USER_INCLUDE = { shop: true, role: true, permissionOverrides: true };

/**
 * Sync the Clerk session into our database.
 *
 * Onboarding paths:
 *   A. Returning user      → return their record (blocked if suspended/disabled).
 *   B. Email matches a     → auto-provision into that org with the invitation's
 *      pending invitation     branch / department / team / role / permissions,
 *                             then mark the invitation accepted.
 *   C. Brand-new signup    → create their own organization as owner.
 */
export const checkUser = async () => {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;
    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'New User';

    // A. Returning user
    const existing = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
      include: USER_INCLUDE,
    });
    if (existing) {
      if (existing.status && existing.status !== 'ACTIVE') return null; // suspended / disabled
      return existing;
    }

    // B. Pending invitation for this email
    const invitation = email
      ? await db.invitation.findFirst({
          where: { email: { equals: email, mode: 'insensitive' }, status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    if (invitation) {
      const expired = invitation.expiresAt && invitation.expiresAt < new Date();
      if (expired) {
        await db.invitation.update({ where: { id: invitation.id }, data: { status: 'EXPIRED' } });
      } else {
        const created = await db.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              clerkId: clerkUser.id,
              name: invitation.name || fullName,
              email,
              phone: invitation.phone || null,
              shopId: invitation.shopId,
              isOwner: invitation.isOwner,
              status: 'ACTIVE',
              branchId: invitation.branchId,
              departmentId: invitation.departmentId,
              teamId: invitation.teamId,
              roleId: invitation.roleId,
            },
          });

          if (invitation.permissions?.length) {
            await tx.userPermission.createMany({
              data: invitation.permissions.map((p) => ({ userId: u.id, permission: p, granted: true })),
              skipDuplicates: true,
            });
          }

          await tx.invitation.update({
            where: { id: invitation.id },
            data: { status: 'ACCEPTED', acceptedAt: new Date() },
          });

          await tx.activityLog.create({
            data: {
              shopId: invitation.shopId,
              userId: u.id,
              action: 'employee.joined',
              entityType: 'User',
              entityId: u.id,
              description: `${u.name} accepted an invitation and joined the organization`,
            },
          });

          return u;
        });

        return db.user.findUnique({ where: { id: created.id }, include: USER_INCLUDE });
      }
    }

    // C. Brand-new self-signup → own organization, owner
    const created = await db.$transaction(async (tx) => {
      const shop = await tx.shop.create({
        data: {
          businessName: `${clerkUser.firstName || 'My'}'s Business`,
          subscriptionPlan: 'FREE',
        },
      });
      return tx.user.create({
        data: {
          clerkId: clerkUser.id,
          name: fullName,
          email,
          shopId: shop.id,
          isOwner: true,
          status: 'ACTIVE',
        },
      });
    });

    return db.user.findUnique({ where: { id: created.id }, include: USER_INCLUDE });
  } catch (error) {
    if (error.message?.includes('Dynamic server usage') || error.digest === 'DYNAMIC_SERVER_USAGE') {
      throw error;
    }
    console.error('Critical Error Syncing User:', error);
    return null;
  }
};
