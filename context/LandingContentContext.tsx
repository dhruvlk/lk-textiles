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
  const [prevInitialContent, setPrevInitialContent] = useState(initialContent)
  const [isLoading, setIsLoading] = useState(false)

  // Sync state if server component passes updated initialContent
  if (initialContent !== prevInitialContent) {
    setPrevInitialContent(initialContent)
    if (initialContent) {
      setContent(initialContent)
    }
  }

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
      console.warn("Could not fetch landing content, using fallback:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Listen for focus, visibility change, and cross-tab publish events
  useEffect(() => {
    const handleRefresh = () => {
      if (document.visibilityState === "visible") {
        fetchContent()
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lk_landing_published_at") {
        fetchContent()
      }
    }

    let channel: BroadcastChannel | null = null
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("lk_landing_channel")
        channel.onmessage = (event) => {
          if (event.data?.type === "CONTENT_PUBLISHED") {
            fetchContent()
          }
        }
      } catch {}
    }

    window.addEventListener("visibilitychange", handleRefresh)
    window.addEventListener("focus", handleRefresh)
    window.addEventListener("storage", handleStorage)

    return () => {
      window.removeEventListener("visibilitychange", handleRefresh)
      window.removeEventListener("focus", handleRefresh)
      window.removeEventListener("storage", handleStorage)
      channel?.close()
    }
  }, [fetchContent])

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
  if (!context) {
    throw new Error("useLandingContent must be used within a LandingContentProvider")
  }
  return context.content
}

export function useLandingContentContext() {
  return useContext(LandingContentContext)
}
