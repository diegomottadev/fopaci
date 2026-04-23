import { useState, useEffect, useCallback } from 'react'
import type { PedidoHistorial } from '../types'
import { fetchPedidos } from '../services/sheets'
import { getAllPendingOrders } from '../db/offlineQueue'

export function useHistorial(): {
  pedidos: PedidoHistorial[]
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const [pedidos, setPedidos] = useState<PedidoHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => {
    setTick(t => t + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    async function load() {
      const [fetchResult, pendingResult] = await Promise.allSettled([
        fetchPedidos(),
        getAllPendingOrders(),
      ])

      if (cancelled) return

      const pendingOrders = pendingResult.status === 'fulfilled' ? pendingResult.value : []
      const pendingHistorial: PedidoHistorial[] = pendingOrders.map(p => ({
        ...p.pedido,
        isPending: true,
      }))

      if (fetchResult.status === 'rejected') {
        // Offline: show pending orders only
        setPedidos(pendingHistorial)
        if (pendingHistorial.length === 0) {
          setError('No se pudo cargar el historial')
        }
        setLoading(false)
        return
      }

      // Build a map — pending first so sheet version overwrites
      const map = new Map<string, PedidoHistorial>()
      for (const p of pendingHistorial) {
        map.set(p.pedidoId, p)
      }
      for (const p of fetchResult.value) {
        map.set(p.pedidoId, p)
      }

      setPedidos(Array.from(map.values()))
      setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [tick])

  return { pedidos, loading, error, refetch }
}
