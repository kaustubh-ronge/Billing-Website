import { redirect } from 'next/navigation';
import { getAccessContext } from '@/lib/permissions/guard';

export const dynamic = 'force-dynamic';

// Land on the first organization tab the user is allowed to see.
export default async function OrganizationIndex() {
  const ctx = await getAccessContext();
  if (!ctx) redirect('/sign-in');

  if (ctx.can('employees:view')) redirect('/organization/employees');
  if (ctx.can('roles:manage')) redirect('/organization/roles');
  if (ctx.can('org:manage')) redirect('/organization/branches');
  if (ctx.can('audit:view')) redirect('/organization/activity');
  redirect('/dashboard');
}
