"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AuthShellProps {
  title: string
  description: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.52_0.19_264/0.08),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn("relative w-full max-w-md", className)}
      >
        <Card className="shadow-float">
          <CardContent className="p-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <Link href="/admin/login" className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-soft">
                <FileText className="h-6 w-6 text-white" />
              </Link>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
