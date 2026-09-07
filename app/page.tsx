"use client"

import { useState, useRef } from "react"
import { toast } from "sonner"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact"
import confetti from "canvas-confetti"
import Link from "next/link"
import Image from "next/image"
import { Button, buttonVariants } from "@/components/ui/button"
import { FadeIn } from "@/components/animations/fade-in"
import { StaggerContainer, StaggerItem } from "@/components/animations/stagger-container"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { motion, useScroll, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Scissors, CheckCircle, Truck, Clock, ShieldCheck,
  Mail, Phone, MapPin, ArrowRight, Send, ChevronRight,
  Globe2, Leaf, Activity
} from "lucide-react"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

const triggerFireworks = () => {
  const duration = 3 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 99999 };

  const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    });
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    });
  }, 250);
}

export default function HomeLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll()
  const yHero = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])

  useGSAP(() => {
    gsap.fromTo(".reveal-text",
      { y: 100, opacity: 0 },
      {
        y: 0, opacity: 1, duration: 1.2,
        stagger: 0.1, ease: "power4.out",
        scrollTrigger: {
          trigger: ".reveal-container",
          start: "top 80%",
        }
      }
    )

    gsap.fromTo(".bento-item",
      { scale: 0.95, opacity: 0, y: 30 },
      {
        scale: 1, opacity: 1, y: 0, duration: 0.8,
        stagger: 0.1, ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: ".bento-grid",
          start: "top 75%",
        }
      }
    )
  }, { scope: containerRef })

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting, isValid }
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    mode: "onChange",
    defaultValues: {
      fullName: "", email: "", phone: "+91 ", company: "", subject: "", message: ""
    }
  })

  const messageValue = useWatch({ name: "message", control }) || ""
  const wordCount = messageValue.trim() ? messageValue.trim().split(/\s+/).filter(Boolean).length : 0

  const onSubmit = async (data: ContactFormValues) => {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to send message")
      toast.success("Email successfully sent!")
      triggerFireworks()
      reset()
    } catch (error) {
      toast.error((error as Error).message || "An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-slate-900 font-sans selection:bg-primary/20 overflow-x-hidden" ref={containerRef}>

      {/* 1. Floating Pill Header */}
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

      <main className="flex-1">

        {/* 2. Asymmetric Hero Section */}
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

        {/* 3. The Heritage (About) - Parallax Overlapping Images */}
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
                  Since our inception, LK Textiles has championed the fusion of traditional textile craftsmanship with cutting-edge manufacturing. We don't just produce fabrics; we engineer materials that define the tactile experience of the world's most prestigious brands.
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

        {/* 4. Bento Box Capabilities */}
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

        {/* 5. Why Choose Us - Animated Cards */}
        <section className="py-24 bg-white border-y border-slate-100">
          <div className="container px-6 mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">The LK Advantage</h2>
                <p className="text-slate-600 text-lg">Why industry leaders trust our manufacturing ecosystem.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: ShieldCheck, title: "Uncompromising Quality", desc: "Multi-stage QA protocols ensure zero defects." },
                { icon: Activity, title: "Scalable Production", desc: "Agile infrastructure capable of massive volume." },
                { icon: Scissors, title: "Bespoke Engineering", desc: "Custom weaves, weights, and finishes on demand." },
                { icon: Truck, title: "Global Logistics", desc: "Optimized supply chains for predictable delivery." }
              ].map((feature, i) => (
                <div key={i} className="group p-8 rounded-3xl bg-[#FDFCF8] border border-slate-200/50 hover:bg-slate-900 hover:text-white transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <div className="mb-6 h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-slate-800 group-hover:border-slate-700 transition-all duration-500">
                    <feature.icon className="h-7 w-7 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-slate-500 group-hover:text-slate-300 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Split Pane Contact Section */}
        <section id="contact" className="relative min-h-[800px] flex items-center bg-slate-900">
          <div className="absolute inset-0 grid lg:grid-cols-2">
            {/* Left Image Pane */}
            <div className="hidden lg:block relative h-full w-full">
              <Image
                src="https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80"
                alt="Denim Texture"
                fill
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-slate-900" />
              <div className="absolute bottom-16 left-16 max-w-md">
                <h3 className="text-4xl font-bold text-white mb-4">Let's craft something exceptional.</h3>
                <p className="text-slate-300 text-lg">Partner with us to elevate your product line with world-class textiles.</p>
              </div>
            </div>
            {/* Right Form Pane Background */}
            <div className="bg-slate-900 h-full w-full" />
          </div>

          <div className="container relative px-6 mx-auto z-10 py-24">
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="hidden lg:block"></div> {/* Spacer for left side */}

              {/* Form Container */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10" />

                <h3 className="text-3xl font-bold mb-2 text-slate-900">Request a Quote</h3>
                <p className="text-slate-500 mb-8 text-sm">Tell us about your fabric requirements, quantities, and timelines.</p>

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Full Name *</Label>
                    <Input
                      id="fullName"
                      placeholder="John Doe"
                      className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg transition-colors"
                      {...register("fullName")}
                      disabled={isSubmitting}
                    />
                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Work Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@company.com"
                        className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg transition-colors"
                        {...register("email")}
                        disabled={isSubmitting}
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg transition-colors"
                        {...register("phone", {
                          onChange: (e) => {
                            let val = e.target.value;
                            if (val.length === 1 && /\d/.test(val)) val = "+91 " + val;
                            else if (val.length < 4) val = "+91 ";
                            else if (!val.startsWith("+91 ")) {
                              if (val.startsWith("+91")) val = "+91 " + val.slice(3);
                              else if (val.startsWith("91") && val.replace(/\D/g, "").length > 10) val = "+91 " + val.slice(2);
                              else val = "+91 " + val;
                            }
                            let digits = val.slice(4).replace(/\D/g, "");
                            if (digits.length > 10) digits = digits.slice(0, 10);
                            const finalValue = "+91 " + digits;
                            e.target.value = finalValue;
                            setValue("phone", finalValue, { shouldValidate: true });
                          }
                        })}
                        disabled={isSubmitting}
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="company" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Company / Brand Name</Label>
                      <Input
                        id="company"
                        placeholder="e.g. Acme Apparel"
                        className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg transition-colors"
                        {...register("company")}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="subject" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="Bulk Inquiry"
                        className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg transition-colors"
                        {...register("subject")}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-4">
                    <Label htmlFor="message" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Details *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your fabric needs..."
                      className="border-2 border-slate-200 rounded-xl p-4 focus-visible:ring-0 focus-visible:border-primary bg-slate-50 text-base resize-none min-h-[120px] transition-colors"
                      {...register("message")}
                      disabled={isSubmitting}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <div>{errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}</div>
                      <span className={cn("text-xs font-medium", wordCount >= 100 ? "text-red-500" : "text-slate-400")}>
                        {wordCount} / 100 words
                      </span>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-full text-lg shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all duration-300"
                    disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting ? "Sending Request..." : "Send Request"} <Send className="ml-2 h-5 w-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 7. Footer */}
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

    </div>
  )
}
