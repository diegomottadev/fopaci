import { jsPDF } from 'jspdf'
import type { WebhookPayload } from '../types'
import { formatCurrency, formatDate } from '../utils/format'

async function loadLogoDataUrl(): Promise<string> {
  const response = await fetch(`${import.meta.env.BASE_URL}fopaci-logo.webp`)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(blob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject() }
    img.src = objectUrl
  })
}

export async function generateRemitoPDF(payload: WebhookPayload): Promise<void> {
  const doc = new jsPDF()
  const { pedido } = payload

  // Logo — top-left, rectangular
  try {
    const logoDataUrl = await loadLogoDataUrl()
    doc.addImage(logoDataUrl, 'PNG', 10, 8, 52, 18)
  } catch {
    // continue without logo if it fails to load
  }

  // Dates — top-right, aligned with logo
  doc.setFontSize(10)
  doc.text(`Fecha: ${formatDate(pedido.fecha)}`, 150, 15)
  if (pedido.fechaEntrega) {
    doc.text(`Entrega: ${formatDate(pedido.fechaEntrega)}`, 150, 21)
  }

  let y = 34

  // Title
  doc.setFontSize(14)
  doc.text('REMITO', 10, y)
  doc.setFontSize(10)

  y += 10

  // Header info
  doc.text(`Vendedor: ${pedido.vendedor}`, 10, y)
  y += 7
  doc.text(`Cliente:  ${pedido.cliente}`, 10, y)
  y += 7
  if (pedido.nombreComercial) {
    doc.text(`Comercio: ${pedido.nombreComercial}`, 10, y)
    y += 7
  }
  doc.text(`DNI/CUIT: ${pedido.dniCuilCodigo}`, 10, y)
  y += 7
  doc.text(`Pedido #: ${pedido.pedidoId}`, 10, y)
  y += 7

  // Separator
  doc.line(10, y, 200, y)
  y += 7

  const hasItemDiscounts = pedido.items.some(i => (i.descuento ?? 0) > 0)

  // Column headers
  doc.text('Código', 10, y)
  doc.text('Descripción', 35, y)
  doc.text('Unid.', 105, y)
  doc.text('Precio', 125, y)
  if (hasItemDiscounts) doc.text('Desc.%', 150, y)
  doc.text('Subtotal', 170, y)
  y += 4

  // Separator
  doc.line(10, y, 200, y)
  y += 7

  // Items
  for (const item of pedido.items) {
    doc.text(item.codigo, 10, y)
    doc.text(item.descripcion, 35, y)
    doc.text(String(item.unidades), 105, y)
    doc.text(formatCurrency(item.precioUnitario), 125, y)
    if (hasItemDiscounts) doc.text(`${item.descuento ?? 0}%`, 150, y)
    doc.text(formatCurrency(item.subtotal), 170, y)
    y += 7
  }

  // Separator
  doc.line(10, y, 200, y)
  y += 7

  // Total
  if ((pedido.descuentoGeneral ?? 0) > 0) {
    const subtotalSinDesc = pedido.items.reduce((acc, i) => acc + i.subtotal, 0)
    doc.text(`Subtotal: ${formatCurrency(subtotalSinDesc)}`, 125, y)
    y += 6
    doc.text(`Desc. general: ${pedido.descuentoGeneral}%`, 125, y)
    y += 6
  }
  doc.setFont('helvetica', 'bold')
  doc.text(`Total: ${formatCurrency(pedido.total)}`, 125, y)
  doc.setFont('helvetica', 'normal')

  if (pedido.observacion) {
    y += 10
    doc.text('Observación:', 10, y)
    y += 6
    const lines = pedido.observacion
      .split('\n')
      .flatMap(line => doc.splitTextToSize(line || ' ', 190) as string[])
    doc.text(lines, 10, y)
    y += (lines.length - 1) * 5
  }

  y += 4

  // Final separator
  doc.line(10, y, 200, y)

  const fechaStr = pedido.fecha.split('-').reverse().join('-') // YYYY-MM-DD → DD-MM-YYYY
  const clienteStr = pedido.cliente.replace(/[/\\:*?"<>|]/g, '').trim()
  const filename = `Remito-${clienteStr}-${fechaStr}.pdf`
  const blob = doc.output('blob')
  const file = new File([blob], filename, { type: 'application/pdf' })

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: `Remito ${pedido.pedidoId}`,
    })
  } else {
    doc.save(filename)
  }
}
