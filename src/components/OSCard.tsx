import { Link } from 'react-router-dom'
import type { Order } from '@/types'
import { StatusBadge } from './StatusBadge'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function OSCard({ order }: { order: Order }) {
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('pt-BR')
    : '—'

  return (
    <Link
      to={`/orders/${order.id}`}
      className="block rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-200 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{order.customerName}</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {order.vehicleInfo.brand} {order.vehicleInfo.model} · {order.vehicleInfo.plate}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">{date}</span>
        <span className="font-semibold text-gray-900">{BRL(order.total)}</span>
      </div>
    </Link>
  )
}
