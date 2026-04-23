import { useState, useEffect } from 'react'
import { countPendingOrders } from '../db/offlineQueue'

export function usePendingCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function refresh() {
      const n = await countPendingOrders()
      if (!cancelled) setCount(n)
    }

    refresh()

    const handleOnline = () => { refresh() }
    const handleFocus = () => { refresh() }
    const handleChanged = () => { refresh() }

    window.addEventListener('online', handleOnline)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('pending-orders-changed', handleChanged)

    return () => {
      cancelled = true
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pending-orders-changed', handleChanged)
    }
  }, [])

  return count
}
