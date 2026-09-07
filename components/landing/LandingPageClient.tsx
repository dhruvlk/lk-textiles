"use client"

import { useRef } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import { LandingHeader } from "@/components/landing/LandingHeader"
import { HeroSection } from "@/components/landing/HeroSection"
import { HeritageSection } from "@/components/landing/HeritageSection"
import { CapabilitiesSection } from "@/components/landing/CapabilitiesSection"
import { AdvantageSection } from "@/components/landing/AdvantageSection"
import { ContactSection } from "@/components/landing/ContactSection"
import { LandingFooter } from "@/components/landing/LandingFooter"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export function LandingPageClient() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      gsap.fromTo(
        ".reveal-text",
        { y: 100, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1.2,
          stagger: 0.1,
          ease: "power4.out",
          scrollTrigger: {
            trigger: ".reveal-container",
            start: "top 80%",
          },
        }
      )

      gsap.fromTo(
        ".bento-item",
        { scale: 0.95, opacity: 0, y: 30 },
        {
          scale: 1,
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "back.out(1.2)",
          scrollTrigger: {
            trigger: ".bento-grid",
            start: "top 75%",
          },
        }
      )
    },
    { scope: containerRef }
  )

  return (
    <div
      className="min-h-screen bg-[#FDFCF8] text-slate-900 font-sans selection:bg-primary/20 overflow-x-hidden"
      ref={containerRef}
    >
      <LandingHeader />

      <main className="flex-1">
        <HeroSection />
        <HeritageSection />
        <CapabilitiesSection />
        <AdvantageSection />
        <ContactSection />
      </main>

      <LandingFooter />
    </div>
  )
}
