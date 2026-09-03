"use client"
/* eslint-disable react-hooks/set-state-in-effect */

/**
 * Company Settings UI — temporarily disabled via FEATURES.companySettingsModule.
 * Kept on disk so the module can be re-enabled without rebuilding from scratch.
 */

import { useEffect, useState } from "react"
import { Building2, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCompany } from "@/components/company-provider"
import { usePermissions } from "@/context/PermissionContext"
import { AccessDenied } from "@/components/auth/AccessDenied"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { CompanyAvatar } from "@/components/companies/CompanyAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  updateCompany,
  uploadCompanyLogo,
} from "@/services/companies.service"
import {
  deleteCompanyBankAccount,
  getCompanyBankAccounts,
  setDefaultCompanyBankAccount,
  upsertCompanyBankAccount,
} from "@/services/company-banks.service"
import { createNotification } from "@/services/notifications.service"
import { applyCompanyTheme } from "@/lib/company-theme"
import type { Company, CompanyBankAccount, DefaultGstType, NumberFyFormat } from "@/types"
import { cn } from "@/lib/utils"

const SECTIONS = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding" },
  { id: "numbering", label: "Invoice & Challan" },
  { id: "banks", label: "Bank Details" },
  { id: "terms", label: "Terms" },
  { id: "defaults", label: "Defaults" },
  { id: "theme", label: "Theme" },
] as const

type SectionId = (typeof SECTIONS)[number]["id"]

export default function SettingsClient() {
  const { selectedCompany, setSelectedCompany, refreshCompanies } = useCompany()
  const { isOwner, isLoading: permissionsLoading, can } = usePermissions()
  const [form, setForm] = useState<Company | null>(null)
  const [banks, setBanks] = useState<CompanyBankAccount[]>([])
  const [section, setSection] = useState<SectionId>("general")
  const [saving, setSaving] = useState(false)
  const [bankDraft, setBankDraft] = useState({
    bank_name: "",
    account_name: "",
    account_number: "",
    ifsc_code: "",
    branch: "",
    upi_id: "",
  })

  useEffect(() => {
    setForm(selectedCompany)
  }, [selectedCompany])

  useEffect(() => {
    if (!selectedCompany) return
    getCompanyBankAccounts(selectedCompany.id)
      .then(setBanks)
      .catch(() => toast.error("Failed to load bank accounts"))
  }, [selectedCompany])

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading settings…
      </div>
    )
  }

  if (!isOwner || !can("settings", "view")) {
    return <AccessDenied />
  }

  if (!selectedCompany || !form) {
    return (
      <EmptyState
        icon={Building2}
        title="Select a company"
        description="Choose a company from the header to manage settings."
      />
    )
  }

  const set = <K extends keyof Company>(key: K, value: Company[K]) =>
    setForm({ ...form, [key]: value })

  const uploadLogo = async (file?: File) => {
    if (!file) return
    try {
      const url = await uploadCompanyLogo(form.id, file)
      set("logo_url", url)
      toast.success("Uploaded. Save settings to apply.")
    } catch {
      toast.error("Upload failed")
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload: Company = {
        ...form,
        terms_conditions: form.invoice_terms ?? form.terms_conditions,
      }
      const updated = await updateCompany(payload)
      setSelectedCompany(updated)
      applyCompanyTheme(updated)
      await createNotification({
        companyId: updated.id,
        type: "company_updated",
        title: "Company settings updated",
        message: `${updated.name} settings were saved.`,
        entityType: "company",
        entityId: updated.id,
      })
      await refreshCompanies()
      toast.success("Settings saved")
    } catch {
      toast.error("Could not save settings")
    } finally {
      setSaving(false)
    }
  }

  const addBank = async () => {
    if (!bankDraft.bank_name.trim()) {
      toast.error("Bank name is required")
      return
    }
    try {
      await upsertCompanyBankAccount({
        company_id: form.id,
        ...bankDraft,
        is_default: banks.length === 0,
      })
      setBanks(await getCompanyBankAccounts(form.id))
      setBankDraft({
        bank_name: "",
        account_name: "",
        account_number: "",
        ifsc_code: "",
        branch: "",
        upi_id: "",
      })
      toast.success("Bank account added")
    } catch {
      toast.error("Could not add bank account")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Company Settings"
        description={`Configure ${selectedCompany.name}`}
        action={
          can("settings", "edit") ? (
            <Button onClick={save} disabled={saving} className="min-h-11 px-5">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save settings
            </Button>
          ) : undefined
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              section === item.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {section === "general" && (
        <SectionCard title="General Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" value={form.name} onChange={(v) => set("name", v)} required />
            <Field label="Owner Name" value={form.owner_name} onChange={(v) => set("owner_name", v)} />
            <Field label="GST Number" value={form.gst_number} onChange={(v) => set("gst_number", v.toUpperCase())} />
            <Field label="PAN Number" value={form.pan_number} onChange={(v) => set("pan_number", v.toUpperCase())} />
            <Field label="Mobile Number" value={form.phone} onChange={(v) => set("phone", v)} />
            <Field label="Email" value={form.email} onChange={(v) => set("email", v)} />
            <Field label="Website" value={form.website} onChange={(v) => set("website", v)} />
            <Field label="Tagline" value={form.tagline} onChange={(v) => set("tagline", v)} />
            <div className="sm:col-span-2">
              <Label>Company Address</Label>
              <Textarea
                className="mt-1.5 min-h-24"
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
            <Field label="State" value={form.state} onChange={(v) => set("state", v)} />
            <Field label="Pincode" value={form.pincode} onChange={(v) => set("pincode", v)} />
          </div>
        </SectionCard>
      )}

      {section === "branding" && (
        <SectionCard title="Branding">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <CompanyAvatar name={form.name} logoUrl={form.logo_url} size="card" />
            <div className="min-w-0 flex-1 space-y-3 rounded-xl border p-4">
              <div>
                <Label>Company Logo</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  Used in the app sidebar. Initials appear when no logo is set.
                </p>
              </div>
              <Input
                type="file"
                accept="image/*"
                className="min-h-11 max-w-md"
                onChange={(e) => uploadLogo(e.target.files?.[0])}
              />
              {form.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logo_url}
                  alt="Company logo"
                  className="mt-1 h-20 max-w-full object-contain"
                />
              ) : null}
            </div>
          </div>
        </SectionCard>
      )}

      {section === "numbering" && (
        <SectionCard title="Invoice & Challan Settings">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Invoice Prefix"
              value={form.invoice_prefix ?? "INV"}
              onChange={(v) => set("invoice_prefix", v.toUpperCase())}
            />
            <Field
              label="Delivery Challan Prefix"
              value={form.delivery_challan_prefix ?? "DC"}
              onChange={(v) => set("delivery_challan_prefix", v.toUpperCase())}
            />
            <Field
              label="Invoice Starting Number"
              type="number"
              value={String(form.invoice_start_number ?? 1)}
              onChange={(v) => set("invoice_start_number", Number(v) || 1)}
            />
            <Field
              label="Delivery Challan Starting Number"
              type="number"
              value={String(form.delivery_challan_start_number ?? 1)}
              onChange={(v) => set("delivery_challan_start_number", Number(v) || 1)}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Financial Year Format</Label>
              <Select
                value={form.number_fy_format ?? "YYYY"}
                onValueChange={(v) => set("number_fy_format", (v ?? "YYYY") as NumberFyFormat)}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY">Calendar year (INV-2026-0001)</SelectItem>
                  <SelectItem value="YYYY-YY">Indian FY (INV-25-26-0001)</SelectItem>
                  <SelectItem value="none">No year (INV-0001)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Next numbers are generated automatically when you create invoices or delivery challans.
          </p>
        </SectionCard>
      )}

      {section === "banks" && (
        <SectionCard title="Bank Details">
          <div className="space-y-3">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between",
                  bank.is_default && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {bank.bank_name}
                    {bank.is_default ? (
                      <span className="ml-2 text-xs text-primary">Default</span>
                    ) : null}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {[bank.account_name, bank.account_number, bank.ifsc_code, bank.upi_id]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!bank.is_default && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-10"
                      onClick={async () => {
                        try {
                          await setDefaultCompanyBankAccount(form.id, bank.id)
                          setBanks(await getCompanyBankAccounts(form.id))
                          toast.success("Default account updated")
                        } catch {
                          toast.error("Could not set default")
                        }
                      }}
                    >
                      Make default
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="min-h-10 text-destructive"
                    onClick={async () => {
                      try {
                        await deleteCompanyBankAccount(bank.id)
                        setBanks(await getCompanyBankAccounts(form.id))
                      } catch {
                        toast.error("Could not delete account")
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 rounded-xl border border-dashed p-4 sm:grid-cols-2">
            <Field
              label="Bank Name"
              value={bankDraft.bank_name}
              onChange={(v) => setBankDraft({ ...bankDraft, bank_name: v })}
            />
            <Field
              label="Account Name"
              value={bankDraft.account_name}
              onChange={(v) => setBankDraft({ ...bankDraft, account_name: v })}
            />
            <Field
              label="Account Number"
              value={bankDraft.account_number}
              onChange={(v) => setBankDraft({ ...bankDraft, account_number: v })}
            />
            <Field
              label="IFSC"
              value={bankDraft.ifsc_code}
              onChange={(v) => setBankDraft({ ...bankDraft, ifsc_code: v.toUpperCase() })}
            />
            <Field
              label="Branch"
              value={bankDraft.branch}
              onChange={(v) => setBankDraft({ ...bankDraft, branch: v })}
            />
            <Field
              label="UPI ID"
              value={bankDraft.upi_id}
              onChange={(v) => setBankDraft({ ...bankDraft, upi_id: v })}
            />
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" className="min-h-11" onClick={addBank}>
                <Plus className="mr-2 h-4 w-4" />
                Add bank account
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {section === "terms" && (
        <SectionCard title="Terms & Conditions">
          <div className="grid gap-4">
            <div>
              <Label>Invoice Terms</Label>
              <Textarea
                className="mt-1.5 min-h-36"
                placeholder="One term per line"
                value={form.invoice_terms ?? form.terms_conditions ?? ""}
                onChange={(e) => set("invoice_terms", e.target.value)}
              />
            </div>
            <div>
              <Label>Delivery Challan Terms</Label>
              <Textarea
                className="mt-1.5 min-h-36"
                placeholder="One term per line"
                value={form.delivery_challan_terms ?? ""}
                onChange={(e) => set("delivery_challan_terms", e.target.value)}
              />
            </div>
          </div>
        </SectionCard>
      )}

      {section === "defaults" && (
        <SectionCard title="Default Values">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default Payment Terms"
              value={form.default_payment_terms ?? "45 Days"}
              onChange={(v) => set("default_payment_terms", v)}
              placeholder="45 Days"
            />
            <div className="space-y-1.5">
              <Label>Default GST Type</Label>
              <Select
                value={form.default_gst_type ?? "cgst_sgst"}
                onValueChange={(v) => set("default_gst_type", (v ?? "cgst_sgst") as DefaultGstType)}
              >
                <SelectTrigger className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cgst_sgst">CGST + SGST</SelectItem>
                  <SelectItem value="igst">IGST</SelectItem>
                  <SelectItem value="none">No GST</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field
              label="Default HSN Code"
              value={form.hsn_code}
              onChange={(v) => set("hsn_code", v)}
            />
            <Field
              label="Default Unit"
              value={form.default_unit ?? "Taka"}
              onChange={(v) => set("default_unit", v)}
            />
            <Field
              label="Default Delivered By"
              value={form.default_delivered_by}
              onChange={(v) => set("default_delivered_by", v)}
            />
          </div>
        </SectionCard>
      )}

      {section === "theme" && (
        <SectionCard title="Theme">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="h-11 w-16 cursor-pointer p-1"
                  value={toColorInput(form.theme_primary) || "#4f46e5"}
                  onChange={(e) => set("theme_primary", e.target.value)}
                />
                <Input
                  className="min-h-11"
                  value={form.theme_primary ?? ""}
                  placeholder="#4f46e5 or oklch(...)"
                  onChange={(e) => set("theme_primary", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="color"
                  className="h-11 w-16 cursor-pointer p-1"
                  value={toColorInput(form.theme_secondary) || "#e2e8f0"}
                  onChange={(e) => set("theme_secondary", e.target.value)}
                />
                <Input
                  className="min-h-11"
                  value={form.theme_secondary ?? ""}
                  placeholder="#e2e8f0"
                  onChange={(e) => set("theme_secondary", e.target.value)}
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Colors apply across the app for this company and remain compatible with light/dark mode.
          </p>
        </SectionCard>
      )}

      {can("settings", "edit") && (
        <div className="sticky bottom-3 z-10 flex justify-end md:hidden">
          <Button onClick={save} disabled={saving} className="min-h-12 shadow-lg">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save settings
          </Button>
        </div>
      )}
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-4 shadow-xs sm:p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string
  value?: string | null
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  type?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        type={type}
        className="min-h-11"
        value={value ?? ""}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function toColorInput(value?: string | null) {
  if (!value) return ""
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : ""
}
