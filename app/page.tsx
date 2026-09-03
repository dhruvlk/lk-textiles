"use client"

import { useState } from "react"
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
import { useRef } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Scissors, CheckCircle, Truck, Clock, ShieldCheck,
  Mail, Phone, MapPin, ArrowRight, Send
} from "lucide-react"

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

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export default function HomeLandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    gsap.fromTo(".feature-card",
      {
        y: 50,
        opacity: 0,
      },
      {
        scrollTrigger: {
          trigger: ".features-container",
          start: "top 80%",
        },
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
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
      fullName: "",
      email: "",
      phone: "+91 ",
      company: "",
      subject: "",
      message: ""
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

      if (!res.ok) {
        throw new Error(result.error || "Failed to send message")
      }

      toast.success("Email successfully sent!")

      // Trigger Fireworks Animation
      triggerFireworks()

      reset()
    } catch (error) {
      const err = error as Error
      toast.error(err.message || "An error occurred. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-primary/20" ref={containerRef}>

      {/* 1. Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm"
      >
        <div className="container mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* <div className="bg-primary text-primary-foreground p-2 rounded-sm">
              <Scissors className="h-6 w-6" />
            </div> */}
            <span className="font-bold text-2xl tracking-tight text-slate-900">Lk Textiles</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="#home" className="hover:text-primary transition-colors">Home</Link>
            <Link href="#about" className="hover:text-primary transition-colors">About</Link>
            <Link href="#products" className="hover:text-primary transition-colors">Products</Link>
            <Link href="#contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="#contact" className={cn(buttonVariants(), "rounded-sm shadow-sm")}>
              Get a Quote
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section id="home" className="relative w-full py-24 md:py-32 lg:py-48 bg-slate-900 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 mix-blend-overlay"
          >
            <Image
              src="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80"
              alt="Premium Fabric Background"
              fill
              className="object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>

          <div className="container relative px-4 md:px-6 mx-auto">
            <StaggerContainer className="max-w-2xl space-y-6">
              <StaggerItem>
                <div className="inline-block px-3 py-1 bg-white/10 text-slate-200 border border-white/20 rounded-sm text-sm font-medium backdrop-blur-sm">
                  Excellence in Fabric Manufacturing
                </div>
              </StaggerItem>
              <StaggerItem>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
                  Premium Textile Solutions for Global Brands
                </h1>
              </StaggerItem>
              <StaggerItem>
                <p className="text-lg md:text-xl text-slate-300 max-w-xl">
                  Delivering high-quality woven, knitted, and customized fabrics with uncompromised quality standards and reliable supply chains.
                </p>
              </StaggerItem>
              <StaggerItem>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Link href="#products" className={cn(buttonVariants({ size: "lg" }), "rounded-sm h-12 px-8 text-base")}>
                    Explore Products
                  </Link>
                  <Link href="#contact" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-sm h-12 px-8 text-base bg-white/10 text-white hover:bg-white/20 border-white/30 backdrop-blur-sm")}>
                    Contact Us
                  </Link>
                </div>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        {/* 3. About Us */}
        <section id="about" className="py-20 md:py-28 bg-white border-b border-slate-100 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <FadeIn direction="left" duration={0.8}>
                <div className="relative h-[400px] md:h-[500px] rounded-sm overflow-hidden shadow-xl">
                  <Image
                    src="https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80"
                    alt="Textile Loom Production"
                    fill
                    className="object-cover"
                  />
                </div>
              </FadeIn>
              <FadeIn direction="right" duration={0.8}>
                <div className="space-y-6">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
                    Crafting Quality Since 1995
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    LKTextiles is a leading manufacturer and exporter of premium fabrics. With decades of industry experience, we combine traditional craftsmanship with state-of-the-art technology to produce textiles that meet global standards.
                  </p>
                  <ul className="space-y-4 pt-4">
                    {[
                      "Over 25 years of industry excellence",
                      "State-of-the-art manufacturing facilities",
                      "Sustainable and ethical production practices",
                      "Global export network across 30+ countries"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center text-slate-700">
                        <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* 4. Product Categories */}
        <section id="categories" className="py-20 md:py-28 bg-slate-50 border-b border-slate-200">
          <div className="container px-4 md:px-6 mx-auto">
            <FadeIn direction="up">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Our Capabilities</h2>
                <p className="text-lg text-slate-600">
                  Explore our diverse range of textile products engineered for comfort, durability, and style.
                </p>
              </div>
            </FadeIn>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Woven Fabrics",
                  desc: "High-density woven fabrics suitable for shirting, suiting, and home textiles.",
                  img: "https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?auto=format&fit=crop&q=80"
                },
                {
                  title: "Knitted Fabrics",
                  desc: "Premium cotton and blended knits designed for activewear and casual clothing.",
                  img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80"
                },
                {
                  title: "Specialty Yarns",
                  desc: "Durable and color-fast yarns for industrial and commercial manufacturing.",
                  img: "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80"
                }
              ].map((category, i) => (
                <StaggerItem key={i}>
                  <Card className="rounded-sm border-slate-200 overflow-hidden group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                    <div className="h-60 overflow-hidden relative">
                      <Image
                        src={category.img}
                        alt={category.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{category.title}</h3>
                      <p className="text-slate-600 mb-4">{category.desc}</p>
                      <Link href="#contact" className="inline-flex items-center font-medium text-primary hover:underline">
                        View Products <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* 5. Why Choose Us */}
        <section className="py-20 md:py-28 bg-white border-b border-slate-100 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <FadeIn direction="up">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Why Partner With Us</h2>
              </div>
            </FadeIn>

            <div className="features-container grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: ShieldCheck, title: "Unmatched Quality", desc: "Rigorous testing and quality control at every stage." },
                { icon: Truck, title: "Reliable Supply", desc: "Consistent production capacity to meet bulk demands." },
                { icon: Scissors, title: "Custom Solutions", desc: "Tailored fabric specifications for unique requirements." },
                { icon: Clock, title: "Timely Delivery", desc: "Optimized logistics ensuring on-time global shipments." }
              ].map((feature, i) => (
                <div key={i} className="feature-card flex flex-col p-6 rounded-sm bg-slate-50 border border-slate-100 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
                  <div className="mb-4 text-primary bg-primary/10 p-3 rounded-full w-fit">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Featured Products */}
        <section id="products" className="py-20 md:py-28 bg-slate-900 text-slate-50 overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <FadeIn direction="up">
              <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="max-w-xl">
                  <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">Featured Fabrics</h2>
                  <p className="text-slate-400 text-lg">Browse our most requested materials utilized by top apparel brands.</p>
                </div>
                <Button variant="outline" className="rounded-sm border-slate-600 text-slate-300 hover:text-white hover:bg-slate-800">
                  Download Catalog
                </Button>
              </div>
            </FadeIn>

            <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "Premium Cotton Twill", img: "https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&q=80", weight: "240 GSM" },
                { name: "Organic Linen Blend", img: "https://images.unsplash.com/photo-1620799139834-6b8f844fbe61?auto=format&fit=crop&q=80", weight: "180 GSM" },
                { name: "Performance Knit", img: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80", weight: "210 GSM" },
                { name: "Denim Selvedge", img: "https://images.unsplash.com/photo-1542272201-b1ca555f8505?auto=format&fit=crop&q=80", weight: "12 Oz" }
              ].map((product, i) => (
                <StaggerItem key={i}>
                  <div className="group cursor-pointer">
                    <div className="h-64 overflow-hidden rounded-sm bg-slate-800 mb-4 relative">
                      <Image
                        src={product.img}
                        alt={product.name}
                        fill
                        className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                      />
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-xs px-2 py-1 rounded-sm border border-white/10 text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        {product.weight}
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg text-slate-100">{product.name}</h3>
                    <div className="mt-2 flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
                      Inquire Now <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        {/* 7. Contact Form Section */}
        <section id="contact" className="py-24 bg-primary text-primary-foreground overflow-hidden">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">

              {/* Left Side: Info */}
              <FadeIn direction="left" duration={0.8}>
                <div className="space-y-8">
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                    Ready to start your next production?
                  </h2>
                  <p className="text-lg md:text-xl text-primary-foreground/90 leading-relaxed">
                    Get in touch with our sales team for bulk inquiries, custom fabric development, and exact quotes. We typically respond within 24 hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button size="lg" className="rounded-sm h-14 px-8 text-base bg-white text-primary hover:bg-slate-100 font-semibold shadow-lg hover:scale-105 transition-transform">
                      Schedule a Call
                    </Button>
                    <Button size="lg" variant="outline" className="rounded-sm h-14 px-8 text-base bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white hover:scale-105 transition-transform">
                      Email Sales
                    </Button>
                  </div>
                </div>
              </FadeIn>

              {/* Right Side: Form */}
              <FadeIn direction="right" duration={0.8}>
                <div className="bg-white rounded-lg shadow-2xl p-8 md:p-10 text-slate-900">
                  <h3 className="text-2xl font-bold mb-6">Request a Quote</h3>
                  <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName">Full Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="fullName"
                          placeholder="John Doe"
                          className={cn("bg-slate-50 border-slate-200", errors.fullName && "border-red-500 focus-visible:ring-red-500")}
                          {...register("fullName")}
                          disabled={isSubmitting}
                        />
                        {errors.fullName && <p className="text-red-500 text-xs">{errors.fullName.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email">Work Email <span className="text-red-500">*</span></Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@company.com"
                          className={cn("bg-slate-50 border-slate-200", errors.email && "border-red-500 focus-visible:ring-red-500")}
                          {...register("email")}
                          disabled={isSubmitting}
                        />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          className={cn("bg-slate-50 border-slate-200", errors.phone && "border-red-500 focus-visible:ring-red-500")}
                          {...register("phone", {
                            onChange: (e) => {
                              let val = e.target.value;

                              if (val.length === 1 && /\d/.test(val)) {
                                val = "+91 " + val;
                              } else if (val.length < 4) {
                                val = "+91 ";
                              } else if (!val.startsWith("+91 ")) {
                                if (val.startsWith("+91")) {
                                  val = "+91 " + val.slice(3);
                                } else if (val.startsWith("91") && val.replace(/\D/g, "").length > 10) {
                                  val = "+91 " + val.slice(2);
                                } else {
                                  val = "+91 " + val;
                                }
                              }

                              let digits = val.slice(4).replace(/\D/g, "");
                              if (digits.length > 10) {
                                digits = digits.slice(0, 10);
                              }

                              const finalValue = "+91 " + digits;
                              e.target.value = finalValue;
                              setValue("phone", finalValue, { shouldValidate: true });
                            }
                          })}
                          disabled={isSubmitting}
                        />
                        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="company">Company / Brand Name</Label>
                        <Input
                          id="company"
                          placeholder="e.g. Acme Apparel"
                          className="bg-slate-50 border-slate-200"
                          {...register("company")}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          placeholder="Bulk Inquiry"
                          className="bg-slate-50 border-slate-200"
                          {...register("subject")}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message">Product Requirements <span className="text-red-500">*</span></Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us about your fabric needs, quantities, and timeline..."
                        className={cn("min-h-[120px] bg-slate-50 border-slate-200 resize-none", errors.message && "border-red-500 focus-visible:ring-red-500")}
                        {...register("message", {
                          onChange: (e) => {
                            const text = e.target.value;
                            const words = text.trim().split(/\s+/).filter(Boolean);
                            if (words.length > 100) {
                              // Truncate and update the form value directly
                              const truncated = words.slice(0, 100).join(" ") + (text.endsWith(" ") ? " " : "");
                              e.target.value = truncated;
                              setValue("message", truncated, { shouldValidate: true });
                            }
                          }
                        })}
                        disabled={isSubmitting}
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div>
                          {errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}
                        </div>
                        <span className={cn("text-xs", wordCount >= 100 ? "text-red-500 font-medium" : "text-slate-400")}>
                          {wordCount} / 100 words
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base rounded-sm shadow-md flex items-center justify-center disabled:opacity-50 hover:scale-[1.02] transition-transform"
                      disabled={isSubmitting || !isValid}
                    >
                      {isSubmitting ? "Sending..." : "Send Message"} <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </FadeIn>

            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <StaggerContainer className="container px-4 md:px-6 mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">

          <StaggerItem className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white mb-6">
              <span className="font-bold text-4xl tracking-tight">Lk Textiles</span>
            </div>
            <p className="text-sm leading-relaxed">
              Leading the global textile industry with sustainable practices and superior manufacturing capabilities since 1995.
            </p>
          </StaggerItem>

          <StaggerItem className="space-y-4">
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="#products" className="hover:text-white transition-colors">Products & Fabrics</Link></li>
              <li><Link href="#contact" className="hover:text-white transition-colors">Manufacturing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
            </ul>
          </StaggerItem>

          <StaggerItem className="space-y-4">
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Woven Fabrics</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Knits & Blends</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Yarn Production</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Custom Textiles</Link></li>
            </ul>
          </StaggerItem>

          <StaggerItem className="space-y-4">
            <h4 className="text-white font-semibold mb-4">Contact Info</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <span>Survey No.8, Plot No.29/1, Mahaprabhu Nagar, Limbayat, Gujarat, Surat, 395012</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                <div className="flex flex-col gap-1">
                  <span>+91 9825121931</span>
                  <span>+91 7069866165</span>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0" />
                <span>lktextiles6165@gmail.com</span>
              </li>
            </ul>
          </StaggerItem>

        </StaggerContainer>
        <div className="container px-4 md:px-6 mx-auto mt-16 pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© {new Date().getFullYear()} Lk Textiles. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
