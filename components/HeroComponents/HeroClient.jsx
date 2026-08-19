"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Hyperspeed from "@/components/ui/Hyperspeed";

const hyperspeedOptions = {
  distortion: "turbulentDistortion",
  length: 400,
  roadWidth: 10,
  islandWidth: 2,
  lanesPerRoad: 4,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 20,
  lightPairsPerRoadWay: 40,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 80],
  movingCloserSpeed: [-120, -160],
  carLightsLength: [12, 80],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080c14,
    islandColor: 0x0f172a,
    background: 0x020617,
    shoulderLines: 0x38bdf8,
    brokenLines: 0x818cf8,
    leftCars: [0x3b82f6, 0x60a5fa, 0x1d4ed8],
    rightCars: [0x8b5cf6, 0xa855f7, 0x6366f1],
    sticks: 0x06b6d4,
  }
};

export default function HeroClient({ systemRole, totalBusinesses = 0, totalInvoices = 0 }) {
  return (
    <div className="w-full relative flex flex-col items-center justify-center z-20 min-h-[85vh]">
      
      {/* 3D Hyperspeed WebGL Backdrop */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none">
        <Hyperspeed effectOptions={hyperspeedOptions} />
      </div>

      {/* Animated Glow Overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-[500px] pointer-events-none opacity-40 z-1">
        <motion.div animate={{ x: [0, 50, -30, 0], y: [0, -30, 30, 0], scale: [1, 1.05, 0.95, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 left-20 w-[400px] h-[400px] bg-blue-500/30 rounded-full mix-blend-multiply filter blur-[100px]" />
        <motion.div animate={{ x: [0, -50, 30, 0], y: [0, 30, -30, 0], scale: [1, 0.95, 1.05, 1] }} transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-20 w-[350px] h-[350px] bg-purple-500/30 rounded-full mix-blend-multiply filter blur-[100px]" />
      </div>

      <div className="container relative mx-auto px-6 text-center z-30 pt-10">
        
        {/* Sleek Badge */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-8 flex justify-center">
          <div className="group relative inline-flex items-center gap-2 rounded-md border border-gray-200/80 bg-white/50 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-gray-700 shadow-sm cursor-default">
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="flex flex-col items-center justify-center gap-6">
          <Link href={systemRole === "ADMIN" ? "/admin" : "/dashboard"} className="relative group">
            <div className="absolute -inset-0.5 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            <Button className="relative h-12 px-8 rounded-lg text-sm font-semibold bg-gray-900 hover:bg-black text-white transition-all transform group-hover:-translate-y-0.5 shadow-md">
              {systemRole === "ADMIN" ? "Enter Admin Console" : "Enter Dashboard"}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          
          {/* Dynamic statistics section */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-6 sm:gap-12 bg-white/40 backdrop-blur-md border border-gray-200/80 px-8 py-4 rounded-xl shadow-sm">
            <div className="text-center sm:text-left">
              <span className="block text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                {totalBusinesses}+
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Businesses Connected
              </span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-255" />
            <div className="text-center sm:text-left">
              <span className="block text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                {totalInvoices}+
              </span>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Invoices Generated
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}