"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCan } from "@/lib/permissions/PermissionContext";
import { NAV_ITEMS } from "./navItems";

export default function MobileSidebar({ open, onClose }) {
  const pathname = usePathname();
  const can = useCan();
  const items = NAV_ITEMS.filter((item) => can(item.perm));

  // Close on route change
  useEffect(() => {
    onClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className="relative flex flex-col w-64 max-w-[80vw] h-full bg-sidebar border-r border-border shadow-xl animate-in slide-in-from-left-5 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="VyaparStock Logo" className="h-8 w-8 object-cover rounded-lg border border-slate-200/50 shadow-3xs dark:hidden" />
            <img src="/dark_logo.jpeg" alt="VyaparStock Logo" className="h-8 w-8 object-cover rounded-lg border border-slate-200/50 shadow-3xs hidden dark:block" />
            <span className="text-base font-black tracking-tight text-sidebar-foreground">
              VyaparStock
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/40 px-3 py-2.5">
            <Zap className="h-3.5 w-3.5 text-yellow-500 shrink-0" />
            <span className="text-xs font-medium text-sidebar-foreground/60">
              Open Source Beta
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
