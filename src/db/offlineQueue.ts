import { openDB, deleteDB, type IDBPDatabase, type DBSchema } from 'idb'
import type { WebhookPayload, Producto, Cliente } from '../types'
import type { VendedorInfo } from '../services/sheets'

interface VinotecaDB extends DBSchema {
  'pending-orders': { key: string; value: WebhookPayload }
  'catalogo': { key: string; value: Producto[] }
  'vendedores': { key: string; value: string[] }
  'vendedores-info': { key: string; value: VendedorInfo[] }
  'clientes': { key: string; value: Cliente[] }
}

const DB_NAME = 'vinoteca-db'
const DB_VERSION = 3

const STORE_PENDING = 'pending-orders'
const STORE_CATALOGO = 'catalogo'
const STORE_VENDEDORES = 'vendedores'
const STORE_CLIENTES = 'clientes'

let db: Promise<IDBPDatabase<VinotecaDB>> | null = null

/**
 * Reset the singleton and wipe the database.
 * Self-contained: closes the connection, deletes the DB, nulls the singleton.
 * Works with the real browser indexedDB and with fake-indexeddb in tests.
 */
export async function resetDB(): Promise<void> {
  if (db) {
    try { (await db).close() } catch { /* ignore */ }
    db = null
  }
  await deleteDB(DB_NAME)
}

export async function openVinotecaDB(): Promise<IDBPDatabase<VinotecaDB>> {
  if (!db) {
    db = openDB<VinotecaDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(STORE_PENDING)) {
          database.createObjectStore(STORE_PENDING, { keyPath: 'pedido.pedidoId' })
        }
        if (!database.objectStoreNames.contains(STORE_CATALOGO)) {
          database.createObjectStore(STORE_CATALOGO)
        }
        if (!database.objectStoreNames.contains(STORE_VENDEDORES)) {
          database.createObjectStore(STORE_VENDEDORES)
        }
        if (!database.objectStoreNames.contains(STORE_CLIENTES)) {
          database.createObjectStore(STORE_CLIENTES)
        }
        if (!database.objectStoreNames.contains('vendedores-info')) {
          database.createObjectStore('vendedores-info')
        }
      },
    })
  }
  return db
}

// --- Pending orders ---

export async function addPendingOrder(payload: WebhookPayload): Promise<void> {
  if (!payload.pedido.pedidoId) throw new Error('addPendingOrder: pedidoId is required')
  const database = await openVinotecaDB()
  await database.put(STORE_PENDING, payload)
}

export async function getAllPendingOrders(): Promise<WebhookPayload[]> {
  const database = await openVinotecaDB()
  return database.getAll(STORE_PENDING)
}

export async function removePendingOrder(pedidoId: string): Promise<void> {
  const database = await openVinotecaDB()
  await database.delete(STORE_PENDING, pedidoId)
}

export async function countPendingOrders(): Promise<number> {
  const database = await openVinotecaDB()
  return database.count(STORE_PENDING)
}

// --- Catalog cache ---

export async function saveCatalogo(productos: Producto[]): Promise<void> {
  const database = await openVinotecaDB()
  await database.put(STORE_CATALOGO, productos, 'data')
}

export async function getCatalogo(): Promise<Producto[] | undefined> {
  const database = await openVinotecaDB()
  return database.get(STORE_CATALOGO, 'data')
}

// --- Vendedores cache ---

export async function saveVendedores(vendedores: string[]): Promise<void> {
  const database = await openVinotecaDB()
  await database.put(STORE_VENDEDORES, vendedores, 'data')
}

export async function getVendedores(): Promise<string[] | undefined> {
  const database = await openVinotecaDB()
  return database.get(STORE_VENDEDORES, 'data')
}

// --- Clientes cache ---

export async function saveClientes(clientes: Cliente[]): Promise<void> {
  const database = await openVinotecaDB()
  await database.put(STORE_CLIENTES, clientes, 'data')
}

export async function getCachedClientes(): Promise<Cliente[] | undefined> {
  const database = await openVinotecaDB()
  return database.get(STORE_CLIENTES, 'data')
}

// --- Vendedores info cache (name + DNI) ---

export async function saveVendedoresInfo(vendedores: VendedorInfo[]): Promise<void> {
  const database = await openVinotecaDB()
  await database.put('vendedores-info', vendedores, 'data')
}

export async function getCachedVendedoresInfo(): Promise<VendedorInfo[] | undefined> {
  const database = await openVinotecaDB()
  return database.get('vendedores-info', 'data')
}
