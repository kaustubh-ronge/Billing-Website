import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { resolvePermissions } from "@/lib/permissions/resolve";

export default async function AppLayout({ children }) {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  const permissions = resolvePermissions(user);
  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    isOwner: user.isOwner,
    roleName: user.role?.name ?? null,
  };

  return (
    <AppShell
      shopName={user.shop?.businessName ?? "My Shop"}
      permissions={permissions}
      isOwner={user.isOwner}
      user={sessionUser}
    >
      {children}
    </AppShell>
  );
}
