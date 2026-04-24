import { useState } from 'react'
import { fetchVendedoresList } from '../services/sheets'
import { getCachedVendedoresInfo, saveVendedoresInfo } from '../db/offlineQueue'
import { usePedidoStore } from '../store/pedidoStore'

interface UseVendedorLogin {
  login: (dni: string) => Promise<void>
  loading: boolean
  error: string | null
}

export function useVendedorLogin(): UseVendedorLogin {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setVendedor = usePedidoStore(s => s.setVendedor)

  async function login(dni: string) {
    const normalized = dni.trim().replace(/[-\s]/g, '')
    if (!normalized) return

    setLoading(true)
    setError(null)

    // Try to resolve name from cache or network
    const cached = await getCachedVendedoresInfo().catch(() => undefined)

    try {
      const lista = await fetchVendedoresList()
      // Network succeeded — update cache in background
      saveVendedoresInfo(lista).catch(() => undefined)
      const match = lista.find(v => v.dni.replace(/[-\s]/g, '') === normalized)
      if (match) {
        setVendedor(match.nombre, normalized)
      } else {
        setError('DNI no encontrado')
      }
    } catch {
      // Offline: use cached list to resolve name, or use DNI as fallback
      const match = cached?.find(v => v.dni.replace(/[-\s]/g, '') === normalized)
      setVendedor(match ? match.nombre : normalized, normalized)
    } finally {
      setLoading(false)
    }
  }

  return { login, loading, error }
}
