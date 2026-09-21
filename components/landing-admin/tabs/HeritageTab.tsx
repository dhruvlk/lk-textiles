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

export function HeritageTab({ formData, setFormData, uploadingField, setUploadingField }: TabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Heritage & About Section</h3>
        <p className="text-xs text-slate-500">Edit the dark-themed heritage and About section on the landing page.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Section Badge</Label>
          <Input
            value={formData.heritage.badge}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, badge: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Heading Title</Label>
          <Input
            value={formData.heritage.title}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, title: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-bold text-slate-700">Narrative Description</Label>
        <Textarea
          rows={4}
          value={formData.heritage.description}
          onChange={(e) =>
            setFormData({ ...formData, heritage: { ...formData.heritage, description: e.target.value } })
          }
          className="resize-none"
        />
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 font-semibold">Stat 1 Value</Label>
          <Input
            value={formData.heritage.stat1Value}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, stat1Value: e.target.value } })
            }
            className="h-10 text-sm bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 font-semibold">Stat 1 Label</Label>
          <Input
            value={formData.heritage.stat1Label}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, stat1Label: e.target.value } })
            }
            className="h-10 text-sm bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 font-semibold">Stat 2 Value</Label>
          <Input
            value={formData.heritage.stat2Value}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, stat2Value: e.target.value } })
            }
            className="h-10 text-sm bg-white"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-slate-500 font-semibold">Stat 2 Label</Label>
          <Input
            value={formData.heritage.stat2Label}
            onChange={(e) =>
              setFormData({ ...formData, heritage: { ...formData.heritage, stat2Label: e.target.value } })
            }
            className="h-10 text-sm bg-white"
          />
        </div>
      </div>

      {/* Heritage Images */}
      <div className="grid sm:grid-cols-2 gap-6 pt-2">
        <ImageUploaderField
          label="Loom Photo 1 (Main)"
          description="High-resolution photo of airjet/rapier looms."
          currentUrl={formData.heritage.image1Url}
          fieldPath="heritage.image1Url"
          uploadingField={uploadingField}
          aspectRatio="video"
          onUploadSuccess={(url) =>
            setFormData({ ...formData, heritage: { ...formData.heritage, image1Url: url } })
          }
          onUploadStateChange={setUploadingField}
        />

        <ImageUploaderField
          label="Yarns Photo 2 (Overlay)"
          description="High-resolution photo of yarn bobbins or textures."
          currentUrl={formData.heritage.image2Url}
          fieldPath="heritage.image2Url"
          uploadingField={uploadingField}
          aspectRatio="video"
          onUploadSuccess={(url) =>
            setFormData({ ...formData, heritage: { ...formData.heritage, image2Url: url } })
          }
          onUploadStateChange={setUploadingField}
        />
      </div>
    </div>
  )
}
