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

export function ContactTab({ formData, setFormData }: TabProps) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-xl font-bold text-slate-900">Contact Information</h3>
        <p className="text-xs text-slate-500">
          Update plant address, telephone lines, inquiry email, and working hours.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-700">Surat Mill Address</Label>
          <Textarea
            rows={2}
            value={formData.contact.address}
            onChange={(e) =>
              setFormData({ ...formData, contact: { ...formData.contact, address: e.target.value } })
            }
            className="resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Primary Phone</Label>
            <Input
              value={formData.contact.phone1}
              onChange={(e) =>
                setFormData({ ...formData, contact: { ...formData.contact, phone1: e.target.value } })
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Secondary Phone</Label>
            <Input
              value={formData.contact.phone2}
              onChange={(e) =>
                setFormData({ ...formData, contact: { ...formData.contact, phone2: e.target.value } })
              }
              className="h-11"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Official Email</Label>
            <Input
              type="email"
              value={formData.contact.email}
              onChange={(e) =>
                setFormData({ ...formData, contact: { ...formData.contact, email: e.target.value } })
              }
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Operating Hours</Label>
            <Input
              value={formData.contact.hours}
              onChange={(e) =>
                setFormData({ ...formData, contact: { ...formData.contact, hours: e.target.value } })
              }
              className="h-11"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
