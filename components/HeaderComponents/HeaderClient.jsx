"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
// Removed SignedIn and SignedOut to fix Turbopack error
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X, Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function HeaderClient({ user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const ThemeIcon = !mounted
    ? Sun
    : theme === "dark"
    ? Moon
    : Sun;

  const headerWrapperClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 sm:px-6 lg:px-8 ${
    isScrolled ? "pt-4" : "pt-0"
  }`;

  const navClasses = `mx-auto flex items-center justify-between transition-all duration-500 ease-in-out ${
    isScrolled 
      ? "h-16 max-w-5xl rounded-xl bg-background/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-border shadow-md px-6" 
      : "h-24 max-w-7xl bg-transparent px-0"
  }`;

  return (
    <div className={headerWrapperClasses}>
      <header className={navClasses}>
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="absolute -inset-2 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-0 group-hover:opacity-40 transition duration-500"></div>
          <img src="/logo.png" alt="Logo" className="relative h-10 w-10 object-cover rounded-xl shadow-lg border border-border" />
          <span className="text-xl font-black tracking-tight text-foreground">
            VyaparStock
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            user.systemRole === "ADMIN" ? (
              <Link href="/admin" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Admin Console</Link>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                <Link href="/invoices" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Invoices</Link>
                <Link href="/customers" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Customers</Link>
                <Link href="/products" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Products</Link>
                <Link href="/settings" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Settings</Link>
              </>
            )
          ) : (
            <>
              <a href="#home" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Home</a>
              <a href="#features" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#about" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">About</a>
              <a href="#contact" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <a href="#how-to-use" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">How to use</a>
            </>
          )}
        </nav>

        {/* Authentication Hub */}
        <div className="flex items-center gap-3">
          {/* LOGGED OUT STATE */}
          {!user ? (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-bold text-muted-foreground hover:text-foreground rounded-lg px-5 hidden sm:flex">
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
                  <Button className="relative font-bold bg-primary text-primary-foreground rounded-lg px-6 transition-all">
                    Get Started
                  </Button>
                </div>
              </SignUpButton>
            </>
          ) : (
            /* LOGGED IN STATE */
            <>
              {user.systemRole !== "ADMIN" && (
                <div className="hidden lg:flex items-center mr-2 px-4 py-1.5 bg-muted/80 backdrop-blur-sm border border-border rounded-md">
                  <span className="text-xs font-black text-foreground uppercase tracking-wider">
                    {user.shopName || "PENDING"}
                  </span>
                </div>
              )}
              <UserButton 
                afterSignOutUrl="/" 
                appearance={{ elements: { avatarBox: "w-10 h-10 border border-gray-200 shadow-sm" } }} 
              />
            </>
          )}

          {/* Theme Toggle Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border bg-background/80 backdrop-blur-md">
                <ThemeIcon className="h-4 w-4 text-foreground" />
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

          {/* Hamburger Toggle Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex md:hidden items-center justify-center p-2 rounded-xl border border-border bg-background/80 backdrop-blur-sm text-foreground transition-colors"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </header>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-20 left-4 right-4 z-45 md:hidden bg-background/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-border shadow-2xl rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-300">
          {user ? (
            user.systemRole === "ADMIN" ? (
              <Link href="/admin" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Admin Console</Link>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Dashboard</Link>
                <Link href="/invoices" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Invoices</Link>
                <Link href="/customers" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Customers</Link>
                <Link href="/products" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Products</Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 transition-colors">Settings</Link>
              </>
            )
          ) : (
            <>
              <a href="#home" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Home</a>
              <a href="#features" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Features</a>
              <a href="#about" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">About</a>
              <a href="#contact" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 border-b border-border transition-colors">Contact</a>
              <a href="#how-to-use" onClick={() => setIsOpen(false)} className="text-sm font-bold text-muted-foreground hover:text-foreground py-2 transition-colors">How to use</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}