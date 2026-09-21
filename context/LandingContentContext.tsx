"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { LandingPageContent } from "@/types/landing-content"
import { defaultLandingContent } from "@/constants/default-landing-content"

interface LandingContentContextType {
  content: LandingPageContent
  isLoading: boolean
  refreshContent: () => Promise<void>
}

const LandingContentContext = createContext<LandingContentContextType>({
  content: defaultLandingContent,
  isLoading: false,
  refreshContent: async () => {},
})

export function LandingContentProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode
  initialContent?: LandingPageContent
}) {
  const [content, setContent] = useState<LandingPageContent>(
    initialContent || defaultLandingContent
  )
  const [isLoading, setIsLoading] = useState(false)

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/landing/content", { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === "object") {
          setContent((prev) => ({
            ...prev,
            ...data,
          }))
        }
      }
    } catch (err) {
      console.warn("Could not fetch landing content, using default fallback:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false
    fetch("/api/admin/landing/content", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && data && typeof data === "object") {
          setContent((prev) => ({
            ...prev,
            ...data,
          }))
        }
      })
      .catch((err) => {
        console.warn("Could not fetch landing content, using default fallback:", err)
      })
      .finally(() => {
        if (!ignore) setIsLoading(false)
      })

    return () => {
      ignore = true
    }
  }, [])

  return (
    <LandingContentContext.Provider
      value={{
        content,
        isLoading,
        refreshContent: fetchContent,
      }}
    >
      {children}
    </LandingContentContext.Provider>
  )
}

export function useLandingContent() {
  const context = useContext(LandingContentContext)
  return context.content
}
