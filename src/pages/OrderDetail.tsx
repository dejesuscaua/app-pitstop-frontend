import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ref as storageRef, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/services/firebase'
import { Navbar } from '@/components/Navbar'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/hooks/useOrders'
import { useAuth } from '@/contexts/AuthContext'
import { generateOrderPDF, downloadPDF } from '@/services/pdf'
import api from '@/services/api'
import type { OrderStatus, VehicleInspection, NotaFiscal } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  open: 'ready',
  ready: 'delivered',
  delivered: null,
}
const NEXT_LABEL: Record<OrderStatus, string> = {
  open: 'Marcar como pronto',
  ready: 'Marcar como entregue',
  delivered: '',
}

const INSPECTION_LABELS: Record<keyof VehicleInspection, string> = {
  fluidos: 'Fluidos',
  freios: 'Freios',
  motor: 'Motor',
  eletrica: 'Elétrica',
  suspensao: 'Suspensão / Direção',
  pneus: 'Pneus',
  arCondicionado: 'Ar condicionado',
  outros: 'Outros',
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orders, updateStatus } = useOrders()
  const { tenantId, shopName } = useAuth()
  const [pdfLoading, setPdfLoading] = useState(false)

  // Notas fiscais
  const [notas, setNotas] = useState<NotaFiscal[]>([])
  const [notasLoading, setNotasLoading] = useState(true)
  const [notaUploading, setNotaUploading] = useState(false)
  const [notaProgress, setNotaProgress] = useState(0)
  const [notaError, setNotaError] = useState<string | null>(null)
  const notaFileRef = useRef<HTMLInputElement>(null)

  const order = orders.find((o) => o.id === id)

  useEffect(() => {
    if (!id) return
    api.get<NotaFiscal[]>(`/orders/${id}/notas`)
      .then(({ data }) => setNotas(data))
      .catch(() => setNotaError('Erro ao carregar notas fiscais'))
      .finally(() => setNotasLoading(false))
  }, [id])

  if (!order) {
    return (
      <div>
        <Navbar title="OS não encontrada" />
        <div className="p-6 text-gray-400">OS não encontrada.</div>
      </div>
    )
  }

  const handleNextStatus = async () => {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    await updateStatus(order.id, next)
  }

  const handleDownloadPDF = async () => {
    setPdfLoading(true)
    try {
      const bytes = await generateOrderPDF(order, shopName ?? 'Minha Oficina')
      downloadPDF(bytes, `OS-${order.id.slice(0, 8)}.pdf`)
    } finally {
      setPdfLoading(false)
    }
  }

  const handleWhatsApp = () => {
    const phone = order.customerPhone?.replaceAll(/\D/g, '')
    const publicUrl = `${globalThis.location.origin}/os/${tenantId}/${order.id}`
    const text = encodeURIComponent(
      `Olá ${order.customerName}! Segue o resumo da sua OS:\n${publicUrl}`
    )
    const waUrl = phone
      ? `https://wa.me/55${phone}?text=${text}`
      : `https://wa.me/?text=${text}`
    globalThis.open(waUrl, '_blank')
  }

  const handleNotaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !id) return
    const path = `tenants/${tenantId}/orders/${id}/notas/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    setNotaUploading(true)
    setNotaProgress(0)
    setNotaError(null)
    const task = uploadBytesResumable(sRef, file)
    task.on(
      'state_changed',
      (snap) => setNotaProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      () => { setNotaError('Erro no upload.'); setNotaUploading(false) },
      async () => {
        try {
          const downloadURL = await getDownloadURL(task.snapshot.ref)
          const { data } = await api.post<NotaFiscal>(`/orders/${id}/notas`, {
            fileName: file.name,
            size: file.size,
            storagePath: path,
            downloadURL,
          })
          setNotas((prev) => [data, ...prev])
        } catch {
          setNotaError('Erro ao salvar metadados.')
        } finally {
          setNotaUploading(false)
          if (notaFileRef.current) notaFileRef.current.value = ''
        }
      },
    )
  }

  const handleNotaDelete = async (nota: NotaFiscal) => {
    if (!id || !confirm(`Excluir "${nota.fileName}"?`)) return
    try { await deleteObject(storageRef(storage, nota.storagePath)) } catch { /* already gone */ }
    await api.delete(`/orders/${id}/notas/${nota.id}`)
    setNotas((prev) => prev.filter((n) => n.id !== nota.id))
  }

  const handleNotaDownload = (nota: NotaFiscal) => {
    const a = document.createElement('a')
    a.href = nota.downloadURL
    a.download = nota.fileName
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    a.click()
  }

  const v = order.vehicleInfo
  const inspection = order.vehicleInspection
  const inspectionKeys = inspection
    ? (Object.keys(INSPECTION_LABELS) as (keyof VehicleInspection)[]).filter((k) => inspection[k]?.checked)
    : []

  return (
    <div>
      <Navbar title={`OS #${order.id.slice(0, 8).toUpperCase()}`} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-5">
        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-gray-900">{order.customerName}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {v.brand} {v.model} {v.year} · {v.plate} · {v.km.toLocaleString('pt-BR')} km
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {order.notes && (
            <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{order.notes}</p>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Peças / Serviços</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium text-right">Qtd</th>
                  <th className="pb-2 font-medium text-right">Unitário</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(order.items ?? []).map((item, i) => (
                  <tr key={`${item.name}-${i}`} className="border-b border-gray-50">
                    <td className="py-2 text-gray-700">
                      <div>{item.name}</div>
                      {(item.oldPartPhoto || item.newPartPhoto) && (
                        <div className="flex gap-2 mt-1">
                          {item.oldPartPhoto && (
                            <a href={item.oldPartPhoto} target="_blank" rel="noopener noreferrer">
                              <img src={item.oldPartPhoto} alt="Peça retirada" className="h-10 w-10 object-cover rounded border border-gray-200" title="Peça retirada" />
                            </a>
                          )}
                          {item.newPartPhoto && (
                            <a href={item.newPartPhoto} target="_blank" rel="noopener noreferrer">
                              <img src={item.newPartPhoto} alt="Peça nova" className="h-10 w-10 object-cover rounded border border-gray-200" title="Peça nova" />
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right text-gray-500">{item.qty}</td>
                    <td className="py-2 text-right text-gray-500">{BRL(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{BRL(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Peças</span>
              <span>{BRL(order.totalParts)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Mão de obra</span>
              <span>{BRL(order.laborPrice)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-100 pt-2">
              <span>Total</span>
              <span>{BRL(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Vistoria */}
        {inspection && inspectionKeys.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Vistoria do veículo</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {inspectionKeys.map((key) => (
                <div key={key} className="flex flex-col gap-0.5 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                  <span className="text-sm font-medium text-danger">⚠ {INSPECTION_LABELS[key]}</span>
                  {inspection[key].note && (
                    <span className="text-xs text-gray-500">{inspection[key].note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fotos do veículo */}
        {(order.vehiclePhotos ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Fotos do veículo</h3>
            <div className="flex flex-wrap gap-2">
              {order.vehiclePhotos!.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="foto veículo" className="h-24 w-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Fotos do serviço */}
        {(order.servicePhotos ?? []).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Fotos do serviço</h3>
            <div className="flex flex-wrap gap-2">
              {order.servicePhotos!.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt="foto serviço" className="h-24 w-24 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notas fiscais */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Notas fiscais</h3>

          <input
            ref={notaFileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.xml"
            onChange={handleNotaUpload}
            disabled={notaUploading}
            className="hidden"
            id="nota-os-upload"
          />
          <label
            htmlFor="nota-os-upload"
            className={`flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-4 text-sm font-medium transition-colors cursor-pointer mb-3
              ${notaUploading
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-brand-300 text-brand-600 hover:bg-brand-50'
              }`}
          >
            {notaUploading ? `Enviando… ${notaProgress}%` : '+ Anexar nota fiscal'}
          </label>
          {notaUploading && (
            <div className="mb-3 h-1.5 w-full rounded-full bg-gray-100">
              <div className="h-1.5 rounded-full bg-brand-400 transition-all" style={{ width: `${notaProgress}%` }} />
            </div>
          )}
          {notaError && <p className="mb-2 text-xs text-danger">{notaError}</p>}

          {notasLoading && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
            </div>
          )}
          {!notasLoading && notas.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-3">Nenhuma nota fiscal anexada.</p>
          )}
          {!notasLoading && notas.length > 0 && (
            <div className="space-y-2">
              {notas.map((nota) => (
                <div key={nota.id} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{nota.fileName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatBytes(nota.size)} · {formatDate(nota.uploadedAt)}
                    </p>
                  </div>
                  <button onClick={() => handleNotaDownload(nota)} className="shrink-0 text-xs text-brand-600 hover:underline">
                    Baixar
                  </button>
                  <button onClick={() => handleNotaDelete(nota)} className="shrink-0 text-xs text-danger hover:underline">
                    Excluir
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          {NEXT_STATUS[order.status] && (
            <button
              onClick={handleNextStatus}
              className="rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              {NEXT_LABEL[order.status]}
            </button>
          )}

          {order.status === 'open' && (
            <button
              onClick={() => navigate(`/orders/${order.id}/edit`)}
              className="rounded-lg border border-brand-300 px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Editar OS
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
          >
            {pdfLoading ? 'Gerando…' : '↓ Baixar PDF'}
          </button>

          <button
            onClick={handleWhatsApp}
            className="rounded-lg bg-whatsapp px-4 py-2.5 text-sm font-semibold text-white hover:brightness-90 transition-all"
          >
            WhatsApp
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </div>
    </div>
  )
}
