import { useEffect, useRef } from 'react'
import { getAllPendingOrders, removePendingOrder } from '../db/offlineQueue'
import { enviarPedido } from '../services/pedidos'

export function useSyncQueue(): void {
  const isFlushingRef = useRef(false)

  useEffect(() => {
    async function flushQueue() {
      if (!navigator.onLine || isFlushingRef.current) return
      isFlushingRef.current = true
      try {
        const orders = await getAllPendingOrders()
        for (const order of orders) {
          try {
            await enviarPedido(order)
            await removePendingOrder(order.pedido.pedidoId)
            window.dispatchEvent(new CustomEvent('pending-orders-changed'))
          } catch {
            // Stop on first failure — leave remaining orders in queue
            break
          }
        }
      } finally {
        isFlushingRef.current = false
      }
    }

    flushQueue()

    const handleOnline = () => { flushQueue() }
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('online', handleOnline)
    }
  }, [])
}
