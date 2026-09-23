"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Upload, Loader2, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ImageUploaderFieldProps {
  label: string
  description?: string
  currentUrl: string
  fieldPath: string
  uploadingField?: string | null
  aspectRatio?: "square" | "video" | "wide" | "hero"
  onUploadSuccess: (url: string) => void
  onRemove?: () => void
  onUploadStateChange?: (fieldPath: string | null) => void
  className?: string
}

export function ImageUploaderField({
  label,
  description,
  currentUrl,
  fieldPath,
  uploadingField,
  aspectRatio = "wide",
  onUploadSuccess,
  onRemove,
  onUploadStateChange,
  className,
}: ImageUploaderFieldProps) {
  const [localUploading, setLocalUploading] = useState(false)
  const isUploading = uploadingField ? uploadingField === fieldPath : localUploading

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLocalUploading(true)
    onUploadStateChange?.(fieldPath)

    try {
      const body = new FormData()
      body.append("file", file)
      if (currentUrl && currentUrl.startsWith("http")) {
        body.append("oldUrl", currentUrl)
      }

      const res = await fetch("/api/admin/landing/upload", {
        method: "POST",
        body,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.")
      }

      onUploadSuccess(data.url)
      toast.success("Image uploaded successfully!")
    } catch (err: unknown) {
      console.error("Upload error:", err)
      toast.error(err instanceof Error ? err.message : "Failed to upload image.")
    } finally {
      setLocalUploading(false)
      onUploadStateChange?.(null)
      e.target.value = ""
    }
  }

  const aspectClass = {
    square: "h-24 w-24",
    video: "h-28 w-44",
    wide: "h-24 w-44",
    hero: "h-32 w-52",
  }[aspectRatio]

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{label}</Label>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
        <div
          className={cn(
            "relative bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shrink-0 border border-slate-300 dark:border-slate-700 shadow-xs",
            aspectClass
          )}
        >
          {currentUrl ? (
            <Image
              src={currentUrl}
              alt={label}
              fill
              sizes="(max-width: 768px) 176px, 176px"
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              No Image
            </div>
          )}
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs">
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>{currentUrl ? "Change Image" : "Upload Image"}</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,.jfif"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileChange}
              />
            </label>
            {currentUrl && onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:border-red-900 dark:text-red-400 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
          {description && <p className="text-[11px] text-slate-400">{description}</p>}
        </div>
      </div>
    </div>
  )
}
