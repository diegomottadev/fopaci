import { useRef, useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Clock, LogOut, ChevronDown } from 'lucide-react'
import Toast from './Toast'
import OfflineBadge from './OfflineBadge'
import { useSyncQueue } from '../hooks/useSyncQueue'
import { usePedidoStore } from '../store/pedidoStore'

export default function Layout() {
  useSyncQueue()
  const navigate = useNavigate()
  const location = useLocation()
  const vendedor = usePedidoStore(s => s.vendedor)
  const setVendedor = usePedidoStore(s => s.setVendedor)
  const resetPedido = usePedidoStore(s => s.resetPedido)

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const isHome = location.pathname === '/'
  const showHistorial = !isHome && !location.pathname.startsWith('/historial')

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    setMenuOpen(false)
    resetPedido()
    setVendedor('')
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#faf7f8]">
      <header className="bg-white border-b border-brand-200 px-4 py-2.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <img src={`${import.meta.env.BASE_URL}fopaci-logo.webp`} alt="Fopaci" className="h-9 object-contain" />
        </div>
        <div className="flex items-center gap-3">
          {vendedor && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen(o => !o)}
                className="flex items-center gap-1 text-sm font-semibold text-brand-800 hover:text-brand-900 cursor-pointer max-w-[160px]"
              >
                <span className="truncate">{vendedor}</span>
                <ChevronDown size={14} className={`shrink-0 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-700 hover:bg-brand-50 cursor-pointer"
                  >
                    <LogOut size={14} />
                    Salir
                  </button>
                </div>
              )}
            </div>
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
