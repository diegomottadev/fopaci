import { useState, useEffect } from 'react'
import { fetchVendedores } from '../services/sheets'
import { getVendedores, saveVendedores } from '../db/offlineQueue'

export function useVendedores(): { vendedores: string[]; loading: boolean; error: string | null } {
  const [vendedores, setVendedores] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Try IDB cache first
      const cached = await getVendedores()
      if (!cancelled && cached && cached.length > 0) {
        setVendedores(cached)
        setLoading(false)
      }

      // Then try network
      try {
        const data = await fetchVendedores()
        if (!cancelled) {
          setVendedores(data)
          setLoading(false)
          setError(null)
          await saveVendedores(data)
        }
      } catch {
        if (!cancelled) {
          if (cached && cached.length > 0) {
            // Cache already shown — silently ignore network error
            setLoading(false)
          } else {
            setError('No se pudo cargar los vendedores')
            setLoading(false)
          }
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { vendedores, loading, error }
}
