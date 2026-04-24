import { useState } from 'react'
import { Check, ChevronLeft } from 'lucide-react'
import { useNavigate, Navigate } from 'react-router-dom'
import { usePedidoStore } from '../store/pedidoStore'
import { useUIStore } from '../store/uiStore'
import { enviarPedido } from '../services/pedidos'
import { addPendingOrder } from '../db/offlineQueue'
import { generateRemitoPDF } from '../services/pdf'
import { formatCurrency } from '../utils/format'
import type { WebhookPayload } from '../types'

export default function Resumen() {
  const navigate = useNavigate()
  const pedidoId = usePedidoStore(s => s.pedidoId)
  const vendedor = usePedidoStore(s => s.vendedor)
  const cliente = usePedidoStore(s => s.cliente)
  const tipoPrecio = usePedidoStore(s => s.tipoPrecio)
  const items = usePedidoStore(s => s.items)
  const resetPedido = usePedidoStore(s => s.resetPedido)
  const isEditing = usePedidoStore(s => s.isEditing)
  const editObservacion = usePedidoStore(s => s.editObservacion)
  const editFechaEntrega = usePedidoStore(s => s.editFechaEntrega)
  const editDescuentoGeneral = usePedidoStore(s => s.editDescuentoGeneral)
  const showToast = useUIStore(s => s.showToast)

  const [sending, setSending] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [confirmado, setConfirmado] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [fechaEntrega, setFechaEntrega] = useState(editFechaEntrega)
  const [observacion, setObservacion] = useState(editObservacion)
  const [descuentos, setDescuentos] = useState<Record<string, string>>(() =>
    isEditing
      ? Object.fromEntries(items.filter(i => (i.descuento ?? 0) > 0).map(i => [i.codigo, String(i.descuento)]))
      : {}
  )
  const [descuentoGeneral, setDescuentoGeneral] = useState(editDescuentoGeneral > 0 ? String(editDescuentoGeneral) : '')

  if (items.length === 0) {
    return <Navigate to="/pedido/nuevo" replace />
  }

  const fecha = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  function parsePct(val: string): number {
    const n = parseFloat(val)
    return isNaN(n) || n <= 0 ? 0 : Math.min(n, 100)
  }

  function subtotalConDesc(codigo: string, subtotalBase: number): number {
    const pct = parsePct(descuentos[codigo] ?? '')
    return pct > 0 ? subtotalBase * (1 - pct / 100) : subtotalBase
  }

  function getTotalEfectivo(): number {
    const subtotalItems = items.reduce((acc, i) => acc + subtotalConDesc(i.codigo, i.subtotal), 0)
    const pctGeneral = parsePct(descuentoGeneral)
    return pctGeneral > 0 ? subtotalItems * (1 - pctGeneral / 100) : subtotalItems
  }

  function buildPayload(action: 'crear' | 'editar'): WebhookPayload {
    const pctGeneral = parsePct(descuentoGeneral)
    return {
      action,
      pedido: {
        pedidoId,
        fecha,
        horaRegistro: new Date().toLocaleString('sv-SE').replace('T', ' '),
        vendedor,
        cliente: cliente?.nombre ?? '',
        nombreComercial: (() => {
          const extra = cliente?.extra ?? {}
          const key = Object.keys(extra).find(k => k.toLowerCase() === 'nombre comercial')
          return key ? extra[key] || undefined : undefined
        })(),
        dniCuilCodigo: cliente?.cuil ?? cliente?.dni ?? cliente?.codigo ?? '',
        items: items.map(i => ({
          ...i,
          descuento: parsePct(descuentos[i.codigo] ?? '') || 0,
          subtotal: subtotalConDesc(i.codigo, i.subtotal),
        })),
        total: getTotalEfectivo(),
        estado: 'Pendiente',
        descuentoGeneral: pctGeneral || 0,
        observacion: observacion.trim() || undefined,
        fechaEntrega: fechaEntrega || undefined,
      }
    }
  }

  async function handleConfirmar() {
    setSending(true)
    const payload = buildPayload(isEditing ? 'editar' : 'crear')
    let success = false
    try {
      try {
        await enviarPedido(payload)
        showToast('Pedido enviado', 'success')
      } catch (err) {
        console.error('[enviarPedido]', err)
        await addPendingOrder(payload)
        window.dispatchEvent(new CustomEvent('pending-orders-changed'))
        showToast(`Sin conexión: ${err instanceof Error ? err.message : 'error desconocido'}`, 'error')
      }
      success = true
    } catch {
      showToast('Error al procesar el pedido', 'error')
    } finally {
      setSending(false)
      if (success) setConfirmado(true)
    }
  }

  async function handleDescargarPDF() {
    const payload = buildPayload('crear')
    await generateRemitoPDF(payload)
    setPdfGenerated(true)
  }

  return (
    <div className="space-y-6">
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <p className="text-base font-semibold text-gray-900 text-center">¿Confirmar y enviar el pedido?</p>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-muted)' }}>
              Esta acción enviará el pedido al sistema.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmando(false); handleConfirmar() }}
                disabled={sending}
                className="flex-1 bg-brand-800 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sending ? 'Enviando…' : 'Sí, confirmar'}
              </button>
              <button
                onClick={() => setConfirmando(false)}
                className="flex-1 border py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/pedido/nuevo')} className="text-brand-700 hover:text-brand-900 cursor-pointer">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-900">Resumen del Pedido</h2>
      </div>

      {/* Order info */}
      <div className="bg-white border rounded-lg p-4 space-y-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Vendedor</span>
          <span className="font-medium">{vendedor}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Cliente</span>
          <span className="font-medium">{cliente?.nombre}</span>
        </div>
        {(cliente?.cuil || cliente?.dni) && (
          <div className="flex justify-between">
            <span style={{ color: 'var(--color-text-muted)' }}>CUIT/DNI</span>
            <span className="font-medium">{cliente.cuil ?? cliente.dni}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Tipo precio</span>
          <span className="font-medium capitalize">{tipoPrecio}</span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: 'var(--color-text-muted)' }}>Fecha</span>
          <span className="font-medium">{fecha}</span>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {items.map(item => {
          const pct = parsePct(descuentos[item.codigo] ?? '')
          const subtotalEfectivo = subtotalConDesc(item.codigo, item.subtotal)
          return (
            <div key={item.codigo} className="flex items-center text-sm py-1 border-b border-brand-100 gap-2">
              <div className="flex-1 min-w-0">
                <span className="font-medium">{item.descripcion}</span>
                <span className="ml-2" style={{ color: 'var(--color-text-muted)' }}>× {item.unidades}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {pct > 0 && <span className="line-through text-gray-400 text-xs">{formatCurrency(item.subtotal)}</span>}
                <span className="text-gray-700">{formatCurrency(subtotalEfectivo)}</span>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={descuentos[item.codigo] ?? ''}
                  onChange={e => setDescuentos(prev => ({ ...prev, [item.codigo]: e.target.value }))}
                  disabled={confirmado}
                  placeholder="0"
                  className="w-14 border rounded px-1.5 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>%</span>
              </div>
            </div>
          )
        })}
        <div className="flex items-center gap-2 font-bold text-base pt-2">
          <span className="flex-1">Total</span>
          {parsePct(descuentoGeneral) > 0 && (
            <span className="line-through text-gray-400 text-sm font-normal">
              {formatCurrency(items.reduce((acc, i) => acc + subtotalConDesc(i.codigo, i.subtotal), 0))}
            </span>
          )}
          <span>{formatCurrency(getTotalEfectivo())}</span>
          <div className="flex items-center gap-0.5">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={descuentoGeneral}
              onChange={e => setDescuentoGeneral(e.target.value)}
              disabled={confirmado}
              placeholder="0"
              className="w-14 border rounded px-1.5 py-0.5 text-xs text-right font-normal focus:outline-none focus:ring-1 focus:ring-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <span className="text-xs font-normal" style={{ color: 'var(--color-text-muted)' }}>%</span>
          </div>
        </div>
      </div>

      {/* Fecha de entrega */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          Fecha de entrega <span className="text-brand-700">*</span>
        </label>
        <input
          type="date"
          min={fecha}
          value={fechaEntrega}
          onChange={e => setFechaEntrega(e.target.value)}
          disabled={confirmado}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--color-border)' }}
        />
      </div>

      {/* Observacion */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Observación</label>
        <textarea
          value={observacion}
          onChange={e => setObservacion(e.target.value)}
          disabled={confirmado}
          rows={3}
          placeholder="Notas o aclaraciones del pedido…"
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: 'var(--color-border)' }}
        />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <button
          onClick={() => {
            if (!fechaEntrega) {
              showToast('Ingresá la fecha de entrega antes de confirmar', 'error')
              return
            }
            setConfirmando(true)
          }}
          disabled={sending || confirmado}
          className="w-full bg-brand-800 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {confirmado ? 'Pedido confirmado ✓' : 'Confirmar y Enviar'}
        </button>
        <button
          onClick={handleDescargarPDF}
          disabled={!confirmado}
          className={`w-full border py-2 rounded-lg text-sm font-medium transition-colors ${confirmado ? 'bg-brand-50 border-brand-400 text-brand-800 hover:bg-brand-100 cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
          style={!confirmado ? { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' } : {}}
        >
          {pdfGenerated
            ? <span className="flex items-center justify-center gap-1"><Check size={14} />PDF descargado</span>
            : 'Descargar remito PDF'}
        </button>
        <button
          onClick={() => { if (confirmado) resetPedido(); navigate(confirmado ? '/' : '/pedido/nuevo') }}
          className="w-full bg-brand-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-700 transition-colors cursor-pointer"
        >
          {confirmado ? 'Volver al inicio' : 'Volver'}
        </button>
      </div>
    </div>
  )
}
