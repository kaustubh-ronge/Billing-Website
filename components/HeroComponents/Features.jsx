"use client";
import { motion } from "framer-motion";
import { featureData } from "@/data/HeroData/heroData";

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white border-t border-gray-100">
      <div className="container mx-auto px-6 lg:px-8 max-w-6xl">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Everything you need.</h2>
          <p className="text-base text-gray-500 leading-relaxed">We stripped away the clutter of traditional accounting software to give you a lightning-fast, highly secure billing machine.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featureData.map((feat, index) => (
            <motion.div
              key={feat.id}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: index * 0.1 }}
              className={`${feat.colSpan} bg-gray-50/50 rounded-2xl p-8 border border-gray-200/60 hover:border-gray-300 transition-colors relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-500 opacity-50 ${feat.glow}`} />
              <div className="relative z-10">
                {/* Icons are now imported directly in heroData, ensure they are size h-8 w-8 there */}
                <div className="mb-5">{feat.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-[90%]">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}