import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StatusBadge } from '@/components/StatusBadge'
import type { Order } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

type PublicOrder = Pick<Order, 'id' | 'customerName' | 'vehicleInfo' | 'status' | 'items' | 'laborPrice' | 'totalParts' | 'total' | 'notes' | 'createdAt'>

export function OrderPublic() {
  const { tenantId, id } = useParams<{ tenantId: string; id: string }>()
  const [order, setOrder] = useState<PublicOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/public/os/${tenantId}/${id}`)
      .then(async (res) => {
        if (!res.ok) { setNotFound(true); return }
        const data = await res.json() as PublicOrder
        setOrder(data)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [tenantId, id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-gray-400">OS não encontrada.</p>
      </div>
    )
  }

  const v = order.vehicleInfo

  return (
    <div className="min-h-screen bg-surface py-8 px-4">
      <div className="mx-auto max-w-lg space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-brand-400 text-3xl">⬡</span>
          <p className="text-xs text-gray-400 mt-1">PitStop OS</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-bold text-gray-900">{order.customerName}</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {v.brand} {v.model} {v.year} · {v.plate}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            OS #{order.id.slice(0, 8).toUpperCase()} · {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : ''}
          </p>
          {order.notes && (
            <p className="mt-3 text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{order.notes}</p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Peças / Serviços</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={`${item.name}-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{item.qty}× {item.name}</span>
                <span className="font-medium text-gray-900">{BRL(item.qty * item.unitPrice)}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 text-sm border-t border-gray-100 pt-3">
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

        <p className="text-center text-xs text-gray-300 pb-4">
          Gerado por PitStop OS
        </p>
      </div>
    </div>
  )
}
