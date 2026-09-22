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

export function CapabilitiesTab({ formData, setFormData, uploadingField, setUploadingField }: TabProps) {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Textile Fabrics & Bento Grid</h3>
        <p className="text-xs text-slate-500">Edit the 4 product highlight tiles shown on the landing page bento grid.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Section Title</Label>
          <Input
            value={formData.capabilities.title}
            onChange={(e) =>
              setFormData({ ...formData, capabilities: { ...formData.capabilities, title: e.target.value } })
            }
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Section Subtitle</Label>
          <Input
            value={formData.capabilities.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, capabilities: { ...formData.capabilities, subtitle: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-6">
        {formData.capabilities.products.map((prod, idx) => (
          <div
            key={prod.id || idx}
            className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Tile #{idx + 1}: {prod.title}
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Title</Label>
                <Input
                  value={prod.title}
                  onChange={(e) => {
                    const updated = [...formData.capabilities.products]
                    updated[idx] = { ...updated[idx], title: e.target.value }
                    setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, products: updated },
                    })
                  }}
                  className="h-10 text-sm bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Link Button Text</Label>
                <Input
                  value={prod.linkText}
                  onChange={(e) => {
                    const updated = [...formData.capabilities.products]
                    updated[idx] = { ...updated[idx], linkText: e.target.value }
                    setFormData({
                      ...formData,
                      capabilities: { ...formData.capabilities, products: updated },
                    })
                  }}
                  className="h-10 text-sm bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Description</Label>
              <Input
                value={prod.description}
                onChange={(e) => {
                  const updated = [...formData.capabilities.products]
                  updated[idx] = { ...updated[idx], description: e.target.value }
                  setFormData({
                    ...formData,
                    capabilities: { ...formData.capabilities, products: updated },
                  })
                }}
                className="h-10 text-sm bg-white"
              />
            </div>

            {prod.imageUrl && (
              <ImageUploaderField
                label="Tile Image"
                currentUrl={prod.imageUrl}
                fieldPath={`prod-${idx}`}
                uploadingField={uploadingField}
                aspectRatio="video"
                onUploadSuccess={(url) => {
                  const updated = [...formData.capabilities.products]
                  updated[idx] = { ...updated[idx], imageUrl: url }
                  setFormData({
                    ...formData,
                    capabilities: { ...formData.capabilities, products: updated },
                  })
                }}
                onRemove={() => {
                  const updated = [...formData.capabilities.products]
                  updated[idx] = { ...updated[idx], imageUrl: "" }
                  setFormData({
                    ...formData,
                    capabilities: { ...formData.capabilities, products: updated },
                  })
                }}
                onUploadStateChange={setUploadingField}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
