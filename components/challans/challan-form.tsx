"use client"
/* eslint-disable */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCompany } from "@/components/company-provider"
import { numberToWords } from "@/lib/number-to-words"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { getCustomers } from "@/services/customers.service"
import { addChallan, updateChallan, generateChallanNumber } from "@/services/challans.service"
import { useAuth } from "@/hooks/useAuth"
import { Customer, Challan, ChallanItem, ChallanStatus } from "@/types"
import { getItemQuantityDisplay, parseQuantityNumeric } from "@/lib/challan-item"
import { calculateDueDate } from "@/utils/calculateDueDate"
import { PageHeader } from "@/components/common/PageHeader"
import { format } from "date-fns"

const itemSchema = z.object({
  quality: z.string().optional(),
  fabric_name: z.string().optional(),
  color: z.string().optional(),
  design: z.string().optional(),
  roll_number: z.string().optional(),
  lot_number: z.string().optional(),
  total_pieces: z.coerce.number().min(1, "At least 1 piece"),
  quantity_display: z.string().min(1, "Quantity is required"),
  weight: z.coerce.number().min(0).optional(),
  rate: z.coerce.number().min(0).optional(),
  amount: z.coerce.number().min(0).optional(),
  remarks: z.string().optional(),
})

const challanSchema = z.object({
  challan_number: z.string().min(1, "Invoice number is required"),
  bill_number: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  party_id: z.string().min(1, "Party is required"),
  delivered_by: z.string().optional(),
  broker: z.string().optional(),
  payment_within_value: z.coerce.number().min(1, "Must be greater than 0"),
  payment_within_unit: z.string().min(1, "Unit is required"),
  due_date: z.string().min(1, "Due Date is required"),
  amount_in_words: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
  items: z.array(itemSchema).min(1, "At least one item is required")
})

export function ChallanForm({ initialData }: { initialData?: Challan }) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const [parties, setParties] = useState<Customer[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDueDateManuallyEdited, setIsDueDateManuallyEdited] = useState(false)
  const isEditMode = !!initialData;

  const form = useForm<z.infer<typeof challanSchema>>({
    resolver: zodResolver(challanSchema) as any,
    defaultValues: initialData ? {
      challan_number: initialData.challan_number,
      bill_number: initialData.bill_number || "",
      date: initialData.date,
      party_id: initialData.customer_id ?? initialData.party_id ?? "",
      delivered_by: initialData.delivered_by || initialData.driver_name || "",
      broker: initialData.broker || "",
      payment_within_value: initialData.payment_within_value || 45,
      payment_within_unit: initialData.payment_within_unit || "Days",
      due_date: initialData.due_date || "",
      amount_in_words: initialData.amount_in_words || "",
      notes: initialData.notes || "",
      status: initialData.status,
      items: initialData.items && initialData.items.length > 0 ? initialData.items.map(i => ({
        quality: i.quality || "",
        fabric_name: i.fabric_name || "",
        color: i.color || "",
        design: i.design || "",
        roll_number: i.roll_number || "",
        lot_number: i.lot_number || "",
        total_pieces: i.total_pieces ?? 1,
        quantity_display: getItemQuantityDisplay(i),
        weight: i.weight || 0,
        rate: i.rate || 0,
        amount: i.amount || 0,
        remarks: i.remarks || ""
      })) : [{ quality: '', total_pieces: 1, quantity_display: '', weight: 0, rate: 0, amount: 0 }]
    } : {
      challan_number: "",
      bill_number: "",
      date: new Date().toISOString().split('T')[0],
      delivered_by: "",
      broker: "",
      payment_within_value: 45,
      payment_within_unit: "Days",
      due_date: "",
      amount_in_words: "",
      status: 'Draft',
      items: [{ quality: '', total_pieces: 1, quantity_display: '', weight: 0, rate: 0, amount: 0 }]
    }
  })

  // Apply company defaults once when creating a new invoice
  useEffect(() => {
    if (isEditMode || !selectedCompany) return
    const terms = selectedCompany.default_payment_terms?.trim() || "45 Days"
    const match = terms.match(/^(\d+)\s*(.*)$/)
    if (match) {
      form.setValue("payment_within_value", Number(match[1]) || 45)
      form.setValue("payment_within_unit", match[2]?.trim() || "Days")
    }
    if (selectedCompany.default_delivered_by) {
      form.setValue("delivered_by", selectedCompany.default_delivered_by)
    }
  }, [selectedCompany?.id, isEditMode])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  })

  // Watch items to calculate amount
  const items = form.watch("items")
  const challanDate = form.watch("date")
  const paymentValue = form.watch("payment_within_value")
  const paymentUnit = form.watch("payment_within_unit")
  
  const totals = items.reduce((acc, item) => ({
    pieces: acc.pieces + (Number(item.total_pieces) || 0),
    weight: acc.weight + (Number(item.weight) || 0),
    amount: acc.amount + (Number(item.amount) || 0),
  }), { pieces: 0, weight: 0, amount: 0 })

  useEffect(() => {
    async function fetchParties() {
      if (selectedCompany) {
        const storedParties = await getCustomers(selectedCompany.id)
        setParties(storedParties)
      }
    }
    fetchParties()
  }, [selectedCompany])

  useEffect(() => {
    async function loadChallanNumber() {
      if (!isEditMode && selectedCompany && !form.getValues("challan_number")) {
        try {
          const number = await generateChallanNumber(selectedCompany.id)
          form.setValue("challan_number", number)
        } catch {
          toast.error("Failed to generate challan number")
        }
      }
    }
    loadChallanNumber()
  }, [isEditMode, selectedCompany, form])

  useEffect(() => {
    form.setValue("amount_in_words", numberToWords(totals.amount))
  }, [totals.amount, form])

  useEffect(() => {
    if (isEditMode && initialData) {
      const expectedDueDate = calculateDueDate(initialData.date, initialData.payment_within_value, initialData.payment_within_unit)
      if (expectedDueDate && initialData.due_date) {
        const expectedFormatted = format(expectedDueDate, 'yyyy-MM-dd')
        if (expectedFormatted !== initialData.due_date) {
          setIsDueDateManuallyEdited(true)
        }
      }
    }
  }, [isEditMode, initialData])

  useEffect(() => {
    if (isDueDateManuallyEdited) return
    
    const newDueDate = calculateDueDate(challanDate, paymentValue, paymentUnit)
    if (newDueDate) {
      form.setValue("due_date", format(newDueDate, 'yyyy-MM-dd'), { shouldValidate: true })
    }
  }, [challanDate, paymentValue, paymentUnit, isDueDateManuallyEdited, form])

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsDueDateManuallyEdited(true)
    form.setValue("due_date", e.target.value, { shouldValidate: true })
  }

  const onSubmit = async (values: z.infer<typeof challanSchema>) => {
    if (!selectedCompany) return
    setIsSubmitting(true)
    
    try {
      const party = parties.find(p => p.id === values.party_id)

      const challanPayload = {
        company_id: selectedCompany.id,
        customer_id: values.party_id,
        challan_number: values.challan_number,
        bill_number: values.bill_number || null,
        date: values.date,
        delivered_by: values.delivered_by || null,
        broker: values.broker || null,
        payment_within_value: values.payment_within_value,
        payment_within_unit: values.payment_within_unit,
        payment_terms: `${values.payment_within_value} ${values.payment_within_unit}`,
        due_date: values.due_date,
        amount_in_words: values.amount_in_words || null,
        notes: values.notes || null,
        status: values.status as ChallanStatus,
        items: values.items.map((item) => ({
          ...item,
          challan_id: initialData?.id ?? '',
        } as ChallanItem)),
      }

      if (initialData) {
        await updateChallan({ ...challanPayload, id: initialData.id, items: challanPayload.items })
        toast.success("Invoice updated successfully!")
      } else {
        await addChallan(challanPayload, user?.id)
        toast.success("Invoice created successfully!")
      }
      
      router.push("/admin/invoices")
      router.refresh()
    } catch (error) {
      toast.error("An error occurred while saving the invoice.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedCompany) return null

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        eyebrow="Invoice"
        title={isEditMode ? "Edit invoice" : "Create invoice"}
        description={
          isEditMode
            ? "Update the details of this invoice."
            : `Create a new invoice for ${selectedCompany.name}`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update invoice" : "Create invoice"}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Basic Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Invoice Number *</Label>
                <Input {...form.register("challan_number")} readOnly={isEditMode} className={isEditMode ? "bg-muted" : ""} />
                {form.formState.errors.challan_number && (
                  <p className="text-xs text-red-500">{form.formState.errors.challan_number.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select
                  value={form.watch("party_id") || undefined}
                  onValueChange={(val: string | null) => {
                    if (val) form.setValue("party_id", val, { shouldValidate: true })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer">
                      {(value: string | null) =>
                        parties.find((p) => p.id === value)?.name ?? "Select a customer"
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {parties.map((party) => (
                      <SelectItem key={party.id} value={party.id}>
                        {party.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.party_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.party_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Bill Number</Label>
                <Input {...form.register("bill_number")} placeholder="Leave blank if N/A" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select onValueChange={(val: string | null) => { if (val) form.setValue("status", val) }} defaultValue={form.getValues("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivered By</Label>
                <Input {...form.register("delivered_by")} placeholder="e.g. Rajesh Patel" />
              </div>
              <div className="space-y-2">
                <Label>Broker</Label>
                <Input {...form.register("broker")} placeholder="Enter Broker Name (Optional)" />
                {form.formState.errors.broker && (
                  <p className="text-xs text-red-500">{form.formState.errors.broker.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Within *</Label>
                <div className="flex gap-2">
                  <Input type="number" {...form.register("payment_within_value")} className="flex-1" />
                  <Select onValueChange={(val: string | null) => { if (val) form.setValue("payment_within_unit", val) }} defaultValue={form.getValues("payment_within_unit")}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Days">Days</SelectItem>
                      <SelectItem value="Weeks">Weeks</SelectItem>
                      <SelectItem value="Months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(form.formState.errors.payment_within_value || form.formState.errors.payment_within_unit) && (
                  <p className="text-xs text-red-500">Payment terms are required</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" {...form.register("due_date")} onChange={(e) => {
                  form.register("due_date").onChange(e);
                  handleDueDateChange(e);
                }} />
                {form.formState.errors.due_date && (
                  <p className="text-xs text-red-500">{form.formState.errors.due_date.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rupees (Read Only)</Label>
              <Input {...form.register("amount_in_words")} readOnly className="bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>Add items to this invoice</CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append({ quality: '', total_pieces: 1, quantity_display: '', weight: 0, rate: 0, amount: 0 })}>
            <Plus className="mr-2 h-4 w-4" />
            Add Row
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">Quality</TableHead>
                  <TableHead>Fabric</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead className="w-[90px]">Pieces</TableHead>
                  <TableHead className="w-[140px]">Total Mts./Kgs</TableHead>
                  <TableHead className="w-[80px]">Weight</TableHead>
                  <TableHead className="w-[90px]">Rate</TableHead>
                  <TableHead className="w-[110px]">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const qtyText = form.watch(`items.${index}.quantity_display`) || ""
                  const r = form.watch(`items.${index}.rate`) || 0
                  const qtyNum = parseQuantityNumeric(qtyText)
                  if (qtyNum * r !== form.getValues(`items.${index}.amount`)) {
                     form.setValue(`items.${index}.amount`, qtyNum * r)
                  }

                  return (
                    <TableRow key={field.id}>
                      <TableCell className="p-2">
                        <Input {...form.register(`items.${index}.quality`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input {...form.register(`items.${index}.fabric_name`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input {...form.register(`items.${index}.color`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input type="number" step="1" min="1" {...form.register(`items.${index}.total_pieces`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input
                          {...form.register(`items.${index}.quantity_display`)}
                          className="h-8"
                          placeholder="e.g. 4500 Mts"
                        />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.weight`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.rate`)} className="h-8" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Input type="number" step="0.01" {...form.register(`items.${index}.amount`)} readOnly className="h-8 bg-muted" />
                      </TableCell>
                      <TableCell className="p-2">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-end">
            <div className="w-[300px] space-y-2 rounded-lg border p-4 bg-muted/50">
              <div className="flex justify-between text-sm">
                <span>Total Pieces:</span>
                <span className="font-medium">{totals.pieces}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Weight:</span>
                <span className="font-medium">{totals.weight.toFixed(2)} kg</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total Amount:</span>
                <span>₹{totals.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...form.register("notes")} placeholder="Any special instructions or notes..." />
        </CardContent>
      </Card>
    </form>
  )
}
