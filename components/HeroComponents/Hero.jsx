import HeroClient from "./HeroClient";
import Features from "./Features";
import HowItWorks from "./HowItWorks";
import AboutAndContact from "./AboutAndContact";
import CTA from "./CTA";

export default function Hero({ systemRole, totalBusinesses, totalInvoices }) {
  return (
    <div className="w-full bg-white flex flex-col overflow-x-hidden" id="home">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative min-h-[100svh] flex items-center justify-center pt-32 pb-20 overflow-hidden bg-white">
        
        {/* Subtle Architectural Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        {/* Top Vignette / Fade so it blends under the header smoothly */}
        <div className="absolute top-0 inset-x-0 h-40 bg-linear-to-b from-white to-transparent z-10"></div>

        {/* The Animated Client Layer */}
        <HeroClient 
          systemRole={systemRole} 
          totalBusinesses={totalBusinesses} 
          totalInvoices={totalInvoices} 
        />
        
      </section>

      {/* ================= SUB SECTIONS ================= */}
      {/* 2. Features Grid */}
      <Features />

      {/* 3. Steps Flow */}
      <div id="how-to-use">
        <HowItWorks />
      </div>

      {/* 4. About & Contact details */}
      <AboutAndContact />

      {/* 5. Final Call to Action */}
      <CTA />

    </div>
  );
}