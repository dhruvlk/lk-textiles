"use client"

import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { PhoneInput } from "@/components/ui/phone-input"
import { cn } from "@/lib/utils"
import { useLandingContent } from "@/context/LandingContentContext"

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
  const { contact, heritage } = useLandingContent()
  const facilityImage = heritage?.image1Url || "https://zizfqhfcqheqtourwikd.supabase.co/storage/v1/object/public/landing-assets/images/1790055042186-yw4k1b.jpg"
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
      fullName: "", email: "", phone: "", company: "", subject: "", message: ""
    }
  })

  const messageValue = useWatch({ name: "message", control }) || ""
  const wordCount = messageValue.trim() ? messageValue.trim().split(/\s+/).filter(Boolean).length : 0

  const truncateTo100Words = (raw: string): string => {
    let count = 0;
    let cutIndex = raw.length;
    const regex = /\S+/g;
    while (regex.exec(raw) !== null) {
      count++;
      if (count === 100) {
        cutIndex = regex.lastIndex;
        break;
      }
    }
    return raw.slice(0, cutIndex);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const words = raw.trim().split(/\s+/).filter(Boolean);

    if (words.length > 100) {
      const truncated = truncateTo100Words(raw);
      e.target.value = truncated;
      setValue("message", truncated, { shouldValidate: true, shouldDirty: true });
      return;
    }

    setValue("message", raw, { shouldValidate: true, shouldDirty: true });
  };

  const handleMessageKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const allowedKeys = [
      "Backspace", "Delete", "Tab", "Escape",
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", "PageUp", "PageDown"
    ];
    if (allowedKeys.includes(e.key)) return;

    const target = e.currentTarget;
    const hasSelection = (target.selectionEnd ?? 0) > (target.selectionStart ?? 0);
    if (hasSelection) return;

    // Prevent starting a 101st word
    const text = target.value;
    const words = text.trim().split(/\s+/).filter(Boolean);
    if (words.length >= 100 && (e.key === " " || e.key === "Enter")) {
      const cursorAtEnd = (target.selectionStart ?? 0) >= text.trimEnd().length;
      if (cursorAtEnd) {
        e.preventDefault();
      }
    }
  };

  const handleMessagePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    const target = e.currentTarget;
    const start = target.selectionStart ?? 0;
    const end = target.selectionEnd ?? 0;
    const before = target.value.slice(0, start);
    const after = target.value.slice(end);
    const combined = before + pastedText + after;
    const words = combined.trim().split(/\s+/).filter(Boolean);

    if (words.length > 100) {
      e.preventDefault();
      const truncated = truncateTo100Words(combined);
      target.value = truncated;
      setValue("message", truncated, { shouldValidate: true, shouldDirty: true });
    }
  };

  // Auto-truncate existing or pre-filled value if it ever exceeds 100 words
  useEffect(() => {
    if (wordCount > 100) {
      const truncated = truncateTo100Words(messageValue);
      setValue("message", truncated, { shouldValidate: true });
    }
  }, [messageValue, wordCount, setValue]);

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
          {facilityImage ? (
            <Image
              src={facilityImage}
              alt="Textile manufacturing facility by LK Textiles"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover opacity-50"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 to-slate-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/40 to-slate-900" />
        </div>

        {/* Right Form Pane */}
        <div className="relative flex items-center justify-center p-8 sm:p-12 lg:p-16 w-full">
          <div className="w-full max-w-xl bg-white/95 backdrop-blur-md p-8 sm:p-10 rounded-3xl shadow-2xl border border-white/20">
            <div className="mb-8">
              <span className="text-primary font-semibold text-xs tracking-widest uppercase mb-2 block">
                {contact?.title || "Let's Talk"}
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {contact?.subtitle || "Start a Conversation"}
              </h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field, fieldState, formState }) => {
                      const showPhoneError = Boolean(
                        (fieldState.isTouched || formState.isSubmitted) && fieldState.error?.message
                      )
                      return (
                        <>
                          <PhoneInput
                            id="phone"
                            variant="underline"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            error={showPhoneError ? fieldState.error?.message : undefined}
                            showError={false}
                            disabled={isSubmitting}
                          />
                          {showPhoneError && (
                            <p className="text-red-500 text-xs mt-1">{fieldState.error?.message}</p>
                          )}
                        </>
                      )
                    }}
                  />
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
                  onChange={handleMessageChange}
                  onKeyDown={handleMessageKeyDown}
                  onPaste={handleMessagePaste}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between items-center mt-2">
                  <div>{errors.message && <p className="text-red-500 text-xs">{errors.message.message}</p>}</div>
                  <span className={cn("text-xs font-medium", wordCount >= 100 ? "text-amber-600 font-semibold" : "text-slate-500")}>
                    {wordCount} / 100 words {wordCount >= 100 && "(Max reached)"}
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
