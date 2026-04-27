import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Zap, Building2 } from 'lucide-react'
import { COUNTRIES } from '@/components/shared/constants'

export default function CreateCompany() {
  const { refreshCompanies } = useCompany()
  const [name, setName] = useState('')
  const [taxId, setTaxId] = useState('')
  const [country, setCountry] = useState('España')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('No autenticado'); setLoading(false); return }

    const companyId = crypto.randomUUID()

    const { error: err } = await supabase
      .from('companies')
      .insert({ id: companyId, name: name.trim(), tax_id: taxId || null, country })

    if (err) { setError(err.message); setLoading(false); return }

    const { error: err2 } = await supabase.from('user_companies').insert({
      user_id: user.id,
      company_id: companyId,
      role: 'owner',
    })

    if (err2) { setError(err2.message); setLoading(false); return }

    await refreshCompanies()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Expenza</span>
        </div>

        <div className="bg-[#13151c] border border-white/[0.06] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">Crear empresa</h1>
              <p className="text-xs text-gray-500">Configura tu primera empresa</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nombre de empresa *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Mi Empresa S.L."
                required
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-600 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">NIF / CIF</label>
              <input
                type="text"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                placeholder="B12345678"
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 placeholder:text-gray-600 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">País</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 transition"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
            >
              {loading ? 'Creando...' : 'Crear empresa y continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
