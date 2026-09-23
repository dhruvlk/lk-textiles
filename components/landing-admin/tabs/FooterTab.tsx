"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LandingPageContent } from "@/types/landing-content"

interface TabProps {
  formData: LandingPageContent
  setFormData: React.Dispatch<React.SetStateAction<LandingPageContent>>
}

export function FooterTab({ formData, setFormData }: TabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Footer Content</h3>
        <p className="text-xs text-slate-500">Edit the footer summary text and copyright declaration.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Footer Mission Statement</Label>
          <Textarea
            rows={3}
            value={formData.footer.description}
            onChange={(e) =>
              setFormData({ ...formData, footer: { ...formData.footer, description: e.target.value } })
            }
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Copyright Line</Label>
          <Input
            value={formData.footer.copyright}
            onChange={(e) =>
              setFormData({ ...formData, footer: { ...formData.footer, copyright: e.target.value } })
            }
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">WhatsApp Contact Link</Label>
          <Input
            value={formData.footer.socialLinks.whatsapp || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                footer: {
                  ...formData.footer,
                  socialLinks: { ...formData.footer.socialLinks, whatsapp: e.target.value },
                },
              })
            }
            placeholder="https://wa.me/919825121931"
            className="h-11"
          />
        </div>
      </div>
    </div>
  )
}
