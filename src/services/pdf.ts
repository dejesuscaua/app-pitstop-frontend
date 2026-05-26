import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import type { Order } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const STATUS_LABEL: Record<string, string> = {
  open: 'Em aberto',
  ready: 'Pronto para entrega',
  delivered: 'Entregue',
}

const INSPECTION_LABELS_PDF: Record<string, string> = {
  fluidos: 'Fluidos',
  freios: 'Freios',
  motor: 'Motor',
  eletrica: 'Elétrica',
  suspensao: 'Suspensão / Direção',
  pneus: 'Pneus',
  arCondicionado: 'Ar condicionado',
  outros: 'Outros',
}

export async function generateOrderPDF(order: Order, shopName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const pageWidth = 595
  const pageHeight = 842
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  const green = rgb(0.11, 0.62, 0.46)
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.45, 0.45, 0.45)
  const lightGray = rgb(0.95, 0.95, 0.95)
  const red = rgb(0.8, 0.1, 0.1)

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - 40

  const ensureSpace = (needed: number) => {
    if (y - needed < 60) {
      page.drawText('PitStop OS — pitstop.app', { x: margin, y: 20, size: 8, font, color: gray })
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
  }

  const drawDivider = () => {
    page.drawLine({ start: { x: margin, y }, end: { x: pageWidth - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  }

  const drawSection = (label: string) => {
    page.drawText(label, { x: margin, y, size: 9, font: bold, color: green })
    y -= 14
  }

  // Header bar
  page.drawRectangle({ x: 0, y: pageHeight - 70, width: pageWidth, height: 70, color: green })
  page.drawText('ORDEM DE SERVIÇO', { x: margin, y: pageHeight - 48, size: 20, font: bold, color: rgb(1, 1, 1) })
  const osLabel = `OS #${order.id.slice(0, 8).toUpperCase()}`
  const osLabelW = font.widthOfTextAtSize(osLabel, 11)
  page.drawText(osLabel, { x: pageWidth - margin - osLabelW, y: pageHeight - 48, size: 11, font, color: rgb(1, 1, 1) })

  y = pageHeight - 90

  // Shop name + date
  page.drawText(shopName, { x: margin, y, size: 13, font: bold, color: dark })
  y -= 16
  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')
  page.drawText(`Data: ${dateStr}`, { x: margin, y, size: 10, font, color: gray })
  y -= 10
  drawDivider()
  y -= 16

  // Customer
  drawSection('CLIENTE')
  page.drawText(order.customerName, { x: margin, y, size: 11, font: bold, color: dark })
  y -= 14
  if (order.customerPhone) {
    page.drawText(`Tel: ${order.customerPhone}`, { x: margin, y, size: 9, font, color: gray })
    y -= 12
  }

  // Vehicle
  y -= 4
  drawDivider()
  y -= 16
  drawSection('VEÍCULO')
  const v = order.vehicleInfo
  page.drawText(`${v.brand} ${v.model} ${v.year}`, { x: margin, y, size: 11, font: bold, color: dark })
  y -= 14
  page.drawText(`Placa: ${v.plate}   KM: ${v.km.toLocaleString('pt-BR')}`, { x: margin, y, size: 10, font, color: gray })
  y -= 10

  // Items table
  y -= 4
  drawDivider()
  y -= 16
  drawSection('SERVIÇOS / PEÇAS')

  // Column positions (right-aligned for numeric cols)
  const colDescX = margin + 4
  const colQtdX = margin + contentWidth * 0.57   // ~370
  const colUnitX = margin + contentWidth * 0.72  // ~452
  const colTotalRight = pageWidth - margin        // right edge for total column

  ensureSpace(24)
  // Table header
  page.drawRectangle({ x: margin, y: y - 4, width: contentWidth, height: 20, color: lightGray })
  page.drawText('Descrição', { x: colDescX, y: y + 2, size: 9, font: bold, color: dark })
  page.drawText('Qtd', { x: colQtdX, y: y + 2, size: 9, font: bold, color: dark })
  page.drawText('Unitário', { x: colUnitX, y: y + 2, size: 9, font: bold, color: dark })
  const totalHeaderW = bold.widthOfTextAtSize('Total', 9)
  page.drawText('Total', { x: colTotalRight - totalHeaderW - 4, y: y + 2, size: 9, font: bold, color: dark })
  y -= 20

  for (const item of order.items) {
    ensureSpace(18)
    const lineTotal = item.qty * item.unitPrice
    const qtyStr = String(item.qty)
    const unitStr = BRL(item.unitPrice)
    const totalStr = BRL(lineTotal)
    const descMaxW = colQtdX - colDescX - 8

    page.drawText(item.name, { x: colDescX, y, size: 9, font, color: dark, maxWidth: descMaxW })
    page.drawText(qtyStr, { x: colQtdX, y, size: 9, font, color: dark })
    page.drawText(unitStr, { x: colUnitX, y, size: 9, font, color: dark })
    const totalW = font.widthOfTextAtSize(totalStr, 9)
    page.drawText(totalStr, { x: colTotalRight - totalW - 4, y, size: 9, font, color: dark })
    y -= 16
  }

  // Totals
  ensureSpace(80)
  y -= 6
  drawDivider()
  y -= 16

  const drawTotalRow = (label: string, value: string, isBold = false, textColor = gray) => {
    const f = isBold ? bold : font
    page.drawText(label, { x: pageWidth - margin - 200, y, size: 10, font: f, color: textColor })
    const valW = f.widthOfTextAtSize(value, 10)
    page.drawText(value, { x: colTotalRight - valW - 4, y, size: 10, font: f, color: textColor })
    y -= 16
  }

  drawTotalRow('Peças:', BRL(order.totalParts))
  drawTotalRow('Mão de obra:', BRL(order.laborPrice))
  y -= 6

  // Total box
  page.drawRectangle({ x: pageWidth - margin - 200, y: y - 5, width: 200, height: 24, color: green })
  page.drawText('TOTAL:', { x: pageWidth - margin - 196, y: y + 4, size: 11, font: bold, color: rgb(1, 1, 1) })
  const totalValStr = BRL(order.total)
  const totalValW = bold.widthOfTextAtSize(totalValStr, 11)
  page.drawText(totalValStr, { x: colTotalRight - totalValW - 6, y: y + 4, size: 11, font: bold, color: rgb(1, 1, 1) })
  y -= 30

  // Status
  ensureSpace(20)
  y -= 4
  page.drawText(`Status: ${STATUS_LABEL[order.status] ?? order.status}`, { x: margin, y, size: 10, font, color: gray })
  y -= 16

  // Vehicle Inspection
  const inspection = order.vehicleInspection
  const inspectionKeys = inspection
    ? Object.keys(INSPECTION_LABELS_PDF).filter((k) => (inspection as Record<string, { checked: boolean; note?: string }>)[k]?.checked)
    : []

  if (inspectionKeys.length > 0) {
    ensureSpace(20 + inspectionKeys.length * 16)
    y -= 4
    drawDivider()
    y -= 16
    drawSection('VISTORIA DO VEÍCULO')
    for (const key of inspectionKeys) {
      ensureSpace(18)
      const point = (inspection as Record<string, { checked: boolean; note?: string }>)[key]
      const label = `⚠ ${INSPECTION_LABELS_PDF[key]}`
      page.drawText(label, { x: margin + 4, y, size: 9, font: bold, color: red })
      if (point.note) {
        const noteX = margin + 4 + bold.widthOfTextAtSize(label, 9) + 8
        page.drawText(point.note, { x: noteX, y, size: 9, font, color: gray, maxWidth: pageWidth - margin - noteX })
      }
      y -= 16
    }
  }

  // Notes
  if (order.notes) {
    ensureSpace(40)
    y -= 4
    drawDivider()
    y -= 16
    drawSection('OBSERVAÇÕES')
    page.drawText(order.notes, { x: margin, y, size: 10, font, color: dark, maxWidth: contentWidth })
    y -= 14
  }

  // Footer on last page
  page.drawText('PitStop OS — pitstop.app', { x: margin, y: 20, size: 8, font, color: gray })

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

function makeHeader(
  page: ReturnType<PDFDocument['addPage']>,
  title: string,
  order: Order,
  shopName: string,
  fonts: { font: Awaited<ReturnType<PDFDocument['embedFont']>>; bold: Awaited<ReturnType<PDFDocument['embedFont']>> },
) {
  const { width, height } = page.getSize()
  const green = rgb(0.11, 0.62, 0.46)
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.45, 0.45, 0.45)
  const margin = 40

  page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: green })
  page.drawText(title, { x: margin, y: height - 48, size: 16, font: fonts.bold, color: rgb(1, 1, 1) })
  page.drawText(`OS #${order.id.slice(0, 8).toUpperCase()}`, { x: width - 160, y: height - 48, size: 10, font: fonts.font, color: rgb(1, 1, 1) })

  let y = height - 95
  page.drawText(shopName, { x: margin, y, size: 11, font: fonts.bold, color: dark })
  y -= 14
  page.drawText(order.customerName, { x: margin, y, size: 10, font: fonts.font, color: gray })
  y -= 10
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) })
  y -= 20
  return y
}

async function addPhotoGrid(
  doc: PDFDocument,
  urls: string[],
  title: string,
  order: Order,
  shopName: string,
  fonts: { font: Awaited<ReturnType<PDFDocument['embedFont']>>; bold: Awaited<ReturnType<PDFDocument['embedFont']>> },
) {
  if (urls.length === 0) return
  const margin = 40
  const cols = 3
  const gap = 10
  const page = doc.addPage([595, 842])
  const { width } = page.getSize()
  const gray = rgb(0.45, 0.45, 0.45)
  const dark = rgb(0.1, 0.1, 0.1)

  let y = makeHeader(page, title, order, shopName, fonts)
  page.drawText(title === 'FOTOS DO VEÍCULO' ? 'Veículo na entrada' : 'Registro do serviço', {
    x: margin, y, size: 13, font: fonts.bold, color: dark,
  })
  y -= 20

  const cellSize = Math.floor((width - margin * 2 - gap * (cols - 1)) / cols)

  for (let i = 0; i < urls.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const x = margin + col * (cellSize + gap)
    const imgY = y - row * (cellSize + gap) - cellSize
    if (imgY < 40) break
    await drawPartImage(doc, page, urls[i], x, imgY + cellSize, cellSize)
  }

  page.drawText('PitStop OS — pitstop.app', { x: margin, y: 20, size: 8, font: fonts.font, color: gray })
}

export async function generatePartsPDF(order: Order, shopName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const fonts = { font, bold }
  const dark = rgb(0.1, 0.1, 0.1)
  const gray = rgb(0.45, 0.45, 0.45)
  const margin = 40

  // Páginas de fotos do veículo e serviço
  await addPhotoGrid(doc, order.vehiclePhotos ?? [], 'FOTOS DO VEÍCULO', order, shopName, fonts)
  await addPhotoGrid(doc, order.servicePhotos ?? [], 'FOTOS DO SERVIÇO', order, shopName, fonts)

  // Páginas de peças antes/depois
  const itemsWithPhotos = (order.items ?? []).filter((i) => i.oldPartPhoto || i.newPartPhoto)

  for (const item of itemsWithPhotos) {
    const page = doc.addPage([595, 842])
    const { width } = page.getSize()

    let y = makeHeader(page, 'RELATÓRIO DE PEÇAS', order, shopName, fonts)

    page.drawText(item.name, { x: margin, y, size: 13, font: bold, color: dark })
    y -= 30

    const imgSize = (width - margin * 2 - 20) / 2
    const labelY = y
    y -= 16

    if (item.oldPartPhoto) page.drawText('ANTES', { x: margin, y: labelY, size: 9, font: bold, color: gray })
    if (item.newPartPhoto) page.drawText('DEPOIS', { x: margin + imgSize + 20, y: labelY, size: 9, font: bold, color: gray })

    await drawPartImage(doc, page, item.oldPartPhoto, margin, y, imgSize)
    await drawPartImage(doc, page, item.newPartPhoto, margin + imgSize + 20, y, imgSize)

    page.drawText('PitStop OS — pitstop.app', { x: margin, y: 20, size: 8, font, color: gray })
  }

  if (doc.getPageCount() === 0) {
    const page = doc.addPage([595, 842])
    const { height } = page.getSize()
    page.drawText('Nenhuma foto registrada.', { x: margin, y: height / 2, size: 12, font, color: gray })
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
