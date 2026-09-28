"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Loader2, Save } from "lucide-react"
import { cn } from "@/lib/utils"

interface PublishButtonProps {
  isDirty: boolean
  isSaving: boolean
  isPublished?: boolean
  onPublish: () => void
  className?: string
  size?: "default" | "sm" | "lg"
}

export function PublishButton({
  isDirty,
  isSaving,
  isPublished = false,
  onPublish,
  className,
  size = "sm",
}: PublishButtonProps) {
  const isDisabled = (!isDirty && isPublished) || isSaving

  return (
    <Button
      type="button"
      size={size}
      disabled={isDisabled}
      onClick={onPublish}
      className={cn(
        "rounded-xl px-4 text-xs font-bold transition-all shadow-sm",
        isDirty
          ? "bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white hover:brightness-110 shadow-md shadow-slate-900/15 cursor-pointer scale-[1.01] active:scale-[0.99]"
          : isPublished
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 cursor-default shadow-none font-semibold"
          : "bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed shadow-none",
        className
      )}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          <span>Publishing...</span>
        </>
      ) : isDirty ? (
        <>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          <span>Publish Changes</span>
        </>
      ) : isPublished ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
          <span>Published & Live</span>
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5 mr-1.5" />
          <span>Publish Changes</span>
        </>
      )}
    </Button>
  )
}
