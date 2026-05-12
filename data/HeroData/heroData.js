// data/HeroData/heroData.js
import { Receipt, Database, Users, BarChart3 } from "lucide-react";

export const featureData = [
  {
    id: 1,
    icon: <Receipt className="h-10 w-10 text-blue-600 mb-6" />,
    title: "Instant PDF Invoices",
    desc: "Generate flawless, gapless PDF invoices instantly on our secure servers. Share directly to WhatsApp with one click.",
    colSpan: "md:col-span-2",
    glow: "bg-blue-50 group-hover:bg-blue-100"
  },
  {
    id: 2,
    icon: <Database className="h-10 w-10 text-indigo-600 mb-6" />,
    title: "Multi-Tenant Vault",
    desc: "Enterprise-grade isolation. Your data is strictly locked away.",
    colSpan: "md:col-span-1",
    glow: "bg-indigo-50 group-hover:bg-indigo-100"
  },
  {
    id: 3,
    icon: <Users className="h-10 w-10 text-purple-600 mb-6" />,
    title: "Smart Debt Tracking",
    desc: "Log partial payments. The system maintains a live ledger of who owes you.",
    colSpan: "md:col-span-1",
    glow: "bg-purple-50 group-hover:bg-purple-100"
  },
  {
    id: 4,
    icon: <BarChart3 className="h-10 w-10 text-emerald-600 mb-6" />,
    title: "Live Analytics",
    desc: "Know exactly what your best-selling items are and catch low inventory instantly.",
    colSpan: "md:col-span-2",
    glow: "bg-emerald-50 group-hover:bg-emerald-100"
  }
];

export const howItWorksSteps = [
  { 
    id: "01", 
    title: "Add Your Products", 
    desc: "Upload your inventory in seconds. Toggle optional stock tracking for services or loose goods." 
  },
  { 
    id: "02", 
    title: "Bill the Customer", 
    desc: "Type a phone number, select items, and apply manual discounts. Our engine calculates taxes instantly." 
  },
  { 
    id: "03", 
    title: "Track the Cash", 
    desc: "Did they pay partially? The system automatically assigns the remaining balance to their debt profile." 
  }
];

export const ctaData = {
  headline: "Ready to modernize?",
  subheadline: "Join the platform built for real-world businesses. Set up your shop and generate your first invoice in under 3 minutes.",
  buttonText: "Create Your Free Account",
  buttonLink: "/dashboard"
};