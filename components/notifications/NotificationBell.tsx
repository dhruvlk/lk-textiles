"use client"
/* eslint-disable */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { Bell, CheckCheck, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useCompany } from "@/components/company-provider"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  clearNotification,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications.service"
import { useNotificationFetcher } from "@/hooks/useNotifications"
import type { AppNotification } from "@/types"
import { cn } from "@/lib/utils"

function formatRelativeTime(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  try {
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ""
  }
}

export function NotificationBell() {
  const { selectedCompany } = useCompany()
  const companyId = selectedCompany?.id
  const router = useRouter()
  const { fetchNotifications } = useNotificationFetcher(companyId)
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(false)

  const refreshUnread = useCallback(async () => {
    const result = await fetchNotifications({ includeList: false })
    if (!result) return
    setUnread(result.unread)
  }, [fetchNotifications])

  const refreshPanel = useCallback(async () => {
    setLoadingList(true)
    try {
      const result = await fetchNotifications({
        includeList: true,
        listLimit: 8,
        syncPayments: true,
      })
      if (!result) return
      setItems(result.items)
      setUnread(result.unread)
    } finally {
      setLoadingList(false)
    }
  }, [fetchNotifications])

  useEffect(() => {
    if (!companyId) {
      setItems([])
      setUnread(0)
      return
    }

    const controller = new AbortController()
    void fetchNotifications({ includeList: false }, controller.signal).then((result) => {
      if (result) setUnread(result.unread)
    })

    return () => controller.abort()
  }, [companyId, fetchNotifications])

  useEffect(() => {
    if (!open || !companyId) return

    const controller = new AbortController()
    setLoadingList(true)

    void fetchNotifications(
      { includeList: true, listLimit: 8, syncPayments: true },
      controller.signal
    )
      .then((result) => {
        if (!result) return
        setItems(result.items)
        setUnread(result.unread)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingList(false)
      })

    return () => controller.abort()
  }, [open, companyId, fetchNotifications])

  if (!selectedCompany || !companyId) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="relative size-8 shrink-0"
            aria-label="Notifications"
          />
        }
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(100vw-2rem,22rem)] gap-0 overflow-hidden p-0"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            disabled={!unread}
            onClick={async () => {
              try {
                await markAllNotificationsRead(companyId)
                await refreshPanel()
              } catch {
                toast.error("Could not mark all as read")
              }
            }}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loadingList ? (
            <div className="space-y-2 px-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex gap-2 border-b px-3 py-2.5 last:border-b-0",
                  !item.is_read && "bg-primary/5"
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={async () => {
                    try {
                      if (!item.is_read) await markNotificationRead(item.id)
                    } catch {
                      // ignore
                    }
                    setOpen(false)
                    if (item.entity_type === "challan" && item.entity_id) {
                      router.push(`/invoices/${item.entity_id}`)
                    } else if (item.entity_type === "delivery_challan" && item.entity_id) {
                      router.push(`/delivery-challans/${item.entity_id}`)
                    } else if (item.entity_type === "stock") {
                      router.push("/admin/stock")
                    } else {
                      router.push("/admin/notifications")
                    }
                    void refreshUnread()
                  }}
                >
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  {item.message ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {item.message}
                    </p>
                  ) : null}
                  {formatRelativeTime(item.created_at) ? (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatRelativeTime(item.created_at)}
                    </p>
                  ) : null}
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={async () => {
                    try {
                      await clearNotification(item.id)
                      await refreshPanel()
                    } catch {
                      toast.error("Could not clear notification")
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t p-1.5">
          <Button
            type="button"
            variant="ghost"
            className="h-9 w-full text-sm font-medium"
            onClick={() => {
              setOpen(false)
              router.push("/admin/notifications")
            }}
          >
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
