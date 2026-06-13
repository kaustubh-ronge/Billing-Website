export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getAccessContext } from '@/lib/permissions/guard';

// Current user's effective permissions — lets the client refresh access state.
export async function GET() {
  const ctx = await getAccessContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({
    permissions: ctx.permissions,
    isOwner: ctx.user.isOwner,
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      email: ctx.user.email,
      roleName: ctx.user.role?.name ?? null,
    },
  });
}
