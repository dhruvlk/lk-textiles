"use client"

import { useMemo, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { PageHeader } from "@/components/common/PageHeader"
import { CompanyAvatar } from "@/components/companies/CompanyAvatar"
import { addCompany, updateCompany, uploadCompanyLogo } from "@/services/companies.service"

export default function CompanyNewClient() {
  const router = useRouter()
  const { user } = useAuth()
  const { companies, setCompanies, setSelectedCompany, refreshCompanies } = useCompany()
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [companyName, setCompanyName] = useState("")
  const logoPreviewUrl = useMemo(
    () => (logoFile ? URL.createObjectURL(logoFile) : null),
    [logoFile]
  )

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      toast.error("You must be logged in to create a company")
      return
    }

    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    try {
      const newCompany = await addCompany({
        user_id: user.id,
        name: formData.get("name") as string,
        logo_url: null,
        gst_number: (formData.get("gst_number") as string) || null,
        hsn_code: (formData.get("hsn_code") as string) || null,
        address: (formData.get("address") as string) || null,
        city: (formData.get("city") as string) || null,
        state: (formData.get("state") as string) || null,
        pincode: (formData.get("pincode") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        website: (formData.get("website") as string) || null,
        pan_number: (formData.get("pan_number") as string) || null,
        tagline: (formData.get("tagline") as string) || null,
        bank_name: (formData.get("bank_name") as string) || null,
        account_name: (formData.get("account_name") as string) || null,
        account_number: (formData.get("account_number") as string) || null,
        ifsc_code: (formData.get("ifsc_code") as string) || null,
        branch: (formData.get("branch") as string) || null,
        bank_details: (formData.get("bank_details") as string) || null,
        terms_conditions: (formData.get("terms_conditions") as string) || null,
        signature_url: null,
        is_active: companies.length === 0,
      })

      let finalCompany = newCompany
      if (logoFile) {
        const logoUrl = await uploadCompanyLogo(newCompany.id, logoFile)
        finalCompany = await updateCompany({ ...newCompany, logo_url: logoUrl })
      }

      toast.success("Company created successfully!")
      await refreshCompanies()
      setCompanies([finalCompany, ...companies])
      setSelectedCompany(finalCompany)
      router.push("/admin/companies")
    } catch (error: unknown) {
      console.error("Failed to create company:", error)
      toast.error(error instanceof Error ? error.message : "Failed to create company")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Add company"
        description="Enter company, bank, and terms details used on challan PDFs."
      />
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold">Basic Information</h3>
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" name="name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input id="tagline" name="tagline" placeholder="e.g. Manufacturers : Art Silk Cloth" />
              </div>
              <div className="flex items-center gap-4">
                <CompanyAvatar
                  name={companyName || "Company"}
                  logoUrl={logoPreviewUrl}
                  size="sidebar"
                />
                <div className="flex-1 space-y-2">
                  <Label htmlFor="logo">Logo</Label>
                  <Input id="logo" type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-muted-foreground">
                    Upload a logo or leave blank to use initials automatically.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input id="gst_number" name="gst_number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hsn_code">HSN Code</Label>
                  <Input id="hsn_code" name="hsn_code" placeholder="e.g. 5407" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input id="pan_number" name="pan_number" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input id="website" name="website" placeholder="https://example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea id="address" name="address" className="min-h-[80px]" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" name="state" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input id="pincode" name="pincode" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input id="bank_name" name="bank_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Input id="branch" name="branch" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="account_name">Account Name</Label>
                  <Input id="account_name" name="account_name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input id="account_number" name="account_number" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input id="ifsc_code" name="ifsc_code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_details">Additional Bank Notes</Label>
                <Textarea id="bank_details" name="bank_details" className="min-h-[80px]" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_conditions">Terms & Conditions</Label>
              <Textarea
                id="terms_conditions"
                name="terms_conditions"
                className="min-h-[160px]"
                placeholder="One term per line"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Company
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
