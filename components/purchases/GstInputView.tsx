"use client"

import { useState, useMemo } from "react"
import {
  FileSpreadsheet,
  Download,
  Search,
  IndianRupee,
  Calendar,
  Building2,
  FileText,
  BadgePercent,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { downloadCsv, downloadExcel } from "@/lib/reports/export"
import { formatFinancialYearLabel } from "@/types"
import { format } from "date-fns"
import { toast } from "sonner"
import type { GstInputReportRow } from "@/types"

interface GstInputViewProps {
  companyName: string
  rows: GstInputReportRow[]
  totals: {
    taxable: number
    cgst: number
    sgst: number
    igst: number
    totalGst: number
  }
  isLoading: boolean
  financialYear: string
  availableFinancialYears: string[]
  onFinancialYearChange: (fy: string) => void
}

export function GstInputView({
  companyName,
  rows,
  totals,
  isLoading,
  financialYear,
  availableFinancialYears,
  onFinancialYearChange,
}: GstInputViewProps) {
  const [search, setSearch] = useState("")

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase().trim()
    return rows.filter(
      (r) =>
        r.supplier_name.toLowerCase().includes(q) ||
        r.supplier_gstin.toLowerCase().includes(q) ||
        r.invoice_number.toLowerCase().includes(q)
    )
  }, [rows, search])

  const filteredTotals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        taxable: acc.taxable + r.taxable_amount,
        cgst: acc.cgst + r.cgst_amount,
        sgst: acc.sgst + r.sgst_amount,
        igst: acc.igst + r.igst_amount,
        totalGst: acc.totalGst + r.total_gst,
        grandTotal: acc.grandTotal + r.grand_total,
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, totalGst: 0, grandTotal: 0 }
    )
  }, [filteredRows])

  // Export handlers
  const handleExportCsv = () => {
    const headers = [
      "Supplier Name",
      "GSTIN",
      "Invoice No",
      "Invoice Date",
      "Taxable Value (INR)",
      "CGST (INR)",
      "SGST (INR)",
      "IGST (INR)",
      "Total GST (INR)",
      "Invoice Total (INR)",
      "Source",
    ]
    const dataRows = filteredRows.map((r) => [
      r.supplier_name,
      r.supplier_gstin,
      r.invoice_number,
      r.invoice_date,
      r.taxable_amount.toFixed(2),
      r.cgst_amount.toFixed(2),
      r.sgst_amount.toFixed(2),
      r.igst_amount.toFixed(2),
      r.total_gst.toFixed(2),
      r.grand_total.toFixed(2),
      r.source,
    ])
    downloadCsv(`GST_Input_Tax_Credit_${financialYear}.csv`, headers, dataRows)
    toast.success("CSV export downloaded!")
  }

  const handleExportExcel = () => {
    const headers = [
      "Supplier Name",
      "GSTIN",
      "Invoice No",
      "Invoice Date",
      "Taxable Value (INR)",
      "CGST (INR)",
      "SGST (INR)",
      "IGST (INR)",
      "Total GST (INR)",
      "Invoice Total (INR)",
      "Source",
    ]
    const dataRows = filteredRows.map((r) => [
      r.supplier_name,
      r.supplier_gstin,
      r.invoice_number,
      r.invoice_date,
      r.taxable_amount.toFixed(2),
      r.cgst_amount.toFixed(2),
      r.sgst_amount.toFixed(2),
      r.igst_amount.toFixed(2),
      r.total_gst.toFixed(2),
      r.grand_total.toFixed(2),
      r.source,
    ])
    downloadExcel(`GST_Input_Tax_Credit_${financialYear}.xlsx`, headers, dataRows)
    toast.success("Excel export downloaded!")
  }

  return (
    <div className="space-y-6">
      {/* 5 KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Taxable Purchases
            </p>
            <p className="text-lg sm:text-xl font-bold text-foreground mt-1 tabular-nums">
              ₹{filteredTotals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Input base value</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total CGST
            </p>
            <p className="text-lg sm:text-xl font-bold text-sky-600 mt-1 tabular-nums">
              ₹{filteredTotals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Central Tax Credit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total SGST
            </p>
            <p className="text-lg sm:text-xl font-bold text-indigo-600 mt-1 tabular-nums">
              ₹{filteredTotals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">State Tax Credit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total IGST
            </p>
            <p className="text-lg sm:text-xl font-bold text-purple-600 mt-1 tabular-nums">
              ₹{filteredTotals.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Integrated Tax Credit</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-primary/5 border-primary/20 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
              <BadgePercent className="h-3.5 w-3.5" /> Total Input GST
            </p>
            <p className="text-lg sm:text-xl font-extrabold text-primary mt-1 tabular-nums">
              ₹{filteredTotals.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-primary/80 mt-0.5 font-medium">Eligible ITC Pool</p>
          </CardContent>
        </Card>
      </div>

      {/* Action / Export / Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by supplier name, GSTIN, invoice number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>

          <Select value={financialYear} onValueChange={(val) => val && onFinancialYearChange(val)}>
            <SelectTrigger className="h-10 w-[140px] rounded-xl text-xs font-semibold">
              <SelectValue>
                {(val: string | null) => (val ? formatFinancialYearLabel(val) : "Select FY")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableFinancialYears.map((fy) => (
                <SelectItem key={fy} value={fy}>
                  {formatFinancialYearLabel(fy)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCsv} className="rounded-xl h-10 text-xs">
            <Download className="h-4 w-4 mr-1.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} className="rounded-xl h-10 text-xs">
            <FileSpreadsheet className="h-4 w-4 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Main GST Input Table */}
      <div className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3.5 text-left font-semibold">Supplier Name</th>
                <th className="py-3 px-3.5 text-left font-semibold">GSTIN</th>
                <th className="py-3 px-3.5 text-left font-semibold">Invoice No.</th>
                <th className="py-3 px-3.5 text-left font-semibold">Date</th>
                <th className="py-3 px-3.5 text-right font-semibold">Taxable Value</th>
                <th className="py-3 px-3.5 text-right font-semibold">CGST</th>
                <th className="py-3 px-3.5 text-right font-semibold">SGST</th>
                <th className="py-3 px-3.5 text-right font-semibold">IGST</th>
                <th className="py-3 px-3.5 text-right font-semibold">Total GST (ITC)</th>
                <th className="py-3 px-3.5 text-right font-semibold">Total Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    Calculating GST input credit entries...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground">
                    No GST purchase bills or expenses recorded for {formatFinancialYearLabel(financialYear)}.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={`${r.invoice_number}-${idx}`} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-3.5">
                      <p className="font-bold text-foreground">{r.supplier_name}</p>
                      <span className="text-[10px] text-muted-foreground">{r.source}</span>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-primary font-medium">{r.supplier_gstin}</td>
                    <td className="py-3 px-3.5 font-semibold text-foreground">{r.invoice_number}</td>
                    <td className="py-3 px-3.5 text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.invoice_date), "dd MMM yyyy")}
                    </td>
                    <td className="py-3 px-3.5 text-right font-medium tabular-nums whitespace-nowrap">
                      ₹{r.taxable_amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right tabular-nums whitespace-nowrap text-sky-600">
                      ₹{r.cgst_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3.5 text-right tabular-nums whitespace-nowrap text-indigo-600">
                      ₹{r.sgst_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3.5 text-right tabular-nums whitespace-nowrap text-purple-600">
                      ₹{r.igst_amount.toFixed(2)}
                    </td>
                    <td className="py-3 px-3.5 text-right font-bold text-primary tabular-nums whitespace-nowrap">
                      ₹{r.total_gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3.5 text-right font-semibold text-foreground tabular-nums whitespace-nowrap">
                      ₹{r.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredRows.length > 0 && (
              <tfoot className="bg-muted/40 font-bold border-t text-xs">
                <tr>
                  <td colSpan={4} className="py-3 px-3.5 text-foreground uppercase tracking-wider">
                    Total Input Tax Credit (ITC)
                  </td>
                  <td className="py-3 px-3.5 text-right tabular-nums">
                    ₹{filteredTotals.taxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-sky-600 tabular-nums">
                    ₹{filteredTotals.cgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-indigo-600 tabular-nums">
                    ₹{filteredTotals.sgst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-purple-600 tabular-nums">
                    ₹{filteredTotals.igst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-primary text-sm font-extrabold tabular-nums">
                    ₹{filteredTotals.totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-3.5 text-right text-foreground tabular-nums">
                    ₹{filteredTotals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
