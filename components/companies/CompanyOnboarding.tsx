"use client"

import React, { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useCompany } from "@/components/company-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PhoneInput } from "@/components/ui/phone-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Building2, Sparkles, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { addCompany } from "@/services/companies.service"

const BUSINESS_TYPES = [
  "Grey Fabric Manufacturer",
  "Weaving Unit",
  "Warping Unit",
  "Textile Trader",
  "Yarn Trader",
  "Job Work Unit",
  "Dyeing & Printing Unit",
  "Processing Unit",
  "Distributor / Wholesaler",
  "Garment Manufacturer",
  "Other Textile Business",
]

export function CompanyOnboarding() {
  const { user } = useAuth()
  const { setCompanies, setSelectedCompany, refreshCompanies } = useCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [businessType, setBusinessType] = useState("Grey Fabric Manufacturer")
  const [mobile, setMobile] = useState(user?.mobile || "")
  const [gstNumber, setGstNumber] = useState("")
  const [address, setAddress] = useState("")

  const handleCreateFirstCompany = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Please enter your company name")
      return
    }

    if (!user) {
      toast.error("You must be signed in to create a company")
      return
    }

    setIsLoading(true)
    try {
      const newCompany = await addCompany({
        user_id: user.id,
        name: name.trim(),
        parent_company_id: null,
        phone: mobile || null,
        gst_number: gstNumber.trim().toUpperCase() || null,
        address: address.trim() || null,
        tagline: businessType,
        is_active: true,
      })

      toast.success(`Company "${newCompany.name}" created successfully!`)
      await refreshCompanies()
      setCompanies([newCompany])
      setSelectedCompany(newCompany)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create company")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-xl border-border/80 shadow-md">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-border/40 bg-muted/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              First Time Setup
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to your workspace
            </CardTitle>
            <CardDescription className="text-sm">
              Let&apos;s set up your business. Create your primary company to begin managing challans, stock, and orders.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleCreateFirstCompany} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="onboarding-company-name" className="text-xs font-semibold">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="onboarding-company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter company name"
                required
                className="h-10 text-sm"
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground">
                This will be your parent or primary business entity.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-business-type" className="text-xs font-semibold">
                  Business Type
                </Label>
                <Select value={businessType} onValueChange={(val) => setBusinessType(val || "Grey Fabric Manufacturer")}>
                  <SelectTrigger id="onboarding-business-type" className="h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="onboarding-mobile" className="text-xs font-semibold">
                  Business Phone
                </Label>
                <PhoneInput
                  id="onboarding-mobile"
                  value={mobile}
                  onChange={setMobile}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-gst" className="text-xs font-semibold">
                  GSTIN <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="onboarding-gst"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  placeholder="24ABKPL2829F1ZR"
                  maxLength={15}
                  className="h-10 font-mono text-xs uppercase"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="onboarding-address" className="text-xs font-semibold">
                  Office / Mill Address <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                </Label>
                <Textarea
                  id="onboarding-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, Industrial Area, City, State"
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold gap-2 mt-4"
              loading={isLoading}
            >
              {isLoading ? "Creating Company..." : "Create your first company"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
