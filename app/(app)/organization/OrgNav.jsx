"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, ShieldCheck, Building, Network, UsersRound, ScrollText } from 'lucide-react';
import { useCan } from '@/lib/permissions/PermissionContext';
import { cn } from '@/lib/utils';

const TABS = [
  { label: 'Employees', href: '/organization/employees', icon: Users, perm: 'employees:view' },
  { label: 'Roles', href: '/organization/roles', icon: ShieldCheck, perm: 'roles:manage' },
  { label: 'Branches', href: '/organization/branches', icon: Building, perm: 'org:manage' },
  { label: 'Departments', href: '/organization/departments', icon: Network, perm: 'org:manage' },
  { label: 'Teams', href: '/organization/teams', icon: UsersRound, perm: 'org:manage' },
  { label: 'Activity Log', href: '/organization/activity', icon: ScrollText, perm: 'audit:view' },
];

export default function OrgNav() {
  const pathname = usePathname();
  const can = useCan();
  const tabs = TABS.filter((t) => can(t.perm));

  return (
    <div className="flex gap-1 border-b border-border overflow-x-auto">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px whitespace-nowrap transition-colors',
              active
                ? 'border-foreground text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
