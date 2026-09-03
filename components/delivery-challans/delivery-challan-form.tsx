"use client"

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import {
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
  type Resolver,
} from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useCompany } from "@/components/company-provider"
import { useAuth } from "@/hooks/useAuth"
import { PageHeader } from "@/components/common/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCustomers } from "@/services/customers.service"
import {
  addDeliveryChallan,
  generateDeliveryChallanNumber,
  updateDeliveryChallan,
} from "@/services/delivery-challans.service"
import { getStocks, parseStockError } from "@/services/stocks.service"
import type { Customer, DeliveryChallan, DeliveryChallanStatus, Stock } from "@/types"

const itemSchema = z.object({
  taka_no: z.string().optional(),
  meters: z.coerce.number().min(0),
  weight: z.coerce.number().min(0),
})

const formSchema = z.object({
  challan_number: z.string().min(1, "Challan number is required"),
  date: z.string().min(1, "Date is required"),
  customer_id: z.string().min(1, "Customer is required"),
  stock_id: z.string().min(1, "Quality is required"),
  quality: z.string().optional(),
  broker: z.string().optional(),
  delivered_by: z.string().optional(),
  remarks: z.string().optional(),
  notes: z.string().optional(),
  status: z.string(),
  items: z.array(itemSchema).min(1, "At least one item is required"),
})

type FormValues = z.infer<typeof formSchema>

const EMPTY_ITEM = { taka_no: "", meters: 0, weight: 0 }

function getDashboardScrollParent(): HTMLElement | null {
  if (typeof document === "undefined") return null
  return document.querySelector("main.scrollbar-stable")
}

type ItemRowProps = {
  index: number
  rowId: string
  isNew: boolean
  canDelete: boolean
  onAddBelow: (index: number) => void
  onRemove: (index: number) => void
  onEnter: (
    event: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: "taka_no" | "meters" | "weight"
  ) => void
  setTakaRef: (index: number, el: HTMLInputElement | null) => void
}

const DeliveryChallanItemsSummary = memo(function DeliveryChallanItemsSummary() {
  const items = useWatch({ name: "items" }) as FormValues["items"] | undefined
  const pieces = items?.length ?? 0
  const meters = (items ?? []).reduce((sum, item) => sum + (Number(item.meters) || 0), 0)
  const weight = (items ?? []).reduce((sum, item) => sum + (Number(item.weight) || 0), 0)

  return (
    <div className="w-full shrink-0 space-y-2 rounded-lg border bg-muted/50 p-4 sm:w-[280px]">
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Total Pieces:</span>
        <span className="min-w-[4.5rem] text-right font-medium tabular-nums">{pieces}</span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Total MTS:</span>
        <span className="min-w-[4.5rem] text-right font-medium tabular-nums">
          {meters.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-muted-foreground">Total Weight:</span>
        <span className="min-w-[4.5rem] text-right font-medium tabular-nums">
          {weight.toFixed(2)}
        </span>
      </div>
    </div>
  )
})

const DeliveryChallanItemRow = memo(function DeliveryChallanItemRow({
  index,
  rowId,
  isNew,
  canDelete,
  onAddBelow,
  onRemove,
  onEnter,
  setTakaRef,
}: ItemRowProps) {
  const { register } = useFormContext<FormValues>()
  const { ref: takaRef, ...takaField } = register(`items.${index}.taka_no`)

  return (
    <TableRow data-row-id={rowId}>
      <TableCell className={cn("text-muted-foreground", isNew && "dc-row-cell")}>
        <div className={cn(isNew && "dc-row-enter")}>{index + 1}</div>
      </TableCell>
      <TableCell className={cn("p-2", isNew && "dc-row-cell")}>
        <div className={cn(isNew && "dc-row-enter")}>
          <Input
            {...takaField}
            ref={(el) => {
              takaRef(el)
              setTakaRef(index, el)
            }}
            className="h-8"
            onKeyDown={(e) => onEnter(e, index, "taka_no")}
          />
        </div>
      </TableCell>
      <TableCell className={cn("p-2", isNew && "dc-row-cell")}>
        <div className={cn(isNew && "dc-row-enter")}>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register(`items.${index}.meters`)}
            className="h-8"
            onKeyDown={(e) => onEnter(e, index, "meters")}
          />
        </div>
      </TableCell>
      <TableCell className={cn("p-2", isNew && "dc-row-cell")}>
        <div className={cn(isNew && "dc-row-enter")}>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...register(`items.${index}.weight`)}
            className="h-8"
            onKeyDown={(e) => onEnter(e, index, "weight")}
          />
        </div>
      </TableCell>
      <TableCell className={cn("p-2", isNew && "dc-row-cell")}>
        <div className={cn("flex justify-end gap-1", isNew && "dc-row-enter")}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Add row below"
            onClick={() => onAddBelow(index)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            title="Delete row"
            onClick={() => onRemove(index)}
            disabled={!canDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

export function DeliveryChallanForm({ initialData }: { initialData?: DeliveryChallan }) {
  const router = useRouter()
  const { selectedCompany } = useCompany()
  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stocks, setStocks] = useState<Stock[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newRowId, setNewRowId] = useState<string | null>(null)
  const isEditMode = !!initialData
  const takaInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const pendingFocusIndex = useRef<number | null>(null)
  const clearNewRowTimer = useRef<number | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as Resolver<FormValues>,
    defaultValues: initialData
      ? {
          challan_number: initialData.challan_number,
          date: initialData.date,
          customer_id: initialData.customer_id,
          stock_id: initialData.stock_id || "",
          quality: initialData.quality || "",
          broker: initialData.broker || "",
          delivered_by: initialData.delivered_by || "",
          remarks: initialData.remarks || "",
          notes: initialData.notes || "",
          status: initialData.status,
          items:
            initialData.items && initialData.items.length > 0
              ? initialData.items.map((item) => ({
                  taka_no: item.taka_no || "",
                  meters: item.meters || 0,
                  weight: item.weight || 0,
                }))
              : [{ taka_no: "", meters: 0, weight: 0 }],
        }
      : {
          challan_number: "",
          date: new Date().toISOString().split("T")[0],
          customer_id: "",
          stock_id: "",
          quality: "",
          broker: "",
          delivered_by: "",
          remarks: "",
          notes: "",
          status: "Draft",
          items: [{ taka_no: "", meters: 0, weight: 0 }],
        },
  })

  useEffect(() => {
    if (initialData || !selectedCompany?.default_delivered_by) return
    form.setValue("delivered_by", selectedCompany.default_delivered_by)
  }, [selectedCompany?.id, selectedCompany?.default_delivered_by, initialData])

  const { fields, append, insert, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const setTakaRef = useCallback((index: number, el: HTMLInputElement | null) => {
    takaInputRefs.current[index] = el
  }, [])

  /** Focus without scrolling — same visual stability as delete. */
  const focusTakaInput = useCallback((index: number) => {
    requestAnimationFrame(() => {
      const input = takaInputRefs.current[index]
      if (!input) return
      const scroller = getDashboardScrollParent()
      const savedTop = scroller?.scrollTop ?? null
      input.focus({ preventScroll: true })
      // Restore exact scroll position in case the browser nudged it.
      if (scroller && savedTop != null) {
        scroller.scrollTop = savedTop
      }
    })
  }, [])

  useEffect(() => {
    if (pendingFocusIndex.current == null) return
    const index = pendingFocusIndex.current
    pendingFocusIndex.current = null

    const rowId = fields[index]?.id ?? null
    if (rowId) {
      setNewRowId(rowId)
      if (clearNewRowTimer.current) window.clearTimeout(clearNewRowTimer.current)
      clearNewRowTimer.current = window.setTimeout(() => {
        setNewRowId(null)
        clearNewRowTimer.current = null
      }, 200)
    }

    focusTakaInput(index)
  }, [fields, focusTakaInput])

  useEffect(() => {
    return () => {
      if (clearNewRowTimer.current) window.clearTimeout(clearNewRowTimer.current)
    }
  }, [])

  const addRowAfter = useCallback(
    (afterIndex?: number) => {
      const scroller = getDashboardScrollParent()
      const savedTop = scroller?.scrollTop ?? null

      if (afterIndex == null) {
        pendingFocusIndex.current = fields.length
        append(EMPTY_ITEM)
      } else {
        pendingFocusIndex.current = afterIndex + 1
        insert(afterIndex + 1, EMPTY_ITEM)
      }

      // Keep viewport locked through the insert + focus pass (match delete feel).
      requestAnimationFrame(() => {
        if (scroller && savedTop != null) {
          scroller.scrollTop = savedTop
        }
      })
    },
    [append, fields.length, insert]
  )

  const handleRowFieldEnter = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>, index: number, field: "taka_no" | "meters" | "weight") => {
      if (event.key !== "Enter") return
      event.preventDefault()

      if (field === "taka_no") {
        form.setFocus(`items.${index}.meters`, { shouldSelect: false })
        return
      }
      if (field === "meters") {
        form.setFocus(`items.${index}.weight`, { shouldSelect: false })
        return
      }

      // Last field (weight)
      if (index === fields.length - 1) {
        addRowAfter()
      } else {
        focusTakaInput(index + 1)
      }
    },
    [addRowAfter, fields.length, focusTakaInput, form]
  )

  const customerId = useWatch({ control: form.control, name: "customer_id" })
  const stockId = useWatch({ control: form.control, name: "stock_id" })
  const selectedCustomer = customers.find((c) => c.id === customerId)
  const selectedStock = stocks.find((s) => s.id === stockId)
  const reservedPieces =
    isEditMode && initialData?.stock_id === stockId ? Number(initialData.total_pieces) || 0 : 0
  const availableForSale = selectedStock
    ? selectedStock.available_taka + reservedPieces
    : null
  const pieceCount = fields.length

  useEffect(() => {
    async function loadData() {
      if (!selectedCompany) return
      setCustomers(await getCustomers(selectedCompany.id))
      try {
        setStocks(await getStocks(selectedCompany.id))
      } catch {
        toast.error("Failed to load stock qualities")
      }
    }
    loadData()
  }, [selectedCompany])

  useEffect(() => {
    async function loadNumber() {
      if (!isEditMode && selectedCompany && !form.getValues("challan_number")) {
        try {
          const number = await generateDeliveryChallanNumber(selectedCompany.id)
          form.setValue("challan_number", number)
        } catch {
          toast.error("Failed to generate delivery challan number")
        }
      }
    }
    loadNumber()
  }, [isEditMode, selectedCompany, form])

  const onSubmit = async (values: FormValues) => {
    if (!selectedCompany) return
    setIsSubmitting(true)

    try {
      const stock = stocks.find((s) => s.id === values.stock_id)
      if (!stock) {
        toast.error("Selected quality was not found in stock.")
        setIsSubmitting(false)
        return
      }

      const pieceCount = values.items.length
      const reserved =
        isEditMode && initialData?.stock_id === values.stock_id
          ? Number(initialData.total_pieces) || 0
          : 0
      const available = stock.available_taka + reserved
      if (pieceCount > available) {
        toast.error(`Only ${available} Taka Available.`)
        setIsSubmitting(false)
        return
      }

      const payload = {
        company_id: selectedCompany.id,
        customer_id: values.customer_id,
        challan_number: values.challan_number,
        date: values.date,
        stock_id: values.stock_id,
        quality: stock.quality_name,
        broker: values.broker || null,
        delivered_by: values.delivered_by || null,
        remarks: values.remarks || null,
        notes: values.notes || null,
        status: values.status as DeliveryChallanStatus,
        items: values.items,
      }

      if (initialData) {
        await updateDeliveryChallan(initialData.id, payload)
        toast.success("Delivery challan updated successfully!")
      } else {
        await addDeliveryChallan(payload, user?.id)
        toast.success("Delivery challan created successfully!")
      }

      router.push("/admin/delivery-challans")
      router.refresh()
    } catch (error) {
      toast.error(parseStockError(error) || "An error occurred while saving the delivery challan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!selectedCompany) return null

  return (
    <FormProvider {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <PageHeader
        eyebrow="Delivery Challans"
        title={isEditMode ? "Edit delivery challan" : "Create delivery challan"}
        description={
          isEditMode
            ? "Update delivery challan details and items."
            : `Create a new delivery challan for ${selectedCompany.name}`
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditMode ? "Update delivery challan" : "Create delivery challan"}
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
                <Label>Challan Number *</Label>
                <Input
                  {...form.register("challan_number")}
                  readOnly={isEditMode}
                  className={isEditMode ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" {...form.register("date")} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer *</Label>
              <Select
                value={customerId || undefined}
                onValueChange={(val: string | null) => {
                  if (val) form.setValue("customer_id", val, { shouldValidate: true })
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a customer">
                    {(value: string | null) =>
                      customers.find((c) => c.id === value)?.name ?? "Select a customer"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customer_id && (
                <p className="text-xs text-destructive">{form.formState.errors.customer_id.message}</p>
              )}
            </div>

            {selectedCustomer && (
              <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{selectedCustomer.name}</p>
                <p className="mt-1 line-clamp-2">{selectedCustomer.address || "No address"}</p>
                <p className="mt-1">GST: {selectedCustomer.gst_number || "—"}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                onValueChange={(val: string | null) => {
                  if (val) form.setValue("status", val)
                }}
                defaultValue={form.getValues("status")}
              >
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
            <CardTitle>Challan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Quality *</Label>
                <Select
                  value={stockId || undefined}
                  onValueChange={(val: string | null) => {
                    if (!val) return
                    const stock = stocks.find((s) => s.id === val)
                    form.setValue("stock_id", val, { shouldValidate: true })
                    form.setValue("quality", stock?.quality_name || "")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality">
                      {selectedStock?.quality_name || "Select quality"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {stocks.map((stock) => (
                      <SelectItem key={stock.id} value={stock.id}>
                        {stock.quality_name} ({stock.available_taka} avail.)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableForSale != null && (
                  <p className="text-xs text-muted-foreground">
                    Available: {availableForSale} Taka
                  </p>
                )}
                {availableForSale != null && pieceCount > availableForSale && (
                  <p className="text-xs text-red-500">
                    Only {availableForSale} Taka Available.
                  </p>
                )}
                {form.formState.errors.stock_id && (
                  <p className="text-xs text-red-500">{form.formState.errors.stock_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Broker</Label>
                <Input {...form.register("broker")} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Delivered By</Label>
              <Input {...form.register("delivered_by")} placeholder="e.g. Rajesh Patel" />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea {...form.register("remarks")} placeholder="Optional remarks" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
          <CardDescription>
            Add taka / meters / weight rows. Press Enter on the last field to add the next row.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto overflow-y-clip">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[70px]">Sr No</TableHead>
                  <TableHead>Taka No.</TableHead>
                  <TableHead className="w-[140px]">MTS</TableHead>
                  <TableHead className="w-[140px]">Wt.</TableHead>
                  <TableHead className="w-[96px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <DeliveryChallanItemRow
                    key={field.id}
                    rowId={field.id}
                    index={index}
                    isNew={newRowId === field.id}
                    canDelete={fields.length > 1}
                    onAddBelow={addRowAfter}
                    onRemove={remove}
                    onEnter={handleRowFieldEnter}
                    setTakaRef={setTakaRef}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-3 grid grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_280px]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto sm:justify-self-start"
              onClick={() => addRowAfter()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Row
            </Button>

            <DeliveryChallanItemsSummary />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea {...form.register("notes")} placeholder="Any special instructions..." />
        </CardContent>
      </Card>
    </form>
    </FormProvider>
  )
}
