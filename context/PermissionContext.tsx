"use client"
/* eslint-disable react-hooks/set-state-in-effect */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCompany } from '@/components/company-provider'
import { getUserRoleForCompany } from '@/services/company-members.service'
import { getPermissionsForSessionUser } from '@/services/permissions.service'
import {
  actionFromPathname,
  moduleFromPathname,
  type PermissionAction,
  type PermissionModule,
} from '@/constants/permissions'
import { hasPermission, ownerMatrix } from '@/lib/permissions'
import type { PermissionMatrix } from '@/types/permissions'
import { AccessDenied } from '@/components/auth/AccessDenied'

type PermissionContextValue = {
  matrix: PermissionMatrix | null
  role: string | null
  isOwner: boolean
  isLoading: boolean
  can: (module: PermissionModule, action?: PermissionAction) => boolean
  canView: (module: PermissionModule) => boolean
  refreshPermissions: () => Promise<void>
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined)

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const lastKeyRef = useRef<string | null>(null)
  const hasDataRef = useRef(false)
  // Key of the request whose result may be applied (ignores stale responses).
  const inFlightKeyRef = useRef<string | null>(null)
  // Key (user + company) the current matrix belongs to.
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const userId = user?.id ?? null
  const userRole = user?.role ?? null
  const companyId = selectedCompany?.id ?? null
  const companyOwnerId = selectedCompany?.user_id ?? null

  const currentKey =
    userId && companyId ? `${userId}:${companyId}:${userRole}:${companyOwnerId}` : null

  const refreshPermissions = useCallback(async (force = false) => {
    if (!userId || !companyId) {
      lastKeyRef.current = null
      inFlightKeyRef.current = null
      hasDataRef.current = false
      setMatrix(null)
      setRole(null)
      setLoadedKey(null)
      setIsLoading(false)
      return
    }

    const cacheKey = `${userId}:${companyId}:${userRole}:${companyOwnerId}`
    if (!force && lastKeyRef.current === cacheKey && hasDataRef.current) {
      return
    }

    // Switching user/company: drop the previous company's permissions immediately
    // instead of applying them to the new company while the request is pending.
    if (lastKeyRef.current !== cacheKey) {
      hasDataRef.current = false
      setMatrix(null)
      setRole(null)
    }
    inFlightKeyRef.current = cacheKey
    if (!hasDataRef.current) setIsLoading(true)
    const isStale = () => inFlightKeyRef.current !== cacheKey

    try {
      const companyRole = await getUserRoleForCompany(userId, companyId)
      if (isStale()) return
      const ownsCompany = companyOwnerId === userId
      const effectiveRole =
        companyRole === 'Owner' || ownsCompany
          ? 'Owner'
          : (companyRole ?? userRole ?? 'Staff')
      let nextMatrix: PermissionMatrix
      if (effectiveRole === 'Owner') {
        nextMatrix = ownerMatrix()
      } else {
        nextMatrix = await getPermissionsForSessionUser(
          companyId,
          userId,
          effectiveRole
        )
        if (isStale()) return
      }
      setRole(effectiveRole)
      setMatrix(nextMatrix)
      lastKeyRef.current = cacheKey
      hasDataRef.current = true
      setLoadedKey(cacheKey)
    } catch (error) {
      console.error('[permissions]', error)
      if (isStale()) return
      if (userRole === 'Owner' || companyOwnerId === userId) {
        setRole('Owner')
        setMatrix(ownerMatrix())
        lastKeyRef.current = cacheKey
        hasDataRef.current = true
      } else {
        setMatrix(null)
        setRole(userRole)
        hasDataRef.current = false
      }
      setLoadedKey(cacheKey)
    } finally {
      if (!isStale()) setIsLoading(false)
    }
  }, [userId, companyId, userRole, companyOwnerId])

  useEffect(() => {
    void refreshPermissions(false)
  }, [refreshPermissions])

  const isOwner = role === 'Owner'

  const can = useCallback(
    (module: PermissionModule, action: PermissionAction = 'view') => {
      return hasPermission(matrix, module, action, { isOwner })
    },
    [matrix, isOwner]
  )

  const canView = useCallback(
    (module: PermissionModule) => can(module, 'view'),
    [can]
  )

  const refresh = useCallback(() => refreshPermissions(true), [refreshPermissions])

  // Also "loading" while the matrix belongs to a different user/company.
  const effectiveLoading = isLoading || (currentKey !== null && loadedKey !== currentKey)

  const value = useMemo(
    () => ({
      matrix,
      role,
      isOwner,
      isLoading: effectiveLoading,
      can,
      canView,
      refreshPermissions: refresh,
    }),
    [matrix, role, isOwner, effectiveLoading, can, canView, refresh]
  )

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function RoutePermissionGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { selectedCompany } = useCompany()
  const { can, isLoading } = usePermissions()

  const routeModule = moduleFromPathname(pathname)
  const routeAction = actionFromPathname(pathname)

  if (!user || !selectedCompany || !routeModule) {
    return <>{children}</>
  }

  // Don't mount protected pages (and fire their data fetches) before the
  // permission check for the current company has resolved.
  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" role="status" aria-live="polite">
        <span className="text-sm text-muted-foreground">Checking access…</span>
      </div>
    )
  }

  if (!can(routeModule, 'view') || (routeAction !== 'view' && !can(routeModule, routeAction))) {
    return <AccessDenied />
  }

  return <>{children}</>
}

export function usePermissions() {
  const context = useContext(PermissionContext)
  if (!context) {
    throw new Error('usePermissions must be used within PermissionProvider')
  }
  return context
}
