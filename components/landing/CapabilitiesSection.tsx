"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Leaf } from "lucide-react"

export function CapabilitiesSection() {
  return (
    <section id="categories" className="py-24 md:py-32 bg-[#FDFCF8]">
      <div className="container px-6 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">Engineering the Future of Fabric</h2>
          <p className="text-lg text-slate-600">Discover our versatile manufacturing capabilities tailored for diverse industry needs.</p>
        </div>

        <div className="bento-grid grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

          {/* Large Feature 1 */}
          <div className="bento-item md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-white">
            <Image src="https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80" alt="Woven Fabrics" fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent p-8 md:p-12 flex flex-col justify-center max-w-[70%]">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Precision Woven Fabrics</h3>
              <p className="text-slate-600 mb-6">High-density engineering for suiting, shirting, and luxury home textiles.</p>
              <Link href="#contact" className="inline-flex w-fit items-center font-semibold text-primary hover:text-slate-900 transition-colors">
                Explore Wovens <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Square Feature 1 */}
          <div className="bento-item md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-900 text-white">
            <div className="absolute inset-0 opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-700">
              <Image src="https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80" alt="Knits" fill className="object-cover" />
            </div>
            <div className="relative h-full p-8 flex flex-col justify-end bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-2">Performance Knits</h3>
              <p className="text-slate-300 text-sm mb-4">Breathable, high-stretch materials for activewear.</p>
              <Link href="#contact" className="inline-flex w-fit items-center font-medium text-white hover:text-slate-300 transition-colors">
                View Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Square Feature 2 */}
          <div className="bento-item md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-white p-8 flex flex-col">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <Leaf className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Sustainable Solutions</h3>
            <p className="text-slate-600 text-sm flex-grow">Organic cottons, recycled polyesters, and zero-discharge dyeing processes.</p>
            <Link href="#contact" className="inline-flex w-fit items-center font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-4">
              Learn More <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Large Feature 2 */}
          <div className="bento-item md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-100">
            <Image src="https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80" alt="Specialty Yarns" fill className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" />
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent p-8 md:p-12 flex flex-col justify-center items-end text-right ml-auto max-w-[70%]">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">Specialty Yarns</h3>
              <p className="text-slate-600 mb-6">Durable, color-fast, and innovatively blended yarns for commercial manufacturing.</p>
              <Link href="#contact" className="inline-flex w-fit items-center font-semibold text-primary hover:text-slate-900 transition-colors">
                Explore Yarns <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
