import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  text?: string
  textClassName?: string
}

const sizeClasses = {
  xs: "size-3",
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-10",
}

export function LoadingSpinner({
  size = "sm",
  text,
  className,
  textClassName,
  ...props
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={cn("inline-flex items-center justify-center gap-2", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      {text && (
        <span className={cn("text-xs text-muted-foreground", textClassName)}>
          {text}
        </span>
      )}
      <span className="sr-only">{text || "Loading..."}</span>
    </div>
  )
}

export interface PageLoaderProps {
  text?: string
  className?: string
}

export function PageLoader({ text = "Loading...", className }: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] w-full flex-col items-center justify-center gap-3 p-8 text-center",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
