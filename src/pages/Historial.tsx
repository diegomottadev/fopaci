import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, RefreshCw, FileDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useHistorial } from '../hooks/useHistorial'
import { usePedidoStore } from '../store/pedidoStore'
import { useUIStore } from '../store/uiStore'
import { generateRemitoPDF } from '../services/pdf'
import { formatCurrency, formatDate } from '../utils/format'
import type { PedidoHistorial } from '../types'

const ESTADO_BADGE: Record<string, string> = {
  Pendiente:  'bg-yellow-100 text-yellow-800',
  Cancelado:  'bg-gray-100 text-gray-600',
  'A cobrar': 'bg-blue-100 text-blue-800',
  Finalizado: 'bg-green-100 text-green-800',
}

function estadoBadge(p: PedidoHistorial): JSX.Element {
  if (p.isPending) return <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">Offline</span>
  const cls = ESTADO_BADGE[p.estado] ?? 'bg-gray-100 text-gray-600'
  return <span className={`text-xs px-2 py-0.5 rounded-full ${cls}`}>{p.estado}</span>
}

export default function Historial() {
  const navigate = useNavigate()
  const { pedidos, loading, error, refetch } = useHistorial()
  const vendedor = usePedidoStore(s => s.vendedor)
  const vendedorDni = usePedidoStore(s => s.vendedorDni)
  const showToast = useUIStore(s => s.showToast)

  const today = new Date().toISOString().slice(0, 10)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    if (syncingRef.current && !loading) {
      syncingRef.current = false
      setSyncing(false)
      showToast('Historial sincronizado', 'success')
    }
  }, [loading])

  function handleSync() {
    syncingRef.current = true
    setSyncing(true)
    refetch()
  }

  async function handleDownloadPDF(e: React.MouseEvent, p: PedidoHistorial) {
    e.stopPropagation()
    setDownloadingId(p.pedidoId)
    try {
      await generateRemitoPDF({ action: 'crear', pedido: { ...p } })
    } finally {
      setDownloadingId(null)
    }
  }
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  const filtered = pedidos.filter(p => {
    if (vendedor && p.vendedor !== vendedor && p.vendedor !== vendedorDni) return false
    if (search) {
      const q = search.trim()
      const words = q.toLowerCase().split(/\s+/)
      const matchAll = (text: string) => words.every(w => text.toLowerCase().includes(w))
      const hit = matchAll(p.cliente) || matchAll(p.vendedor) ||
        (p.nombreComercial ? matchAll(p.nombreComercial) : false) ||
        p.dniCuilCodigo.includes(q)
      if (!hit) return false
    }
    if (dateFrom && p.fecha < dateFrom) return false
    if (dateTo && p.fecha > dateTo) return false
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/')} className="text-brand-700 hover:text-brand-900 cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">Historial</h2>
        </div>
        <button onClick={handleSync} disabled={syncing} className="flex items-center gap-1 text-sm text-brand-800 hover:text-brand-900 disabled:opacity-50 font-medium cursor-pointer">
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Sincronizando…' : 'Sincronizar'}
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Buscar por cliente o vendedor…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
          style={{ borderColor: 'var(--color-border)' }}
        />
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
              style={{ borderColor: 'var(--color-border)' }} />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
              style={{ borderColor: 'var(--color-border)' }} />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-brand-700">{error}</p>}

      {!loading && filtered.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Sin resultados</p>
      )}

      <ul className="space-y-2">
        {filtered.map(p => (
          <li key={p.pedidoId}>
            <button
              className="w-full text-left bg-white border rounded-lg px-4 py-3 hover:bg-brand-50 transition-colors cursor-pointer"
              style={{ borderColor: 'var(--color-border)' }}
              onClick={() => navigate(`/historial/${p.pedidoId}`)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.cliente}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(p.fecha)}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Vendedor: {p.vendedor}</p>
                  {p.localidad && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Localidad: {p.localidad}</p>
                  )}
                  {p.fechaEntrega && (
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Fecha de entrega: {formatDate(p.fechaEntrega)}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(p.total)}</span>
                  {estadoBadge(p)}
                  <button
                    onClick={e => handleDownloadPDF(e, p)}
                    disabled={downloadingId === p.pedidoId}
                    className="flex items-center gap-1 text-xs text-brand-700 hover:text-brand-900 disabled:opacity-40 border border-brand-200 rounded px-2 py-0.5 hover:bg-brand-50 cursor-pointer"
                    aria-label="Descargar remito PDF"
                  >
                    <FileDown size={14} />PDF
                  </button>
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
