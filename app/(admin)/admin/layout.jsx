import { checkUser } from "@/lib/checkUser";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Shield, LogOut, CreditCard } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({ children }) {
  const user = await checkUser();

  if (!user || user.systemRole !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card shrink-0">
        {/* Brand */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Shield className="h-4 w-4" />
          </div>
          <span className="font-bold text-foreground tracking-tight">Admin Portal</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Overview
          </Link>
          <Link
            href="/admin/requests"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            Registration Queue
          </Link>
          <Link
            href="/admin/plans"
            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            Subscription Plans
          </Link>
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <UserButton
              afterSignOutUrl="/"
              appearance={{ elements: { avatarBox: "w-8 h-8" } }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-50 h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Overview
          </Link>
          <Link href="/admin/requests" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Queue
          </Link>
          <Link href="/admin/plans" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            Plans
          </Link>
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 mt-14 md:mt-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
