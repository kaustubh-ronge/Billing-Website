"use client";
import { createContext, useContext, useMemo } from 'react';

const PermissionContext = createContext({
  permissions: [],
  isOwner: false,
  user: null,
});

export function PermissionProvider({ value, children }) {
  // value: { permissions: string[], isOwner: boolean, user: {...} }
  const memo = useMemo(() => value, [JSON.stringify(value?.permissions), value?.isOwner, value?.user?.id]);
  return <PermissionContext.Provider value={memo}>{children}</PermissionContext.Provider>;
}

export function usePermissions() {
  return useContext(PermissionContext);
}

/**
 * Returns a `can(permission)` checker. Accepts a single key or an array
 * (OR semantics — true if the user holds any of them). Owner always passes.
 */
export function useCan() {
  const { permissions, isOwner } = usePermissions();
  return (perm) => {
    if (isOwner) return true;
    if (!perm) return true;
    if (Array.isArray(perm)) return perm.some((p) => permissions.includes(p));
    return permissions.includes(perm);
  };
}
