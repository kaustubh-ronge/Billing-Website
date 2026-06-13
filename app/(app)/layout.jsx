import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

export default async function AppLayout({ children }) {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <AppShell shopName={user.shop?.businessName ?? "My Shop"}>
      {children}
    </AppShell>
  );
}
