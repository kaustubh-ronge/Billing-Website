import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { resolvePermissions } from "@/lib/permissions/resolve";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AppLayout({ children }) {
  const user = await checkUser();

  if (!user) {
    redirect("/sign-in");
  }
  
  if (user.error === "SUSPENDED") {
    throw new Error("Your account has been suspended. Please contact the administrator.");
  }
  
  if (user.systemRole === "ADMIN") {
    redirect("/admin");
  }

  if (user.registrationRequest && (user.registrationRequest.status === "PENDING" || user.registrationRequest.status === "REJECTED")) {
    redirect("/pending-approval");
  }

  if (!user.shopId) {
    redirect("/register-business");
  }

  // Account Suspension and Expiry check
  const isSuspended = user.shop?.isActive === false;
  const isExpired = user.shop?.planExpiresAt && new Date(user.shop.planExpiresAt) < new Date();

  if (isSuspended || isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white border border-slate-200 shadow-lg rounded-2xl p-8 text-center space-y-6">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-gray-900">Access Restricted</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              {isSuspended 
                ? "Your business account has been suspended by the administrator. Please contact support to reactivate your access."
                : "Your subscription plan has expired. Please contact support or your administrator to renew your plan."
              }
            </p>
          </div>
          <div className="pt-4 border-t border-slate-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl w-full justify-center">
              <UserButton appearance={{ elements: { avatarBox: "w-8 h-8" } }} />
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900 truncate max-w-40">{user.name}</p>
                <p className="text-[10px] text-gray-500 truncate max-w-40">{user.email}</p>
              </div>
            </div>
            <SignOutButton>
              <Button className="w-full rounded-full font-bold bg-black text-white hover:bg-slate-900">
                Sign Out Account
              </Button>
            </SignOutButton>
          </div>
        </div>
      </div>
    );
  }

  const permissions = resolvePermissions(user);
  const sessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    isOwner: user.isOwner,
    roleName: user.role?.name ?? null,
  };

  const planExpiresAt = user.shop?.planExpiresAt ? new Date(user.shop.planExpiresAt) : null;
  const daysRemaining = planExpiresAt ? Math.ceil((planExpiresAt - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const showExpiryAlert = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 10;

  return (
    <AppShell
      shopName={user.shop?.businessName ?? "My Shop"}
      permissions={permissions}
      isOwner={user.isOwner}
      user={sessionUser}
    >
      {showExpiryAlert && (
        <div className="mb-4 bg-amber-500 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-sm animate-pulse">
          <span>⚠️ Your subscription plan expires in {daysRemaining} days. Please contact the administrator to activate/renew your plan.</span>
        </div>
      )}
      {children}
    </AppShell>
  );
}
