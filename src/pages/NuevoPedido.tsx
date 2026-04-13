import { useMemo, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePedidoStore } from '../store/pedidoStore'
import { useUIStore } from '../store/uiStore'
import { useCatalogo } from '../hooks/useCatalogo'
import { useClientes } from '../hooks/useClientes'
import type { Producto } from '../types'
import { CategoriaPills } from '../components/CategoriaPills'
import type { Categoria } from '../types'

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

  // Hooks
  const { catalogo, loading: catalogoLoading } = useCatalogo()
  const { clientes, loading: clientesLoading } = useClientes(clienteQuery)

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
        <h2 className="text-xl font-bold text-gray-900">
          {isEdit ? 'Editar Pedido' : 'Nuevo Pedido'}
        </h2>
        <button onClick={handleCancelar} className="text-sm text-gray-500 hover:text-gray-700">
          Cancelar
        </button>
      </div>

      {/* Cliente search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Cliente</label>

        {cliente ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div>
              <p className="font-medium text-gray-900">{cliente.nombre}</p>
              {(cliente.cuil || cliente.dni) && (
                <p className="text-xs text-gray-500">{cliente.cuil ?? cliente.dni}</p>
              )}
            </div>
            <button onClick={() => setCliente(null)} className="text-xs text-red-600 hover:text-red-800">
              Cambiar
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <input
              type="text"
              placeholder="Buscar por nombre, CUIT o código…"
              value={clienteQuery}
              onChange={e => setClienteQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
            />
            {clientesLoading && <p className="text-xs text-gray-500">Buscando…</p>}
            {clientes.length > 0 && (
              <ul className="border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
                {clientes.map(c => (
                  <li key={c.rowIndex}>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                      onClick={() => { setCliente(c); setClienteQuery('') }}
                    >
                      <span className="font-medium">{c.nombre}</span>
                      {(c.cuil || c.dni) && <span className="text-gray-500 ml-2 text-xs">{c.cuil ?? c.dni}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                ? 'bg-red-800 text-white border-red-800'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
          >
            {tipo === 'mayorista' ? 'Mayorista' : 'Público'}
          </button>
        ))}
      </div>

      {/* Catálogo */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Catálogo</label>
        {!catalogoLoading && (
          <CategoriaPills
            categorias={categorias}
            seleccionada={categoriaSeleccionada}
            onSelect={setCategoriaSeleccionada}
          />
        )}
        <input
          type="text"
          placeholder="Filtrar productos…"
          value={catalogoSearch}
          onChange={e => setCatalogoSearch(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-800"
        />
        {catalogoLoading && <p className="text-sm text-gray-500">Cargando catálogo…</p>}
        <ul className="space-y-2">
          {filteredCatalogo.map(producto => {
            const qty = getItemQuantity(producto.codigo)
            const precio = getPrecioUnitario(producto)
            return (
              <li
                key={producto.codigo}
                className={`flex items-center justify-between rounded-lg px-3 py-2 border transition-colors ${
                  qty > 0 ? 'border-red-200 bg-red-50/40' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{producto.descripcion}</p>
                  <p className="text-xs text-gray-500">{producto.codigo} · ${precio.toLocaleString('es-AR')}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {qty > 0 ? (
                    <>
                      <button
                        onClick={() => handleUpdateUnidades(producto.codigo, qty - 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >−</button>
                      <span className="w-6 text-center text-sm font-medium">{qty}</span>
                      <button
                        onClick={() => handleUpdateUnidades(producto.codigo, qty + 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                      >+</button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleAddItem(producto)}
                      className="text-xs bg-red-800 text-white px-2 py-1 rounded-lg hover:bg-red-900"
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
        <div className="bg-gray-100 rounded-lg p-3 space-y-1">
          <p className="text-sm font-semibold text-gray-700">Pedido actual</p>
          {items.map(item => (
            <div key={item.codigo} className="flex justify-between text-sm text-gray-600">
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
              className="flex-1 bg-red-800 text-white py-3 rounded-lg font-semibold hover:bg-red-900 transition-colors flex items-center justify-center gap-1"
            >
              Continuar <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
