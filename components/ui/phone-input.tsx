"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { cleanPhoneDigits } from "@/lib/validations/phone"

export interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "defaultValue"> {
  id?: string
  name?: string
  value?: string | null
  defaultValue?: string | null
  onChange?: (value: string) => void
  onBlur?: React.FocusEventHandler<HTMLInputElement>
  error?: string
  containerClassName?: string
  inputClassName?: string
  variant?: "default" | "underline"
  showError?: boolean
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      error: externalError,
      containerClassName,
      inputClassName,
      variant = "default",
      showError = true,
      placeholder = "98765 43210",
      disabled = false,
      required = false,
      className: _ignored,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internalDigits, setInternalDigits] = React.useState<string>(() =>
      cleanPhoneDigits(defaultValue)
    )
    const [touched, setTouched] = React.useState(false)

    // Current 10-digit string
    const currentDigits = isControlled ? cleanPhoneDigits(value) : internalDigits

    // Synchronize internal state when defaultValue changes in uncontrolled mode
    React.useEffect(() => {
      if (!isControlled && defaultValue !== undefined) {
        setInternalDigits(cleanPhoneDigits(defaultValue))
      }
    }, [isControlled, defaultValue])

    // Compute validation error message
    let inlineError = ""
    if (touched) {
      if (required && currentDigits.length === 0) {
        inlineError = "Mobile number is required"
      } else if (currentDigits.length > 0 && currentDigits.length < 10) {
        inlineError = "Mobile number must be exactly 10 digits"
      }
    }
    const displayError = externalError || inlineError

    const handleDigitsChange = (newDigits: string) => {
      const sanitized = newDigits.replace(/\D/g, "").slice(0, 10)
      if (!isControlled) {
        setInternalDigits(sanitized)
      }
      const fullValue = sanitized.length > 0 ? `+91${sanitized}` : ""
      onChange?.(fullValue)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow control/meta key combinations (Ctrl+A, Ctrl+C, Ctrl+V, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      // Allow navigation & editing keys
      const allowedKeys = [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ]
      if (allowedKeys.includes(e.key)) {
        return
      }

      // Block any non-numeric key press
      if (!/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        return
      }

      // Prevent typing an 11th digit if not replacing selection
      const target = e.currentTarget
      const selectionLength = (target.selectionEnd ?? 0) - (target.selectionStart ?? 0)
      if (currentDigits.length >= 10 && selectionLength === 0) {
        e.preventDefault()
      }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault()
      const pastedText = e.clipboardData.getData("text")
      const pastedDigits = cleanPhoneDigits(pastedText)

      const target = e.currentTarget
      const start = target.selectionStart ?? 0
      const end = target.selectionEnd ?? 0

      const before = currentDigits.slice(0, start)
      const after = currentDigits.slice(end)
      const combined = cleanPhoneDigits(before + pastedDigits + after)

      handleDigitsChange(combined)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleDigitsChange(e.target.value)
    }

    const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true)
      onBlur?.(e)
    }

    const formattedStorageValue = currentDigits.length > 0 ? `+91${currentDigits}` : ""

    return (
      <div className="w-full">
        {name && <input type="hidden" name={name} value={formattedStorageValue} />}

        {variant === "underline" ? (
          <div
            className={cn(
              "flex items-center w-full min-w-0 border-0 border-b-2 border-slate-200 bg-transparent text-lg text-slate-900 transition-colors",
              "focus-within:border-primary",
              disabled && "pointer-events-none cursor-not-allowed opacity-60",
              displayError && "border-red-500",
              containerClassName
            )}
          >
            <span
              className="text-lg font-semibold text-slate-700 pr-2 select-none shrink-0"
              aria-hidden="true"
            >
              +91
            </span>
            <input
              ref={ref}
              id={id}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder={placeholder}
              value={currentDigits}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={handleInputBlur}
              disabled={disabled}
              required={required}
              aria-invalid={Boolean(displayError)}
              className={cn(
                "flex-1 min-w-0 bg-transparent px-0 py-2 text-lg text-slate-900 placeholder:text-slate-300 outline-none",
                inputClassName
              )}
              {...props}
            />
          </div>
        ) : (
          <div
            className={cn(
              "flex items-center w-full min-w-0 rounded-lg border border-input bg-card text-sm shadow-xs transition-all duration-200 overflow-hidden",
              "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 hover:border-border",
              disabled && "pointer-events-none cursor-not-allowed bg-muted/50 opacity-60",
              displayError && "border-destructive ring-3 ring-destructive/20",
              containerClassName
            )}
          >
            <div
              className="flex items-center justify-center px-3 py-1 text-muted-foreground font-medium border-r border-input select-none shrink-0 text-sm bg-muted/30 h-full self-stretch"
              aria-hidden="true"
            >
              +91
            </div>
            <input
              ref={ref}
              id={id}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder={placeholder}
              value={currentDigits}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={handleInputBlur}
              disabled={disabled}
              required={required}
              aria-invalid={Boolean(displayError)}
              className={cn(
                "flex-1 min-w-0 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground text-foreground",
                inputClassName
              )}
              {...props}
            />
          </div>
        )}

        {showError && displayError && (
          <p
            className={cn(
              "text-xs mt-1 animate-in fade-in-50",
              variant === "underline" ? "text-red-500" : "text-destructive"
            )}
          >
            {displayError}
          </p>
        )}
      </div>
    )
  }
)

PhoneInput.displayName = "PhoneInput"
