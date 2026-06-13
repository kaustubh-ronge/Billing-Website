import { ALL_PERMISSIONS } from './registry';

/**
 * Resolve a user's EFFECTIVE permission set.
 *
 * Resolution order (later steps override earlier ones):
 *   1. Owner  → every permission, full stop.
 *   2. Role template permissions (if a role is assigned).
 *   3. Per-user overrides: granted=true adds, granted=false revokes.
 *   4. Default deny — anything not in the set is denied.
 *
 * Expects a user object with `role` (the Role relation) and
 * `permissionOverrides` loaded. Pure function — no DB access.
 */
export function resolvePermissions(user) {
  if (!user) return [];
  if (user.isOwner) return [...ALL_PERMISSIONS];

  const set = new Set();

  // 2. Role template
  if (user.role?.permissions?.length) {
    for (const p of user.role.permissions) set.add(p);
  }

  // 3. Per-user overrides
  for (const ov of user.permissionOverrides ?? []) {
    if (ov.granted) set.add(ov.permission);
    else set.delete(ov.permission);
  }

  return [...set];
}

/** Does this user hold a specific permission? */
export function userCan(user, permission) {
  if (!user) return false;
  if (user.isOwner) return true;
  return resolvePermissions(user).includes(permission);
}
