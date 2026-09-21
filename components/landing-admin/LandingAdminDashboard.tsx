"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Save,
  RotateCcw,
  ExternalLink,
  LogOut,
  Loader2,
  Sparkles,
  LayoutTemplate,
  Search,
  Layers,
  History,
  ShieldCheck,
  Phone,
  FileText,
  Building,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { LandingPageContent } from "@/types/landing-content"
import { defaultLandingContent } from "@/constants/default-landing-content"
import { cn } from "@/lib/utils"

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

  // Save changes
  const handleSave = async () => {
    if (!isDirty || isSaving) return

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/landing/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || "Failed to save content.")
      }

      setInitialData(result.content || formData)
      toast.success("Landing page content published successfully!")
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

  // Logout
  const handleLogoutClick = async () => {
    try {
      await fetch("/api/admin/landing/logout", { method: "POST" })
      toast.success("Logged out successfully.")
      onLogout()
    } catch {
      onLogout()
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
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 pb-20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">
                  Landing Page Content Manager
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                  Live Editor
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Logged in as: <strong className="text-slate-700">{adminEmail || "lktextiles6165@gmail.com"}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Live Site Link */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <span>View Public Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Discard Button */}
            {isDirty && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDiscard}
                className="rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Discard
              </Button>
            )}

            {/* Save Button */}
            <Button
              type="button"
              size="sm"
              disabled={!isDirty || isSaving}
              onClick={handleSave}
              className={cn(
                "rounded-xl px-5 text-xs font-bold transition-all shadow-sm",
                isDirty
                  ? "bg-slate-900 text-white hover:bg-slate-800 shadow-md scale-102"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  {isDirty ? "Publish Changes" : "Up to Date"}
                </>
              )}
            </Button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogoutClick}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 pt-8">
        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none border-b border-slate-200/80">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 transition-all duration-200",
                  isActive
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
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
      </main>
    </div>
  )
}
