"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCan } from "@/lib/permissions/PermissionContext";
import { NAV_ITEMS } from "./navItems";

export default function AppSidebar() {
  const pathname = usePathname();
  const can = useCan();
  const items = NAV_ITEMS.filter((item) => can(item.perm));

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-sidebar h-screen sticky top-0 overflow-y-auto">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-black text-sm shrink-0">
          SB
        </div>
        <span className="text-base font-black tracking-tight text-sidebar-foreground">
          SmartBill
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground"
                )}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3 w-3 text-sidebar-accent-foreground/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
          <Zap className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
          <span className="text-xs font-medium text-sidebar-foreground/60">
            Open Source Beta
          </span>
        </div>
      </div>
    </aside>
  );
}
