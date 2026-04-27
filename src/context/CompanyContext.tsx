import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Company } from '@/types'

interface CompanyContextValue {
  activeCompany: Company | null
  companies: Company[]
  setActiveCompany: (company: Company) => void
  refreshCompanies: () => Promise<void>
  loading: boolean
}

const CompanyContext = createContext<CompanyContextValue>({
  activeCompany: null,
  companies: [],
  setActiveCompany: () => {},
  refreshCompanies: async () => {},
  loading: true,
})

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [activeCompany, setActiveCompanyState] = useState<Company | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  const refreshCompanies = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: userCompanies } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)

    if (!userCompanies?.length) {
      setCompanies([])
      setLoading(false)
      return
    }

    const ids = userCompanies.map(uc => uc.company_id)
    const { data: companiesData } = await supabase
      .from('companies')
      .select('*')
      .in('id', ids)

    const list = companiesData || []
    setCompanies(list)

    // Restore from localStorage or pick first
    const savedId = localStorage.getItem('expenza_active_company')
    const found = list.find(c => c.id === savedId)
    if (found) {
      setActiveCompanyState(found)
    } else if (list.length > 0) {
      setActiveCompanyState(list[0])
      localStorage.setItem('expenza_active_company', list[0].id)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refreshCompanies()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') refreshCompanies()
      if (event === 'SIGNED_OUT') {
        setCompanies([])
        setActiveCompanyState(null)
        setLoading(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [refreshCompanies])

  const setActiveCompany = (company: Company) => {
    setActiveCompanyState(company)
    localStorage.setItem('expenza_active_company', company.id)
  }

  return (
    <CompanyContext.Provider value={{ activeCompany, companies, setActiveCompany, refreshCompanies, loading }}>
      {children}
    </CompanyContext.Provider>
  )
}

export const useCompany = () => useContext(CompanyContext)
