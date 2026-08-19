"use client";
import { SignIn } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'

export default function Page() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 text-xs font-medium text-gray-400">
        Loading authentication page...
      </div>
    );
  }

  return <SignIn />;
}