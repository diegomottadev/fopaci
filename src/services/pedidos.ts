// src/services/pedidos.ts
import type { WebhookPayload } from '../types'

/**
 * Sends a WebhookPayload to the configured Google Apps Script endpoint.
 *
 * Uses GET with URL params instead of POST — Apps Script's exec URL issues a
 * 302 redirect on POST, which causes browsers to drop the body before doPost
 * is reached. GET requests go through directly; doGet in Code.gs handles writes.
 */
export async function enviarPedido(payload: WebhookPayload): Promise<void> {
  // Read at call time so vi.stubEnv works correctly in tests
  const webhookUrl = import.meta.env.VITE_WEBHOOK_PEDIDOS

  if (!webhookUrl || webhookUrl === 'PENDIENTE') {
    throw new Error('Webhook no configurado')
  }

  const url = new URL(webhookUrl)
  url.searchParams.set('action', payload.action)
  url.searchParams.set('pedido', JSON.stringify(payload.pedido))

  await fetch(url.toString(), { mode: 'no-cors' })
}
