import React from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface SearchInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  placeholder?: string
  showClearButton?: boolean
  containerClassName?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder = "Search...",
  showClearButton = true,
  className,
  containerClassName,
  disabled,
  ...props
}: SearchInputProps) {
  const handleClear = () => {
    onChange("")
    if (onClear) onClear()
  }

  return (
    <div className={cn("relative flex-1", containerClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9", showClearButton && value ? "pr-8" : "", className)}
        {...props}
      />
      {showClearButton && value && !disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
