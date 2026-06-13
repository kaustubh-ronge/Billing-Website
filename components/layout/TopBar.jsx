"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar({ shopName, onMobileMenuToggle }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const ThemeIcon = !mounted
    ? Monitor
    : theme === "dark"
    ? Moon
    : theme === "light"
    ? Sun
    : Monitor;

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-background/90 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8"
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Shop name badge */}
      {shopName && (
        <div className="hidden sm:flex items-center">
          <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            {shopName}
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ThemeIcon className="h-4 w-4" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2 cursor-pointer">
            <Sun className="h-4 w-4" /> Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2 cursor-pointer">
            <Moon className="h-4 w-4" /> Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2 cursor-pointer">
            <Monitor className="h-4 w-4" /> System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User button */}
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: { avatarBox: "w-8 h-8 border border-border" },
        }}
      />
    </header>
  );
}
