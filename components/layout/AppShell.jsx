"use client";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import MobileSidebar from "./MobileSidebar";
import { PermissionProvider } from "@/lib/permissions/PermissionContext";

export default function AppShell({ shopName, permissions = [], isOwner = false, user = null, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PermissionProvider value={{ permissions, isOwner, user }}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop sidebar */}
        <AppSidebar />

        {/* Mobile sidebar overlay */}
        <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0">
          <TopBar
            shopName={shopName}
            userName={user?.name}
            roleName={isOwner ? "Owner" : user?.roleName}
            onMobileMenuToggle={() => setMobileOpen(true)}
          />
          <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </PermissionProvider>
  );
}
