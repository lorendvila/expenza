import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { X, Check, Loader2 } from 'lucide-react'
import type { Expense, Project } from '@/types'
import { CATEGORIES, CURRENCIES, COUNTRIES } from '@/components/shared/constants'

interface Props {
  expense: Expense
  projects: Project[]
  companyId: string
  onClose: () => void
}

export default function EditExpenseModal({ expense, projects, companyId, onClose }: Props) {
  const qc = useQueryClient()

  const [projectId, setProjectId] = useState(expense.project_id || '')
  const [date, setDate] = useState(expense.date || '')
  const [supplier, setSupplier] = useState(expense.supplier || '')
  const [totalAmount, setTotalAmount] = useState(expense.total_amount?.toString() || '')
  const [taxAmount, setTaxAmount] = useState(expense.tax_amount?.toString() || '')
  const [netAmount, setNetAmount] = useState(expense.net_amount?.toString() || '')
  const [taxId, setTaxId] = useState(expense.tax_id || '')
  const [currency, setCurrency] = useState(expense.currency || 'EUR')
  const [category, setCategory] = useState(expense.category || '')
  const [country, setCountry] = useState(expense.country || '')
  const [notes, setNotes] = useState(expense.notes || '')
  const [saving, setSaving] = useState(false)

  const inputCls = 'w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition placeholder:text-gray-600'

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('expenses').update({
      project_id: projectId || null,
      date: date || null,
      supplier: supplier || null,
      total_amount: totalAmount ? parseFloat(totalAmount) : null,
      tax_amount: taxAmount ? parseFloat(taxAmount) : null,
      net_amount: netAmount ? parseFloat(netAmount) : null,
      tax_id: taxId || null,
      currency: currency || 'EUR',
      category: category || null,
      country: country || null,
      notes: notes || null,
    }).eq('id', expense.id)

    qc.invalidateQueries({ queryKey: ['expenses', companyId] })
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#13151c] border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <h2 className="text-sm font-semibold text-white">Editar gasto</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto">
          <div className="p-5 grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1">Proyecto / Viaje</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} className={inputCls}>
                <option value="">— Sin proyecto —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Categoría</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">País</label>
              <select value={country} onChange={e => setCountry(e.target.value)} className={inputCls}>
                <option value="">— Seleccionar —</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={`${inputCls} [color-scheme:dark]`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputCls}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Proveedor</label>
              <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Nombre proveedor" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">NIF / Tax ID</label>
              <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="B12345678" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Total</label>
              <input type="number" step="0.01" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">IVA</label>
              <input type="number" step="0.01" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Base imponible</label>
              <input type="number" step="0.01" value={netAmount} onChange={e => setNetAmount(e.target.value)} placeholder="0.00" className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">Notas</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Observaciones..." className={inputCls} />
            </div>

            {expense.file_url && (
              <div className="col-span-2">
                <a
                  href={expense.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 transition"
                >
                  Ver archivo adjunto →
                </a>
              </div>
            )}
          </div>

          <div className="px-5 pb-5 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-sm rounded-lg py-2.5 transition">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
