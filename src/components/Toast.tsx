import { useEffect } from 'react'
import { useUIStore } from '../store/uiStore'

export default function Toast() {
  const toast = useUIStore(s => s.toast)
  const hideToast = useUIStore(s => s.hideToast)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(hideToast, 3000)
    return () => clearTimeout(timer)
  }, [toast, hideToast])

  if (!toast) return null

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg text-white text-center z-50
        ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-amber-500' : 'bg-red-600'}`}
    >
      {toast.message}
    </div>
  )
}
