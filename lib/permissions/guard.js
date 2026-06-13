import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/authHelper';
import { resolvePermissions } from './resolve';

/**
 * Server-side access context. Loads the current user (with role + overrides),
 * blocks non-active accounts, and exposes a `can()` checker.
 *
 * @returns {Promise<{user, permissions, can}|null>} null if unauthenticated or inactive.
 */
export async function getAccessContext() {
  const user = await getSessionUser();
  if (!user) return null;
  if (user.status && user.status !== 'ACTIVE') return null; // suspended / disabled

  const permissions = resolvePermissions(user);
  const can = (perm) => user.isOwner || permissions.includes(perm);
  return { user, permissions, can };
}

/**
 * API-route guard. Returns the access context, OR a NextResponse error that the
 * route should return directly.
 *
 *   const ctx = await requirePermission('invoices:create');
 *   if (ctx instanceof NextResponse) return ctx;
 *   const { user, can } = ctx;
 */
export async function requirePermission(permission) {
  const ctx = await getAccessContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (permission && !ctx.can(permission)) {
    return NextResponse.json(
      { error: 'You do not have permission to perform this action.', code: 'FORBIDDEN', permission },
      { status: 403 }
    );
  }
  return ctx;
}

/** Require at least one of several permissions (OR semantics). */
export async function requireAnyPermission(permissions) {
  const ctx = await getAccessContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!permissions.some((p) => ctx.can(p))) {
    return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
  }
  return ctx;
}

/** Authenticated + active, no specific permission required. */
export async function requireAuth() {
  const ctx = await getAccessContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return ctx;
}

/** Owner-only operations (e.g. deleting the org, changing the owner). */
export async function requireOwner() {
  const ctx = await getAccessContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!ctx.user.isOwner) {
    return NextResponse.json({ error: 'Only the owner can perform this action.', code: 'FORBIDDEN' }, { status: 403 });
  }
  return ctx;
}
