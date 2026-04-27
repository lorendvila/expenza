import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import { Plus, Download, FileText, Trash2, FolderKanban, Check, X, RotateCcw, Loader2 } from 'lucide-react'
import type { Project, Expense } from '@/types'
import { COUNTRIES, COUNTRY_FLAGS } from '@/components/shared/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { exportExpensesToExcel, exportExpensesToCSV } from '@/components/expenses/exportExcel'

function ProjectCard({
  project,
  expenses,
  companyName,
  onDelete,
  onToggleStatus,
}: {
  project: Project
  expenses: Expense[]
  companyName: string
  onDelete: () => void
  onToggleStatus: () => void
}) {
  const total = expenses.reduce((s, e) => s + (e.total_amount || 0), 0)
  const flag = COUNTRY_FLAGS[project.destination_country || ''] || ''

  return (
    <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <FolderKanban className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">{project.name}</h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                project.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                  : 'bg-gray-500/10 text-gray-400 ring-1 ring-gray-500/20'
              }`}>
                {project.status === 'active' ? 'Activo' : 'Cerrado'}
              </span>
            </div>
            {project.destination_country && (
              <p className="text-xs text-gray-500 mt-0.5">{flag} {project.destination_country}</p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-semibold text-white">{formatCurrency(total)}</p>
          <p className="text-xs text-gray-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {(project.start_date || project.end_date) && (
        <div className="flex gap-4 text-xs text-gray-500">
          {project.start_date && <span>Inicio: <span className="text-gray-400">{formatDate(project.start_date)}</span></span>}
          {project.end_date && <span>Fin: <span className="text-gray-400">{formatDate(project.end_date)}</span></span>}
        </div>
      )}

      {project.notes && (
        <p className="text-xs text-gray-500 line-clamp-2">{project.notes}</p>
      )}

      <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.04]">
        <button
          onClick={onToggleStatus}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition ${
            project.status === 'active'
              ? 'bg-gray-500/10 hover:bg-gray-500/20 text-gray-400'
              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
          }`}
        >
          {project.status === 'active' ? <X className="w-3 h-3" /> : <RotateCcw className="w-3 h-3" />}
          {project.status === 'active' ? 'Cerrar' : 'Reabrir'}
        </button>
        <button
          onClick={() => exportExpensesToExcel(expenses, project.name, companyName)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
        >
          <Download className="w-3 h-3" />
          Excel
        </button>
        <button
          onClick={() => exportExpensesToCSV(expenses, project.name, companyName)}
          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
        >
          <FileText className="w-3 h-3" />
          CSV
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

    </div>
  )
}

function NewProjectForm({ onClose, companyId, userId }: { onClose: () => void; companyId: string; userId: string }) {
  const qc = useQueryClient()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [country, setCountry] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('projects').insert({
      name: name.trim(),
      company_id: companyId,
      user_id: userId,
      start_date: startDate || null,
      end_date: endDate || null,
      destination_country: country || null,
      notes: notes || null,
      status: 'active',
    })
    qc.invalidateQueries({ queryKey: ['projects', companyId] })
    onClose()
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4 space-y-3">
      <h3 className="text-sm font-semibold text-white">Nuevo Proyecto</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="Viaje a París Q1 2025"
            className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Fecha fin</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition [color-scheme:dark]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">País destino</label>
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition"
          >
            <option value="">— Seleccionar —</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Notas</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Descripción opcional..."
            className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 resize-none placeholder:text-gray-600 transition"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium px-3 py-2 rounded-lg transition"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Crear proyecto
        </button>
        <button
          type="button"
          onClick={onClose}
          className="bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-xs px-3 py-2 rounded-lg transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

export default function Projects() {
  const { activeCompany } = useCompany()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: userRow } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return []
      const { data } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })
      return (data || []) as Project[]
    },
    enabled: !!activeCompany,
  })

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return []
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', activeCompany.id)
      return (data || []) as Expense[]
    },
    enabled: !!activeCompany,
  })

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from('projects').delete().eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', activeCompany?.id] }),
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await supabase.from('projects').update({ status: status === 'active' ? 'closed' : 'active' }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', activeCompany?.id] }),
  })

  const active = projects.filter(p => p.status === 'active')
  const closed = projects.filter(p => p.status === 'closed')

  const getExpenses = (projectId: string) => expenses.filter(e => e.project_id === projectId)

  if (!activeCompany) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        Selecciona una empresa para ver los proyectos.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Proyectos</h1>
          <p className="text-xs text-gray-500 mt-0.5">{activeCompany.name}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {showForm && userRow && (
        <div className="mb-6">
          <NewProjectForm
            onClose={() => setShowForm(false)}
            companyId={activeCompany.id}
            userId={userRow.id}
          />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Activos ({active.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    expenses={getExpenses(p.id)}
                    companyName={activeCompany.name}
                    onDelete={() => {
                      if (confirm(`¿Eliminar el proyecto "${p.name}"?`)) {
                        deleteProject.mutate(p.id)
                      }
                    }}
                    onToggleStatus={() => toggleStatus.mutate({ id: p.id, status: p.status })}
                  />
                ))}
              </div>
            </div>
          )}

          {closed.length > 0 && (
            <div>
              <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                Cerrados ({closed.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-70">
                {closed.map(p => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    expenses={getExpenses(p.id)}
                    companyName={activeCompany.name}
                    onDelete={() => {
                      if (confirm(`¿Eliminar el proyecto "${p.name}"?`)) {
                        deleteProject.mutate(p.id)
                      }
                    }}
                    onToggleStatus={() => toggleStatus.mutate({ id: p.id, status: p.status })}
                  />
                ))}
              </div>
            </div>
          )}

          {projects.length === 0 && !showForm && (
            <div className="text-center py-16">
              <FolderKanban className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aún no hay proyectos</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Crear el primero
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
