import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCompany } from '@/context/CompanyContext'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, Receipt, FolderKanban, Globe2, Loader2, Download } from 'lucide-react'
import type { Expense, Project } from '@/types'
import { CATEGORY_COLORS } from '@/components/shared/constants'
import { formatCurrency } from '@/lib/utils'
import { exportExpensesToExcel, exportExpensesToCSV } from '@/components/expenses/exportExcel'

const gridColor = '#1f2333'
const tooltipStyle = {
  backgroundColor: '#1a1d27',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  fontSize: 11,
  color: '#e5e7eb',
}
const tickStyle = { fontSize: 10, fill: '#6b7280' }

function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

export default function ExecutiveDashboard() {
  const { activeCompany } = useCompany()

  const { data: expenses = [], isLoading: loadingExp } = useQuery({
    queryKey: ['expenses', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return []
      const { data } = await supabase.from('expenses').select('*').eq('company_id', activeCompany.id)
      return (data || []) as Expense[]
    },
    enabled: !!activeCompany,
  })

  const { data: projects = [], isLoading: loadingProj } = useQuery({
    queryKey: ['projects', activeCompany?.id],
    queryFn: async () => {
      if (!activeCompany) return []
      const { data } = await supabase.from('projects').select('*').eq('company_id', activeCompany.id)
      return (data || []) as Project[]
    },
    enabled: !!activeCompany,
  })

  if (!activeCompany) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
        Selecciona una empresa para ver los informes.
      </div>
    )
  }

  if (loadingExp || loadingProj) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
      </div>
    )
  }

  const totalAmount = expenses.reduce((s, e) => s + (e.total_amount || 0), 0)
  const countrySet = new Set(expenses.filter(e => e.country).map(e => e.country!))

  // Monthly evolution (last 12 months)
  const monthlyMap: Record<string, number> = {}
  expenses.forEach(e => {
    if (!e.date) return
    const month = e.date.slice(0, 7)
    monthlyMap[month] = (monthlyMap[month] || 0) + (e.total_amount || 0)
  })
  const monthlyData = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, total]) => ({
      month: format(parseISO(month + '-01'), 'MMM yy', { locale: es }),
      total: Math.round(total * 100) / 100,
    }))

  // By project (top 10)
  const projectMap: Record<string, { name: string; total: number }> = {}
  expenses.forEach(e => {
    if (!e.project_id) return
    const p = projects.find(p => p.id === e.project_id)
    const name = p?.name || 'Sin proyecto'
    if (!projectMap[e.project_id]) projectMap[e.project_id] = { name, total: 0 }
    projectMap[e.project_id].total += e.total_amount || 0
  })
  const projectData = Object.values(projectMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)
    .map(d => ({ name: d.name.length > 18 ? d.name.slice(0, 18) + '…' : d.name, total: Math.round(d.total * 100) / 100 }))

  // By category
  const categoryMap: Record<string, number> = {}
  expenses.forEach(e => {
    if (!e.category) return
    categoryMap[e.category] = (categoryMap[e.category] || 0) + (e.total_amount || 0)
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)

  // By country (top 10)
  const countryMap: Record<string, number> = {}
  expenses.forEach(e => {
    if (!e.country) return
    countryMap[e.country] = (countryMap[e.country] || 0) + (e.total_amount || 0)
  })
  const countryData = Object.entries(countryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, total]) => ({ name, total: Math.round(total * 100) / 100 }))

  const COLORS = Object.values(CATEGORY_COLORS)

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Informes</h1>
          <p className="text-xs text-gray-500 mt-0.5">{activeCompany.name}</p>
        </div>
        {expenses.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportExpensesToExcel(expenses, 'Todos', activeCompany.name)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition"
            >
              <Download className="w-3 h-3" />
              Excel
            </button>
            <button
              onClick={() => exportExpensesToCSV(expenses, 'Todos', activeCompany.name)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition"
            >
              <Download className="w-3 h-3" />
              CSV
            </button>
          </div>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard
          icon={TrendingUp}
          label="Total gastos"
          value={formatCurrency(totalAmount)}
          sub={`${expenses.length} gastos`}
          color="bg-blue-600/20 text-blue-400"
        />
        <KpiCard
          icon={Receipt}
          label="Nº gastos"
          value={expenses.length.toString()}
          sub={`${expenses.filter(e => !e.total_amount).length} sin importe`}
          color="bg-violet-600/20 text-violet-400"
        />
        <KpiCard
          icon={FolderKanban}
          label="Proyectos"
          value={projects.length.toString()}
          sub={`${projects.filter(p => p.status === 'active').length} activos`}
          color="bg-emerald-600/20 text-emerald-400"
        />
        <KpiCard
          icon={Globe2}
          label="Países"
          value={countrySet.size.toString()}
          color="bg-amber-600/20 text-amber-400"
        />
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          Sin datos para mostrar aún.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Monthly evolution */}
          {monthlyData.length > 0 && (
            <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-4">Evolución mensual</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="month" tick={tickStyle} />
                  <YAxis tick={tickStyle} width={60} tickFormatter={v => `${v}€`} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: unknown) => [formatCurrency(v as number), 'Total']}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* By project */}
            {projectData.length > 0 && (
              <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
                <h2 className="text-sm font-semibold text-white mb-4">Por proyecto (top 10)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectData} layout="vertical" margin={{ left: 5, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis type="number" tick={tickStyle} tickFormatter={v => `${v}€`} />
                    <YAxis type="category" dataKey="name" tick={tickStyle} width={90} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(v as number), 'Total']} />
                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* By category */}
            {categoryData.length > 0 && (
              <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
                <h2 className="text-sm font-semibold text-white mb-4">Por categoría</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: unknown) => [formatCurrency(v as number), 'Total']}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => <span style={{ color: '#9ca3af', fontSize: 11 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* By country */}
          {countryData.length > 0 && (
            <div className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4">
              <h2 className="text-sm font-semibold text-white mb-4">Por país (top 10)</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={countryData} layout="vertical" margin={{ left: 5, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis type="number" tick={tickStyle} tickFormatter={v => `${v}€`} />
                  <YAxis type="category" dataKey="name" tick={tickStyle} width={80} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: unknown) => [formatCurrency(v as number), 'Total']} />
                  <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
