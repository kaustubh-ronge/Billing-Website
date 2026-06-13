"use client";
import { useState } from "react";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import MobileSidebar from "./MobileSidebar";

export default function AppShell({ shopName, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Mobile sidebar overlay */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          shopName={shopName}
          onMobileMenuToggle={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
