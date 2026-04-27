import * as XLSX from 'xlsx'
import type { Expense } from '@/types'

export function exportExpensesToExcel(expenses: Expense[], projectName: string, companyName: string) {
  const rows = expenses.map(e => ({
    Fecha: e.date || '',
    Proveedor: e.supplier || '',
    Categoría: e.category || '',
    País: e.country || '',
    Total: e.total_amount || '',
    IVA: e.tax_amount || '',
    'Base imponible': e.net_amount || '',
    Moneda: e.currency || 'EUR',
    'NIF Proveedor': e.tax_id || '',
    Notas: e.notes || '',
    'URL Archivo': e.file_url || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 12 }, { wch: 25 }, { wch: 14 }, { wch: 14 },
    { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 8 },
    { wch: 15 }, { wch: 30 }, { wch: 50 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos')

  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9\-_áéíóúÁÉÍÓÚñÑ ]/g, '').slice(0, 30)
  const filename = `${safeName(companyName)}_${safeName(projectName)}_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, filename)
}

export function exportExpensesToCSV(expenses: Expense[], projectName: string, companyName: string) {
  const headers = ['Fecha', 'Proveedor', 'Categoría', 'País', 'Total', 'IVA', 'Base imponible', 'Moneda', 'NIF Proveedor', 'Notas', 'URL Archivo']
  const rows = expenses.map(e => [
    e.date || '',
    e.supplier || '',
    e.category || '',
    e.country || '',
    e.total_amount ?? '',
    e.tax_amount ?? '',
    e.net_amount ?? '',
    e.currency || 'EUR',
    e.tax_id || '',
    e.notes || '',
    e.file_url || '',
  ])

  const escape = (v: unknown) => {
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }

  const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9\-_áéíóúÁÉÍÓÚñÑ ]/g, '').slice(0, 30)
  a.href = url
  a.download = `${safeName(companyName)}_${safeName(projectName)}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function exportExpensesToExcelBuffer(expenses: Expense[], projectName: string, companyName: string): Uint8Array {
  const rows = expenses.map(e => ({
    Fecha: e.date || '',
    Proveedor: e.supplier || '',
    Categoría: e.category || '',
    País: e.country || '',
    Total: e.total_amount || '',
    IVA: e.tax_amount || '',
    'Base imponible': e.net_amount || '',
    Moneda: e.currency || 'EUR',
    'NIF Proveedor': e.tax_id || '',
    Notas: e.notes || '',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos')

  const safeName = (s: string) => s.replace(/[^a-zA-Z0-9\-_áéíóúÁÉÍÓÚñÑ ]/g, '').slice(0, 30)
  const filename = `${safeName(companyName)}_${safeName(projectName)}_${new Date().toISOString().split('T')[0]}.xlsx`

  void filename
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
}
