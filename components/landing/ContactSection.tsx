"use client"

import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import Image from "next/image"
import confetti from "canvas-confetti"
import { Send } from "lucide-react"

import { contactFormSchema, type ContactFormValues } from "@/lib/validations/contact"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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

export function ContactSection() {
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
            <h3 className="text-4xl font-bold text-white mb-4">Let&apos;s craft something exceptional.</h3>
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
                  className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg text-slate-900 placeholder:text-slate-300 transition-colors"
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
                    className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg text-slate-900 placeholder:text-slate-300 transition-colors"
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
                    className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg text-slate-900 placeholder:text-slate-300 transition-colors"
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
                    className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg text-slate-900 placeholder:text-slate-300 transition-colors"
                    {...register("company")}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Bulk Inquiry"
                    className="border-0 border-b-2 border-slate-200 rounded-none px-0 py-2 focus-visible:ring-0 focus-visible:border-primary bg-transparent text-lg text-slate-900 placeholder:text-slate-300 transition-colors"
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
                  className="border-2 border-slate-200 rounded-xl p-4 focus-visible:ring-0 focus-visible:border-primary bg-slate-50 text-base text-slate-900 placeholder:text-slate-300 resize-none min-h-[120px] transition-colors"
                  {...register("message")}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  <div>{errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}</div>
                  <span className={cn("text-xs font-medium", wordCount >= 100 ? "text-red-500" : "text-slate-500")}>
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
  )
}
