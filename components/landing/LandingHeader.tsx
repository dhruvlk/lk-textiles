"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl rounded-full border border-white/20 bg-white/70 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] px-6 py-3 flex items-center justify-between"
    >
      <Link href="/" className="flex items-center gap-2 z-10">
        <Image
          src="/logo-1.png"
          alt="LK Textiles Logo"
          width={120}
          height={50}
          className="h-15 w-auto object-contain"
          priority
        />
      </Link>
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8 font-medium text-sm text-slate-700">
        <Link href="#home" className="hover:text-primary transition-all hover:-translate-y-0.5">Home</Link>
        <Link href="#about" className="hover:text-primary transition-all hover:-translate-y-0.5">Heritage</Link>
        <Link href="#categories" className="hover:text-primary transition-all hover:-translate-y-0.5">Capabilities</Link>
        <Link href="#contact" className="hover:text-primary transition-all hover:-translate-y-0.5">Contact</Link>
      </nav>
      <div className="flex items-center gap-4 z-10">
        <Link href="#contact" className={cn(buttonVariants(), "rounded-full px-6 bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5")}>
          Inquire Now
        </Link>
      </div>
    </motion.header>
  )
}
