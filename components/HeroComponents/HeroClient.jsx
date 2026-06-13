"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroClient() {
  return (
    <div className="w-full relative flex flex-col items-center justify-center z-20">
      
      {/* Animated Aurora Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] pointer-events-none opacity-50">
        <motion.div animate={{ x: [0, 50, -30, 0], y: [0, -30, 30, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 left-20 w-[400px] h-[400px] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[100px]" />
        <motion.div animate={{ x: [0, -50, 30, 0], y: [0, 30, -30, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-20 w-[350px] h-[350px] bg-purple-400/30 rounded-full mix-blend-multiply filter blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-6 text-center z-30 pt-10">
        
        {/* Sleek Badge */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 flex justify-center">
          <div className="group relative inline-flex items-center gap-2 rounded-full border border-gray-200/80 bg-white/50 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm cursor-default">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>The New Standard for B2B SaaS</span>
          </div>
        </motion.div>

        {/* Refined Typography */}
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight md:text-6xl mb-6 leading-tight">
          <span className="text-gray-900">The intelligent way to run your </span>
          <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">entire business.</span>
        </motion.h1>

        {/* Scaled Subtitle */}
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="mx-auto max-w-2xl text-lg text-gray-500 mb-10 leading-relaxed">
          Generate stunning PDF invoices instantly, track every rupee your customers owe, and manage inventory with absolute precision.
        </motion.p>

        {/* Standardized Button Sizes */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <Button className="relative h-12 px-8 rounded-full text-sm font-semibold bg-gray-900 hover:bg-black text-white transition-all transform group-hover:-translate-y-0.5 shadow-md">
              Enter Dashboard
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          
          <a href="#features">
            <Button variant="outline" className="h-12 px-8 rounded-full text-sm font-semibold border-gray-200 bg-white/60 backdrop-blur-sm text-gray-700 hover:bg-white hover:text-gray-900 shadow-sm transition-all">
              See How it Works
            </Button>
          </a>
        </motion.div>

      </div>
    </div>
  );
}