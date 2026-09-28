"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  ExternalLink,
  RotateCcw,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Save,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { LegalContentEditor } from "./LegalContentEditor"
import { DeleteConfirmationModal } from "./DeleteConfirmationModal"
import { PublishButton } from "./PublishButton"
import { LegalContentType, LegalContent } from "@/types/landing-legal"
import { defaultLegalContentMap } from "@/constants/default-legal-content"

interface LegalContentCardProps {
  type: LegalContentType
  title: string
  subtitle: string
  publicUrl: string
  icon?: React.ReactNode
}

interface FormState {
  title: string
  description: string
  content: string
}

export function LegalContentCard({
  type,
  title,
  subtitle,
  publicUrl,
  icon,
}: LegalContentCardProps) {
  const [initialData, setInitialData] = useState<LegalContent | null>(null)
  const [formData, setFormData] = useState<FormState>({
    title: defaultLegalContentMap[type]?.title || "",
    description: defaultLegalContentMap[type]?.description || "",
    content: defaultLegalContentMap[type]?.content || "",
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/admin/landing/legal?type=${type}`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error("Failed to load legal document.")
        }
        const json = await res.json()
        if (ignore) return

        if (json.data) {
          setInitialData(json.data)
          setFormData({
            title: json.data.title || "",
            description: json.data.description || "",
            content: json.data.content || "",
          })
        } else {
          // Fallback to defaults
          const fallback = defaultLegalContentMap[type]
          if (fallback) {
            setInitialData(fallback)
            setFormData({
              title: fallback.title,
              description: fallback.description,
              content: fallback.content,
            })
          }
        }
      } catch {
        if (!ignore) {
          toast.error(`Could not load ${title}. Using default values.`)
          const fallback = defaultLegalContentMap[type]
          if (fallback) {
            setInitialData(fallback)
            setFormData({
              title: fallback.title,
              description: fallback.description,
              content: fallback.content,
            })
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      ignore = true
    }
  }, [type, title])

  // Check if dirty (unsaved changes exist)
  const isDirty = useMemo(() => {
    if (!initialData) return true
    return (
      formData.title.trim() !== (initialData.title || "").trim() ||
      formData.description.trim() !== (initialData.description || "").trim() ||
      formData.content.trim() !== (initialData.content || "").trim()
    )
  }, [formData, initialData])

  // Discard unsaved changes
  const handleDiscard = () => {
    if (!initialData) return
    setFormData({
      title: initialData.title || "",
      description: initialData.description || "",
      content: initialData.content || "",
    })
    toast.info("Unsaved changes discarded.")
  }

  // Save / Publish
  const handleSave = async (publish: boolean) => {
    if (!formData.title.trim()) {
      toast.error("Page title is required.")
      return
    }

    if (!formData.content.trim()) {
      toast.error("Document content cannot be empty.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/admin/landing/legal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: formData.title.trim(),
          description: formData.description.trim(),
          content: formData.content.trim(),
          is_published: publish,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to save content.")
      }

      const updated = json.data as LegalContent
      setInitialData(updated)
      setFormData({
        title: updated.title,
        description: updated.description,
        content: updated.content,
      })

      if (publish) {
        toast.success("Changes published successfully.")
      } else {
        toast.success("Draft saved successfully.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save content.")
    } finally {
      setIsSaving(false)
    }
  }

  // Confirm deletion
  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/landing/legal?type=${type}`, {
        method: "DELETE",
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || "Failed to delete content.")
      }

      setInitialData(null)
      setFormData({
        title: "",
        description: "",
        content: "",
      })

      toast.success("Content deleted successfully.")
      setDeleteModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete content.")
    } finally {
      setIsDeleting(false)
    }
  }

  const isPublished = Boolean(initialData?.is_published)

  if (isLoading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-800" />
        <span className="text-xs font-semibold text-slate-500">Loading {title}...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="flex items-start gap-3.5">
          {icon && (
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0 border border-slate-200/80">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
              {/* Publication Status Pill */}
              {isDirty ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  <span>Unsaved Changes</span>
                </span>
              ) : isPublished ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Published & Live</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Draft / Unpublished</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
        </div>

        {/* View Live Public Link */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Link
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200/80 transition-all shadow-2xs"
          >
            <span>View Public Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </Link>
        </div>
      </div>

      {/* Published Timestamp Info if Available */}
      {initialData?.updated_at && (
        <div className="flex items-center gap-2 text-[11px] text-slate-400 -mt-3">
          <Clock className="w-3.5 h-3.5" />
          <span>
            Last updated:{" "}
            {new Date(initialData.updated_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}

      {/* Editor Component */}
      <LegalContentEditor
        title={formData.title}
        description={formData.description}
        content={formData.content}
        onTitleChange={(v) => setFormData((prev) => ({ ...prev, title: v }))}
        onDescriptionChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
        onContentChange={(v) => setFormData((prev) => ({ ...prev, content: v }))}
        disabled={isSaving || isDeleting}
      />

      {/* Action Footer Bar */}
      <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Delete Trigger */}
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            disabled={(!initialData && !formData.title && !formData.content) || isSaving || isDeleting}
            className="rounded-xl px-3 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50/50 hover:bg-rose-100/60 border-rose-200/60 shadow-2xs transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Delete Content</span>
          </Button>
        </div>

        {/* Right Actions: Discard, Save Draft, Publish */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Discard Button */}
          {isDirty && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={isSaving || isDeleting}
              className="rounded-xl px-3.5 text-xs font-semibold text-amber-700 bg-amber-50/80 hover:bg-amber-100/80 border-amber-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>Discard Changes</span>
            </Button>
          )}

          {/* Save Draft Button (saves without publishing to public) */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSave(false)}
            disabled={!isDirty || isSaving || isDeleting}
            className="rounded-xl px-3.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs transition-all"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            <span>Save Draft</span>
          </Button>

          {/* Publish Button */}
          <PublishButton
            isDirty={isDirty}
            isSaving={isSaving}
            isPublished={isPublished}
            onPublish={() => handleSave(true)}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title={`Delete ${title}`}
        description="Are you sure you want to delete this content? This action will remove the content from the live website and public pages will display an empty state."
        isLoading={isDeleting}
      />
    </div>
  )
}
