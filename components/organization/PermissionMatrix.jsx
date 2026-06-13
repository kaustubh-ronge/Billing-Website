"use client";
import { PERMISSION_GROUPS } from '@/lib/permissions/registry';
import { Check } from 'lucide-react';

/**
 * Simple multi-select permission picker grouped by module.
 *
 * @param {string[]} value      currently selected permission keys
 * @param {(keys:string[])=>void} onChange
 * @param {string[]} [inherited]  permissions provided by a role — shown locked & checked
 * @param {boolean} [disabled]
 */
export default function PermissionMatrix({ value = [], onChange, inherited = [], disabled = false }) {
  const selected = new Set(value);
  const inheritedSet = new Set(inherited);

  const toggle = (key) => {
    if (disabled || inheritedSet.has(key)) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  const toggleGroup = (groupPerms) => {
    if (disabled) return;
    const toggleable = groupPerms.filter((p) => !inheritedSet.has(p.key)).map((p) => p.key);
    const allOn = toggleable.every((k) => selected.has(k));
    const next = new Set(selected);
    if (allOn) toggleable.forEach((k) => next.delete(k));
    else toggleable.forEach((k) => next.add(k));
    onChange([...next]);
  };

  return (
    <div className="space-y-4">
      {PERMISSION_GROUPS.map((group) => {
        const groupKeys = group.permissions.map((p) => p.key);
        const selectedCount = groupKeys.filter((k) => selected.has(k) || inheritedSet.has(k)).length;
        return (
          <div key={group.key} className="border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between bg-muted/40 px-4 py-2.5">
              <div>
                <p className="text-sm font-bold text-foreground">{group.label}</p>
                <p className="text-[11px] text-muted-foreground">{group.description}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleGroup(group.permissions)}
                disabled={disabled}
                className="text-[11px] font-bold text-blue-600 hover:underline disabled:opacity-40"
              >
                {selectedCount === groupKeys.length ? 'Clear all' : 'Select all'}
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-px bg-border">
              {group.permissions.map((perm) => {
                const isInherited = inheritedSet.has(perm.key);
                const isChecked = isInherited || selected.has(perm.key);
                return (
                  <button
                    type="button"
                    key={perm.key}
                    onClick={() => toggle(perm.key)}
                    disabled={disabled || isInherited}
                    className={`flex items-start gap-2.5 px-4 py-2.5 text-left bg-card transition-colors ${
                      isInherited ? 'cursor-not-allowed' : 'hover:bg-muted/40'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        isChecked
                          ? isInherited
                            ? 'bg-muted-foreground/40 border-transparent'
                            : 'bg-blue-600 border-blue-600'
                          : 'border-border'
                      }`}
                    >
                      {isChecked && <Check className="h-3 w-3 text-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-foreground">{perm.label}</span>
                      <span className="block text-[11px] text-muted-foreground leading-tight">
                        {isInherited ? 'From role' : perm.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
