// src/utils/format.ts

/**
 * Formats a number as Argentine Peso currency.
 * Uses Intl.NumberFormat with es-AR locale and ARS currency.
 * Example: formatCurrency(1500) → "$ 1.500,00"
 */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(n)
}
