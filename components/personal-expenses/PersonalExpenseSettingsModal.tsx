"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PersonalExpensesSettingsSection } from "@/components/settings/sections/PersonalExpensesSettingsSection"
import { Settings2 } from "lucide-react"

interface PersonalExpenseSettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSettingsUpdated?: () => void
}

export function PersonalExpenseSettingsModal({
  open,
  onOpenChange,
  userId,
  onSettingsUpdated,
}: PersonalExpenseSettingsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl sm:max-w-4xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6 z-[95]">
        <DialogHeader className="border-b pb-3 mb-2">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Personal Expense Settings
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage your categories, subcategories, payment methods, and expense preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <PersonalExpensesSettingsSection
            isModal={true}
            onSettingsUpdated={onSettingsUpdated}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
