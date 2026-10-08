"use client"

import { useState, useMemo } from "react"
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Tag,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Building2,
  FileSpreadsheet,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { format } from "date-fns"
import { toast } from "sonner"
import { deleteVaultDocument } from "@/services/documents.service"
import { formatFinancialYearLabel } from "@/types"
import type { DocumentFilters, VaultDocument } from "@/types"

interface DocumentVaultProps {
  companyId: string
  documents: VaultDocument[]
  isLoading: boolean
  financialYear: string
  availableFinancialYears: string[]
  onFinancialYearChange: (fy: string) => void
  onRefresh: () => void
  onPreviewDocument: (doc: VaultDocument) => void
  onOpenQuickUpload: () => void
}

const FOLDERS: Array<{ id: VaultDocument["document_type"] | "all"; label: string; countKey?: string }> = [
  { id: "all", label: "All Bills & Documents" },
  { id: "Purchase Bill", label: "Purchase Bills" },
  { id: "Expense Bill", label: "Expense Bills" },
  { id: "GST Document", label: "GST Documents" },
  { id: "Transport Bill", label: "Transport Bills" },
  { id: "Machine Bill", label: "Machine Bills" },
  { id: "Other", label: "Other Documents" },
]

export function DocumentVault({
  companyId,
  documents,
  isLoading,
  financialYear,
  availableFinancialYears,
  onFinancialYearChange,
  onRefresh,
  onPreviewDocument,
  onOpenQuickUpload,
}: DocumentVaultProps) {
  const [search, setSearch] = useState("")
  const [selectedFolder, setSelectedFolder] = useState<VaultDocument["document_type"] | "all">("all")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Delete state
  const [docToDelete, setDocToDelete] = useState<VaultDocument | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Folder filter
      if (selectedFolder !== "all" && doc.document_type !== selectedFolder) {
        return false
      }
      // Tag filter
      if (selectedTag !== "all" && !doc.tags.includes(selectedTag)) {
        return false
      }
      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const matchesName = doc.file_name.toLowerCase().includes(q)
        const matchesDesc = doc.description?.toLowerCase().includes(q)
        const matchesSupplier = doc.supplier?.name.toLowerCase().includes(q)
        const matchesGstin = doc.supplier?.gstin?.toLowerCase().includes(q)
        const matchesTags = doc.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchesName && !matchesDesc && !matchesSupplier && !matchesGstin && !matchesTags) {
          return false
        }
      }
      return true
    })
  }, [documents, selectedFolder, selectedTag, search])

  // Count per folder
  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length }
    documents.forEach((d) => {
      counts[d.document_type] = (counts[d.document_type] || 0) + 1
    })
    return counts
  }, [documents])

  const handleDeleteConfirm = async () => {
    if (!docToDelete) return
    setIsDeleting(true)
    try {
      await deleteVaultDocument(companyId, docToDelete.id)
      toast.success(`Document "${docToDelete.file_name}" removed from vault.`)
      setDeleteDialogOpen(false)
      setDocToDelete(null)
      onRefresh()
    } catch (err) {
      console.error("Delete doc error:", err)
      toast.error("Failed to delete document.")
    } finally {
      setIsDeleting(false)
    }
  }

  const downloadFile = (doc: VaultDocument, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!doc.public_url) return
    const a = window.document.createElement("a")
    a.href = doc.public_url
    a.download = doc.file_name
    a.target = "_blank"
    a.rel = "noreferrer"
    window.document.body.appendChild(a)
    a.click()
    window.document.body.removeChild(a)
  }

  return (
    <div className="space-y-5">
      {/* Top Banner / Digital Folder Architecture Header */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-gradient-to-r from-muted/50 via-muted/30 to-background flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FolderOpen className="h-4 w-4" /> Digital Document Vault
          </div>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
            Original Bill & Invoice Archive ({formatFinancialYearLabel(financialYear)})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your online file cabinet. Search, inspect, and preview all purchase bills and GST receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
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

          <Button onClick={onOpenQuickUpload} className="rounded-xl shadow-xs">
            <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Bill
          </Button>
        </div>
      </div>

      {/* Main Vault Workspace: Sidebar Folders + Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left: Folders Navigation */}
        <div className="md:col-span-1 rounded-2xl border bg-card p-3 shadow-xs space-y-1">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
            Folders · FY {financialYear}
          </p>
          {FOLDERS.map((f) => {
            const count = folderCounts[f.id] || 0
            const active = selectedFolder === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFolder(f.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  {active ? <FolderOpen className="h-4 w-4 shrink-0" /> : <Folder className="h-4 w-4 shrink-0" />}
                  <span className="truncate">{f.label}</span>
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                    active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Right: Search, Filter & Document Cards */}
        <div className="md:col-span-3 space-y-4">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by file name, invoice number, supplier, GSTIN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={selectedTag} onValueChange={(val) => setSelectedTag(val || "all")}>
                <SelectTrigger className="h-10 w-[140px] rounded-xl text-xs">
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="GST">GST</SelectItem>
                  <SelectItem value="Non-GST">Non-GST</SelectItem>
                  <SelectItem value="Yarn">Yarn</SelectItem>
                  <SelectItem value="Fabric">Fabric</SelectItem>
                  <SelectItem value="Machine">Machine</SelectItem>
                  <SelectItem value="Transport">Transport</SelectItem>
                  <SelectItem value="Important">Important</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Documents Content */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground rounded-2xl border bg-card">
              Loading vault documents...
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border bg-card space-y-3">
              <Folder className="h-12 w-12 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">No documents in this folder</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No files found matching your search. Upload an original supplier bill or receipt to get started.
              </p>
              <Button size="sm" onClick={onOpenQuickUpload} className="rounded-xl mt-2">
                <UploadCloud className="h-4 w-4 mr-1.5" /> Upload First Bill
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredDocs.map((doc) => {
                const isPdf =
                  doc.file_type?.toLowerCase().includes("pdf") ||
                  doc.file_name.toLowerCase().endsWith(".pdf")
                const isImage =
                  doc.file_type?.toLowerCase().startsWith("image/") ||
                  /\.(jpg|jpeg|png|webp)$/i.test(doc.file_name)

                return (
                  <div
                    key={doc.id}
                    onClick={() => onPreviewDocument(doc)}
                    className="p-4 rounded-2xl border bg-card hover:bg-muted/20 hover:border-primary/40 transition-all cursor-pointer group shadow-2xs space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top icon & type */}
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isPdf
                              ? "bg-rose-500/10 text-rose-600"
                              : isImage
                              ? "bg-sky-500/10 text-sky-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}
                        >
                          {isPdf ? <FileText className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
                        </div>

                        <Badge variant="outline" className="text-[10px] rounded-md font-medium">
                          {doc.document_type}
                        </Badge>
                      </div>

                      {/* File Name & description */}
                      <div className="mt-2.5">
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {doc.file_name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {doc.description || (doc.supplier ? `Supplier: ${doc.supplier.name}` : "Bill document")}
                        </p>
                      </div>

                      {/* Tags */}
                      {doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.map((t) => (
                            <span
                              key={t}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer info & actions */}
                    <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onPreviewDocument(doc)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Preview"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => downloadFile(doc, e)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                          title="Download"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDocToDelete(doc)
                            setDeleteDialogOpen(true)
                          }}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title="Delete document"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Bill Document?"
        description={
          docToDelete
            ? `Are you sure you want to remove "${docToDelete.file_name}" from your company vault?`
            : "Are you sure you want to delete this document?"
        }
        confirmText="Delete Document"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
