import React from "react"
import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl" | "full"
}

const maxWidthMap = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "7xl": "max-w-7xl",
  full: "max-w-full",
}

export function PageContainer({
  children,
  className,
  maxWidth = "7xl",
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6",
        maxWidthMap[maxWidth],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
