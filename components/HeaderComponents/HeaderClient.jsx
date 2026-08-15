"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
// Removed SignedIn and SignedOut to fix Turbopack error
import { UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function HeaderClient({ user }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerWrapperClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out px-4 sm:px-6 lg:px-8 ${
    isScrolled ? "pt-4" : "pt-0"
  }`;

  const navClasses = `mx-auto flex items-center justify-between transition-all duration-500 ease-in-out ${
    isScrolled 
      ? "h-16 max-w-5xl rounded-full bg-white/70 backdrop-blur-2xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] px-6" 
      : "h-24 max-w-7xl bg-transparent px-0"
  }`;

  return (
    <div className={headerWrapperClasses}>
      <header className={navClasses}>
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group relative">
          <div className="absolute -inset-2 bg-linear-to-r from-blue-600 to-purple-600 rounded-full blur opacity-0 group-hover:opacity-40 transition duration-500"></div>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-gray-900 to-black text-white font-bold shadow-lg">
            SB
          </div>
          <span className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-br from-gray-900 to-gray-600">
            SmartBill
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            user.systemRole === "ADMIN" ? (
              <Link href="/admin" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Admin Console</Link>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Dashboard</Link>
                <Link href="/invoices" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Invoices</Link>
                <Link href="/customers" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Customers</Link>
                <Link href="/products" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Products</Link>
                <Link href="/settings" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Settings</Link>
              </>
            )
          ) : (
            <>
              <a href="#home" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Home</a>
              <a href="#features" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Features</a>
              <a href="#about" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">About</a>
              <a href="#contact" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">Contact</a>
              <a href="#how-to-use" className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors">How to use</a>
            </>
          )}
        </nav>

        {/* Authentication Hub */}
        <div className="flex items-center gap-3">
          {/* LOGGED OUT STATE */}
          {!user ? (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" className="font-bold text-gray-600 hover:text-black rounded-full px-5 hidden sm:flex">
                  Log in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-600 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
                  <Button className="relative font-bold bg-black hover:bg-gray-900 text-white rounded-full px-6 transition-all">
                    Get Started
                  </Button>
                </div>
              </SignUpButton>
            </>
          ) : (
            /* LOGGED IN STATE */
            <>
              {user.systemRole !== "ADMIN" && (
                <div className="hidden lg:flex items-center mr-2 px-4 py-1.5 bg-gray-100/80 backdrop-blur-sm border border-gray-200 rounded-full">
                  <span className="text-xs font-black text-gray-800 uppercase tracking-wider">
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

          {/* Hamburger Toggle Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="flex md:hidden items-center justify-center p-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-black transition-colors"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </header>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-20 left-4 right-4 z-45 md:hidden bg-white/95 backdrop-blur-2xl border border-gray-200 shadow-2xl rounded-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-5 duration-300">
          {user ? (
            user.systemRole === "ADMIN" ? (
              <Link href="/admin" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Admin Console</Link>
            ) : (
              <>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Dashboard</Link>
                <Link href="/invoices" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Invoices</Link>
                <Link href="/customers" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Customers</Link>
                <Link href="/products" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Products</Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 transition-colors">Settings</Link>
              </>
            )
          ) : (
            <>
              <a href="#home" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Home</a>
              <a href="#features" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Features</a>
              <a href="#about" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">About</a>
              <a href="#contact" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 border-b border-gray-100 transition-colors">Contact</a>
              <a href="#how-to-use" onClick={() => setIsOpen(false)} className="text-sm font-bold text-gray-600 hover:text-black py-2 transition-colors">How to use</a>
            </>
          )}
        </div>
      )}
    </div>
  );
}