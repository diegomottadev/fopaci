import { useState, useEffect } from 'react'
import { usePendingCount } from '../hooks/usePendingCount'

export default function OfflineBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const pendingCount = usePendingCount()

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && pendingCount === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm">
      {!isOnline && <span className="bg-yellow-500 text-black px-2 py-0.5 rounded text-xs">Sin conexión</span>}
      {pendingCount > 0 && (
        <span className="bg-orange-500 text-white px-2 py-0.5 rounded text-xs">
          {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
