import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Zap, Home, LayoutDashboard, FolderKanban, BarChart3, User,
  ChevronDown, Check, Plus, LogOut
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import type { Company } from '@/types'
import { COUNTRIES } from './shared/constants'

const navItems = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/gastos', label: 'Gastos', icon: LayoutDashboard },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/informes', label: 'Informes', icon: BarChart3 },
  { to: '/perfil', label: 'Perfil', icon: User },
]

function CompanySelector() {
  const { activeCompany, companies, setActiveCompany, refreshCompanies } = useCompany()
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newCountry, setNewCountry] = useState('España')
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setCreating(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const createCompany = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data: company } = await supabase
      .from('companies')
      .insert({ name: newName.trim(), country: newCountry })
      .select().single()
    if (company) {
      await supabase.from('user_companies').insert({ user_id: user.id, company_id: company.id, role: 'owner' })
      await refreshCompanies()
      setActiveCompany(company as Company)
    }
    setNewName('')
    setCreating(false)
    setOpen(false)
    setSaving(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-white/[0.04] transition text-left"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-white">
            {activeCompany?.name?.[0]?.toUpperCase() || '?'}
          </span>
        </div>
        <span className="text-sm text-white/80 truncate flex-1 min-w-0">
          {activeCompany?.name || 'Sin empresa'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1d27] border border-white/[0.08] rounded-xl shadow-2xl z-50 overflow-hidden">
          {companies.map(c => (
            <button
              key={c.id}
              onClick={() => { setActiveCompany(c); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition text-left"
            >
              <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600/60 to-violet-500/60 flex items-center justify-center">
                <span className="text-[9px] font-bold text-white">{c.name[0].toUpperCase()}</span>
              </div>
              <span className="text-sm text-white/80 truncate flex-1">{c.name}</span>
              {activeCompany?.id === c.id && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
            </button>
          ))}

          <div className="border-t border-white/[0.06] mt-1 pt-1">
            {creating ? (
              <div className="px-3 py-2 space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nombre empresa"
                  autoFocus
                  className="w-full bg-[#0f1117] border border-white/[0.07] text-white text-xs rounded px-2 py-1.5 outline-none placeholder:text-gray-600"
                  onKeyDown={e => e.key === 'Enter' && createCompany()}
                />
                <select
                  value={newCountry}
                  onChange={e => setNewCountry(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/[0.07] text-white text-xs rounded px-2 py-1.5 outline-none"
                >
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-1">
                  <button
                    onClick={createCompany}
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded py-1 transition"
                  >
                    {saving ? '...' : 'Crear'}
                  </button>
                  <button
                    onClick={() => setCreating(false)}
                    className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-xs rounded py-1 transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.04] transition text-left"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs text-gray-500">Nueva empresa</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#13151c] border-r border-white/[0.06] fixed left-0 top-0 bottom-0 z-20">
        {/* Logo */}
        <div className="px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">Expenza</span>
          </div>
          <CompanySelector />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/[0.04] transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-[#13151c] border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">Expenza</span>
        </div>
        <div className="w-40">
          <CompanySelector />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 md:ml-56 min-h-screen">
        <div className="pt-0 md:pt-0">
          <div className="pt-14 md:pt-0">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#13151c] border-t border-white/[0.06] flex">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] transition ${
                isActive ? 'text-blue-400' : 'text-gray-500'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
