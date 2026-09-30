"use client"

import { Trash2 } from "lucide-react"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"

interface DeleteConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete Legal Content",
  description = "Are you sure you want to delete this content?",
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      confirmText="Delete Content"
      cancelText="Cancel"
      variant="destructive"
      icon={<Trash2 className="w-5 h-5 text-rose-600" />}
      isLoading={isLoading}
      onConfirm={onConfirm}
    />
  )
}
