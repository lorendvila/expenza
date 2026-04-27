import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import {
  Plus, FolderPlus, Search, ChevronDown, ChevronRight,
  Upload, Loader2
} from 'lucide-react'
import type { Project, Expense } from '@/types'
import { CATEGORIES } from '@/components/shared/constants'
import { formatCurrency } from '@/lib/utils'
import ExpenseTable from '@/components/expenses/ExpenseTable'
import UploadModal from '@/components/expenses/UploadModal'

function ProjectGroup({
  project,
  expenses,
  projects,
  companyId,
  userId,
}: {
  project: Project | null
  expenses: Expense[]
  projects: Project[]
  companyId: string
  userId: string
}) {
  const qc = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showClose, setShowClose] = useState(false)

  const total = expenses.reduce((s, e) => s + (e.total_amount || 0), 0)
  const isUnassigned = project === null

  const closeProject = async () => {
    if (!project) return
    await supabase.from('projects').update({ status: 'closed' }).eq('id', project.id)
    qc.invalidateQueries({ queryKey: ['projects', companyId] })
  }

  return (
    <div className="bg-[#13151c] border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#13151c]">
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-white transition">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-white truncate">
            {isUnassigned ? 'Sin proyecto' : project.name}
          </span>
          {!isUnassigned && project.status === 'active' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
              Activo
            </span>
          )}
          <span className="text-xs text-gray-500">{expenses.length} gasto{expenses.length !== 1 ? 's' : ''}</span>
        </div>

        <span className="text-sm font-semibold text-white ml-auto mr-3">{formatCurrency(total)}</span>

        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 text-xs bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-2.5 py-1.5 rounded-lg transition"
        >
          <Upload className="w-3.5 h-3.5" />
          Añadir
        </button>

        {!isUnassigned && project.status === 'active' && (
          <button
            onClick={() => setShowClose(!showClose)}
            className="text-xs text-gray-500 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition"
          >
            Cerrar
          </button>
        )}
      </div>

      {showClose && !isUnassigned && (
        <div className="px-4 py-2 bg-amber-500/5 border-t border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400">¿Cerrar el proyecto?</span>
          <div className="flex gap-2">
            <button onClick={closeProject} className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 px-2.5 py-1 rounded-lg transition">
              Confirmar
            </button>
            <button onClick={() => setShowClose(false)} className="text-xs text-gray-500 hover:text-white transition">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {!collapsed && (
        <div className="border-t border-white/[0.04]">
          {expenses.length > 0 ? (
            <ExpenseTable
              expenses={expenses}
              projects={projects}
              companyId={companyId}
              showAssign={isUnassigned}
            />
          ) : (
            <div className="py-6 text-center">
              <p className="text-xs text-gray-600 mb-2">Sin gastos</p>
              <button
                onClick={() => setShowUpload(true)}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Subir primer recibo
              </button>
            </div>
          )}
        </div>
      )}

      {showUpload && (
        <UploadModal
          companyId={companyId}
          userId={userId}
          projects={projects}
          defaultProjectId={project?.id}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  )
}

export default function Dashboard() {
  const { activeCompany } = useCompany()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [creatingProject, setCreatingProject] = useState(false)
  const qc = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      return user
    },
  })

  const { data: projects = [], isLoading: loadingProjects } = useQuery({
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

  const { data: allExpenses = [], isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return []
      const { data } = await supabase
        .from('expenses')
        .select('*')
        .eq('company_id', activeCompany.id)
        .order('created_at', { ascending: false })
      return (data || []) as Expense[]
    },
    enabled: !!activeCompany,
  })

  const createProject = async () => {
    if (!newProjectName.trim() || !activeCompany || !user) return
    setCreatingProject(true)
    await supabase.from('projects').insert({
      name: newProjectName.trim(),
      company_id: activeCompany.id,
      user_id: user.id,
      status: 'active',
    })
    qc.invalidateQueries({ queryKey: ['projects', activeCompany.id] })
    setNewProjectName('')
    setShowNewProject(false)
    setCreatingProject(false)
  }

  // Filter expenses
  const filteredExpenses = allExpenses.filter(e => {
    const matchSearch = !search ||
      e.supplier?.toLowerCase().includes(search.toLowerCase()) ||
      e.country?.toLowerCase().includes(search.toLowerCase()) ||
      e.notes?.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !categoryFilter || e.category === categoryFilter
    return matchSearch && matchCategory
  })

  // Active projects only for dashboard
  const activeProjects = projects.filter(p => p.status === 'active')

  // Group expenses
  const grouped = activeProjects.map(p => ({
    project: p,
    expenses: filteredExpenses.filter(e => e.project_id === p.id),
  }))

  const unassigned = filteredExpenses.filter(e => !e.project_id)

  const isLoading = loadingProjects || loadingExpenses

  if (!activeCompany) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        Selecciona una empresa para ver los gastos.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">Gastos</h1>
          <p className="text-xs text-gray-500 mt-0.5">{activeCompany.name}</p>
        </div>
        <button
          onClick={() => setShowNewProject(!showNewProject)}
          className="flex items-center gap-2 bg-violet-600/80 hover:bg-violet-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
        >
          <FolderPlus className="w-4 h-4" />
          Nuevo Proyecto
        </button>
      </div>

      {/* Inline new project */}
      {showNewProject && (
        <div className="mb-5 bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              placeholder="Nombre del proyecto..."
              autoFocus
              onKeyDown={e => e.key === 'Enter' && createProject()}
              className="flex-1 bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition"
            />
            <button
              onClick={createProject}
              disabled={creatingProject}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm px-3 py-2 rounded-lg transition"
            >
              {creatingProject ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Crear y subir ticket
            </button>
            <button
              onClick={() => { setShowNewProject(false); setNewProjectName('') }}
              className="bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-sm px-3 py-2 rounded-lg transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por proveedor, país..."
            className="w-full bg-[#13151c] border border-white/[0.06] text-white text-sm rounded-lg pl-9 pr-3 py-2 outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-[#13151c] border border-white/[0.06] text-sm text-gray-400 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ project, expenses }) => (
            <ProjectGroup
              key={project.id}
              project={project}
              expenses={expenses}
              projects={projects}
              companyId={activeCompany.id}
              userId={user?.id || ''}
            />
          ))}

          {/* Unassigned */}
          {(unassigned.length > 0 || grouped.length === 0) && (
            <ProjectGroup
              project={null}
              expenses={unassigned}
              projects={projects}
              companyId={activeCompany.id}
              userId={user?.id || ''}
            />
          )}

          {grouped.length === 0 && unassigned.length === 0 && !isLoading && (
            <div className="text-center py-16">
              <Upload className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aún no hay gastos</p>
              <p className="text-xs text-gray-600 mt-1">Crea un proyecto y sube tu primer recibo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
