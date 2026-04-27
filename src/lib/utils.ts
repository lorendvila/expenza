import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | undefined | null, currency = 'EUR') {
  if (amount == null) return '—'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '—'
  try {
    return new Intl.DateTimeFormat('es-ES').format(new Date(dateStr + 'T00:00:00'))
  } catch {
    return dateStr
  }
}
