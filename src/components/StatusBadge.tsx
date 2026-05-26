import type { OrderStatus } from '@/types'

const config: Record<OrderStatus, { label: string; className: string }> = {
  open: { label: 'Em aberto', className: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Pronto', className: 'bg-brand-50 text-brand-800' },
  delivered: { label: 'Entregue', className: 'bg-gray-100 text-gray-600' },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = config[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
