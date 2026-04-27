import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import type { Project, Expense } from '@/types'
import { exportExpensesToExcelBuffer } from '@/components/expenses/exportExcel'
import { supabase } from '@/lib/supabase'

interface Props {
  project: Project
  expenses: Expense[]
  companyName: string
  onClose: () => void
}

export default function EmailProjectModal({ project, expenses, companyName, onClose }: Props) {
  const [to, setTo] = useState('')
  const [subject, setSubject] = useState(`Nota de gastos: ${project.name}`)
  const [message, setMessage] = useState(
    `Adjunto encontrarás el informe de gastos del proyecto "${project.name}".\n\nTotal: ${expenses.reduce((s, e) => s + (e.total_amount || 0), 0).toFixed(2)} EUR\nNúmero de gastos: ${expenses.length}\n\nSaludos.`
  )
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!to.trim()) return
    setSending(true)
    setError('')

    try {
      const buffer = exportExpensesToExcelBuffer(expenses, project.name, companyName)
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
      const filename = `${companyName}_${project.name}_${new Date().toISOString().split('T')[0]}.xlsx`

      const { error: fnError } = await supabase.functions.invoke('send-email', {
        body: { to, subject, message, filename, base64 },
      })

      if (fnError) throw new Error(fnError.message)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#13151c] border border-white/[0.06] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h2 className="text-sm font-semibold text-white">Enviar informe por email</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
              <Send className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-sm text-white font-medium mb-1">Email enviado</p>
            <p className="text-xs text-gray-500 mb-4">Se ha enviado el informe a {to}</p>
            <button onClick={onClose} className="bg-white/[0.06] hover:bg-white/[0.1] text-white text-sm px-4 py-2 rounded-lg transition">
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Para *</label>
              <input
                type="email"
                value={to}
                onChange={e => setTo(e.target.value)}
                required
                placeholder="contable@empresa.com"
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 placeholder:text-gray-600 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Asunto</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Mensaje</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={5}
                className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2.5 outline-none focus:border-blue-500/50 resize-none transition"
              />
            </div>

            <div className="bg-[#1a1d27] rounded-lg px-3 py-2.5 text-xs text-gray-500">
              Se adjuntará automáticamente: <span className="text-gray-300">{companyName}_{project.name}.xlsx</span>
              <br />{expenses.length} gastos exportados
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-sm rounded-lg py-2.5 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg py-2.5 transition"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {sending ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
