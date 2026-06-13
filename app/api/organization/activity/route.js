export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permissions/guard';
import { db } from '@/lib/prisma';

export async function GET(req) {
  const ctx = await requirePermission('audit:view');
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 200);
  const action = searchParams.get('action') || '';
  const userId = searchParams.get('userId') || '';

  const where = { shopId: ctx.user.shopId };
  if (action) where.action = { startsWith: action };
  if (userId) where.userId = userId;

  const logs = await db.activityLog.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({ logs });
}
