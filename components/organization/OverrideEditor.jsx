"use client";
import { PERMISSION_GROUPS } from '@/lib/permissions/registry';
import { cn } from '@/lib/utils';

const STATES = [
  { key: 'inherit', label: 'Inherit' },
  { key: 'grant', label: 'Allow' },
  { key: 'revoke', label: 'Deny' },
];

/**
 * Tri-state per-permission override editor.
 * Each permission can be: Inherit (from role), Allow (force-grant), Deny (force-revoke).
 *
 * @param {string[]} rolePerms  permissions the assigned role provides
 * @param {{permission:string,granted:boolean}[]} overrides
 * @param {(next:{permission:string,granted:boolean}[])=>void} onChange
 */
export default function OverrideEditor({ rolePerms = [], overrides = [], onChange }) {
  const roleSet = new Set(rolePerms);
  const ovMap = new Map(overrides.map((o) => [o.permission, o.granted ? 'grant' : 'revoke']));

  const stateFor = (key) => ovMap.get(key) || 'inherit';
  const effective = (key) => {
    const s = stateFor(key);
    if (s === 'grant') return true;
    if (s === 'revoke') return false;
    return roleSet.has(key);
  };

  const setState = (key, state) => {
    const next = overrides.filter((o) => o.permission !== key);
    if (state === 'grant') next.push({ permission: key, granted: true });
    else if (state === 'revoke') next.push({ permission: key, granted: false });
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => (
        <div key={group.key} className="border border-border rounded-xl overflow-hidden">
          <div className="bg-muted/40 px-4 py-2">
            <p className="text-sm font-bold text-foreground">{group.label}</p>
          </div>
          <div className="divide-y divide-border">
            {group.permissions.map((perm) => {
              const state = stateFor(perm.key);
              const allowed = effective(perm.key);
              return (
                <div key={perm.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={cn('h-2 w-2 rounded-full shrink-0', allowed ? 'bg-emerald-500' : 'bg-border')} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{perm.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{perm.description}</p>
                    </div>
                  </div>
                  <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
                    {STATES.map((s) => (
                      <button
                        type="button"
                        key={s.key}
                        onClick={() => setState(perm.key, s.key)}
                        className={cn(
                          'px-2.5 py-1 text-[11px] font-bold transition-colors',
                          state === s.key
                            ? s.key === 'grant'
                              ? 'bg-emerald-600 text-white'
                              : s.key === 'revoke'
                                ? 'bg-rose-600 text-white'
                                : 'bg-foreground text-background'
                            : 'bg-card text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
