import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { CompanyProvider, useCompany } from '@/context/CompanyContext'
import type { Session } from '@supabase/supabase-js'

import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import CreateCompany from '@/pages/CreateCompany'
import Home from '@/pages/Home'
import Dashboard from '@/pages/Dashboard'
import Projects from '@/pages/Projects'
import ExecutiveDashboard from '@/pages/ExecutiveDashboard'
import Profile from '@/pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const { companies, loading: loadingCompany } = useCompany()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // Loading state
  if (session === undefined || (session && loadingCompany)) {
    return (
      <div className="min-h-screen bg-[#0f1117] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Not logged in
  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Logged in but no company yet
  if (!loadingCompany && companies.length === 0) {
    return (
      <Routes>
        <Route path="/crear-empresa" element={<CreateCompany />} />
        <Route path="*" element={<Navigate to="/crear-empresa" replace />} />
      </Routes>
    )
  }

  // Fully authenticated
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="gastos" element={<Dashboard />} />
        <Route path="proyectos" element={<Projects />} />
        <Route path="informes" element={<ExecutiveDashboard />} />
        <Route path="perfil" element={<Profile />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CompanyProvider>
          <AuthGate />
        </CompanyProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
