"use client"

import React, { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: "default" | "destructive"
  icon?: React.ReactNode
  isLoading?: boolean
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  variant = "destructive",
  icon,
  isLoading = false,
}: ConfirmationDialogProps) {
  // Prevent background scrolling while modal is open, and restore cleanly when closed
  useEffect(() => {
    if (open) {
      const originalBodyOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"

      const adminMain = document.getElementById("landing-admin-main")
      const originalMainOverflow = adminMain ? adminMain.style.overflow : ""
      if (adminMain) {
        adminMain.style.overflow = "hidden"
      }

      return () => {
        if (originalBodyOverflow && originalBodyOverflow !== "hidden") {
          document.body.style.overflow = originalBodyOverflow
        } else {
          document.body.style.overflow = ""
        }

        if (adminMain) {
          if (originalMainOverflow && originalMainOverflow !== "hidden") {
            adminMain.style.overflow = originalMainOverflow
          } else {
            adminMain.style.overflow = ""
          }
        }
      }
    }
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!isLoading) {
          onOpenChange(val)
        }
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl sm:rounded-3xl border border-border/80 bg-card/95 backdrop-blur-2xl shadow-xl p-6 sm:p-7">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {icon && (
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 shadow-xs ${
                variant === "destructive"
                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  : "bg-muted text-foreground border border-border/70"
              }`}
            >
              {icon}
            </div>
          )}
          <div className="space-y-1.5 flex-1 text-left">
            <DialogHeader className="p-0 text-left">
              <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-1">
                {description}
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>
        <DialogFooter className="gap-2.5 pt-4 sm:justify-end border-t border-border/50 mt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant}
            disabled={isLoading}
            onClick={onConfirm}
            className="rounded-xl px-4 py-2 text-xs font-semibold shadow-xs"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
