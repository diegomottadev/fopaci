// src/utils/format.ts

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(n)
}

// Converts "YYYY-MM-DD" → "DD/MM/YYYY". Returns original string if format doesn't match.
export function formatDate(date: string | undefined): string {
  if (!date) return ''
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : date
}
