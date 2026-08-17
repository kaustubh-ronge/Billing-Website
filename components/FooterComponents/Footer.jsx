import Link from "next/link";
import { Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer id="contact" className="bg-slate-900 border-t border-slate-800 text-slate-400 py-16 font-sans">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.png" alt="Logo" className="h-10 w-10 object-cover rounded-xl shadow-lg bg-white p-0.5 border border-slate-800" />
              <span className="text-xl font-black tracking-tight text-white">
                VyaparStock
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              The intelligent way to run your entire business. Generating billing invoices, managing inventory, and tracking outstanding balances.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Navigation</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#home" className="hover:text-white transition-colors">Home</a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">Features</a>
              </li>
              <li>
                <a href="#about" className="hover:text-white transition-colors">About</a>
              </li>
              <li>
                <a href="#how-to-use" className="hover:text-white transition-colors">How to use</a>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Contact Us</h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <a href="mailto:advikssoftwaresolutions@gmail.com" className="hover:text-white transition-colors truncate">
                  advikssoftwaresolutions@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-purple-500 shrink-0 mt-0.5" />
                <span className="capitalize text-slate-400">pandharpur</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} ADVIKS Software Solutions. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-[10px] text-slate-500">Built with precision for retail businesses</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
