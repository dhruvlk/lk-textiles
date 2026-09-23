import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label?: string
  required?: boolean
  error?: string
  description?: string
  className?: string
  children: React.ReactNode
  htmlFor?: string
}

export function FormField({
  label,
  required,
  error,
  description,
  className,
  children,
  htmlFor,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <Label
          htmlFor={htmlFor}
          className={cn(
            "text-xs font-bold text-slate-700 dark:text-slate-300",
            error && "text-destructive"
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && !error && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
      {error && <p className="text-[11px] font-medium text-destructive">{error}</p>}
    </div>
  )
}
