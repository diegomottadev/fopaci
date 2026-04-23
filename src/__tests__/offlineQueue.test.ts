import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import type { WebhookPayload, Producto } from '../types'
import {
  resetDB,
  addPendingOrder,
  getAllPendingOrders,
  removePendingOrder,
  countPendingOrders,
  saveCatalogo,
  getCatalogo,
  saveVendedores,
  getVendedores,
} from '../db/offlineQueue'

const mockPayload: WebhookPayload = {
  action: 'crear',
  pedido: {
    pedidoId: 'test-uuid-1',
    fecha: '2026-04-12',
    vendedor: 'Ana',
    cliente: 'Vinoteca Pepe',
    dniCuilCodigo: '20-12345678-9',
    items: [{ codigo: 'VT001', descripcion: 'Malbec', unidades: 2, precioUnitario: 1500, subtotal: 3000 }],
    total: 3000,
    estado: 'Pendiente',
  },
}

const mockPayload2: WebhookPayload = {
  action: 'crear',
  pedido: {
    pedidoId: 'test-uuid-2',
    fecha: '2026-04-13',
    vendedor: 'Carlos',
    cliente: 'Bodega Norte',
    dniCuilCodigo: '20-98765432-1',
    items: [{ codigo: 'VT002', descripcion: 'Cabernet', unidades: 1, precioUnitario: 2000, subtotal: 2000 }],
    total: 2000,
    estado: 'Pendiente',
  },
}

beforeEach(async () => {
  await resetDB()
})

afterAll(async () => {
  await resetDB()
})

describe('pending-orders store', () => {
  it('addPendingOrder adds a payload to the store', async () => {
    await addPendingOrder(mockPayload)
    const all = await getAllPendingOrders()
    expect(all).toHaveLength(1)
    expect(all[0]).toEqual(mockPayload)
  })

  it('getAllPendingOrders returns all pending orders', async () => {
    await addPendingOrder(mockPayload)
    await addPendingOrder(mockPayload2)
    const all = await getAllPendingOrders()
    expect(all).toHaveLength(2)
  })

  it('removePendingOrder removes by pedidoId', async () => {
    await addPendingOrder(mockPayload)
    await addPendingOrder(mockPayload2)
    await removePendingOrder('test-uuid-1')
    const all = await getAllPendingOrders()
    expect(all).toHaveLength(1)
    expect(all[0].pedido.pedidoId).toBe('test-uuid-2')
  })

  it('addPendingOrder is idempotent — same pedidoId replaces existing', async () => {
    await addPendingOrder(mockPayload)
    const updated = { ...mockPayload, pedido: { ...mockPayload.pedido, total: 9999 } }
    await addPendingOrder(updated)
    const all = await getAllPendingOrders()
    expect(all).toHaveLength(1)
    expect(all[0].pedido.total).toBe(9999)
  })

  it('countPendingOrders returns correct count', async () => {
    await addPendingOrder(mockPayload)
    await addPendingOrder(mockPayload2)
    expect(await countPendingOrders()).toBe(2)
    await removePendingOrder('test-uuid-1')
    expect(await countPendingOrders()).toBe(1)
  })
})

describe('catalogo store', () => {
  it('saveCatalogo and getCatalogo round-trips', async () => {
    const productos: Producto[] = [
      {
        codigo: 'VT001',
        descripcion: 'Malbec',
        bulto: 12,
        precioMayoristaUnidad: 1200,
        precioMayoristaBulto: 14400,
        precioPublicoUnidad: 1500,
        precioPublicoBulto: 18000,
      },
    ]
    await saveCatalogo(productos)
    const result = await getCatalogo()
    expect(result).toEqual(productos)
  })

  it('getCatalogo returns undefined when empty', async () => {
    const result = await getCatalogo()
    expect(result).toBeUndefined()
  })
})

describe('vendedores store', () => {
  it('saveVendedores and getVendedores round-trips', async () => {
    await saveVendedores(['Ana', 'Carlos'])
    const result = await getVendedores()
    expect(result).toEqual(['Ana', 'Carlos'])
  })
})
