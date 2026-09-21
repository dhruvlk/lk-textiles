"use client"

import { ShieldCheck, Activity, Scissors, Truck, Award, CheckCircle, Zap, type LucideIcon } from "lucide-react"
import { useLandingContent } from "@/context/LandingContentContext"

const iconMap: Record<string, LucideIcon> = {
  ShieldCheck,
  Activity,
  Scissors,
  Truck,
  Award,
  CheckCircle,
  Zap,
}

export function AdvantageSection() {
  const content = useLandingContent()
  const { advantages } = content

  return (
    <section className="py-24 bg-white border-y border-slate-100">
      <div className="container px-6 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">{advantages.title}</h2>
            <p className="text-slate-600 text-lg">{advantages.subtitle}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {advantages.items.map((feature, i) => {
            const IconComponent = iconMap[feature.iconName] || ShieldCheck
            return (
              <div key={feature.id || i} className="group p-8 rounded-3xl bg-[#FDFCF8] border border-slate-200/50 hover:bg-slate-900 hover:text-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="mb-6 h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-slate-800 group-hover:border-slate-700 transition-all duration-500">
                  <IconComponent className="h-7 w-7 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-slate-300">{feature.title}</h3>
                <p className="text-slate-500 group-hover:text-slate-300 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
