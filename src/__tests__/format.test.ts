import { describe, it, expect } from 'vitest'
import { formatCurrency } from '../utils/format'

describe('formatCurrency', () => {
  it('formats Argentine peso amounts', () => {
    const result = formatCurrency(1500)
    // Argentine format uses periods as thousand separators
    // Accept both '1.500' and '1500' depending on Node version
    expect(result).toMatch(/1[.,]?500/)
    expect(result).toMatch(/ARS|\$/)
  })

  it('formats zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toMatch(/ARS|\$/)
  })

  it('handles large numbers', () => {
    const result = formatCurrency(1000000)
    // Verify Argentine thousand-separator grouping: '1.000.000' (period) or '1,000,000'
    expect(result).toMatch(/1[.,]000[.,]000/)
    expect(result).toMatch(/ARS|\$/)
  })

  it('handles negative numbers', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
    expect(result).toMatch(/-|−/)
  })
})
