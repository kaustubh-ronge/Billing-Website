"use client";
import { motion } from "framer-motion";
import { howItWorksSteps } from "@/data/HeroData/heroData";

export default function HowItWorks() {
  return (
    <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative z-10">
        
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Built for speed.</h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">Three simple steps to manage your daily retail workflow.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {howItWorksSteps.map((step, i) => (
            <motion.div 
              key={step.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center text-center px-4"
            >
              <div className="text-5xl font-black text-slate-700/50 mb-5">{step.id}</div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">{step.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}