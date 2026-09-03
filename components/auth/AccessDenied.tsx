"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ShieldOff } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AccessDenied() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
        <ShieldOff className="h-7 w-7 text-destructive" />
      </div>
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        403
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Access Denied</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        You do not have permission to view this module. Contact your company owner if you
        need access.
      </p>
      <Button className="mt-6" render={<Link href="/admin" />} nativeButton={false}>
        Back to Dashboard
      </Button>
    </motion.div>
  )
}
