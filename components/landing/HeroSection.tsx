"use client"

import Link from "next/link"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"
import { ChevronRight, Globe2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export function HeroSection() {
  const { scrollYProgress } = useScroll()
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  return (
    <section id="home" className="relative min-h-screen pt-32 pb-20 flex items-center overflow-hidden">
      {/* Abstract background shapes */}
      <div className="absolute top-0 right-0 w-[50vw] h-[100vh] bg-gradient-to-bl from-slate-200/50 to-transparent rounded-bl-[200px] -z-10" />
      <div className="absolute -top-40 -left-40 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-primary/5 blur-[120px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">

          {/* Left Content */}
          <div className="lg:col-span-6 space-y-8 z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Setting Global Standards Since 1995
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]"
            >
              Weave Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500">Legacy in Fabric.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
              className="text-lg md:text-xl text-slate-600 max-w-lg leading-relaxed"
            >
              LK Textiles architects the finest materials for global brands, marrying age-old craftsmanship with state-of-the-art innovation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="#categories" className={cn(buttonVariants({ size: "lg" }), "rounded-full h-14 px-8 text-base shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all group")}>
                Explore Capabilities
                <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-4 pl-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-10 w-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden relative shadow-sm">
                      <Image src={`https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=100&h=100&sat=-100&seed=${i}`} fill alt="Client" className="object-cover" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-medium text-slate-600 leading-tight">
                  Trusted by <br /><span className="text-slate-900 font-bold">500+ Brands</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Visuals */}
          <div className="lg:col-span-6 relative h-[600px] hidden lg:block">
            <motion.div
              style={{ y: yHero }}
              className="absolute right-0 top-10 w-[80%] h-[90%] rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80"
                alt="Premium Fabric Texture"
                fill
                className="object-cover scale-110"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </motion.div>

            {/* Floating detail card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 1 }}
              className="absolute bottom-20 -left-10 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl border border-white max-w-xs"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                  <Globe2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Global Export</div>
                  <div className="text-lg font-bold text-slate-900">30+ Countries</div>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "85%" }}
                  transition={{ duration: 1.5, delay: 1.5 }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  )
}
