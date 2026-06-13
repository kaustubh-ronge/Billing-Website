export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { db } from '@/lib/prisma';

// PUT /api/settings/team/[userId] — change role or active status (owner only)
export async function PUT(req, { params }) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'OWNER') return NextResponse.json({ error: 'Only owners can manage team members' }, { status: 403 });

  const { userId } = await params;
  const { role, isActive } = await req.json();

  // Prevent owner from demoting themselves
  if (userId === actor.id && role && role !== 'OWNER') {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 });
  }

  const target = await db.user.findFirst({ where: { id: userId, shopId: actor.shopId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  const updateData = {};
  if (role !== undefined) updateData.role = role;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updated = await db.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  return NextResponse.json({ success: true, member: updated });
}

// DELETE /api/settings/team/[userId] — remove a member from the shop (owner only)
export async function DELETE(req, { params }) {
  const actor = await getSessionUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'OWNER') return NextResponse.json({ error: 'Only owners can remove team members' }, { status: 403 });

  const { userId } = await params;
  if (userId === actor.id) return NextResponse.json({ error: 'You cannot remove yourself' }, { status: 400 });

  const target = await db.user.findFirst({ where: { id: userId, shopId: actor.shopId } });
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

  // Detach from shop rather than deleting the account — preserves Clerk user
  await db.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
