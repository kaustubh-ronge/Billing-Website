import { redirect } from 'next/navigation';
import { getAccessContext } from '@/lib/permissions/guard';
import OrgNav from './OrgNav';

export const dynamic = 'force-dynamic';

const ORG_PERMISSIONS = ['employees:view', 'roles:manage', 'org:manage', 'audit:view'];

export default async function OrganizationLayout({ children }) {
  const ctx = await getAccessContext();
  if (!ctx) redirect('/sign-in');
  if (!ORG_PERMISSIONS.some((p) => ctx.can(p))) redirect('/dashboard');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground">Organization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your team, roles, structure, and activity trail.
        </p>
      </div>
      <OrgNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
