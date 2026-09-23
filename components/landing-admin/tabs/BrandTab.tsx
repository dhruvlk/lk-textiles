"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageUploaderField } from "../ImageUploaderField"
import { LandingPageContent } from "@/types/landing-content"

interface TabProps {
  formData: LandingPageContent
  setFormData: React.Dispatch<React.SetStateAction<LandingPageContent>>
  uploadingField: string | null
  setUploadingField: (field: string | null) => void
}

export function BrandTab({ formData, setFormData, uploadingField, setUploadingField }: TabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Brand Identity & Logo</h3>
        <p className="text-xs text-slate-500">Edit company display name, tagline, and corporate logo.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Company / Brand Name</Label>
          <Input
            value={formData.brand.name}
            onChange={(e) =>
              setFormData({ ...formData, brand: { ...formData.brand, name: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Tagline</Label>
          <Input
            value={formData.brand.tagline}
            onChange={(e) =>
              setFormData({ ...formData, brand: { ...formData.brand, tagline: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <ImageUploaderField
          label="Corporate Logo"
          description="High-resolution PNG or SVG with transparent background recommended."
          currentUrl={formData.brand.logoUrl}
          fieldPath="brand.logoUrl"
          uploadingField={uploadingField}
          aspectRatio="wide"
          onUploadSuccess={(url) =>
            setFormData({ ...formData, brand: { ...formData.brand, logoUrl: url } })
          }
          onRemove={() =>
            setFormData({ ...formData, brand: { ...formData.brand, logoUrl: "/logo-1.png" } })
          }
          onUploadStateChange={setUploadingField}
        />
      </div>
    </div>
  )
}
