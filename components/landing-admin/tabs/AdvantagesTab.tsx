"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LandingPageContent } from "@/types/landing-content"

interface TabProps {
  formData: LandingPageContent
  setFormData: React.Dispatch<React.SetStateAction<LandingPageContent>>
}

export function AdvantagesTab({ formData, setFormData }: TabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Why Choose LK Textiles</h3>
        <p className="text-xs text-slate-500">Edit the advantage cards presented to B2B buyers.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6 pb-4 border-b border-slate-100">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Section Title</Label>
          <Input
            value={formData.advantages.title}
            onChange={(e) =>
              setFormData({ ...formData, advantages: { ...formData.advantages, title: e.target.value } })
            }
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Section Subtitle</Label>
          <Input
            value={formData.advantages.subtitle}
            onChange={(e) =>
              setFormData({ ...formData, advantages: { ...formData.advantages, subtitle: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        {formData.advantages.items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3"
          >
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pillar #{idx + 1}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Title</Label>
              <Input
                value={item.title}
                onChange={(e) => {
                  const updated = [...formData.advantages.items]
                  updated[idx] = { ...updated[idx], title: e.target.value }
                  setFormData({
                    ...formData,
                    advantages: { ...formData.advantages, items: updated },
                  })
                }}
                className="h-10 text-sm bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-600 font-semibold">Description</Label>
              <Input
                value={item.desc}
                onChange={(e) => {
                  const updated = [...formData.advantages.items]
                  updated[idx] = { ...updated[idx], desc: e.target.value }
                  setFormData({
                    ...formData,
                    advantages: { ...formData.advantages, items: updated },
                  })
                }}
                className="h-10 text-sm bg-white"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
