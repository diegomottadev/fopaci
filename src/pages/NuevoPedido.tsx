import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { ClienteCombobox } from '../components/ClienteCombobox'
import { usePedidoStore } from '../store/pedidoStore'
import { useUIStore } from '../store/uiStore'
import { useCatalogo } from '../hooks/useCatalogo'
import { useClientes } from '../hooks/useClientes'
import type { Producto, Categoria } from '../types'

function getClienteExtra(extra: Record<string, string>, key: string): string {
  const lkey = key.toLowerCase()
  const found = Object.keys(extra).find(k => k.toLowerCase() === lkey)
  return found ? extra[found] : ''
}

export default function NuevoPedido() {
  const navigate = useNavigate()
  const { clienteId } = useParams()
  const isEdit = !!clienteId

  // Store
  const cliente = usePedidoStore(s => s.cliente)
  const tipoPrecio = usePedidoStore(s => s.tipoPrecio)
  const items = usePedidoStore(s => s.items)
  const total = usePedidoStore(s => s.total)
  const setCliente = usePedidoStore(s => s.setCliente)
  const setTipoPrecio = usePedidoStore(s => s.setTipoPrecio)
  const addItem = usePedidoStore(s => s.addItem)
  const updateItem = usePedidoStore(s => s.updateItem)
  const removeItem = usePedidoStore(s => s.removeItem)
  const resetPedido = usePedidoStore(s => s.resetPedido)
  const showToast = useUIStore(s => s.showToast)

  // Local state
  const [clienteQuery, setClienteQuery] = useState('')
  const [catalogoSearch, setCatalogoSearch] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncingClientes, setSyncingClientes] = useState(false)

  // Hooks
  const { catalogo, loading: catalogoLoading, sync } = useCatalogo()
  const { clientes, loading: clientesLoading, sync: syncClientes } = useClientes(clienteQuery)

  // Filtered catalog
  const categorias = useMemo<Categoria[]>(
    () => catalogo
      .filter(p => p.codigo.length === 2)
      .map(p => ({ codigo: p.codigo, nombre: p.descripcion })),
    [catalogo]
  )

  const filteredCatalogo = useMemo(
    () => catalogo.filter(p => {
      if (p.codigo.length === 2) return false
      const matchCategoria = !categoriaSeleccionada || p.codigo.startsWith(categoriaSeleccionada)
      const matchTexto =
        p.descripcion.toLowerCase().includes(catalogoSearch.toLowerCase()) ||
        p.codigo.toLowerCase().includes(catalogoSearch.toLowerCase())
      return matchCategoria && matchTexto
    }),
    [catalogo, categoriaSeleccionada, catalogoSearch]
  )

  function getItemQuantity(codigo: string): number {
    return items.find(i => i.codigo === codigo)?.unidades ?? 0
  }

  function getPrecioUnitario(producto: Producto): number {
    return tipoPrecio === 'mayorista' ? producto.precioMayoristaUnidad : producto.precioPublicoUnidad
  }

  function handleAddItem(producto: Producto) {
    const precioUnitario = getPrecioUnitario(producto)
    addItem({
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      unidades: 1,
      precioUnitario,
      subtotal: precioUnitario,
    })
  }

  function handleUpdateUnidades(codigo: string, unidades: number) {
    if (unidades <= 0) {
      removeItem(codigo)
    } else {
      updateItem(codigo, { unidades })
    }
  }

  function handleContinuar() {
    if (!cliente) {
      showToast('Seleccioná un cliente', 'error')
      return
    }
    if (items.length === 0) {
      showToast('Agregá al menos un producto', 'error')
      return
    }
    navigate('/pedido/resumen')
  }

  function handleCancelar() {
    resetPedido()
    navigate('/')
  }

  return (
    <div className={`space-y-6${items.length > 0 ? ' pb-24' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={handleCancelar} className="text-brand-700 hover:text-brand-900 cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
          </h2>
        </div>
      </div>

      {/* Cliente search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Cliente</label>
          <button
            onClick={async () => {
              setSyncingClientes(true)
              try {
                await syncClientes()
                showToast('Clientes sincronizados', 'success')
              } catch {
                showToast('Error al sincronizar clientes', 'error')
              } finally {
                setSyncingClientes(false)
              }
            }}
            disabled={syncingClientes}
            className="text-xs text-brand-700 hover:text-brand-900 disabled:opacity-50 cursor-pointer"
          >
            {syncingClientes ? 'Sincronizando…' : 'Sincronizar'}
          </button>
        </div>

        {cliente ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div>
              <p className="font-medium text-gray-900">
                {cliente.nombre}
                {getClienteExtra(cliente.extra, 'nombre comercial') && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    {getClienteExtra(cliente.extra, 'nombre comercial')}
                  </span>
                )}
              </p>
              {getClienteExtra(cliente.extra, 'localidad') && (
                <p className="text-xs text-gray-500">{getClienteExtra(cliente.extra, 'localidad')}</p>
              )}
            </div>
            <button onClick={() => setCliente(null)} className="text-xs text-brand-700 hover:text-brand-900 cursor-pointer">
              Cambiar
            </button>
          </div>
        ) : (
          <ClienteCombobox
            query={clienteQuery}
            onQueryChange={setClienteQuery}
            clientes={clientes}
            loading={clientesLoading}
            onSelect={c => { setCliente(c); setClienteQuery('') }}
          />
        )}
      </div>

      {/* Tipo precio */}
      <div className="flex gap-2">
        {(['mayorista', 'publico'] as const).map(tipo => (
          <button
            key={tipo}
            onClick={() => setTipoPrecio(tipo)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
              ${tipoPrecio === tipo
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-white border-[var(--color-border)] hover:bg-brand-50'}`}
          style={tipoPrecio !== tipo ? { color: 'var(--color-text-muted)' } : {}}
          >
            {tipo === 'mayorista' ? 'Mayorista' : 'Público'}
          </button>
        ))}
      </div>

      {/* Catálogo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Catálogo</label>
          <button
            onClick={async () => {
              setSyncing(true)
              try {
                await sync()
                showToast('Catálogo sincronizado', 'success')
              } catch {
                showToast('Error al sincronizar el catálogo', 'error')
              } finally {
                setSyncing(false)
              }
            }}
            disabled={syncing}
            className="text-xs text-brand-700 hover:text-brand-900 disabled:opacity-50 cursor-pointer"
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar'}
          </button>
        </div>
        {!catalogoLoading && categorias.length > 0 && (
          <select
            value={categoriaSeleccionada ?? ''}
            onChange={e => setCategoriaSeleccionada(e.target.value || null)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800 bg-white"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat.codigo} value={cat.codigo}>{cat.nombre}</option>
            ))}
          </select>
        )}
        <input
          type="text"
          placeholder="Filtrar productos…"
          value={catalogoSearch}
          onChange={e => setCatalogoSearch(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-800"
          style={{ borderColor: 'var(--color-border)' }}
        />
        {catalogoLoading && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Cargando catálogo…</p>}
        <ul className="space-y-2">
          {filteredCatalogo.map(producto => {
            const qty = getItemQuantity(producto.codigo)
            const precio = getPrecioUnitario(producto)
            return (
              <li
                key={producto.codigo}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${
                  qty > 0 ? 'border-brand-200 bg-brand-50/60' : 'bg-white'
                }`}
                style={qty === 0 ? { borderColor: 'var(--color-border)' } : {}}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{producto.descripcion}</p>
                  <p className="text-xs text-gray-500">{producto.codigo} · ${precio.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {qty > 0 ? (
                    <>
                      <button
                        onClick={() => handleUpdateUnidades(producto.codigo, qty - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >−</button>
                      <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={e => {
                          const v = parseInt(e.target.value)
                          if (!isNaN(v) && v >= 1) handleUpdateUnidades(producto.codigo, v)
                        }}
                        onClick={e => (e.target as HTMLInputElement).select()}
                        className="w-12 text-center text-sm font-medium border rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-brand-800"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <button
                        onClick={() => handleUpdateUnidades(producto.codigo, qty + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >+</button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddItem(producto)}
                      className="text-xs bg-brand-800 text-white px-2 py-1 rounded-lg hover:bg-brand-900 cursor-pointer"
                    >
                      Agregar
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        {!catalogoLoading && filteredCatalogo.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--color-text-muted)' }}>
            Sin resultados
          </p>
        )}
      </div>

      {/* Order summary */}
      {items.length > 0 && (
        <div className="bg-brand-50 rounded-lg p-3 space-y-1 border border-brand-100">
          <p className="text-sm font-semibold text-brand-800">Pedido actual</p>
          {items.map(item => (
            <div key={item.codigo} className="flex justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span>{item.descripcion} × {item.unidades}</span>
              <span>${item.subtotal.toLocaleString('es-AR')}</span>
            </div>
          ))}
          <div className="border-t pt-1 flex justify-between font-semibold text-gray-900">
            <span>Total</span>
            <span>${total.toLocaleString('es-AR')}</span>
          </div>
        </div>
      )}

      {/* Sticky bottom CTA */}
      {items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                {items.length} producto{items.length !== 1 ? 's' : ''}
              </p>
              <p className="font-semibold text-gray-900 text-sm">${total.toLocaleString('es-AR')}</p>
            </div>
            <button
              onClick={handleContinuar}
              className="flex-1 bg-brand-800 text-white py-3 rounded-lg font-semibold hover:bg-brand-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
