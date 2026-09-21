"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageUploaderField } from "../ImageUploaderField"
import { LandingPageContent } from "@/types/landing-content"

interface TabProps {
  formData: LandingPageContent
  setFormData: React.Dispatch<React.SetStateAction<LandingPageContent>>
  uploadingField: string | null
  setUploadingField: (field: string | null) => void
}

export function HeroTab({ formData, setFormData, uploadingField, setUploadingField }: TabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Hero Section Banners & Copy</h3>
        <p className="text-xs text-slate-500">Edit the primary headline, hero image, CTA buttons, and export metrics.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Hero Pulsing Badge</Label>
          <Input
            value={formData.hero.badge}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, badge: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Trusted Client Count</Label>
          <Input
            value={formData.hero.trustedCount}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, trustedCount: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Headline Prefix (Black text)</Label>
          <Input
            value={formData.hero.titlePrefix}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, titlePrefix: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Headline Highlight (Gradient text)</Label>
          <Input
            value={formData.hero.titleGradient}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, titleGradient: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-700">Hero Description Paragraph</Label>
        <Textarea
          rows={3}
          value={formData.hero.description}
          onChange={(e) =>
            setFormData({ ...formData, hero: { ...formData.hero, description: e.target.value } })
          }
          className="resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Primary CTA Button Text</Label>
          <Input
            value={formData.hero.primaryCtaText}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, primaryCtaText: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Primary CTA Target Link</Label>
          <Input
            value={formData.hero.primaryCtaLink}
            onChange={(e) =>
              setFormData({ ...formData, hero: { ...formData.hero, primaryCtaLink: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      {/* Hero Image & Floating Badge */}
      <div className="pt-4 border-t border-slate-100 space-y-4">
        <ImageUploaderField
          label="Hero Showcase Image"
          description="High-resolution fabric manufacturing or mill image."
          currentUrl={formData.hero.imageUrl}
          fieldPath="hero.imageUrl"
          uploadingField={uploadingField}
          aspectRatio="hero"
          onUploadSuccess={(url) =>
            setFormData({ ...formData, hero: { ...formData.hero, imageUrl: url } })
          }
          onUploadStateChange={setUploadingField}
        />

        <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div>
            <Label className="text-[11px] text-slate-500 font-semibold">Floating Badge Title</Label>
            <Input
              value={formData.hero.exportBadgeTitle}
              onChange={(e) =>
                setFormData({ ...formData, hero: { ...formData.hero, exportBadgeTitle: e.target.value } })
              }
              className="h-10 text-xs mt-1 bg-white"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-500 font-semibold">Floating Badge Value</Label>
            <Input
              value={formData.hero.exportBadgeValue}
              onChange={(e) =>
                setFormData({ ...formData, hero: { ...formData.hero, exportBadgeValue: e.target.value } })
              }
              className="h-10 text-xs mt-1 bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
