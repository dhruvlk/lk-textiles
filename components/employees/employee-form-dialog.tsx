"use client"
/* eslint-disable */

import { useEffect, useState } from "react"
import { useCompany } from "@/components/company-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, PlusCircle } from "lucide-react"
import { PermissionMatrixEditor } from "@/components/employees/PermissionMatrix"
import { emptyPermissionMatrix } from "@/constants/permissions"
import {
  createEmployeeRequest,
  updateEmployeeRequest,
} from "@/services/employees.service"
import type { Employee, PermissionMatrix } from "@/types/permissions"

type EmployeeFormDialogProps = {
  onSaved: () => Promise<void> | void
  initialData?: Employee
  trigger?: React.ReactElement
}

export function EmployeeFormDialog({
  onSaved,
  initialData,
  trigger,
}: EmployeeFormDialogProps) {
  const { selectedCompany } = useCompany()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sendInvite, setSendInvite] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [permissions, setPermissions] = useState<PermissionMatrix>(emptyPermissionMatrix())

  useEffect(() => {
    if (!open) return
    if (initialData) {
      setStatus(initialData.is_active ? "active" : "inactive")
      setPermissions(initialData.permissions)
      setSendInvite(false)
      setShowPassword(false)
    } else {
      setStatus("active")
      // Sensible starter access — owner can change in the matrix
      const defaults = emptyPermissionMatrix()
      defaults.dashboard = {
        can_view: true,
        can_create: false,
        can_edit: false,
        can_delete: false,
        can_export: false,
      }
      setPermissions(defaults)
      setSendInvite(false)
      setShowPassword(false)
    }
  }, [open, initialData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedCompany) return

    const formData = new FormData(e.currentTarget)
    const fullName = String(formData.get("fullName") || "").trim()
    const email = String(formData.get("email") || "").trim()
    const mobile = String(formData.get("mobile") || "").trim() || null
    const designation = String(formData.get("designation") || "").trim() || null
    const password = String(formData.get("password") || "").trim()

    if (!fullName) {
      toast.error("Full name is required")
      return
    }

    setIsLoading(true)
    try {
      if (initialData) {
        await updateEmployeeRequest({
          companyId: selectedCompany.id,
          membershipId: initialData.membership_id,
          userId: initialData.user_id,
          fullName,
          mobile,
          designation,
          isActive: status === "active",
          password: password || undefined,
          permissions,
        })
        toast.success("Employee updated")
      } else {
        if (!email) {
          toast.error("Email is required")
          setIsLoading(false)
          return
        }
        await createEmployeeRequest({
          companyId: selectedCompany.id,
          fullName,
          email,
          mobile,
          designation,
          password: sendInvite ? undefined : password,
          sendInvite,
          isActive: status === "active",
          permissions,
        })
        toast.success(sendInvite ? "Invite sent" : "Employee created")
      }
      setOpen(false)
      await onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save employee")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )
        }
      />
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Employee" : "Add Employee"}</DialogTitle>
          <DialogDescription>
            {initialData
              ? `Update access for ${initialData.full_name}`
              : `Create a login and permission set for ${selectedCompany?.name}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                defaultValue={initialData?.full_name}
                placeholder="Rahul Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required={!initialData}
                defaultValue={initialData?.email}
                disabled={Boolean(initialData)}
                placeholder="accountant@adityatextiles.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                name="mobile"
                defaultValue={initialData?.mobile ?? ""}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Input
                id="designation"
                name="designation"
                defaultValue={initialData?.designation ?? ""}
                placeholder="Sales Executive"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as "active" | "inactive")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {status === "active" ? "Active" : "Inactive"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!initialData && (
              <div className="space-y-2 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-primary"
                    checked={sendInvite}
                    onChange={(e) => setSendInvite(e.target.checked)}
                  />
                  Send invite email instead of setting a password
                </label>
              </div>
            )}

            {(initialData || !sendInvite) && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="password">
                  {initialData ? "Reset Password (optional)" : "Password *"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required={!initialData && !sendInvite}
                    minLength={6}
                    placeholder={initialData ? "Leave blank to keep current" : "Minimum 6 characters"}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <PermissionMatrixEditor value={permissions} onChange={setPermissions} />

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialData ? "Save Changes" : "Create Employee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
