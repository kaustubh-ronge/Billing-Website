"use client";
import { motion } from "framer-motion";
import { Mail, MapPin, Shield, CheckCircle2 } from "lucide-react";

export default function AboutAndContact() {
  return (
    <div className="w-full bg-white flex flex-col font-sans">
      
      {/* ================= ABOUT SECTION ================= */}
      <section id="about" className="py-24 bg-slate-50 border-t border-b border-gray-150 relative overflow-hidden">
        <div className="container mx-auto px-6 lg:px-8 max-w-6xl relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Block */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="relative rounded-2xl overflow-hidden bg-slate-900 text-white p-8 space-y-6 shadow-xl border border-slate-800"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-black">Our Commitment</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                VyaparStock is built by ADVIKS Software Solutions to provide retail, wholesale, and agro-businesses with robust billing infrastructure. We eliminate software complexity so you can focus on scale.
              </p>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>High performance PDF rendering engine</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Interactive sales and outstanding accounts tracking</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-200">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                  <span>Multi-layout customizable invoice configurations</span>
                </div>
              </div>
            </motion.div>

            {/* Content block */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
                Designed for high growth business owners.
              </h2>
              <p className="text-base text-gray-500 leading-relaxed">
                We believe software should work for you, not the other way around. VyaparStock offers instant business insights, customizable layouts, item stock tracking, and user privilege controls under a single unified dashboard.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                Developed and supported locally by ADVIKS Software Solutions, we ensure platform reliability, quick feature releases, and secure cloud storage.
              </p>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ================= CONTACT SECTION ================= */}
      <section id="contact" className="py-24 bg-white relative">
        <div className="container mx-auto px-6 lg:px-8 max-w-4xl text-center">
          
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-base text-gray-500">Have questions or need technical support? Contact ADVIKS Software Solutions directly.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Email Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="bg-slate-50 border border-gray-200/60 hover:border-blue-300 rounded-2xl p-6 transition-all flex flex-col items-center gap-3.5 shadow-xs"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Email Address</h4>
                <p className="text-xs text-gray-500 mt-1">Direct support and feedback</p>
              </div>
              <a href="mailto:advikssoftwaresolutions@gmail.com" className="text-sm font-bold text-blue-600 hover:underline break-all">
                advikssoftwaresolutions@gmail.com
              </a>
            </motion.div>

            {/* Address Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="bg-slate-50 border border-gray-200/60 hover:border-purple-300 rounded-2xl p-6 transition-all flex flex-col items-center gap-3.5 shadow-xs"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Office Location</h4>
                <p className="text-xs text-gray-500 mt-1">ADVIKS Software Solutions</p>
              </div>
              <span className="text-sm font-bold text-gray-800 capitalize">
                pandharpur
              </span>
            </motion.div>
          </div>

        </div>
      </section>

    </div>
  );
}
