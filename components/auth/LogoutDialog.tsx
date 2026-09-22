"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog"
import { LogOut } from "lucide-react"

interface LogoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LogoutDialog({ open, onOpenChange }: LogoutDialogProps) {
  const { logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await logout()
      onOpenChange(false)
      toast.success("Logged out successfully.")
      router.push("/admin/login")
    } catch {
      toast.error("Failed to log out.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Logout"
      description="Are you sure you want to logout?"
      confirmText="Logout"
      cancelText="Cancel"
      onConfirm={handleLogout}
      variant="destructive"
      icon={<LogOut className="w-5 h-5 text-rose-600" />}
      isLoading={isLoading}
    />
  )
}
