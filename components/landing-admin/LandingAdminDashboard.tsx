"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Save,
  RotateCcw,
  ExternalLink,
  LogOut,
  Loader2,
  LayoutTemplate,
  Search,
  Layers,
  History,
  ShieldCheck,
  Phone,
  FileText,
  Building,
  CheckCircle2,
  Globe,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LandingPageContent } from "@/types/landing-content"
import { defaultLandingContent } from "@/constants/default-landing-content"
import { cn } from "@/lib/utils"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"

import { BrandTab } from "./tabs/BrandTab"
import { SeoTab } from "./tabs/SeoTab"
import { HeroTab } from "./tabs/HeroTab"
import { HeritageTab } from "./tabs/HeritageTab"
import { CapabilitiesTab } from "./tabs/CapabilitiesTab"
import { AdvantagesTab } from "./tabs/AdvantagesTab"
import { ContactTab } from "./tabs/ContactTab"
import { FooterTab } from "./tabs/FooterTab"

interface LandingAdminDashboardProps {
  adminEmail?: string
  onLogout: () => void
}

type TabKey = "brand" | "seo" | "hero" | "heritage" | "capabilities" | "advantages" | "contact" | "footer"

const tabs: { key: TabKey; label: string; icon: LucideIcon }[] = [
  { key: "brand", label: "Brand & Logo", icon: Building },
  { key: "seo", label: "SEO & Social", icon: Search },
  { key: "hero", label: "Hero Banner", icon: LayoutTemplate },
  { key: "heritage", label: "Heritage / About", icon: History },
  { key: "capabilities", label: "Fabrics & Products", icon: Layers },
  { key: "advantages", label: "Why Choose Us", icon: ShieldCheck },
  { key: "contact", label: "Contact Details", icon: Phone },
  { key: "footer", label: "Footer", icon: FileText },
]

export function LandingAdminDashboard({ adminEmail, onLogout }: LandingAdminDashboardProps) {
  const [initialData, setInitialData] = useState<LandingPageContent>(defaultLandingContent)
  const [formData, setFormData] = useState<LandingPageContent>(defaultLandingContent)
  const [activeTab, setActiveTab] = useState<TabKey>("hero")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  // Ensure body scroll is unlocked when admin panel is active
  useEffect(() => {
    document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    let ignore = false
    fetch("/api/admin/landing/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore) {
          if (data) {
            setInitialData(data)
            setFormData(data)
          } else {
            toast.error("Could not load latest content, using defaults.")
          }
        }
      })
      .catch(() => {
        toast.error("Failed to connect to content service.")
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false)
        }
      })

    return () => {
      ignore = true
    }
  }, [])

  // Check if dirty (changes exist)
  const isDirty = useMemo(() => {
    return JSON.stringify(initialData) !== JSON.stringify(formData)
  }, [initialData, formData])

  // Save & publish changes
  const handleSave = async () => {
    if (!isDirty || isSaving) return

    // 1. Prevent publishing while an image upload is in flight
    if (uploadingField) {
      toast.error("Please wait for the current image upload to finish before publishing.")
      return
    }

    // 2. Client-side field validation
    if (!formData.brand?.name?.trim()) {
      toast.error("Company / Brand Name cannot be empty.")
      return
    }
    if (!formData.hero?.titlePrefix?.trim() && !formData.hero?.titleGradient?.trim()) {
      toast.error("Hero headline cannot be empty.")
      return
    }
    if (formData.contact?.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.contact.email.trim())) {
        toast.error("Please enter a valid contact email address.")
        return
      }
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/landing/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to publish changes.")
      }

      const published = result.content || formData
      setInitialData(published)

      // Broadcast to any open public landing page tabs for real-time live sync
      try {
        localStorage.setItem("lk_landing_published_at", Date.now().toString())
        if (typeof window !== "undefined" && "BroadcastChannel" in window) {
          const channel = new BroadcastChannel("lk_landing_channel")
          channel.postMessage({ type: "CONTENT_PUBLISHED", timestamp: Date.now() })
          channel.close()
        }
      } catch {
        // Fallback gracefully
      }

      toast.success("Changes published successfully.")
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred while saving.")
    } finally {
      setIsSaving(false)
    }
  }

  // Discard changes
  const handleDiscard = () => {
    setFormData(initialData)
    toast.info("Unsaved changes discarded.")
  }

  // Open sign out confirmation modal
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  // Execute confirmed sign out and redirect to /admin/login
  const handleConfirmLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      const res = await fetch("/api/admin/landing/logout", { method: "POST" })
      if (res.ok) {
        toast.success("Logged out successfully.")
      }
    } catch {
      toast.error("Logout request failed.")
    } finally {
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
      onLogout()
      router.push("/admin/login")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-slate-800" />
        <div className="text-sm font-semibold text-slate-600">Loading Landing Page Content...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#F8F9FA] text-slate-900 overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Status */}
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href="/"
              target="_blank"
              title="View Public Site"
              className="relative flex items-center justify-center h-12 w-12 shadow-xs hover:shadow-sm transition-all shrink-0 group"
            >
              <Image
                src={formData.brand?.logoUrl || "/logo-1.png"}
                alt={`${formData.brand?.name || "LK Textiles"} Logo`}
                width={150}
                height={100}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                priority
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  Landing Page Content Manager
                </h1>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100/90 border border-slate-200/70 text-[11px] text-slate-600 font-medium">
                  <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-900 text-[9px] font-bold text-amber-300 uppercase">
                    {(adminEmail || "lktextiles6165@gmail.com").charAt(0)}
                  </span>
                  <span className="text-slate-400 font-normal">Logged in as:</span>
                  <strong className="text-slate-800 font-semibold">{adminEmail || "lktextiles6165@gmail.com"}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* View Live Site Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/70 transition-all shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </Link>

            {/* Discard Button */}
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                className="rounded-xl text-xs font-semibold text-amber-700 bg-amber-50/80 hover:bg-amber-100/80 border-amber-200/80 shadow-2xs transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
            )}

            {/* Save / Publish Button */}
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || isSaving || Boolean(uploadingField)}
              onClick={handleSave}
              className={cn(
                "rounded-xl px-4 sm:px-5 text-xs font-bold transition-all shadow-sm",
                isDirty && !uploadingField
                  ? "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white hover:brightness-110 shadow-md shadow-slate-900/15 scale-[1.02] active:scale-[0.99]"
                  : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed shadow-none"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publishing...
                </>
              ) : uploadingField ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-slate-400" />
                  Uploading Image...
                </>
              ) : (
                <>
                  {isDirty ? (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                  )}
                  {isDirty ? "Publish Changes" : "All Changes Saved"}
                </>
              )}
            </Button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogoutClick}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200/60 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content Container */}
      <main
        id="landing-admin-main"
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden w-full"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-24">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none border-b border-slate-200/80">
          <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80 shrink-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shrink-0 transition-all duration-200",
                    isActive
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Contents */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8">
          {activeTab === "brand" && (
            <BrandTab
              formData={formData}
              setFormData={setFormData}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
            />
          )}

          {activeTab === "seo" && (
            <SeoTab
              formData={formData}
              setFormData={setFormData}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
            />
          )}

          {activeTab === "hero" && (
            <HeroTab
              formData={formData}
              setFormData={setFormData}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
            />
          )}

          {activeTab === "heritage" && (
            <HeritageTab
              formData={formData}
              setFormData={setFormData}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
            />
          )}

          {activeTab === "capabilities" && (
            <CapabilitiesTab
              formData={formData}
              setFormData={setFormData}
              uploadingField={uploadingField}
              setUploadingField={setUploadingField}
            />
          )}

          {activeTab === "advantages" && (
            <AdvantagesTab
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {activeTab === "contact" && (
            <ContactTab
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {activeTab === "footer" && (
            <FooterTab
              formData={formData}
              setFormData={setFormData}
            />
          )}
          </div>
        </div>
      </main>

      {/* Sign Out Confirmation Modal */}
      <ConfirmationDialog
        open={logoutDialogOpen}
        onOpenChange={setLogoutDialogOpen}
        title="Sign Out"
        description="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        variant="destructive"
        icon={<LogOut className="w-5 h-5 text-rose-600" />}
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}
