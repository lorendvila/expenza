import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import {
  X, Upload, Loader2, AlertTriangle, ChevronDown, ChevronUp,
  RefreshCw, Check, FileImage
} from 'lucide-react'
import type { Project, AIExtracted } from '@/types'
import { CATEGORIES, CURRENCIES, COUNTRIES } from '@/components/shared/constants'
import { cn } from '@/lib/utils'

const RECEIPT_PROMPT = `You are a specialist in extracting structured data from receipts and invoices for a business expense app. The receipt may be in any language. The user is based in Spain/Europe.

EXTRACTION RULES:
- date: Look for any date on the receipt. Common formats: DD/MM/YYYY, DD-MM-YY, YYYY-MM-DD, "3 Mar 2025".
  Always return ISO format YYYY-MM-DD. If format is ambiguous (e.g. 03/04/25), assume DD/MM/YY (European convention).
  Return null if truly not found.
- total_amount: The FINAL amount paid. Look for keywords: Total, TOTAL, Importe, A pagar, Amount due, Grand Total, Gesamtbetrag, Montant TTC.
  Return as string number (e.g. "45.30"). Return null if not found. NEVER infer or calculate.
- tax_amount: The VAT/IVA/tax portion only. Look for: IVA, VAT, TVA, MwSt, GST, Tax.
  Return null if not explicitly printed — do not calculate from total minus net.
- net_amount: The base amount before tax. Look for: Base imponible, Subtotal, Net, HT, Netto.
  Return null if not explicitly printed — do not calculate.
- supplier: The business name at the top of the receipt, or the brand/store name. Return null if not found.
- tax_id: The supplier's tax registration number. Look for: NIF, CIF, VAT No, TVA, SIRET, Steuernummer. Return null if not found.
- currency: ISO 4217 code. Infer from symbol (€=EUR, $=USD, £=GBP, $=COP if Colombian context) or country. Default EUR if European receipt with no symbol.
- country: Country in Spanish where the expense occurred. Infer from: language of receipt, address, currency, tax ID format (Spanish NIF=España, French SIRET=Francia, etc). Return null if cannot determine.
- category: One of exactly: "transporte", "alojamiento", "comidas", "gasolina", "otros".
  Infer from supplier name and context. Hotels/hostels=alojamiento, restaurants/cafes/bars=comidas, airlines/trains/taxi/metro=transporte, gas stations=gasolina. Default "otros".
- raw_text: Full verbatim text of the receipt as you read it.
- confidence: Object with score 0-1 per field indicating extraction confidence.

Return ONLY a valid JSON object with these exact keys. No explanation, no markdown.`

interface Props {
  companyId: string
  userId: string
  projects: Project[]
  defaultProjectId?: string
  onClose: () => void
  onSaved?: () => void
}

type Step = 'upload' | 'review'

// Fields that can have confidence scores
const CONFIDENCE_FIELDS = ['date', 'total_amount', 'tax_amount', 'net_amount', 'supplier', 'tax_id', 'currency', 'country', 'category']

function FieldWrapper({ label, confidence, children }: { label: string; confidence?: number; children: React.ReactNode }) {
  const low = confidence !== undefined && (confidence < 0.7)
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-xs font-medium text-gray-400">{label}</label>
        {low && <AlertTriangle className="w-3 h-3 text-amber-400" />}
      </div>
      <div className={cn(low && 'ring-1 ring-amber-500/50 rounded-lg')}>
        {children}
      </div>
    </div>
  )
}

export default function UploadModal({ companyId, userId, projects, defaultProjectId, onClose, onSaved }: Props) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const dropRef = useRef<HTMLDivElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [dragging, setDragging] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'analyzing' | 'done' | 'error'>('idle')
  const [statusMsg, setStatusMsg] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [extracted, setExtracted] = useState<AIExtracted | null>(null)

  // Review form state
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [category, setCategory] = useState('')
  const [country, setCountry] = useState('')
  const [date, setDate] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [supplier, setSupplier] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [taxAmount, setTaxAmount] = useState('')
  const [netAmount, setNetAmount] = useState('')
  const [taxId, setTaxId] = useState('')
  const [notes, setNotes] = useState('')
  const [showRaw, setShowRaw] = useState(false)
  const [saving, setSaving] = useState(false)

  const callClaudeVision = useCallback(async (url: string): Promise<AIExtracted> => {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url } },
            { type: 'text', text: RECEIPT_PROMPT },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({})) as { error?: { message?: string } }
      throw new Error(err?.error?.message || `Claude API error ${response.status}`)
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> }
    const raw = data.content[0]?.text || ''

    // Clean possible markdown fences
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(cleaned) as AIExtracted
  }, [])

  const processFile = useCallback(async (file: File) => {
    setUploadStatus('uploading')
    setStatusMsg('Subiendo archivo...')

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}/${Date.now()}.${ext}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filename, file, { contentType: file.type, upsert: false })

    if (uploadError || !uploadData) {
      setUploadStatus('error')
      setStatusMsg('Error al subir el archivo: ' + (uploadError?.message || ''))
      return
    }

    const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(uploadData.path)
    const publicUrl = urlData.publicUrl
    setFileUrl(publicUrl)

    setUploadStatus('analyzing')
    setStatusMsg('Analizando con IA...')

    try {
      const result = await callClaudeVision(publicUrl)
      setExtracted(result)

      // Pre-fill form
      setDate(result.date || '')
      setSupplier(result.supplier || '')
      setTotalAmount(result.total_amount || '')
      setTaxAmount(result.tax_amount || '')
      setNetAmount(result.net_amount || '')
      setTaxId(result.tax_id || '')
      setCurrency(result.currency || 'EUR')
      setCountry(result.country || '')
      setCategory(result.category || 'otros')

      setUploadStatus('done')
      setStep('review')
    } catch (err) {
      setUploadStatus('error')
      setStatusMsg('Error al analizar: ' + (err instanceof Error ? err.message : 'Desconocido'))
    }
  }, [userId, callClaudeVision])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [processFile])

  const retryAnalysis = async () => {
    if (!fileUrl) return
    setUploadStatus('analyzing')
    setStatusMsg('Reintentando análisis con IA...')
    try {
      const result = await callClaudeVision(fileUrl)
      setExtracted(result)
      setDate(result.date || '')
      setSupplier(result.supplier || '')
      setTotalAmount(result.total_amount || '')
      setTaxAmount(result.tax_amount || '')
      setNetAmount(result.net_amount || '')
      setTaxId(result.tax_id || '')
      setCurrency(result.currency || 'EUR')
      setCountry(result.country || '')
      setCategory(result.category || 'otros')
      setUploadStatus('done')
    } catch (err) {
      setUploadStatus('error')
      setStatusMsg('Error: ' + (err instanceof Error ? err.message : 'Desconocido'))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('expenses').insert({
      company_id: companyId,
      user_id: userId,
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
      file_url: fileUrl || null,
      raw_ocr_text: extracted?.raw_text || null,
      ai_raw_response: extracted ? { ...extracted } : null,
    })

    qc.invalidateQueries({ queryKey: ['expenses', companyId] })
    onSaved?.()
    onClose()
    setSaving(false)
  }

  // Count low-confidence fields
  const lowConfidenceCount = extracted
    ? CONFIDENCE_FIELDS.filter(f => {
        const conf = extracted.confidence?.[f]
        return conf !== undefined && conf < 0.7
      }).length
    : 0

  const getConf = (field: string) => extracted?.confidence?.[field]

  const inputCls = (conf?: number) => cn(
    'w-full bg-[#1a1d27] border text-white text-sm rounded-lg px-3 py-2 outline-none transition',
    conf !== undefined && conf < 0.7
      ? 'border-amber-500/50 bg-amber-500/5 focus:border-amber-400/70'
      : 'border-white/[0.07] focus:border-blue-500/50'
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#13151c] border border-white/[0.06] rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {step === 'upload' ? 'Subir recibo' : 'Revisar extracción'}
            </h2>
            {step === 'review' && lowConfidenceCount > 0 && (
              <p className="text-xs text-amber-400 mt-0.5">
                ⚠ {lowConfidenceCount} campo{lowConfidenceCount > 1 ? 's requieren' : ' requiere'} revisión
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div className="p-5">
              <div
                ref={dropRef}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => uploadStatus === 'idle' && fileRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-10 text-center transition cursor-pointer',
                  dragging ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]',
                  uploadStatus !== 'idle' && 'cursor-default pointer-events-none'
                )}
              >
                {uploadStatus === 'idle' && (
                  <>
                    <FileImage className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-white font-medium mb-1">
                      Arrastra un recibo o haz clic
                    </p>
                    <p className="text-xs text-gray-500">Imágenes y PDF · Máx 10MB</p>
                  </>
                )}
                {(uploadStatus === 'uploading' || uploadStatus === 'analyzing') && (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                    <p className="text-sm text-white">{statusMsg}</p>
                    <div className="w-48 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full bg-gradient-to-r from-blue-600 to-violet-500 rounded-full transition-all duration-1000',
                          uploadStatus === 'uploading' ? 'w-1/3' : 'w-2/3'
                        )}
                      />
                    </div>
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="flex flex-col items-center gap-3">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <p className="text-sm text-red-400">{statusMsg}</p>
                    <button
                      onClick={e => { e.stopPropagation(); setUploadStatus('idle'); setStatusMsg('') }}
                      className="text-xs text-gray-400 hover:text-white bg-white/[0.06] px-3 py-1.5 rounded-lg transition"
                    >
                      Reintentar
                    </button>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* STEP 2: Review */}
          {step === 'review' && extracted && (
            <div className="p-5 space-y-4">
              {/* Retry button */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Análisis completado
                </span>
                <button
                  onClick={retryAnalysis}
                  disabled={uploadStatus === 'analyzing'}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1.5 rounded-lg transition disabled:opacity-50"
                >
                  {uploadStatus === 'analyzing'
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <RefreshCw className="w-3 h-3" />}
                  Reintentar análisis
                </button>
              </div>

              {/* Project */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Proyecto / Viaje</label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition"
                >
                  <option value="">— Sin proyecto —</option>
                  {projects.filter(p => p.status === 'active').map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <FieldWrapper label="Categoría" confidence={getConf('category')}>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className={inputCls(getConf('category'))}
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </FieldWrapper>

                {/* Country */}
                <FieldWrapper label="País" confidence={getConf('country')}>
                  <select
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className={inputCls(getConf('country'))}
                  >
                    <option value="">— Seleccionar —</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FieldWrapper>

                {/* Date */}
                <FieldWrapper label="Fecha" confidence={getConf('date')}>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className={cn(inputCls(getConf('date')), '[color-scheme:dark]')}
                  />
                </FieldWrapper>

                {/* Currency */}
                <FieldWrapper label="Moneda" confidence={getConf('currency')}>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className={inputCls(getConf('currency'))}
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FieldWrapper>

                {/* Supplier */}
                <FieldWrapper label="Proveedor" confidence={getConf('supplier')}>
                  <input
                    type="text"
                    value={supplier}
                    onChange={e => setSupplier(e.target.value)}
                    placeholder="Nombre proveedor"
                    className={inputCls(getConf('supplier'))}
                  />
                </FieldWrapper>

                {/* Tax ID */}
                <FieldWrapper label="NIF / Tax ID" confidence={getConf('tax_id')}>
                  <input
                    type="text"
                    value={taxId}
                    onChange={e => setTaxId(e.target.value)}
                    placeholder="B12345678"
                    className={inputCls(getConf('tax_id'))}
                  />
                </FieldWrapper>

                {/* Total */}
                <FieldWrapper label="Total" confidence={getConf('total_amount')}>
                  <input
                    type="number"
                    step="0.01"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputCls(getConf('total_amount'))}
                  />
                </FieldWrapper>

                {/* IVA */}
                <FieldWrapper label="IVA" confidence={getConf('tax_amount')}>
                  <input
                    type="number"
                    step="0.01"
                    value={taxAmount}
                    onChange={e => setTaxAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputCls(getConf('tax_amount'))}
                  />
                </FieldWrapper>

                {/* Net */}
                <FieldWrapper label="Base imponible" confidence={getConf('net_amount')}>
                  <input
                    type="number"
                    step="0.01"
                    value={netAmount}
                    onChange={e => setNetAmount(e.target.value)}
                    placeholder="0.00"
                    className={inputCls(getConf('net_amount'))}
                  />
                </FieldWrapper>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Notas</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observaciones..."
                    className="w-full bg-[#1a1d27] border border-white/[0.07] text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition"
                  />
                </div>
              </div>

              {/* Raw OCR */}
              {extracted.raw_text && (
                <div>
                  <button
                    onClick={() => setShowRaw(!showRaw)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition"
                  >
                    {showRaw ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {showRaw ? 'Ocultar' : 'Ver'} texto OCR completo
                  </button>
                  {showRaw && (
                    <div className="mt-2 bg-[#0f1117] border border-white/[0.06] rounded-lg p-3 text-xs text-gray-400 font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {extracted.raw_text}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div className="px-5 py-4 border-t border-white/[0.06] flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setStep('upload'); setUploadStatus('idle'); setStatusMsg(''); setExtracted(null) }}
              className="flex-1 bg-white/[0.06] hover:bg-white/[0.1] text-gray-400 text-sm rounded-lg py-2.5 transition"
            >
              ← Volver
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar gasto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
