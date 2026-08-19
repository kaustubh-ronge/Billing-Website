"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ctaData } from "@/data/HeroData/heroData";

export default function CTA() {
  return (
    <section className="py-28 relative overflow-hidden bg-blue-600">
      <div className="absolute inset-0 bg-linear-to-b from-transparent to-blue-900/40" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
        className="container relative mx-auto px-6 text-center z-10 max-w-3xl"
      >
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
          {ctaData.headline}
        </h2>
        
        <p className="text-base md:text-lg text-blue-100 mb-10 leading-relaxed">
          {ctaData.subheadline}
        </p>
        
        <Link href={ctaData.buttonLink}>
          <Button className="h-12 px-8 rounded-lg text-sm font-semibold bg-white text-blue-700 hover:bg-gray-50 hover:text-blue-800 shadow-lg transition-transform transform hover:-translate-y-0.5">
            {ctaData.buttonText}
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}