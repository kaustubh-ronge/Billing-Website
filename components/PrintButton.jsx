"use client";
import React from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()}
      className="font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2.5 flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
    >
      <Printer className="h-4 w-4" /> Print / Download PDF
    </Button>
  );
}
