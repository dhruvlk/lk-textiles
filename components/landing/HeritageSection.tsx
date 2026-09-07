"use client"

import Image from "next/image"

export function HeritageSection() {
  return (
    <section id="about" className="py-24 md:py-32 bg-slate-950 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="container px-6 mx-auto">
        <div className="reveal-container grid lg:grid-cols-2 gap-16 items-center">

          {/* Images Grid */}
          <div className="relative h-[500px] md:h-[600px] w-full hidden md:block">
            <div className="absolute top-0 left-0 w-[60%] h-[70%] rounded-2xl overflow-hidden shadow-2xl z-10 border border-white/10">
              <Image src="https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80" alt="Loom" fill className="object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-[55%] h-[60%] rounded-2xl overflow-hidden shadow-2xl z-20 border border-white/10 translate-y-8 -translate-x-4">
              <Image src="https://images.unsplash.com/photo-1605289355680-75fb41239154?auto=format&fit=crop&q=80" alt="Yarn" fill className="object-cover" />
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-8">
            <div className="reveal-text inline-block px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm font-medium text-slate-300">
              Our Heritage
            </div>
            <h2 className="reveal-text text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              Decades of Mastery <br />Woven into Every Thread.
            </h2>
            <p className="reveal-text text-lg text-slate-400 leading-relaxed">
              Since our inception, LK Textiles has championed the fusion of traditional textile craftsmanship with cutting-edge manufacturing. We don&apos;t just produce fabrics; we engineer materials that define the tactile experience of the world&apos;s most prestigious brands.
            </p>

            <div className="reveal-text grid grid-cols-2 gap-8 pt-6">
              <div>
                <div className="text-4xl font-light text-white mb-2">25+</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider">Years of Excellence</div>
              </div>
              <div>
                <div className="text-4xl font-light text-white mb-2">10M+</div>
                <div className="text-sm text-slate-400 uppercase tracking-wider">Meters Annually</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
