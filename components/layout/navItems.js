import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Building2,
  Settings,
} from "lucide-react";

/**
 * Primary navigation. Each item declares the permission(s) that gate it.
 * `perm` as an array means "visible if the user holds ANY of these".
 * The sidebars filter this list against the current user's permissions.
 */
export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, perm: "dashboard:view" },
  { label: "Invoices", href: "/invoices", icon: FileText, perm: "invoices:view" },
  { label: "Customers", href: "/customers", icon: Users, perm: "customers:view" },
  { label: "Products", href: "/products", icon: Package, perm: "products:view" },
  {
    label: "Organization",
    href: "/organization",
    icon: Building2,
    perm: ["employees:view", "roles:manage", "org:manage", "audit:view"],
  },
  { label: "Settings", href: "/settings", icon: Settings, perm: "settings:manage" },
];
