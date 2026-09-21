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

export function SeoTab({ formData, setFormData, uploadingField, setUploadingField }: TabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">SEO & Social Meta</h3>
        <p className="text-xs text-slate-500">Configure page title, meta description, and social share preview image.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Meta Title</Label>
          <Input
            value={formData.seo.title}
            onChange={(e) =>
              setFormData({ ...formData, seo: { ...formData.seo, title: e.target.value } })
            }
            className="h-11"
          />
          <p className="text-[11px] text-slate-400">
            Recommended length: 50-60 characters ({formData.seo.title.length} characters).
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Meta Description</Label>
          <Textarea
            rows={3}
            value={formData.seo.description}
            onChange={(e) =>
              setFormData({ ...formData, seo: { ...formData.seo, description: e.target.value } })
            }
            className="resize-none"
          />
          <p className="text-[11px] text-slate-400">
            Recommended length: 110-155 characters ({formData.seo.description.length} characters).
          </p>
        </div>

        <ImageUploaderField
          label="OpenGraph / Social Preview Image"
          description="Recommended: 1200 x 630 pixels PNG or JPG."
          currentUrl={formData.seo.ogImage}
          fieldPath="seo.ogImage"
          uploadingField={uploadingField}
          aspectRatio="video"
          onUploadSuccess={(url) =>
            setFormData({ ...formData, seo: { ...formData.seo, ogImage: url } })
          }
          onUploadStateChange={setUploadingField}
        />
      </div>
    </div>
  )
}
