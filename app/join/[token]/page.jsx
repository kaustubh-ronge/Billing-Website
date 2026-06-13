import { db } from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import JoinClient from './JoinClient';

export const dynamic = 'force-dynamic';

export default async function JoinPage({ params }) {
  const { token } = await params;
  const invitation = await db.invitation.findUnique({ where: { token } });

  let valid = false;
  let reason = null;
  if (!invitation) reason = 'not_found';
  else if (invitation.status !== 'PENDING') reason = 'used';
  else if (invitation.expiresAt && invitation.expiresAt < new Date()) reason = 'expired';
  else valid = true;

  let orgName = null;
  let roleName = null;
  if (valid) {
    const shop = await db.shop.findUnique({
      where: { id: invitation.shopId },
      select: { businessName: true },
    });
    orgName = shop?.businessName ?? 'the organization';
    if (invitation.roleId) {
      const role = await db.role.findUnique({
        where: { id: invitation.roleId },
        select: { name: true },
      });
      roleName = role?.name ?? null;
    }
  }

  const clerkUser = await currentUser();
  const currentEmail = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null;
  const emailMatches = valid && currentEmail && currentEmail === invitation.email.toLowerCase();

  return (
    <JoinClient
      token={token}
      valid={valid}
      reason={reason}
      orgName={orgName}
      roleName={roleName}
      inviteEmail={valid ? invitation.email : null}
      isOwnerInvite={valid ? invitation.isOwner : false}
      signedIn={!!clerkUser}
      emailMatches={emailMatches}
    />
  );
}
