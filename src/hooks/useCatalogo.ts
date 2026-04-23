import { useState, useEffect } from 'react'
import type { Producto } from '../types'
import { fetchCatalogo } from '../services/sheets'
import { getCatalogo, saveCatalogo } from '../db/offlineQueue'

export function useCatalogo(): { catalogo: Producto[]; loading: boolean; error: string | null } {
  const [catalogo, setCatalogo] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Try IDB cache first
      const cached = await getCatalogo()
      if (!cancelled && cached && cached.length > 0) {
        setCatalogo(cached)
        setLoading(false)
      }

      // Then try network
      try {
        const data = await fetchCatalogo()
        if (!cancelled) {
          setCatalogo(data)
          setLoading(false)
          setError(null)
          await saveCatalogo(data)
        }
      } catch {
        if (!cancelled) {
          if (cached && cached.length > 0) {
            // Cache already shown — silently ignore network error
            setLoading(false)
          } else {
            setError('No se pudo cargar el catálogo')
            setLoading(false)
          }
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { catalogo, loading, error }
}
