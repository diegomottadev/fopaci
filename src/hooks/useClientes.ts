import { useState, useEffect, useRef } from 'react'
import type { Cliente } from '../types'
import { fetchAllClientes } from '../services/sheets'
import { getCachedClientes, saveClientes } from '../db/offlineQueue'
import { buscarEnClientePublic } from '../services/sheets'

export function useClientes(query: string): { clientes: Cliente[]; loading: boolean } {
  const [allClientes, setAllClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const loadedRef = useRef(false)

  // Load full list once (cache-first, then network)
  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    async function load() {
      setLoading(true)
      const cached = await getCachedClientes()
      if (cached && cached.length > 0) {
        setAllClientes(cached)
        setLoading(false)
      }

      try {
        const data = await fetchAllClientes()
        setAllClientes(data)
        setLoading(false)
        await saveClientes(data)
      } catch {
        if (!cached || cached.length === 0) setLoading(false)
      }
    }

    load()
  }, [])

  const trimmed = query.trim()
  const clientes = trimmed
    ? allClientes.filter(c => buscarEnClientePublic(c, trimmed))
    : []

  return { clientes, loading: loading && trimmed.length > 0 }
}
