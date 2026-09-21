"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RotateCcw, Home } from "lucide-react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard route error:", error)
  }, [error])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4 text-destructive">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mb-6">
        An error occurred while loading this dashboard section. You can try refreshing or return to the main dashboard.
      </p>
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => reset()} className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
        <Link href="/admin">
          <Button size="sm" className="gap-2">
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  )
}
