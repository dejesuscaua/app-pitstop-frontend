import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Order } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS_LABEL: Record<string, string> = {
  open: 'Em aberto',
  ready: 'Pronto para entrega',
  delivered: 'Entregue',
}

export async function generateOrderPDF(order: Order, shopName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([595, 842])
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()
  const green = rgb(0.11, 0.62, 0.46)
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.45, 0.45, 0.45)
  const lightGray = rgb(0.95, 0.95, 0.95)
  const margin = 40

  let y = height - 40

  // Header bar
  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: green })
  page.drawText('ORDEM DE SERVIÇO', {
    x: margin,
    y: height - 48,
    size: 20,
    font: bold,
    color: rgb(1, 1, 1),
  })
  page.drawText(`OS #${order.id.slice(0, 8).toUpperCase()}`, {
    x: width - 160,
    y: height - 48,
    size: 11,
    font,
    color: rgb(1, 1, 1),
  })

  y = height - 90

  // Shop name
  page.drawText(shopName, { x: margin, y, size: 13, font: bold, color: dark })
  y -= 14

  // Date
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')
  page.drawText(`Data: ${dateStr}`, { x: margin, y, size: 10, font, color: gray })
  y -= 8

  const drawDivider = (yPos: number) => {
    page.drawLine({ start: { x: margin, y: yPos }, end: { x: width - margin, y: yPos }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  }

  drawDivider(y)
  y -= 16

  // Customer section
  const drawSection = (label: string, yPos: number) => {
    page.drawText(label, { x: margin, y: yPos, size: 9, font: bold, color: green })
    return yPos - 14
  }

  y = drawSection('CLIENTE', y)
  page.drawText(order.customerName, { x: margin, y, size: 11, font: bold, color: dark })
  y -= 13

  // Vehicle section
  y -= 6
  drawDivider(y)
  y -= 16
  y = drawSection('VEÍCULO', y)
  const v = order.vehicleInfo
  page.drawText(`${v.brand} ${v.model} ${v.year}`, { x: margin, y, size: 11, font: bold, color: dark })
  y -= 13
  page.drawText(`Placa: ${v.plate}   KM: ${v.km.toLocaleString('pt-BR')}`, { x: margin, y, size: 10, font, color: gray })
  y -= 8

  // Items table
  y -= 6
  drawDivider(y)
  y -= 16
  y = drawSection('SERVIÇOS / PEÇAS', y)

  // Table header
  page.drawRectangle({ x: margin, y: y - 3, width: width - margin * 2, height: 18, color: lightGray })
  page.drawText('Descrição', { x: margin + 4, y: y + 2, size: 9, font: bold, color: dark })
  page.drawText('Qtd', { x: 360, y: y + 2, size: 9, font: bold, color: dark })
  page.drawText('Unitário', { x: 400, y: y + 2, size: 9, font: bold, color: dark })
  page.drawText('Total', { x: 500, y: y + 2, size: 9, font: bold, color: dark })
  y -= 18

  for (const item of order.items) {
    const lineTotal = item.qty * item.unitPrice
    page.drawText(item.name, { x: margin + 4, y, size: 9, font, color: dark })
    page.drawText(String(item.qty), { x: 360, y, size: 9, font, color: dark })
    page.drawText(BRL(item.unitPrice), { x: 400, y, size: 9, font, color: dark })
    page.drawText(BRL(lineTotal), { x: 500, y, size: 9, font, color: dark })
    y -= 14
  }

  // Totals box
  y -= 6
  drawDivider(y)
  y -= 16

  const drawTotal = (label: string, value: string, isBold = false) => {
    page.drawText(label, { x: width - 240, y, size: 10, font: isBold ? bold : font, color: isBold ? dark : gray })
    page.drawText(value, { x: width - margin - 80, y, size: 10, font: isBold ? bold : font, color: isBold ? dark : gray })
    y -= 14
  }

  drawTotal('Peças:', BRL(order.totalParts))
  drawTotal('Mão de obra:', BRL(order.laborPrice))
  y -= 8

  // Total box
  page.drawRectangle({ x: width - 240, y: y - 4, width: 200, height: 22, color: green })
  page.drawText('TOTAL:', { x: width - 236, y: y + 3, size: 11, font: bold, color: rgb(1, 1, 1) })
  page.drawText(BRL(order.total), { x: width - margin - 80, y: y + 3, size: 11, font: bold, color: rgb(1, 1, 1) })
  y -= 28

  // Status
  y -= 6
  page.drawText(`Status: ${STATUS_LABEL[order.status] ?? order.status}`, { x: margin, y, size: 10, font, color: gray })
  y -= 14

  // Notes
  if (order.notes) {
    y -= 4
    drawDivider(y)
    y -= 16
    y = drawSection('OBSERVAÇÕES', y)
    page.drawText(order.notes, { x: margin, y, size: 10, font, color: dark, maxWidth: width - margin * 2 })
    y -= 14
  }

  // Footer
  page.drawText('PitStop OS — pitstop.app', {
    x: margin,
    y: 20,
    size: 8,
    font,
    color: gray,
  })

  return doc.save()
}

async function fetchImageBytes(url: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(url)
    const buf = await res.arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    return null
  }
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array) {
  try { return await doc.embedJpg(bytes) } catch { /* try png */ }
  try { return await doc.embedPng(bytes) } catch { return null }
}

async function drawPartImage(
  doc: PDFDocument,
  page: ReturnType<typeof doc.addPage>,
  url: string | undefined,
  x: number,
  y: number,
  size: number,
) {
  if (!url) return
  const bytes = await fetchImageBytes(url)
  if (!bytes) return
  const img = await embedImage(doc, bytes)
  if (!img) return
  const scaled = img.scaleToFit(size, size)
  page.drawImage(img, { x, y: y - scaled.height, width: scaled.width, height: scaled.height })
}

export async function generatePartsPDF(order: Order, shopName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const green = rgb(0.11, 0.62, 0.46)
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.45, 0.45, 0.45)

  const itemsWithPhotos = (order.items ?? []).filter((i) => i.oldPartPhoto || i.newPartPhoto)

  for (const item of itemsWithPhotos) {
    const page = doc.addPage([595, 842])
    const { width, height } = page.getSize()
    const margin = 40

    // Header
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: green })
    page.drawText('RELATÓRIO DE PEÇAS', { x: margin, y: height - 48, size: 16, font: bold, color: rgb(1, 1, 1) })
    page.drawText(`OS #${order.id.slice(0, 8).toUpperCase()}`, { x: width - 160, y: height - 48, size: 10, font, color: rgb(1, 1, 1) })

    let y = height - 95
    page.drawText(shopName, { x: margin, y, size: 11, font: bold, color: dark })
    y -= 14
    page.drawText(order.customerName, { x: margin, y, size: 10, font, color: gray })
    y -= 10
    page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
    y -= 20

    // Item name
    page.drawText(item.name, { x: margin, y, size: 13, font: bold, color: dark })
    y -= 30

    const imgSize = (width - margin * 2 - 20) / 2
    const labelY = y
    y -= 16

    // Labels
    if (item.oldPartPhoto) page.drawText('ANTES', { x: margin, y: labelY, size: 9, font: bold, color: gray })
    if (item.newPartPhoto) page.drawText('DEPOIS', { x: margin + imgSize + 20, y: labelY, size: 9, font: bold, color: gray })

    await drawPartImage(doc, page, item.oldPartPhoto, margin, y, imgSize)
    await drawPartImage(doc, page, item.newPartPhoto, margin + imgSize + 20, y, imgSize)

    // Footer
    page.drawText('PitStop OS — pitstop.app', { x: margin, y: 20, size: 8, font, color: gray })
  }

  if (doc.getPageCount() === 0) {
    const page = doc.addPage([595, 842])
    page.drawText('Nenhuma foto de peça registrada.', { x: 40, y: 400, size: 12, font, color: gray })
  }

  return doc.save()
}

export function downloadPDF(bytes: Uint8Array, filename: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
