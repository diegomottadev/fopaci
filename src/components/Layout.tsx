import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Clock } from 'lucide-react'
import Toast from './Toast'
import OfflineBadge from './OfflineBadge'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { usePedidoStore } from '../store/pedidoStore'

export default function Layout() {
  useSyncQueue()
  const navigate = useNavigate()
  const location = useLocation()
  const vendedor = usePedidoStore(s => s.vendedor)

  const isHome = location.pathname === '/'
  const showHistorial = !isHome && !location.pathname.startsWith('/historial')

  return (
    <div className="min-h-screen bg-[#faf7f8]">
      <header className="bg-white border-b border-brand-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}fopaci-logo.webp`} alt="Fopaci" className="h-9 object-contain" />
        </div>
        <div className="flex items-center gap-3">
          {vendedor && (
            <span className="text-sm font-semibold text-brand-800 max-w-[140px] truncate">
              {vendedor}
            </span>
          )}
          {showHistorial && (
            <button onClick={() => navigate('/historial')} className="text-brand-700 hover:text-brand-900 cursor-pointer">
              <Clock size={20} />
            </button>
          )}
          <OfflineBadge />
        </div>
      </header>
      <main id="main-content" className="container mx-auto px-4 py-6 max-w-2xl">
        <Outlet />
      </main>
      <Toast />
    </div>
  )
}
