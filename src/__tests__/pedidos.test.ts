import { describe, it, expect, vi, afterEach } from 'vitest'
import { enviarPedido } from '../services/pedidos'
import type { WebhookPayload } from '../types'

const mockPayload: WebhookPayload = {
  action: 'crear',
  pedido: {
    pedidoId: 'test-uuid-1',
    fecha: '2026-04-13',
    vendedor: 'Ana',
    cliente: 'Vinoteca Pepe',
    dniCuilCodigo: '20-12345678-9',
    items: [
      {
        codigo: 'VT001',
        descripcion: 'Malbec',
        unidades: 2,
        precioUnitario: 1500,
        subtotal: 3000,
      },
    ],
    total: 3000,
    estado: 'Pendiente',
  },
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('enviarPedido', () => {
  it('throws if WEBHOOK_URL is PENDIENTE', async () => {
    vi.stubEnv('VITE_WEBHOOK_PEDIDOS', 'PENDIENTE')
    await expect(enviarPedido(mockPayload)).rejects.toThrow('Webhook no configurado')
  })

  it('throws if WEBHOOK_URL is falsy (empty)', async () => {
    vi.stubEnv('VITE_WEBHOOK_PEDIDOS', '')
    await expect(enviarPedido(mockPayload)).rejects.toThrow('Webhook no configurado')
  })

  it('POSTs to the webhook URL without Content-Type header', async () => {
    vi.stubEnv('VITE_WEBHOOK_PEDIDOS', 'https://script.google.com/macros/s/FAKE_ID/exec')
    const mockFetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', mockFetch)

    await enviarPedido(mockPayload)

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://script.google.com/macros/s/FAKE_ID/exec')
    expect(options.method).toBe('POST')
    expect(options.body).toBe(JSON.stringify(mockPayload))
    // Critical: NO Content-Type header to avoid CORS preflight
    const headers = options.headers ?? {}
    const headerKeys = Object.keys(headers).map((k: string) => k.toLowerCase())
    expect(headerKeys).not.toContain('content-type')
  })

  it('throws on non-ok response', async () => {
    vi.stubEnv('VITE_WEBHOOK_PEDIDOS', 'https://script.google.com/macros/s/FAKE_ID/exec')
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    vi.stubGlobal('fetch', mockFetch)

    await expect(enviarPedido(mockPayload)).rejects.toThrow('HTTP 500')
  })
})
