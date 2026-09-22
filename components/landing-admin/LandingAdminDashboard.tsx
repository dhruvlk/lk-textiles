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
  Menu,
  X,
  ChevronRight,
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

interface TabConfig {
  key: TabKey
  label: string
  icon: LucideIcon
  description: string
}

const tabs: TabConfig[] = [
  { key: "brand", label: "Brand & Logo", icon: Building, description: "Manage brand identity, logos & company details" },
  { key: "seo", label: "SEO & Social", icon: Search, description: "Meta tags, page titles & OpenGraph social previews" },
  { key: "hero", label: "Hero Banner", icon: LayoutTemplate, description: "Main headline, visual slides, badge & call-to-actions" },
  { key: "heritage", label: "Heritage / About", icon: History, description: "Legacy narrative, timeline milestones & brand story" },
  { key: "capabilities", label: "Fabrics & Products", icon: Layers, description: "Product catalog, fabric categories & specifications" },
  { key: "advantages", label: "Why Choose Us", icon: ShieldCheck, description: "Key selling points, certifications & advantages" },
  { key: "contact", label: "Contact Details", icon: Phone, description: "Office address, phone numbers & inquiry contacts" },
  { key: "footer", label: "Footer", icon: FileText, description: "Copyright, social handles, links & legal credits" },
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const router = useRouter()

  const currentTab = useMemo(() => {
    return tabs.find((t) => t.key === activeTab) || tabs[0]
  }, [activeTab])

  // Ensure body scroll is unlocked when admin panel is active
  useEffect(() => {
    document.body.style.overflow = ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileNavOpen) {
        setMobileNavOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [mobileNavOpen])

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

  // Switch tab and smooth scroll to top of editor
  const handleTabSwitch = (key: TabKey) => {
    setActiveTab(key)
    setMobileNavOpen(false)
    const mainEl = document.getElementById("landing-admin-main")
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

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
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* DESKTOP LEFT SIDEBAR (Fixed / Sticky Left)                                */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white border-r border-slate-200/80 z-30 shadow-[1px_0_4px_rgba(0,0,0,0.02)] select-none">
        {/* Brand Header */}
        <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-200/80 shrink-0">
          <Link
            href="/"
            target="_blank"
            title="View Live Landing Page"
            className="flex items-center gap-3 group min-w-0"
          >
            <div className="relative flex items-center justify-center h-10 w-10 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-2xs group-hover:border-slate-300 transition-all shrink-0">
              <Image
                src={formData.brand?.logoUrl || "/logo-1.png"}
                alt={`${formData.brand?.name || "LK Textiles"} Logo`}
                width={80}
                height={80}
                className="h-full w-full object-contain p-1 group-hover:scale-105 transition-transform"
                priority
              />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 tracking-tight truncate group-hover:text-indigo-950 transition-colors">
                {formData.brand?.name || "LK Textiles"}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Landing CMS</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-1.5 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Page Sections
          </div>
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabSwitch(tab.key)}
                className={cn(
                  "group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left cursor-pointer",
                  isActive
                    ? "bg-slate-900 text-white font-bold shadow-sm shadow-slate-900/15"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 font-medium"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-white/15 text-amber-300"
                        : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80 group-hover:text-slate-700"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="truncate">{tab.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                )}
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer: Logged in status & Public Site Link */}
        <div className="p-3.5 border-t border-slate-200/80 bg-slate-50/70 shrink-0 space-y-2.5">
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-white border border-slate-200/70 shadow-2xs">
            <div className="w-7 h-7 rounded-lg bg-indigo-900 text-amber-300 text-[11px] font-bold flex items-center justify-center shrink-0 uppercase shadow-xs">
              {(adminEmail || "lktextiles6165@gmail.com").charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] text-slate-400 font-medium">Logged in</div>
              <div className="text-xs font-semibold text-slate-800 truncate" title={adminEmail || "lktextiles6165@gmail.com"}>
                {adminEmail || "lktextiles6165@gmail.com"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER (Slide-over for screens < md)                              */}
      {/* ========================================================================= */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />

          {/* Drawer Menu */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl overflow-hidden bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0">
                  <Image
                    src={formData.brand?.logoUrl || "/logo-1.png"}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="h-full w-full object-contain p-1"
                  />
                </div>
                <div className="text-sm font-extrabold text-slate-900 truncate">
                  CMS Navigation
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Sections
              </div>
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => handleTabSwitch(tab.key)}
                    className={cn(
                      "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left",
                      isActive
                        ? "bg-slate-900 text-white font-bold shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("w-4 h-4", isActive ? "text-amber-300" : "text-slate-400")} />
                      <span>{tab.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </button>
                )
              })}
            </div>

            <div className="p-3 border-t border-slate-200/80 bg-slate-50 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileNavOpen(false)
                  handleLogoutClick()
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 border border-rose-200/60"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RIGHT SIDE CONTAINER: TOP ACTION BAR + SCROLLABLE EDITOR                  */}
      {/* ========================================================================= */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top Sticky Header */}
        <header className="h-16 shrink-0 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-3 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Left: Mobile Toggle + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/70"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Breadcrumb Title */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="hidden sm:inline text-xs font-medium text-slate-400">
                CMS
              </span>
              <ChevronRight className="hidden sm:inline w-3 h-3 text-slate-300" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {currentTab.label}
                </span>
                {/* Save status badge */}
                {isDirty ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/70 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span className="hidden sm:inline">Unsaved Changes</span>
                    <span className="sm:hidden">Unsaved</span>
                  </span>
                ) : (
                  <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Saved & Live</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* View Live Site Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200/70 transition-all shadow-2xs"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>View Live Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
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
                <RotateCcw className="w-3.5 h-3.5 sm:mr-1.5" />
                <span className="hidden sm:inline">Discard</span>
              </Button>
            )}

            {/* Save / Publish Button */}
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || isSaving || Boolean(uploadingField)}
              onClick={handleSave}
              className={cn(
                "rounded-xl px-3.5 sm:px-4 text-xs font-bold transition-all shadow-sm",
                isDirty && !uploadingField
                  ? "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white hover:brightness-110 shadow-md shadow-slate-900/15 scale-[1.02] active:scale-[0.99]"
                  : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed shadow-none"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin" />
                  <span className="hidden sm:inline">Publishing...</span>
                </>
              ) : uploadingField ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:mr-1.5 animate-spin text-slate-400" />
                  <span className="hidden sm:inline">Uploading Image...</span>
                </>
              ) : (
                <>
                  {isDirty ? (
                    <Save className="w-3.5 h-3.5 sm:mr-1.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:mr-1.5 text-emerald-500" />
                  )}
                  <span>{isDirty ? "Publish Changes" : "All Changes Saved"}</span>
                </>
              )}
            </Button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogoutClick}
              title="Sign Out"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-transparent hover:border-rose-200/60 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Scrollable Content Container */}
        <main
          id="landing-admin-main"
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#F8F9FA] scroll-smooth"
        >
          <div className="max-w-5xl mx-auto space-y-6 pb-28">
            {/* Active Section Header Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center text-indigo-900 shadow-2xs shrink-0">
                  <currentTab.icon className="w-5 h-5 text-indigo-700" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    {currentTab.label}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentTab.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Section Tab Editor Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xs border border-slate-200/80 space-y-8">
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
      </div>

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
