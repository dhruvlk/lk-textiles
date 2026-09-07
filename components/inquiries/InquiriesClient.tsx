"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState, useMemo } from "react"
import { format } from "date-fns"
import {
  Inbox,
  Mail,
  Phone,
  Building2,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Check,
  Copy,
  MessageSquare,
} from "lucide-react"
import { toast } from "sonner"
import type { Inquiry, InquiryStatus } from "@/types"
import {
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
} from "@/services/inquiries.service"
import { PageHeader } from "@/components/common/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"

function getInitials(name?: string): string {
  if (!name) return "IN"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function InquiriesClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all")

  // Detail Modal State
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Delete Dialog State
  const [inquiryToDelete, setInquiryToDelete] = useState<Inquiry | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Copied state indicator
  const [copiedEmail, setCopiedEmail] = useState(false)

  const fetchInquiriesData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)

    try {
      const data = await getInquiries()
      setInquiries(data)
    } catch (error) {
      console.error("Failed to load inquiries:", error)
      toast.error("Failed to load inquiries. Make sure the database migration has run.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchInquiriesData()
  }, [])

  // Derived counts
  const totalCount = inquiries.length
  const newCount = inquiries.filter((i) => i.status === "new").length
  const readCount = inquiries.filter((i) => i.status === "read").length

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      // Status filter
      if (statusFilter !== "all" && inquiry.status !== statusFilter) {
        return false
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase()
        const matchesName = inquiry.full_name?.toLowerCase().includes(q)
        const matchesEmail = inquiry.email?.toLowerCase().includes(q)
        const matchesPhone = inquiry.phone?.toLowerCase().includes(q)
        const matchesCompany = inquiry.company?.toLowerCase().includes(q)
        const matchesSubject = inquiry.subject?.toLowerCase().includes(q)
        const matchesMessage = inquiry.message?.toLowerCase().includes(q)
        return (
          matchesName ||
          matchesEmail ||
          matchesPhone ||
          matchesCompany ||
          matchesSubject ||
          matchesMessage
        )
      }
      return true
    })
  }, [inquiries, statusFilter, search])

  // Handlers
  const handleOpenDetail = async (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry)
    setDetailOpen(true)

    // Auto mark as read when viewing if currently new
    if (inquiry.status === "new") {
      try {
        const updated = await updateInquiryStatus(inquiry.id, "read")
        setInquiries((prev) =>
          prev.map((i) => (i.id === inquiry.id ? updated : i))
        )
        setSelectedInquiry(updated)
      } catch (err) {
        console.error("Could not update status to read:", err)
      }
    }
  }

  const handleToggleStatus = async (inquiry: Inquiry, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const nextStatus: InquiryStatus = inquiry.status === "new" ? "read" : "new"
    try {
      const updated = await updateInquiryStatus(inquiry.id, nextStatus)
      setInquiries((prev) =>
        prev.map((i) => (i.id === inquiry.id ? updated : i))
      )
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry(updated)
      }
      toast.success(
        nextStatus === "read" ? "Marked as read" : "Marked as new / unread"
      )
    } catch {
      toast.error("Failed to update inquiry status")
    }
  }

  const handleDeleteConfirm = async () => {
    if (!inquiryToDelete) return
    setIsDeleting(true)
    try {
      await deleteInquiry(inquiryToDelete.id)
      setInquiries((prev) => prev.filter((i) => i.id !== inquiryToDelete.id))
      if (selectedInquiry?.id === inquiryToDelete.id) {
        setDetailOpen(false)
        setSelectedInquiry(null)
      }
      toast.success("Inquiry deleted successfully")
    } catch {
      toast.error("Failed to delete inquiry")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setInquiryToDelete(null)
    }
  }

  const handleCopyEmail = (email: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    navigator.clipboard.writeText(email)
    setCopiedEmail(true)
    toast.success("Email copied to clipboard")
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        eyebrow="Communications"
        title="Website Inquiries"
        description="View, track, and follow up on contact form submissions from your website visitors."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchInquiriesData(true)}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-gradient-to-br from-card to-card/50 shadow-xs transition-shadow hover:shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Inbox className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Inquiries
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {totalCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-card shadow-xs transition-shadow hover:shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  New / Unread
                </p>
                {newCount > 0 && (
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                  </span>
                )}
              </div>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {newCount}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-card shadow-xs transition-shadow hover:shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Read / Handled
              </p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {readCount}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search input */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by sender, email, phone, company, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-h-10 pl-9"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-md px-3 py-1.5 font-medium transition-all ${
              statusFilter === "all"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("new")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              statusFilter === "new"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            New ({newCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("read")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${
              statusFilter === "read"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Read ({readCount})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <Card className="border-border/60">
          <div className="space-y-4 p-8">
            <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
            <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
            <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
            <div className="h-12 w-full animate-pulse rounded-md bg-muted/60" />
          </div>
        </Card>
      ) : filteredInquiries.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={
            search || statusFilter !== "all"
              ? "No matching inquiries found"
              : "No inquiries yet"
          }
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your search query or status filter."
              : "When visitors submit your website's contact form, their inquiries will appear here automatically."
          }
          action={
            search || statusFilter !== "all" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden border-border/60 shadow-xs">
          {/* Desktop & Tablet Table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[220px]">Sender</TableHead>
                  <TableHead className="w-[220px]">Contact</TableHead>
                  <TableHead>Subject & Message Preview</TableHead>
                  <TableHead className="w-[160px]">Date</TableHead>
                  <TableHead className="w-[110px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInquiries.map((inquiry) => {
                  const isNew = inquiry.status === "new"
                  return (
                    <TableRow
                      key={inquiry.id}
                      onClick={() => handleOpenDetail(inquiry)}
                      className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                        isNew
                          ? "bg-amber-500/[0.03] font-medium hover:bg-amber-500/[0.07]"
                          : ""
                      }`}
                    >
                      {/* Status */}
                      <TableCell>
                        {isNew ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            New
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            Read
                          </span>
                        )}
                      </TableCell>

                      {/* Sender */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {inquiry.full_name}
                          </p>
                          {inquiry.company ? (
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate">{inquiry.company}</span>
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <a
                            href={`mailto:${inquiry.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-primary hover:underline"
                            title="Send email"
                          >
                            <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate">{inquiry.email}</span>
                          </a>
                          {inquiry.phone && (
                            <a
                              href={`tel:${inquiry.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
                              title="Call phone"
                            >
                              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span>{inquiry.phone}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Subject & Message */}
                      <TableCell>
                        <div className="max-w-md space-y-0.5">
                          {inquiry.subject && (
                            <p className="truncate text-sm font-medium text-foreground">
                              {inquiry.subject}
                            </p>
                          )}
                          <p className="line-clamp-1 text-xs text-muted-foreground">
                            {inquiry.message}
                          </p>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="space-y-0.5">
                          <p>
                            {format(new Date(inquiry.created_at), "dd MMM yyyy")}
                          </p>
                          <p className="text-[11px] opacity-75">
                            {format(new Date(inquiry.created_at), "hh:mm a")}
                          </p>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => handleOpenDetail(inquiry)}
                            title="View inquiry"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              isNew
                                ? "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                            onClick={(e) => handleToggleStatus(inquiry, e)}
                            title={isNew ? "Mark as Read" : "Mark as New"}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setInquiryToDelete(inquiry)
                              setDeleteDialogOpen(true)
                            }}
                            title="Delete inquiry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="divide-y divide-border md:hidden">
            {filteredInquiries.map((inquiry) => {
              const isNew = inquiry.status === "new"
              return (
                <div
                  key={inquiry.id}
                  onClick={() => handleOpenDetail(inquiry)}
                  className={`cursor-pointer p-4 transition-colors hover:bg-muted/40 ${
                    isNew ? "bg-amber-500/[0.04]" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">
                          {inquiry.full_name}
                        </p>
                        {isNew && (
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                            New
                          </span>
                        )}
                      </div>
                      {inquiry.company && (
                        <p className="text-xs text-muted-foreground">
                          {inquiry.company}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {format(new Date(inquiry.created_at), "dd MMM")}
                    </span>
                  </div>

                  {inquiry.subject && (
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {inquiry.subject}
                    </p>
                  )}

                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {inquiry.message}
                  </p>

                  <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-xs">
                    <span className="text-muted-foreground">
                      {inquiry.email}
                    </span>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={(e) => handleToggleStatus(inquiry, e)}
                      >
                        {isNew ? "Mark Read" : "Mark New"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => {
                          setInquiryToDelete(inquiry)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Inquiry Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl p-6 sm:p-7 gap-5 overflow-hidden">
          {selectedInquiry && (
            <div className="space-y-5">
              <DialogHeader className="pr-10 space-y-3">
                {/* Status & Timestamp Header */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    {selectedInquiry.status === "new" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        New Inquiry
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <Check className="h-3 w-3" />
                        Read
                      </span>
                    )}

                    <Button
                      variant="outline"
                      size="xs"
                      className="h-6 text-[11px] gap-1 rounded-full px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => handleToggleStatus(selectedInquiry)}
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {selectedInquiry.status === "new"
                        ? "Mark as Read"
                        : "Mark as New"}
                    </Button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {format(
                        new Date(selectedInquiry.created_at),
                        "dd MMM yyyy, hh:mm a"
                      )}
                    </span>
                  </div>
                </div>

                {/* Subject Title */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Subject
                  </p>
                  <DialogTitle className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-foreground break-words">
                    {selectedInquiry.subject || "Contact Form Submission"}
                  </DialogTitle>
                </div>
                <DialogDescription className="sr-only">
                  Inquiry details from {selectedInquiry.full_name}
                </DialogDescription>
              </DialogHeader>

              {/* Sender Profile Card */}
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 sm:p-4.5 space-y-3.5">
                {/* Sender Top Line: Avatar, Name, Company */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm border border-primary/20 shadow-2xs">
                    {getInitials(selectedInquiry.full_name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground tracking-tight truncate">
                      {selectedInquiry.full_name}
                    </p>
                    {selectedInquiry.company ? (
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                        <span className="truncate">{selectedInquiry.company}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-0.5">Website Visitor</p>
                    )}
                  </div>
                </div>

                {/* Contact Information (Email & Phone enclosed in individual cards) */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {/* Email Box */}
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/90 p-2.5 px-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Email
                        </p>
                        <a
                          href={`mailto:${selectedInquiry.email}`}
                          className="block text-xs sm:text-sm font-medium text-primary hover:underline truncate"
                          title={selectedInquiry.email}
                        >
                          {selectedInquiry.email}
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyEmail(selectedInquiry.email)}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Copy email address"
                    >
                      {copiedEmail ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Phone Box */}
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-background/90 p-2.5 px-3 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Phone
                        </p>
                        {selectedInquiry.phone ? (
                          <a
                            href={`tel:${selectedInquiry.phone}`}
                            className="block text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors truncate"
                            title={selectedInquiry.phone}
                          >
                            {selectedInquiry.phone}
                          </a>
                        ) : (
                          <p className="text-xs text-muted-foreground italic">Not provided</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Inquiry Message
                  </p>
                  <span className="text-[11px] text-muted-foreground">
                    {selectedInquiry.message.length} characters
                  </span>
                </div>
                <div className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap select-text max-h-[240px] overflow-y-auto font-sans shadow-2xs">
                  {selectedInquiry.message}
                </div>
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 pt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInquiryToDelete(selectedInquiry)
                    setDeleteDialogOpen(true)
                  }}
                  className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 justify-center sm:justify-start"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Inquiry
                </Button>

                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDetailOpen(false)}
                  >
                    Close
                  </Button>
                  <a
                    href={`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(
                      selectedInquiry.subject || "Website Inquiry"
                    )}`}
                    className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-xs")}
                  >
                    <Mail className="h-4 w-4" />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Inquiry"
        description={`Are you sure you want to delete the inquiry from "${inquiryToDelete?.full_name}"? This action cannot be undone.`}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  )
}
