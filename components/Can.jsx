"use client";
import { useCan } from '@/lib/permissions/PermissionContext';

/**
 * Conditionally render UI based on the current user's permissions.
 *
 *   <Can perm="invoices:delete">
 *     <DeleteButton />
 *   </Can>
 *
 *   <Can perm={["roles:manage", "org:manage"]} fallback={<Locked />}>
 *     ...
 *   </Can>
 */
export function Can({ perm, fallback = null, children }) {
  const can = useCan();
  return can(perm) ? <>{children}</> : fallback;
}
