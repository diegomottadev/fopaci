import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuidv4 } from 'uuid'
import type { Cliente, TipoPrecio, PedidoItem, PedidoHistorial } from '../types'

const DEFAULT_TIPO_PRECIO: TipoPrecio = 'mayorista'

export interface PedidoState {
  pedidoId: string
  vendedor: string
  vendedorDni: string
  cliente: Cliente | null
  tipoPrecio: TipoPrecio
  items: PedidoItem[]
  total: number
  isEditing: boolean
  editObservacion: string
  editFechaEntrega: string
  editDescuentoGeneral: number

  setVendedor: (nombre: string, dni?: string) => void
  setCliente: (c: Cliente | null) => void
  setTipoPrecio: (t: TipoPrecio) => void
  addItem: (item: PedidoItem) => void
  updateItem: (codigo: string, changes: Partial<Pick<PedidoItem, 'unidades' | 'precioUnitario'>>) => void
  removeItem: (codigo: string) => void
  resetPedido: () => void
  loadForEdit: (pedido: PedidoHistorial) => void
}

const calcTotal = (items: PedidoItem[]): number =>
  items.reduce((acc, i) => acc + i.subtotal, 0)

export const usePedidoStore = create<PedidoState>()(
  persist(
    (set) => ({
      pedidoId: uuidv4(),
      vendedor: '',
      vendedorDni: '',
      cliente: null,
      tipoPrecio: 'mayorista',
      items: [],
      total: 0,
      isEditing: false,
      editObservacion: '',
      editFechaEntrega: '',
      editDescuentoGeneral: 0,

      setVendedor: (nombre, dni = '') => set({ vendedor: nombre, vendedorDni: dni }),

      setCliente: (c) => set({ cliente: c }),

      setTipoPrecio: (t) => set({ tipoPrecio: t }),

      addItem: (item) =>
        set((state) => {
          const normalized = { ...item, subtotal: item.unidades * item.precioUnitario }
          const exists = state.items.some((i) => i.codigo === normalized.codigo)
          const items = exists
            ? state.items.map((i) => (i.codigo === normalized.codigo ? normalized : i))
            : [...state.items, normalized]
          return { items, total: calcTotal(items) }
        }),

      updateItem: (codigo, changes) =>
        set((state) => {
          const items = state.items.map((i) => {
            if (i.codigo !== codigo) return i
            const unidades = changes.unidades ?? i.unidades
            const precioUnitario = changes.precioUnitario ?? i.precioUnitario
            return { ...i, unidades, precioUnitario, subtotal: unidades * precioUnitario }
          })
          return { items, total: calcTotal(items) }
        }),

      removeItem: (codigo) =>
        set((state) => {
          const items = state.items.filter((i) => i.codigo !== codigo)
          return { items, total: calcTotal(items) }
        }),

      resetPedido: () =>
        set((state) => ({
          pedidoId: uuidv4(),
          cliente: null,
          tipoPrecio: DEFAULT_TIPO_PRECIO,
          items: [],
          total: 0,
          vendedor: state.vendedor,
          isEditing: false,
          editObservacion: '',
          editFechaEntrega: '',
          editDescuentoGeneral: 0,
        })),

      loadForEdit: (pedido) =>
        set((state) => ({
          pedidoId: pedido.pedidoId,
          vendedor: pedido.vendedor || state.vendedor,
          cliente: {
            rowIndex: -1,
            nombre: pedido.cliente,
            ...(pedido.dniCuilCodigo ? { cuil: pedido.dniCuilCodigo } : {}),
            extra: (pedido.nombreComercial
              ? { 'nombre comercial': pedido.nombreComercial }
              : {}) as Record<string, string>,
          },
          tipoPrecio: DEFAULT_TIPO_PRECIO,
          items: [...pedido.items],
          total: pedido.total,
          isEditing: true,
          editObservacion: pedido.observacion ?? '',
          editFechaEntrega: pedido.fechaEntrega ?? '',
          editDescuentoGeneral: pedido.descuentoGeneral ?? 0,
        })),
    }),
    {
      name: 'vinoteca-vendedor',
      partialize: (state) => ({ vendedor: state.vendedor, vendedorDni: state.vendedorDni }),
    }
  )
)
