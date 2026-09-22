"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useLandingContent } from "@/context/LandingContentContext"

export function HeritageSection() {
  const content = useLandingContent()
  const { heritage } = content

  return (
    <section id="about" className="py-24 md:py-32 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container px-6 mx-auto">
        <div className="reveal-container grid lg:grid-cols-2 gap-16 items-center">

          {/* Images Grid */}
          <div className="relative h-[500px] md:h-[600px] w-full hidden md:block">
            <div className="absolute top-0 left-0 w-[60%] h-[70%] rounded-2xl overflow-hidden shadow-2xl z-10 border border-white/10 bg-slate-900 flex items-center justify-center">
              {heritage.image1Url ? (
                <Image
                  src={heritage.image1Url}
                  alt="LK Textiles Grey Fabric Manufacturing Loom"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Manufacturing Looms</div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[60%] rounded-2xl overflow-hidden shadow-2xl z-20 border border-white/10 translate-y-8 -translate-x-4 bg-slate-800 flex items-center justify-center">
              {heritage.image2Url ? (
                <Image
                  src={heritage.image2Url}
                  alt="Art Silk Textile Yarns"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              ) : (
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Textile Yarns</div>
              )}
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-8">
            <div className="reveal-text inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-300">
              {heritage.badge}
            </div>
            <h2 className="reveal-text text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              {heritage.title}
            </h2>
            <p className="reveal-text text-lg text-slate-400 leading-relaxed">
              {heritage.description}
            </p>

            <div className="reveal-text grid grid-cols-2 gap-8 pt-2">
              <div>
                <div className="text-4xl font-light text-white mb-2">{heritage.stat1Value}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider">{heritage.stat1Label}</div>
              </div>
              <div>
                <div className="text-4xl font-light text-white mb-2">{heritage.stat2Value}</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider">{heritage.stat2Label}</div>
              </div>
            </div>

            <div className="reveal-text pt-2">
              <Link
                href={heritage.ctaLink}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 hover:shadow-lg transition-all duration-300 group"
              >
                <span>{heritage.ctaText}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
