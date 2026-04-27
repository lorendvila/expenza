import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { Expense, Project } from '@/types'
import { CATEGORY_BADGE } from '@/components/shared/constants'
import { formatDate, formatCurrency, cn } from '@/lib/utils'
import EditExpenseModal from './EditExpenseModal'

interface Props {
  expenses: Expense[]
  projects: Project[]
  companyId: string
  showAssign?: boolean
}

export default function ExpenseTable({ expenses, projects, companyId, showAssign }: Props) {
  const qc = useQueryClient()
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este gasto?')) return
    await supabase.from('expenses').delete().eq('id', id)
    qc.invalidateQueries({ queryKey: ['expenses', companyId] })
  }

  const handleAssign = async (expenseId: string, projectId: string) => {
    await supabase.from('expenses').update({ project_id: projectId || null }).eq('id', expenseId)
    qc.invalidateQueries({ queryKey: ['expenses', companyId] })
  }

  if (expenses.length === 0) {
    return <p className="text-xs text-gray-600 py-4 text-center">Sin gastos</p>
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/[0.04]">
              {['Fecha', 'Proveedor', 'Categoría', 'País', 'Total', 'IVA', 'Base', 'Mon.', 'NIF', 'Notas', ''].map(h => (
                <th key={h} className="text-left py-2 px-2 text-[10px] font-medium text-gray-600 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e, i) => (
              <tr
                key={e.id}
                className={cn(
                  'border-b border-white/[0.03] hover:bg-white/[0.015] transition',
                  i % 2 === 0 ? '' : 'bg-white/[0.02]'
                )}
              >
                <td className="py-2 px-2 text-gray-300 whitespace-nowrap">{formatDate(e.date)}</td>
                <td className="py-2 px-2 text-white max-w-[140px]">
                  <span className="truncate block" title={e.supplier}>{e.supplier || '—'}</span>
                </td>
                <td className="py-2 px-2">
                  {e.category ? (
                    <span className={cn('inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-medium', CATEGORY_BADGE[e.category] || CATEGORY_BADGE.otros)}>
                      {e.category}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-2 px-2 text-gray-400 whitespace-nowrap">{e.country || '—'}</td>
                <td className="py-2 px-2 text-white font-medium whitespace-nowrap">
                  {e.total_amount != null ? formatCurrency(e.total_amount, e.currency) : '—'}
                </td>
                <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                  {e.tax_amount != null ? formatCurrency(e.tax_amount, e.currency) : '—'}
                </td>
                <td className="py-2 px-2 text-gray-400 whitespace-nowrap">
                  {e.net_amount != null ? formatCurrency(e.net_amount, e.currency) : '—'}
                </td>
                <td className="py-2 px-2 text-gray-500">{e.currency}</td>
                <td className="py-2 px-2 text-gray-500 max-w-[90px]">
                  <span className="truncate block" title={e.tax_id}>{e.tax_id || '—'}</span>
                </td>
                <td className="py-2 px-2 text-gray-500 max-w-[100px]">
                  <span className="truncate block" title={e.notes}>{e.notes || '—'}</span>
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1">
                    {showAssign && (
                      <select
                        value={e.project_id || ''}
                        onChange={ev => handleAssign(e.id, ev.target.value)}
                        className="bg-[#1a1d27] border border-white/[0.07] text-gray-400 text-[10px] rounded px-1.5 py-1 outline-none max-w-[100px]"
                        title="Asignar proyecto"
                      >
                        <option value="">Sin proyecto</option>
                        {projects.filter(p => p.status === 'active').map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                    {e.file_url && (
                      <a
                        href={e.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-blue-400 transition"
                        title="Ver archivo"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => setEditingExpense(e)}
                      className="p-1 text-gray-500 hover:text-white transition"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1 text-gray-500 hover:text-red-400 transition"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          projects={projects}
          companyId={companyId}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </>
  )
}
