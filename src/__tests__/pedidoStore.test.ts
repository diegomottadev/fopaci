import { describe, it, expect, beforeEach } from 'vitest'
import { usePedidoStore } from '../store/pedidoStore'
import type { Cliente, PedidoItem } from '../types'

const mockCliente: Cliente = {
  rowIndex: 1,
  nombre: 'Vinoteca Pepe',
  dni: '12345678',
  extra: {},
}

const mockItem: PedidoItem = {
  codigo: 'VT001',
  descripcion: 'Malbec',
  unidades: 2,
  precioUnitario: 1500,
  subtotal: 3000,
}

const mockItem2: PedidoItem = {
  codigo: 'VT002',
  descripcion: 'Cabernet',
  unidades: 1,
  precioUnitario: 2000,
  subtotal: 2000,
}

describe('pedidoStore', () => {
  beforeEach(() => {
    usePedidoStore.setState({
      pedidoId: 'test-initial-id',
      vendedor: '',
      cliente: null,
      tipoPrecio: 'mayorista',
      items: [],
      total: 0,
    })
  })

  it('setVendedor updates vendedor', () => {
    usePedidoStore.getState().setVendedor('Ana')
    expect(usePedidoStore.getState().vendedor).toBe('Ana')
  })

  it('setCliente updates cliente', () => {
    usePedidoStore.getState().setCliente(mockCliente)
    expect(usePedidoStore.getState().cliente).toEqual(mockCliente)
  })

  it('setTipoPrecio updates tipoPrecio', () => {
    usePedidoStore.getState().setTipoPrecio('publico')
    expect(usePedidoStore.getState().tipoPrecio).toBe('publico')
  })

  it('addItem adds an item and updates total', () => {
    usePedidoStore.getState().addItem(mockItem)
    const state = usePedidoStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.total).toBe(3000)
  })

  it('addItem replaces existing item with same codigo', () => {
    usePedidoStore.getState().addItem(mockItem)
    const replacedItem: PedidoItem = {
      codigo: 'VT001',
      descripcion: 'Malbec Reserve',
      unidades: 4,
      precioUnitario: 1500,
      subtotal: 6000,
    }
    usePedidoStore.getState().addItem(replacedItem)
    const state = usePedidoStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.total).toBe(6000)
  })

  it('updateItem recalculates subtotal and total', () => {
    usePedidoStore.getState().addItem(mockItem)
    usePedidoStore.getState().updateItem('VT001', { unidades: 5 })
    const state = usePedidoStore.getState()
    const item = state.items.find(i => i.codigo === 'VT001')
    expect(item?.subtotal).toBe(5 * 1500)
    expect(state.total).toBe(5 * 1500)
  })

  it('removeItem removes by codigo and updates total', () => {
    usePedidoStore.getState().addItem(mockItem)
    usePedidoStore.getState().addItem(mockItem2)
    usePedidoStore.getState().removeItem('VT001')
    const state = usePedidoStore.getState()
    expect(state.items).toHaveLength(1)
    expect(state.total).toBe(2000)
  })

  it('removeItem with unknown codigo leaves state unchanged', () => {
    usePedidoStore.getState().addItem(mockItem)
    usePedidoStore.getState().removeItem('DOES_NOT_EXIST')
    expect(usePedidoStore.getState().items).toHaveLength(1)
  })

  it('updateItem with unknown codigo leaves state unchanged', () => {
    usePedidoStore.getState().addItem(mockItem)
    usePedidoStore.getState().updateItem('DOES_NOT_EXIST', { unidades: 99 })
    const item = usePedidoStore.getState().items.find(i => i.codigo === 'VT001')
    expect(item?.unidades).toBe(2)
  })

  it('resetPedido preserves vendedor and resets everything else', () => {
    usePedidoStore.getState().setVendedor('Ana')
    usePedidoStore.getState().setCliente(mockCliente)
    usePedidoStore.getState().addItem(mockItem)
    const oldPedidoId = usePedidoStore.getState().pedidoId

    usePedidoStore.getState().resetPedido()

    const state = usePedidoStore.getState()
    expect(state.vendedor).toBe('Ana')
    expect(state.cliente).toBeNull()
    expect(state.items).toEqual([])
    expect(state.total).toBe(0)
    expect(state.tipoPrecio).toBe('mayorista')
    expect(state.pedidoId).not.toBe(oldPedidoId)
  })
})
