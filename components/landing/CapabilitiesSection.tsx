"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Leaf } from "lucide-react"
import { useLandingContent } from "@/context/LandingContentContext"

export function CapabilitiesSection() {
  const content = useLandingContent()
  const { capabilities } = content
  const p1 = capabilities.products[0] || {}
  const p2 = capabilities.products[1] || {}
  const p3 = capabilities.products[2] || {}
  const p4 = capabilities.products[3] || {}

  return (
    <section id="categories" className="py-24 md:py-32 bg-[#FDFCF8]">
      <div className="container px-6 mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">{capabilities.title}</h2>
          <p className="text-lg text-slate-600">{capabilities.subtitle}</p>
        </div>

        <div className="bento-grid grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 h-auto md:h-[600px]">

          {/* Large Feature 1 */}
          <div className="bento-item md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-white">
            {p1.imageUrl && (
              <Image src={p1.imageUrl} alt={p1.title} fill className="object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent p-8 md:p-12 flex flex-col justify-center max-w-[70%]">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">{p1.title}</h3>
              <p className="text-slate-600 mb-6">{p1.description}</p>
              <Link href={p1.linkUrl || "#contact"} className="inline-flex w-fit items-center font-semibold text-primary hover:text-slate-900 transition-colors">
                {p1.linkText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Square Feature 1 */}
          <div className="bento-item md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-900 text-white">
            {p2.imageUrl && (
              <div className="absolute inset-0 opacity-40 mix-blend-overlay group-hover:scale-110 transition-transform duration-700">
                <Image src={p2.imageUrl} alt={p2.title} fill className="object-cover" />
              </div>
            )}
            <div className="relative h-full p-8 flex flex-col justify-end bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent">
              <h3 className="text-2xl font-bold text-white mb-2">{p2.title}</h3>
              <p className="text-slate-300 text-sm mb-4">{p2.description}</p>
              <Link href={p2.linkUrl || "#contact"} className="inline-flex w-fit items-center font-medium text-white hover:text-slate-300 transition-colors">
                {p2.linkText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Square Feature 2 */}
          <div className="bento-item md:col-span-1 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-white p-8 flex flex-col">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-6">
              <Leaf className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{p3.title}</h3>
            <p className="text-slate-600 text-sm flex-grow">{p3.description}</p>
            <Link href={p3.linkUrl || "#contact"} className="inline-flex w-fit items-center font-medium text-emerald-600 hover:text-emerald-700 transition-colors mt-4">
              {p3.linkText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          {/* Large Feature 2 */}
          <div className="bento-item md:col-span-2 md:row-span-1 group relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-100">
            {p4.imageUrl && (
              <Image src={p4.imageUrl} alt={p4.title} fill className="object-cover opacity-50 group-hover:scale-105 group-hover:opacity-70 transition-all duration-700" />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent p-8 md:p-12 flex flex-col justify-center items-end text-right ml-auto max-w-[70%]">
              <h3 className="text-3xl font-bold text-slate-900 mb-4">{p4.title}</h3>
              <p className="text-slate-600 mb-6">{p4.description}</p>
              <Link href={p4.linkUrl || "#contact"} className="inline-flex w-fit items-center font-semibold text-primary hover:text-slate-900 transition-colors">
                {p4.linkText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
