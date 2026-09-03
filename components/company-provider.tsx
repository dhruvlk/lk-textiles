"use client"
/* eslint-disable */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import {
  getCompanies,
  getSelectedCompanyId,
  setSelectedCompanyId,
} from '@/services/companies.service'
import { useAuth } from '@/hooks/useAuth'
import { Company } from '@/types'

interface CompanyContextType {
  selectedCompany: Company | null
  setSelectedCompany: (company: Company | null) => void
  companies: Company[]
  setCompanies: (companies: Company[]) => void
  isLoading: boolean
  refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const companyId = user?.companyId ?? null

  const refreshCompanies = useCallback(async () => {
    if (!isAuthenticated) {
      setCompanies([])
      setSelectedCompanyState(null)
      setIsLoading(false)
      return
    }

    setIsLoading((prev) => (companies.length === 0 ? true : prev))
    try {
      const storedCompanies = await getCompanies()
      setCompanies(storedCompanies)

      const storedId = await getSelectedCompanyId()
      const active = storedCompanies.find((c) => c.is_active)
      const membershipCompany = companyId
        ? storedCompanies.find((c) => c.id === companyId)
        : undefined
      const found = storedId
        ? storedCompanies.find((c) => c.id === storedId)
        : membershipCompany ?? active ?? storedCompanies[0]

      setSelectedCompanyState((prev) => {
        const next = found ?? storedCompanies[0] ?? null
        if (prev?.id === next?.id) return prev
        return next
      })
    } catch {
      setCompanies([])
      setSelectedCompanyState(null)
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, companyId, companies.length])

  useEffect(() => {
    void refreshCompanies()
    // Only re-fetch when auth identity changes — not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, companyId])

  const handleSetSelectedCompany = useCallback(async (company: Company | null) => {
    setSelectedCompanyState(company)
    if (company) {
      await setSelectedCompanyId(company.id)
      setCompanies((prev) =>
        prev.map((c) => ({ ...c, is_active: c.id === company.id }))
      )
    }
  }, [])

  const value = useMemo(
    () => ({
      selectedCompany,
      setSelectedCompany: handleSetSelectedCompany,
      companies,
      setCompanies,
      isLoading,
      refreshCompanies,
    }),
    [selectedCompany, handleSetSelectedCompany, companies, isLoading, refreshCompanies]
  )

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}
