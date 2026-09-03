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

  const userId = user?.id ?? null
  const userRole = user?.role ?? null
  const companyId = selectedCompany?.id ?? null
  const companyOwnerId = selectedCompany?.user_id ?? null

  const refreshPermissions = useCallback(async (force = false) => {
    if (!userId || !companyId) {
      lastKeyRef.current = null
      hasDataRef.current = false
      setMatrix(null)
      setRole(null)
      setIsLoading(false)
      return
    }

    const cacheKey = `${userId}:${companyId}:${userRole}:${companyOwnerId}`
    if (!force && lastKeyRef.current === cacheKey && hasDataRef.current) {
      return
    }

    if (!hasDataRef.current) setIsLoading(true)

    try {
      const companyRole = await getUserRoleForCompany(userId, companyId)
      const ownsCompany = companyOwnerId === userId
      const effectiveRole =
        companyRole === 'Owner' || ownsCompany
          ? 'Owner'
          : (companyRole ?? userRole ?? 'Staff')
      setRole(effectiveRole)
      if (effectiveRole === 'Owner') {
        setMatrix(ownerMatrix())
      } else {
        const next = await getPermissionsForSessionUser(
          companyId,
          userId,
          effectiveRole
        )
        setMatrix(next)
      }
      lastKeyRef.current = cacheKey
      hasDataRef.current = true
    } catch (error) {
      console.error('[permissions]', error)
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
    } finally {
      setIsLoading(false)
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

  const value = useMemo(
    () => ({
      matrix,
      role,
      isOwner,
      isLoading,
      can,
      canView,
      refreshPermissions: refresh,
    }),
    [matrix, role, isOwner, isLoading, can, canView, refresh]
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
  const { canView, isLoading } = usePermissions()

  const routeModule = moduleFromPathname(pathname)

  if (isLoading || !user || !selectedCompany || !routeModule) {
    return <>{children}</>
  }

  if (!canView(routeModule)) {
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
