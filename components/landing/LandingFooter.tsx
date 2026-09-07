"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, Phone, Mail } from "lucide-react"

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 pt-20 pb-10 border-t border-white/10">
      <div className="container px-6 mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8 mb-16">

          <div className="md:col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white/10 p-4 rounded-2xl w-fit backdrop-blur-sm border border-white/5">
              <Image src="/logo-1.png" alt="LK Textiles Logo" width={140} height={60} className="h-12 w-auto object-contain brightness-0 invert" />
            </div>
            <p className="text-sm leading-relaxed max-w-sm">
              Redefining the standards of global textile manufacturing with uncompromising quality and sustainable innovation.
            </p>
          </div>

          <div className="md:col-span-4 lg:col-span-2 space-y-6">
            <h4 className="text-white font-bold tracking-wide uppercase text-sm">Navigation</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#home" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="#about" className="hover:text-white transition-colors">Heritage</Link></li>
              <li><Link href="#categories" className="hover:text-white transition-colors">Capabilities</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <h4 className="text-white font-bold tracking-wide uppercase text-sm">Capabilities</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Precision Woven Fabrics</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Performance Knits</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sustainable Solutions</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Specialty Yarns</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <h4 className="text-white font-bold tracking-wide uppercase text-sm">Connect</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-500 mt-0.5 shrink-0" />
                <span>Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Surat, 395012</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-500 shrink-0" />
                <div className="flex flex-col">
                  <span>+91 98251 21931</span>
                  <span>+91 70698 66165</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-slate-500 shrink-0" />
                <span>lktextiles6165@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} LK Textiles. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
