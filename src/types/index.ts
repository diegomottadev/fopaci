// src/types/index.ts

export type TipoPrecio = 'mayorista' | 'publico'

export interface Producto {
  codigo: string
  descripcion: string
  bulto: number
  precioMayoristaUnidad: number
  precioMayoristaBulto: number
  precioPublicoUnidad: number
  precioPublicoBulto: number
}

export interface Cliente {
  rowIndex: number        // gviz row index (used as URL :clienteId)
  nombre: string
  dni?: string
  cuil?: string
  codigo?: string
  extra: Record<string, string>
}

export interface PedidoItem {
  codigo: string
  descripcion: string
  unidades: number
  precioUnitario: number
  descuento?: number   // percentage 0-100, undefined = 0
  subtotal: number
}

export interface WebhookPayload {
  action: 'crear' | 'editar' | 'cancelar'
  pedido: {
    pedidoId: string
    fecha: string           // "YYYY-MM-DD"
    vendedor: string
    cliente: string
    nombreComercial?: string
    dniCuilCodigo: string
    items: PedidoItem[]
    total: number
    estado: 'Pendiente' | 'Cancelado' | 'A cobrar' | 'Finalizado'
    descuentoGeneral?: number  // percentage 0-100, undefined = 0
    observacion?: string
  }
}

export interface PedidoHistorial {
  pedidoId: string
  fecha: string
  vendedor: string
  cliente: string
  nombreComercial?: string
  dniCuilCodigo: string
  items: PedidoItem[]
  total: number
  estado: 'Pendiente' | 'Cancelado' | 'A cobrar' | 'Finalizado'
  descuentoGeneral?: number
  observacion?: string
  isPending?: boolean    // true if still in pending-orders queue
}

export interface Categoria {
  codigo: string
  nombre: string
}
