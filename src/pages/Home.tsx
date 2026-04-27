import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban, Camera, LayoutDashboard, FileSpreadsheet, BarChart3,
  Zap, Brain, ArrowRight
} from 'lucide-react'

const steps = [
  {
    step: 1, icon: FolderKanban, color: 'blue',
    title: 'Crea un Proyecto',
    desc: 'Organiza tus gastos por viaje o proyecto empresarial.',
    gradient: 'from-blue-600/20 to-blue-600/5',
    ring: 'ring-blue-500/20',
    iconBg: 'bg-blue-600/20',
    iconColor: 'text-blue-400',
    numColor: 'text-blue-500',
  },
  {
    step: 2, icon: Camera, color: 'violet',
    title: 'Sube tus Recibos',
    desc: 'Fotografía facturas o PDFs. La IA extrae los datos automáticamente.',
    gradient: 'from-violet-600/20 to-violet-600/5',
    ring: 'ring-violet-500/20',
    iconBg: 'bg-violet-600/20',
    iconColor: 'text-violet-400',
    numColor: 'text-violet-500',
  },
  {
    step: 3, icon: LayoutDashboard, color: 'cyan',
    title: 'Gestiona tus Gastos',
    desc: 'Revisa, edita y clasifica todos tus gastos en un solo lugar.',
    gradient: 'from-cyan-600/20 to-cyan-600/5',
    ring: 'ring-cyan-500/20',
    iconBg: 'bg-cyan-600/20',
    iconColor: 'text-cyan-400',
    numColor: 'text-cyan-500',
  },
  {
    step: 4, icon: FileSpreadsheet, color: 'emerald',
    title: 'Exporta o Envía por Email',
    desc: 'Genera informes Excel y envíalos directamente a tu contable.',
    gradient: 'from-emerald-600/20 to-emerald-600/5',
    ring: 'ring-emerald-500/20',
    iconBg: 'bg-emerald-600/20',
    iconColor: 'text-emerald-400',
    numColor: 'text-emerald-500',
  },
  {
    step: 5, icon: BarChart3, color: 'amber',
    title: 'Analiza tus Finanzas',
    desc: 'Dashboard ejecutivo con gráficos de evolución, países y categorías.',
    gradient: 'from-amber-600/20 to-amber-600/5',
    ring: 'ring-amber-500/20',
    iconBg: 'bg-amber-600/20',
    iconColor: 'text-amber-400',
    numColor: 'text-amber-500',
  },
]

const stats = [
  { icon: Brain, label: 'Extracción con IA', sub: 'Claude Vision API' },
  { icon: Zap, label: '5 pasos simples', sub: 'Flujo optimizado' },
  { icon: FileSpreadsheet, label: 'Excel export', sub: 'Listo para contable' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-blue-600/10 border border-blue-500/20 rounded-full px-3 py-1.5 mb-6">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-blue-400 font-medium">Gestión de gastos con IA</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Gestiona tus gastos
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            de empresa sin esfuerzo
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
          Sube tus recibos, la IA los analiza automáticamente y genera informes profesionales en segundos.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/gastos')}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            Empezar ahora
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/proyectos')}
            className="flex items-center justify-center gap-2 border border-white/[0.08] hover:bg-white/[0.04] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition"
          >
            Ver proyectos
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-12">
        {stats.map(({ icon: Icon, label, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="bg-[#13151c] border border-white/[0.06] rounded-xl p-4 text-center"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center mx-auto mb-2">
              <Icon className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-white">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Steps */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-6 text-center">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 * i }}
                className={`bg-gradient-to-br ${s.gradient} border border-white/[0.06] ring-1 ${s.ring} rounded-2xl p-5 relative overflow-hidden`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${s.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold ${s.numColor}`}>0{s.step}</span>
                      <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
