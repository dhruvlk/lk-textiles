"use client"

import { motion } from "framer-motion"
import { MODULE_CONFIG, type PermissionModule } from "@/constants/permissions"
import type { PermissionFlags, PermissionMatrix as Matrix } from "@/types/permissions"
import { cn } from "@/lib/utils"

type PermissionMatrixProps = {
  value: Matrix
  onChange: (next: Matrix) => void
  disabled?: boolean
  /** Hide owner-only modules from the grantable matrix */
  hideOwnerOnly?: boolean
}

function toggleFlag(
  flags: PermissionFlags,
  key: keyof PermissionFlags,
  checked: boolean
): PermissionFlags {
  const next = { ...flags, [key]: checked }
  // Creating/editing/deleting/exporting implies view
  if (checked && key !== "can_view") {
    next.can_view = true
  }
  // Turning off view clears dependent actions
  if (!checked && key === "can_view") {
    return {
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
      can_export: false,
    }
  }
  return next
}

export function PermissionMatrixEditor({
  value,
  onChange,
  disabled = false,
  hideOwnerOnly = true,
}: PermissionMatrixProps) {
  const modules = MODULE_CONFIG.filter((m) => !(hideOwnerOnly && m.ownerOnly))

  const updateModule = (module: PermissionModule, key: keyof PermissionFlags, checked: boolean) => {
    onChange({
      ...value,
      [module]: toggleFlag(value[module], key, checked),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight">Permissions</h3>
          <p className="text-xs text-muted-foreground">
            Choose exactly what this employee can view and change.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,0.7fr))] gap-2 border-b bg-muted/40 px-4 py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase sm:grid">
          <span>Module</span>
          <span className="text-center">View</span>
          <span className="text-center">Create</span>
          <span className="text-center">Edit</span>
          <span className="text-center">Delete</span>
          <span className="text-center">Export</span>
        </div>

        <div className="divide-y divide-border/60">
          {modules.map((mod, index) => {
            const flags = value[mod.module]
            const actionKeys = new Set(mod.actions.map((a) => a.key))
            return (
              <motion.div
                key={mod.module}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                className="flex flex-col gap-2.5 px-4 py-3 sm:grid sm:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,0.7fr))] sm:items-center sm:gap-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{mod.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{mod.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:contents">
                  {(
                    [
                      ["can_view", "view", "View"],
                      ["can_create", "create", "Create"],
                      ["can_edit", "edit", "Edit"],
                      ["can_delete", "delete", "Delete"],
                      ["can_export", "export", "Export"],
                    ] as const
                  ).map(([flagKey, actionKey, label]) => {
                    const available = actionKeys.has(actionKey)
                    return (
                      <label
                        key={flagKey}
                        className={cn(
                          "flex items-center gap-2 rounded-md border border-border/50 p-1.5 sm:border-0 sm:p-0 sm:justify-center",
                          !available && "opacity-30"
                        )}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border accent-primary"
                          checked={available ? flags[flagKey] : false}
                          disabled={disabled || !available}
                          onChange={(e) =>
                            updateModule(mod.module, flagKey, e.target.checked)
                          }
                        />
                        <span className="text-xs text-muted-foreground sm:hidden">{label}</span>
                      </label>
                    )
                  })}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Employee Management remains Owner-only and cannot be granted here.
      </p>
    </div>
  )
}
