import type { Producto, Cliente, PedidoHistorial, PedidoItem } from '../types'

// ─── Types ───────────────────────────────────────────────────────────────────

interface GvizCol { id: string; label: string; type: string }
interface GvizCell { v: string | number | null; f?: string }
interface GvizRow { c: (GvizCell | null)[] }
export interface GvizTable { cols: GvizCol[]; rows: GvizRow[] }
interface GvizResponse { table: GvizTable }

// ─── Core ─────────────────────────────────────────────────────────────────────

export function buildGvizUrl(sheetId: string, tabName?: string): string {
  const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json`
  return tabName ? `${base}&sheet=${encodeURIComponent(tabName)}` : base
}

export function parseGviz(raw: string): GvizResponse {
  const json = raw
    .replace(/^\s*\/\*O_o\*\/\s*/, '')
    .replace(/^google\.visualization\.Query\.setResponse\(/, '')
    .replace(/\);\s*$/, '')
  return JSON.parse(json) as GvizResponse
}

function cellValue(row: GvizRow, index: number): string {
  const cell = row.c[index]
  if (!cell || cell.v === null || cell.v === undefined) return ''
  return String(cell.v)
}

// gviz returns date cells as "Date(year,month0,day)" — normalize to YYYY-MM-DD
function cellDate(row: GvizRow, index: number): string {
  const raw = cellValue(row, index)
  const match = raw.match(/^Date\((\d+),(\d+),(\d+)\)$/)
  if (match) {
    const y = match[1]
    const m = String(parseInt(match[2]) + 1).padStart(2, '0')
    const d = match[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return raw.slice(0, 10)
}

function cellNumber(row: GvizRow, index: number): number {
  const cell = row.c[index]
  if (!cell || cell.v === null || cell.v === undefined) return 0
  return Number(cell.v)
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

export function mapProducto(row: GvizRow, _cols: GvizCol[]): Producto {
  return {
    codigo: cellValue(row, 0),
    descripcion: cellValue(row, 1),
    bulto: parseInt(cellValue(row, 3)) || 0,  // col D: "6 X 220" → 6
    precioMayoristaUnidad: cellNumber(row, 4), // col E
    precioMayoristaBulto: cellNumber(row, 5),  // col F
    precioPublicoUnidad: cellNumber(row, 7),   // col H (G vacío)
    precioPublicoBulto: cellNumber(row, 8),    // col I
  }
}

const NOMBRE_ALIASES = ['nombre', 'razon social', 'razón social', 'cliente']
const DNI_ALIASES = ['dni', 'nro. de documento', 'nro de documento', 'nro documento', 'numero de documento', 'número de documento']
const CUIL_ALIASES = ['cuil', 'cuit']
const CODIGO_ALIASES = ['codigo', 'código', 'cod', 'id']

function findColIndex(cols: GvizCol[], aliases: string[]): number {
  return cols.findIndex(c => aliases.includes(c.label.trim().toLowerCase()))
}

export function mapCliente(row: GvizRow, cols: GvizCol[], rowIndex: number): Cliente {
  const nombreIdx = findColIndex(cols, NOMBRE_ALIASES)
  const dniIdx = findColIndex(cols, DNI_ALIASES)
  const cuilIdx = findColIndex(cols, CUIL_ALIASES)
  const codigoIdx = findColIndex(cols, CODIGO_ALIASES)

  const knownIndexes = new Set([nombreIdx, dniIdx, cuilIdx, codigoIdx].filter(i => i >= 0))
  const extra: Record<string, string> = {}
  cols.forEach((col, i) => {
    if (!knownIndexes.has(i)) extra[col.label] = cellValue(row, i)
  })

  return {
    rowIndex,
    nombre: nombreIdx >= 0 ? cellValue(row, nombreIdx) : '',
    ...(dniIdx >= 0 && { dni: cellValue(row, dniIdx) }),
    ...(cuilIdx >= 0 && { cuil: cellValue(row, cuilIdx) }),
    ...(codigoIdx >= 0 && { codigo: cellValue(row, codigoIdx) }),
    extra,
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchGviz(url: string): Promise<GvizTable> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const text = await res.text()
  return parseGviz(text).table
}

export async function fetchCatalogo(): Promise<Producto[]> {
  const base = buildGvizUrl(import.meta.env.VITE_SHEET_CATALOGO, 'Catálogo')
  const table = await fetchGviz(`${base}&headers=2`)
  return table.rows
    .map(row => mapProducto(row, table.cols))
    .filter(p => Boolean(p.codigo) && (p.codigo.length <= 2 || p.precioMayoristaUnidad > 0))
}

export interface VendedorInfo {
  nombre: string
  dni: string
}

export async function fetchVendedoresList(): Promise<VendedorInfo[]> {
  const url = buildGvizUrl(import.meta.env.VITE_SHEET_VENDEDORES, 'Vendedores')
  const table = await fetchGviz(url)
  return table.rows.map(row => ({
    nombre: [cellValue(row, 0), cellValue(row, 1)].filter(Boolean).join(' '),
    dni: cellValue(row, 2),
  })).filter(v => Boolean(v.nombre))
}

export async function fetchVendedores(): Promise<string[]> {
  const lista = await fetchVendedoresList()
  return lista.map(v => v.nombre)
}

function matchWords(text: string, query: string): boolean {
  const t = text.toLowerCase()
  return query.toLowerCase().trim().split(/\s+/).every(w => t.includes(w))
}

function getExtraField(extra: Record<string, string>, key: string): string {
  const lkey = key.toLowerCase()
  const found = Object.keys(extra).find(k => k.toLowerCase() === lkey)
  return found ? extra[found] : ''
}

export const buscarEnClientePublic = (c: Cliente, q: string): boolean => {
  const trimmed = q.trim()
  if (!trimmed) return false
  const nombreComercial = getExtraField(c.extra, 'nombre comercial')
  return (
    matchWords(c.nombre, trimmed) ||
    (nombreComercial ? matchWords(nombreComercial, trimmed) : false) ||
    (c.dni ?? '').includes(trimmed) ||
    (c.cuil ?? '').replace(/[-\s]/g, '').includes(trimmed.replace(/[-\s]/g, '')) ||
    (c.codigo ?? '').toLowerCase().includes(trimmed.toLowerCase())
  )
}

export async function fetchAllClientes(): Promise<Cliente[]> {
  const url = buildGvizUrl(import.meta.env.VITE_SHEET_CLIENTES, 'Clientes')
  const table = await fetchGviz(url)
  return table.rows.map((row, i) => mapCliente(row, table.cols, i))
}

export async function fetchClientes(query: string): Promise<Cliente[]> {
  const all = await fetchAllClientes()
  if (!query.trim()) return []
  return all.filter(c => buscarEnClientePublic(c, query.trim()))
}

export async function fetchPedidos(): Promise<PedidoHistorial[]> {
  const base = buildGvizUrl(import.meta.env.VITE_SHEET_PEDIDOS, 'Pedidos')
  const tq = encodeURIComponent('SELECT * ORDER BY A DESC LIMIT 200')
  const url = `${base}&tq=${tq}`
  const table = await fetchGviz(url)

  const map = new Map<string, PedidoHistorial>()

  table.rows.forEach(row => {
    const pedidoId = cellValue(row, 14)
    if (!pedidoId) return

    const item: PedidoItem = {
      codigo: cellValue(row, 4),
      descripcion: cellValue(row, 5),
      unidades: cellNumber(row, 6),
      precioUnitario: cellNumber(row, 7),
      descuento: cellNumber(row, 8) || undefined,
      subtotal: cellNumber(row, 9),
    }

    if (map.has(pedidoId)) {
      map.get(pedidoId)!.items.push(item)
    } else {
      map.set(pedidoId, {
        pedidoId,
        fecha: cellDate(row, 0),
        vendedor: cellValue(row, 1),
        cliente: cellValue(row, 2),
        nombreComercial: cellValue(row, 15) || undefined,
        dniCuilCodigo: cellValue(row, 3),
        items: [item],
        total: cellNumber(row, 11),
        estado: cellValue(row, 12) as PedidoHistorial['estado'],
        descuentoGeneral: cellNumber(row, 10) || undefined,
        observacion: cellValue(row, 13) || undefined,
      })
    }
  })

  return Array.from(map.values())
}
