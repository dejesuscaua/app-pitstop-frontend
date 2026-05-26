import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/hooks/useOrders'
import { useAuth } from '@/contexts/AuthContext'
import { generateOrderPDF, downloadPDF } from '@/services/pdf'
import type { OrderStatus } from '@/types'

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

export function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orders, updateStatus } = useOrders()
  const { tenantId, shopName } = useAuth()
  const [pdfLoading, setPdfLoading] = useState(false)

  const order = orders.find((o) => o.id === id)

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

  const v = order.vehicleInfo

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
              {order.items.map((item, i) => (
                <tr key={`${item.name}-${i}`} className="border-b border-gray-50">
                  <td className="py-2 text-gray-700">{item.name}</td>
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
