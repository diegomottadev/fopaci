import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const ESTADO_BADGE: Record<string, string> = {
  Pendiente:  'bg-yellow-100 text-yellow-800',
  Cancelado:  'bg-gray-100 text-gray-600',
  'A cobrar': 'bg-blue-100 text-blue-800',
  Finalizado: 'bg-green-100 text-green-800',
}
import { useHistorial } from '../hooks/useHistorial'
import { usePedidoStore } from '../store/pedidoStore'
import { useUIStore } from '../store/uiStore'
import { enviarPedido } from '../services/pedidos'
import { addPendingOrder } from '../db/offlineQueue'
import { generateRemitoPDF } from '../services/pdf'
import { formatCurrency } from '../utils/format'
import type { WebhookPayload } from '../types'

export default function HistorialDetalle() {
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const { pedidoId } = useParams<{ pedidoId: string }>()
  const navigate = useNavigate()
  const { pedidos, loading, refetch } = useHistorial()
  const showToast = useUIStore(s => s.showToast)
  const loadForEdit = usePedidoStore(s => s.loadForEdit)

  const pedido = pedidos.find(p => p.pedidoId === pedidoId)

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cargando pedido…</p>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="text-center py-8">
        <p style={{ color: 'var(--color-text-muted)' }}>Pedido no encontrado.</p>
        <button onClick={() => navigate('/historial')} className="mt-4 text-brand-800 hover:underline text-sm cursor-pointer">
          Volver al historial
        </button>
      </div>
    )
  }

  const canEdit = pedido.estado === 'Pendiente' || !!pedido.isPending
  const canCancel = canEdit

  function handleEdit() {
    loadForEdit(pedido!)
    navigate(`/pedido/${pedido!.pedidoId}`)
  }

  async function handleDownloadPDF() {
    await generateRemitoPDF({
      action: 'crear',
      pedido: {
        pedidoId: pedido!.pedidoId,
        fecha: pedido!.fecha,
        vendedor: pedido!.vendedor,
        cliente: pedido!.cliente,
        dniCuilCodigo: pedido!.dniCuilCodigo,
        items: pedido!.items,
        total: pedido!.total,
        estado: pedido!.estado,
        descuentoGeneral: pedido!.descuentoGeneral,
        observacion: pedido!.observacion,
      },
    })
  }

  async function handleCancel() {
    const payload: WebhookPayload = {
      action: 'cancelar',
      pedido: {
        pedidoId: pedido!.pedidoId,
        fecha: pedido!.fecha,
        vendedor: pedido!.vendedor,
        cliente: pedido!.cliente,
        dniCuilCodigo: pedido!.dniCuilCodigo,
        items: pedido!.items,
        total: pedido!.total,
        estado: 'Cancelado',
      }
    }
    try {
      await enviarPedido(payload)
      showToast('Pedido cancelado', 'success')
    } catch {
      await addPendingOrder(payload)
      window.dispatchEvent(new CustomEvent('pending-orders-changed'))
      showToast('Sin conexión — cancelación guardada localmente', 'warning')
    }
    refetch()
    navigate('/historial')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/historial')}
          className="text-brand-700 hover:text-brand-900 cursor-pointer"
          aria-label="Volver al historial"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Detalle</h2>
      </div>

      {/* Info */}
      <div className="bg-white border rounded-lg p-4 space-y-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Pedido</span><span className="font-mono text-xs">{pedido.pedidoId}</span></div>
        <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Fecha</span><span>{pedido.fecha}</span></div>
        <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Vendedor</span><span>{pedido.vendedor}</span></div>
        <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Cliente</span><span className="font-medium">{pedido.cliente}</span></div>
        {pedido.dniCuilCodigo && <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>CUIT/DNI</span><span>{pedido.dniCuilCodigo}</span></div>}
        <div className="flex justify-between"><span style={{ color: 'var(--color-text-muted)' }}>Estado</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            pedido.isPending ? 'bg-orange-100 text-orange-800' :
            (ESTADO_BADGE[pedido.estado] ?? 'bg-gray-100 text-gray-600')
          }`}>{pedido.isPending ? 'Offline' : pedido.estado}</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {pedido.items.map((item, i) => (
          <div key={`${item.codigo}-${i}`} className="flex justify-between text-sm py-1 border-b border-brand-100">
            <div>
              <span className="font-medium">{item.descripcion}</span>
              <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>× {item.unidades}</span>
            </div>
            <span>{formatCurrency(item.subtotal)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold text-base pt-2">
          <span>Total</span>
          <span>{formatCurrency(pedido.total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={handleDownloadPDF}
          className="w-full bg-brand-700 text-white py-3 rounded-lg font-semibold hover:bg-brand-800 transition-colors cursor-pointer"
        >
          Descargar remito PDF
        </button>
        {canEdit && (
          <button
            onClick={handleEdit}
            className="w-full bg-brand-800 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 transition-colors cursor-pointer"
          >
            Editar pedido
          </button>
        )}
        {canCancel && (
          confirmingCancel ? (
            <div className="flex gap-2">
              <button
                onClick={async () => { await handleCancel(); setConfirmingCancel(false) }}
                className="flex-1 bg-brand-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors cursor-pointer"
              >
                Sí, cancelar
              </button>
              <button
                onClick={() => setConfirmingCancel(false)}
                className="flex-1 border py-2 rounded-lg text-sm hover:bg-brand-50 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                No, volver
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingCancel(true)}
              className="w-full border border-brand-200 text-brand-700 py-2 rounded-lg text-sm hover:bg-brand-50 transition-colors cursor-pointer"
            >
              Cancelar pedido
            </button>
          )
        )}
      </div>
    </div>
  )
}
