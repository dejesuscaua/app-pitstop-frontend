import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { OSCard } from '@/components/OSCard'
import { useOrders } from '@/hooks/useOrders'
import type { OrderStatus } from '@/types'

const TABS: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'open', label: 'Em aberto' },
  { value: 'ready', label: 'Prontas' },
  { value: 'delivered', label: 'Entregues' },
]

export function Orders() {
  const { orders, loading } = useOrders()
  const navigate = useNavigate()
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')

  const filtered = tab === 'all' ? orders : orders.filter((o) => o.status === tab)

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )
    }
    if (filtered.length === 0) {
      const msg = tab === 'all' ? 'Nenhuma OS cadastrada.' : 'Nenhuma OS com esse status.'
      return (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
          {msg}
        </div>
      )
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((o) => (
          <OSCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Ordens de Serviço" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 overflow-x-auto bg-gray-100 p-1 rounded-lg">
            {TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/orders/new')}
            className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors sm:shrink-0"
          >
            + Nova OS
          </button>
        </div>

        {renderList()}
      </div>
    </div>
  )
}
