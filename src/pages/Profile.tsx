import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { useNavigate } from 'react-router-dom'
import { User, Building2, Plus, Check, LogOut, Loader2, Trash2 } from 'lucide-react'
import type { Company } from '@/types'
import { COUNTRIES } from '@/components/shared/constants'

export default function Profile() {
  const { activeCompany, companies, setActiveCompany, refreshCompanies } = useCompany()
  const navigate = useNavigate()

  const [showNewCompany, setShowNewCompany] = useState(false)
  const [newName, setNewName] = useState('')
  const [newTaxId, setNewTaxId] = useState('')
  const [newCountry, setNewCountry] = useState('España')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const createCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !user) return
    setSaving(true)
    setError('')
    const { data: company, error: err } = await supabase
      .from('companies')
      .insert({ name: newName.trim(), tax_id: newTaxId || null, country: newCountry })
      .select().single()
    if (err || !company) { setError(err?.message || 'Error'); setSaving(false); return }
    await supabase.from('user_companies').insert({ user_id: user.id, company_id: company.id, role: 'owner' })
    await refreshCompanies()
    setActiveCompany(company as Company)
    setNewName('')
    setNewTaxId('')
    setShowNewCompany(false)
    setSaving(false)
  }

  const inputCls = 'w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition'

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 pb-24 md:pb-8 space-y-5">
      <h1 className="text-xl font-bold text-white">Perfil</h1>

      {/* User info */}
      <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">
              {user?.user_metadata?.name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>

      {/* Companies */}
      <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-white">Empresas</h2>
          </div>
          <button
            onClick={() => setShowNewCompany(!showNewCompany)}
            className="flex items-center gap-1.5 text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-2.5 py-1.5 rounded-lg transition"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva empresa
          </button>
        </div>

        <div className="space-y-2 mb-4">
          {companies.map(c => (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
                activeCompany?.id === c.id
                  ? 'border-blue-500/30 bg-blue-600/10'
                  : 'border-white/[0.05] hover:bg-white/[0.02]'
              }`}
              onClick={() => setActiveCompany(c)}
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600/60 to-violet-500/60 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{c.name[0].toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{c.name}</p>
                {c.country && <p className="text-xs text-gray-500">{c.country}</p>}
                {c.tax_id && <p className="text-xs text-gray-500">{c.tax_id}</p>}
              </div>
              {activeCompany?.id === c.id && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
            </div>
          ))}
        </div>

        {showNewCompany && (
          <form onSubmit={createCompany} className="bg-[#1a1d27] border border-white/[0.07] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-medium text-gray-400">Nueva empresa</h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
              <input type="text" value={newName} onChange={e => setNewName(e.target.value)} required placeholder="Mi Empresa S.L." className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">NIF / CIF</label>
              <input type="text" value={newTaxId} onChange={e => setNewTaxId(e.target.value)} placeholder="B12345678" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">País</label>
              <select value={newCountry} onChange={e => setNewCountry(e.target.value)} className={inputCls}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium py-2 rounded-lg transition"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                Crear
              </button>
              <button type="button" onClick={() => { setShowNewCompany(false); setError('') }} className="flex-1 bg-white/[0.06] text-gray-400 text-xs py-2 rounded-lg transition hover:bg-white/[0.1]">
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-[#13151c] border border-red-500/10 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-red-400" />
          Zona de peligro
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Estas acciones son irreversibles. Procede con precaución.
        </p>
        <button
          onClick={async () => {
            if (!confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no puede deshacerse.')) return
            await supabase.auth.signOut()
            navigate('/login')
          }}
          className="text-xs text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg transition"
        >
          Eliminar mi cuenta
        </button>
      </div>
    </div>
  )
}
