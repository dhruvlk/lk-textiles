"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Plus,
  Trash2,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  IndianRupee,
  Layers,
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { getSuppliers } from "@/services/suppliers.service"
import { getStocks } from "@/services/stocks.service"
import { checkDuplicateInvoice, createPurchase, getPurchaseById } from "@/services/purchases.service"
import { uploadVaultDocument } from "@/services/documents.service"
import { SupplierModal } from "@/components/purchases/SupplierModal"
import {
  formatFinancialYearCode,
  formatFinancialYearLabel,
  isValidGstin,
} from "@/types"
import type {
  Purchase,
  PurchaseItem,
  PurchasePaymentStatus,
  PurchaseType,
  Stock,
  Supplier,
} from "@/types"

const PURCHASE_TYPES: PurchaseType[] = [
  "Stock Purchase",
  "Expense Purchase",
  "Asset Purchase",
  "Service Purchase",
  "Other",
]

const TEXTILE_UNITS = ["Kg", "Mtr", "Taka", "Pcs", "Nos", "Box", "Roll", "Cone", "Bag", "Set"]

const GST_RATES = [0, 5, 12, 18, 28]

interface PurchaseFormProps {
  initialPurchaseId?: string
  isDuplicate?: boolean
}

type FormItem = Omit<PurchaseItem, "id" | "purchase_id" | "created_at"> & {
  tempId: string
}

export function PurchaseForm({ initialPurchaseId, isDuplicate }: PurchaseFormProps) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const companyId = selectedCompany?.id

  // Masters
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isLoadingMasters, setIsLoadingMasters] = useState(true)

  // Modals
  const [supplierModalOpen, setSupplierModalOpen] = useState(false)

  // Header State
  const [supplierId, setSupplierId] = useState<string>("")
  const [supplierName, setSupplierName] = useState<string>("")
  const [supplierGstin, setSupplierGstin] = useState<string>("")
  const [invoiceNumber, setInvoiceNumber] = useState<string>("")
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState<string>("")
  const [purchaseType, setPurchaseType] = useState<PurchaseType>("Stock Purchase")
  const [isGstBill, setIsGstBill] = useState<boolean>(true)
  const [hsnSac, setHsnSac] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<PurchasePaymentStatus>("Unpaid")
  const [paymentMethod, setPaymentMethod] = useState<Purchase["payment_method"]>("Bank Transfer")
  const [paidAmountInput, setPaidAmountInput] = useState<string>("0")

  // Line items state
  const [items, setItems] = useState<FormItem[]>([
    {
      tempId: "item-1",
      item_name: "Yarn",
      description: "",
      hsn_sac: "5205",
      quantity: 100,
      unit: "Kg",
      rate: 240,
      discount: 0,
      taxable_amount: 24000,
      gst_rate: 5,
      gst_amount: 1200,
      total_amount: 25200,
      count: "30s",
      color: "Natural",
    },
  ])

  // Document upload state
  const [attachedFile, setAttachedFile] = useState<File | null>(null)

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-calculated Financial Year
  const financialYear = useMemo(() => formatFinancialYearCode(invoiceDate), [invoiceDate])

  // Load masters (suppliers & stocks)
  useEffect(() => {
    if (!companyId) return
    const activeCompanyId = companyId
    let isCancelled = false

    async function loadMasters() {
      try {
        const [supData, stockData] = await Promise.all([
          getSuppliers(activeCompanyId),
          getStocks(activeCompanyId).catch(() => []),
        ])
        if (!isCancelled) {
          setSuppliers(supData)
          setStocks(stockData)
          if (supData.length > 0 && !supplierId) {
            setSupplierId(supData[0].id)
            setSupplierName(supData[0].name)
            setSupplierGstin(supData[0].gstin || "")
          }
        }
      } catch (err) {
        console.error("Error loading masters:", err)
      } finally {
        if (!isCancelled) setIsLoadingMasters(false)
      }
    }

    void loadMasters()
    return () => {
      isCancelled = true
    }
  }, [companyId])

  // Handle supplier change
  const handleSupplierSelect = (id: string) => {
    setSupplierId(id)
    const sup = suppliers.find((s) => s.id === id)
    if (sup) {
      setSupplierName(sup.name)
      setSupplierGstin(sup.gstin || "")
    }
  }

  // Duplicate invoice check on blur
  const checkDuplicate = async () => {
    if (!companyId || !invoiceNumber.trim()) {
      setDuplicateWarning(null)
      return
    }
    const activeCompanyId = companyId

    try {
      const res = await checkDuplicateInvoice(
        activeCompanyId,
        supplierId || null,
        supplierGstin || null,
        invoiceNumber,
        financialYear
      )

      if (res.isDuplicate && res.existingPurchase) {
        setDuplicateWarning(
          `Possible duplicate bill! Invoice #${invoiceNumber} for this supplier already recorded on ${res.existingPurchase.invoice_date} (Total: ₹${res.existingPurchase.grand_total.toLocaleString("en-IN")}).`
        )
      } else {
        setDuplicateWarning(null)
      }
    } catch {
      setDuplicateWarning(null)
    }
  }

  // Calculations for items
  const updateItem = (index: number, patch: Partial<FormItem>) => {
    setItems((prev) => {
      const copy = [...prev]
      const current = { ...copy[index], ...patch }

      const qty = Number(current.quantity) || 0
      const rate = Number(current.rate) || 0
      const disc = Number(current.discount) || 0
      const taxable = Math.max(0, qty * rate - disc)
      const gstPercent = isGstBill ? Number(current.gst_rate) || 0 : 0
      const gstAmt = (taxable * gstPercent) / 100
      const total = taxable + gstAmt

      current.taxable_amount = taxable
      current.gst_rate = gstPercent
      current.gst_amount = gstAmt
      current.total_amount = total

      copy[index] = current
      return copy
    })
  }

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}`,
        item_name: purchaseType === "Stock Purchase" ? "Fabric" : "Purchase Item",
        description: "",
        hsn_sac: "",
        quantity: 1,
        unit: purchaseType === "Stock Purchase" ? "Mtr" : "Nos",
        rate: 0,
        discount: 0,
        taxable_amount: 0,
        gst_rate: isGstBill ? 5 : 0,
        gst_amount: 0,
        total_amount: 0,
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.warning("Purchase must contain at least 1 item.")
      return
    }
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  // Summary totals
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + (Number(it.taxable_amount) || 0), 0),
    [items]
  )
  const totalGst = useMemo(
    () => (isGstBill ? items.reduce((acc, it) => acc + (Number(it.gst_amount) || 0), 0) : 0),
    [items, isGstBill]
  )
  const cgst = totalGst / 2
  const sgst = totalGst / 2
  const igst = 0 // default intra-state, can split if needed
  const rawGrandTotal = subtotal + totalGst
  const grandTotal = Math.round(rawGrandTotal)
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2))

  const paidAmount = Number(paidAmountInput) || 0
  const balanceAmount = Math.max(0, grandTotal - paidAmount)

  // Payment status sync
  useEffect(() => {
    if (paymentStatus === "Paid") {
      setPaidAmountInput(String(grandTotal))
    } else if (paymentStatus === "Unpaid") {
      setPaidAmountInput("0")
    }
  }, [paymentStatus, grandTotal])

  // Save handler (Active or Draft)
  const handleSavePurchase = async (status: "Active" | "Draft") => {
    if (!companyId) return
    const activeCompanyId = companyId

    if (!supplierName.trim()) {
      toast.error("Please enter or select a supplier.")
      return
    }
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required.")
      return
    }
    if (items.length === 0) {
      toast.error("Please add at least one line item.")
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading(status === "Draft" ? "Saving draft purchase..." : "Saving purchase bill...")

    try {
      const newPurchase = await createPurchase(
        activeCompanyId,
        {
          supplier_id: supplierId || null,
          supplier_name: supplierName.trim(),
          supplier_gstin: supplierGstin?.trim()?.toUpperCase() || null,
          invoice_number: invoiceNumber.trim(),
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          financial_year: financialYear,
          purchase_type: purchaseType,
          is_gst_bill: isGstBill,
          hsn_sac: hsnSac?.trim() || null,
          subtotal,
          discount: 0,
          gst_rate: items[0]?.gst_rate || 5,
          cgst_amount: cgst,
          sgst_amount: sgst,
          igst_amount: igst,
          total_gst: totalGst,
          round_off: roundOff,
          grand_total: grandTotal,
          payment_status: paymentStatus,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          payment_method: paidAmount > 0 ? paymentMethod : null,
          status,
          notes: notes.trim() || null,
          created_by: user?.id || null,
        },
        items,
        {
          userId: user?.id,
          initialPayment:
            paidAmount > 0
              ? {
                  amount: paidAmount,
                  method: paymentMethod || "Bank Transfer",
                  notes: "Initial payment on purchase creation",
                }
              : undefined,
        }
      )

      // Upload original bill if attached
      if (attachedFile && newPurchase) {
        try {
          await uploadVaultDocument(activeCompanyId, attachedFile, {
            financialYear,
            documentType: "Purchase Bill",
            purchaseId: newPurchase.id,
            supplierId: supplierId || null,
            description: `Original bill for Purchase #${newPurchase.invoice_number}`,
            tags: ["Purchase", purchaseType, isGstBill ? "GST" : "Non-GST"],
            userId: user?.id,
          })
          toast.success("Bill document securely attached to vault!", { id: toastId })
        } catch (uploadErr) {
          console.error("Document upload error:", uploadErr)
          toast.error("Purchase bill saved, but bill file upload failed.", { id: toastId })
        }
      } else {
        toast.success(status === "Draft" ? "Draft purchase saved!" : "Purchase bill recorded successfully!", {
          id: toastId,
        })
      }

      router.push("/admin/purchases")
    } catch (err) {
      console.error("Save purchase error:", err)
      const msg = err instanceof Error ? err.message : "Failed to record purchase bill"
      toast.error(msg, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const gstinStatus = supplierGstin ? (isValidGstin(supplierGstin) ? "valid" : "invalid") : "empty"

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/purchases")}
            className="rounded-xl h-10 w-10 shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-6 w-6 text-primary" />
              Add Purchase Bill
            </h1>
            <p className="text-sm text-muted-foreground">
              Record incoming bills, update stock inventory, and store original invoices.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSavePurchase("Draft")}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Save Draft
          </Button>
          <Button
            type="button"
            onClick={() => handleSavePurchase("Active")}
            disabled={isSubmitting}
            className="rounded-xl shadow-xs"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Purchase
          </Button>
        </div>
      </div>

      {/* Duplicate warning banner */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">Duplicate Bill Warning</p>
            <p className="mt-0.5">{duplicateWarning}</p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Supplier & Bill Details
          </CardTitle>
          <CardDescription className="text-xs">
            Enter supplier information and purchase invoice metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Supplier row with inline "+ Add Supplier" */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">
                  Supplier / Vendor <span className="text-destructive">*</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(true)}
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" /> Create New Supplier
                </button>
              </div>

              {suppliers.length > 0 ? (
                <Select value={supplierId} onValueChange={(val) => val && handleSupplierSelect(val)}>
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="Select existing supplier">
                      {(value: string | null) => {
                        if (!value) return "Select existing supplier"
                        const s = suppliers.find((x) => x.id === value)
                        return s ? `${s.name}${s.gstin ? ` (${s.gstin})` : ""}` : "Select existing supplier"
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-[260px]">
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} {s.gstin ? `(${s.gstin})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Enter supplier name"
                  className="h-10 rounded-xl"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Vendor GSTIN</Label>
                {gstinStatus === "valid" && (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Valid format
                  </span>
                )}
                {gstinStatus === "invalid" && (
                  <span className="text-[11px] font-medium text-amber-600 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Check format
                  </span>
                )}
              </div>
              <Input
                value={supplierGstin}
                onChange={(e) => setSupplierGstin(e.target.value.toUpperCase())}
                onBlur={checkDuplicate}
                placeholder="24AAAAA0000A1Z5"
                maxLength={15}
                className="h-10 rounded-xl uppercase font-mono tracking-wider text-xs"
              />
            </div>
          </div>

          {/* Invoice No, Date, Due Date, FY */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Invoice Number <span className="text-destructive">*</span>
              </Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                onBlur={checkDuplicate}
                placeholder="e.g. INV-4587"
                required
                className="h-10 rounded-xl font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Invoice Date *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Financial Year</Label>
              <Input
                value={formatFinancialYearLabel(financialYear)}
                disabled
                className="h-10 rounded-xl bg-muted/40 font-semibold"
              />
            </div>
          </div>

          {/* Purchase Type & GST Switch */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Purchase Type *</Label>
              <Select
                value={purchaseType}
                onValueChange={(val) => val && setPurchaseType(val as PurchaseType)}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PURCHASE_TYPES.map((pt) => (
                    <SelectItem key={pt} value={pt}>
                      {pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GST Applicable?</Label>
              <Select
                value={isGstBill ? "gst" : "non_gst"}
                onValueChange={(val) => setIsGstBill(val === "gst")}
              >
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gst">GST Bill (Eligible for Input Tax Credit)</SelectItem>
                  <SelectItem value="non_gst">Non-GST / Exempted Purchase</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Main HSN / SAC</Label>
              <Input
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                placeholder="e.g. 5205 or 5208"
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Purchase Items</CardTitle>
            <CardDescription className="text-xs">
              {purchaseType === "Stock Purchase"
                ? "Items will be added to quality stock inventory upon saving."
                : "Add items or services purchased on this invoice."}
            </CardDescription>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={addItem} className="rounded-xl">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((it, idx) => (
            <div
              key={it.tempId}
              className="p-4 rounded-xl border bg-muted/15 hover:bg-muted/25 transition-colors space-y-3"
            >
              {/* Top row: Item Name, Stock link, Qty, Unit, Rate, Discount, GST %, Total */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-[11px] font-semibold">Item Name *</Label>
                  <Input
                    value={it.item_name}
                    onChange={(e) => updateItem(idx, { item_name: e.target.value })}
                    placeholder="e.g. Cotton Yarn 30s"
                    className="h-9 rounded-lg text-xs"
                  />
                </div>

                {/* Stock linking (if Stock Purchase) */}
                {purchaseType === "Stock Purchase" && (
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-semibold text-primary">Link Stock Quality</Label>
                    <Select
                      value={it.stock_id || "none"}
                      onValueChange={(val) => {
                        const stock = stocks.find((s) => s.id === val)
                        updateItem(idx, {
                          stock_id: !val || val === "none" ? null : val,
                          quality: stock ? stock.quality_name : it.quality,
                        })
                      }}
                    >
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue placeholder="Select quality">
                          {(val: string | null) => {
                            if (!val || val === "none") return "-- Direct Stock --"
                            const st = stocks.find((s) => s.id === val)
                            return st ? `${st.quality_name} (Avail: ${st.available_taka})` : "Select quality"
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Direct Stock --</SelectItem>
                        {stocks.map((stk) => (
                          <SelectItem key={stk.id} value={stk.id}>
                            {stk.quality_name} (Avail: {stk.available_taka})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={purchaseType === "Stock Purchase" ? "sm:col-span-1" : "sm:col-span-2"}>
                  <Label className="text-[11px] font-semibold">Qty</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg text-xs text-right font-medium"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <Label className="text-[11px] font-semibold">Unit</Label>
                  <Select
                    value={it.unit}
                    onValueChange={(val) => val && updateItem(idx, { unit: val })}
                  >
                    <SelectTrigger className="h-9 rounded-lg text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEXTILE_UNITS.map((u) => (
                        <SelectItem key={u} value={u}>
                          {u}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <Label className="text-[11px] font-semibold">Rate (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.rate}
                    onChange={(e) => updateItem(idx, { rate: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg text-xs text-right"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1">
                  <Label className="text-[11px] font-semibold">Disc (₹)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={it.discount}
                    onChange={(e) => updateItem(idx, { discount: parseFloat(e.target.value) || 0 })}
                    className="h-9 rounded-lg text-xs text-right"
                  />
                </div>

                {isGstBill && (
                  <div className="sm:col-span-1 space-y-1">
                    <Label className="text-[11px] font-semibold">GST %</Label>
                    <Select
                      value={String(it.gst_rate)}
                      onValueChange={(val) => updateItem(idx, { gst_rate: Number(val || 0) })}
                    >
                      <SelectTrigger className="h-9 rounded-lg text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GST_RATES.map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="sm:col-span-1 space-y-1 text-right">
                  <Label className="text-[11px] font-semibold">Total (₹)</Label>
                  <div className="h-9 flex items-center justify-end font-bold text-xs text-foreground tabular-nums">
                    ₹{it.total_amount.toFixed(2)}
                  </div>
                </div>

                <div className="sm:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(idx)}
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Optional Textile Fields (Yarn / Fabric specs) */}
              <div className="pt-2 border-t border-border/60">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Textile Specs (Optional: Count, Lot, Color, GSM, Weight)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <Input
                    placeholder="Count (e.g. 30s Cw)"
                    value={it.count || ""}
                    onChange={(e) => updateItem(idx, { count: e.target.value })}
                    className="h-7 text-xs rounded-md"
                  />
                  <Input
                    placeholder="Denier / Quality"
                    value={it.quality || it.denier || ""}
                    onChange={(e) => updateItem(idx, { quality: e.target.value })}
                    className="h-7 text-xs rounded-md"
                  />
                  <Input
                    placeholder="Lot No."
                    value={it.lot_number || ""}
                    onChange={(e) => updateItem(idx, { lot_number: e.target.value })}
                    className="h-7 text-xs rounded-md"
                  />
                  <Input
                    placeholder="Color"
                    value={it.color || ""}
                    onChange={(e) => updateItem(idx, { color: e.target.value })}
                    className="h-7 text-xs rounded-md"
                  />
                  <Input
                    placeholder="Meters"
                    type="number"
                    value={it.meters ?? ""}
                    onChange={(e) => updateItem(idx, { meters: parseFloat(e.target.value) || null })}
                    className="h-7 text-xs rounded-md text-right"
                  />
                  <Input
                    placeholder="Weight (Kg)"
                    type="number"
                    value={it.weight ?? ""}
                    onChange={(e) => updateItem(idx, { weight: parseFloat(e.target.value) || null })}
                    className="h-7 text-xs rounded-md text-right"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bill Attachment & Payment Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Document Attachment Vault */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-primary" />
              Upload Original Bill / Invoice
            </CardTitle>
            <CardDescription className="text-xs">
              PDF or clear photo of supplier&apos;s invoice. Stored permanently in your company vault.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              id="bill-file-upload"
              className="hidden"
              onChange={(e) => setAttachedFile(e.target.files?.[0] || null)}
            />

            {!attachedFile ? (
              <label
                htmlFor="bill-file-upload"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/30 transition-colors border-muted-foreground/30 text-center"
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-xs font-semibold text-primary">Click to select original bill</span>
                <span className="text-[11px] text-muted-foreground mt-0.5">
                  PDF, JPG, PNG or WEBP (Max 20MB)
                </span>
              </label>
            ) : (
              <div className="flex items-center justify-between p-3.5 rounded-xl border bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{attachedFile.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {(attachedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachedFile(null)}
                  className="text-xs text-destructive hover:bg-destructive/10"
                >
                  Remove
                </Button>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Bill Notes / Remarks</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Terms 30 days, transport by Sharma transport Surat"
                className="rounded-xl min-h-[70px] text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Totals & Payment Section */}
        <Card className="rounded-2xl border shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Tax Breakdown & Payment
            </CardTitle>
            <CardDescription className="text-xs">
              Review invoice totals and record initial payments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Calculation summary */}
            <div className="space-y-2 p-3.5 rounded-xl border bg-muted/20 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable Subtotal:</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              {isGstBill && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>CGST:</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>SGST:</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total GST (Input Credit):</span>
                    <span>₹{totalGst.toFixed(2)}</span>
                  </div>
                </>
              )}
              {roundOff !== 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Round Off:</span>
                  <span>₹{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t pt-2 text-foreground">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Payment Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Status</Label>
                <Select
                  value={paymentStatus}
                  onValueChange={(val) => val && setPaymentStatus(val as PurchasePaymentStatus)}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unpaid">Unpaid</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Paid">Paid in Full</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Payment Method</Label>
                <Select
                  value={paymentMethod || "Bank Transfer"}
                  onValueChange={(val) => val && setPaymentMethod(val as Purchase["payment_method"])}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Paid Amount (₹)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  placeholder="0.00"
                  className="h-10 rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Outstanding Balance</Label>
                <div className="h-10 px-3 rounded-xl border bg-muted/40 flex items-center font-bold text-rose-600 text-sm">
                  ₹{balanceAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Modal */}
      <SupplierModal
        open={supplierModalOpen}
        onOpenChange={setSupplierModalOpen}
        companyId={companyId || ""}
        onSuccess={(created) => {
          setSuppliers((prev) => [created, ...prev])
          handleSupplierSelect(created.id)
        }}
      />
    </div>
  )
}
