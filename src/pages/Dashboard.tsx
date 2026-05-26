import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { StatusBadge } from '@/components/StatusBadge'
import api from '@/services/api'
import type { Order, Appointment } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Stats {
  openCount: number
  readyCount: number
  monthRevenue: number
  monthTotal: number
  recent: Pick<Order, 'id' | 'customerName' | 'status' | 'total' | 'createdAt'>[]
}

function StatCard({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])

  useEffect(() => {
    api.get<Stats>('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .finally(() => setLoading(false))
    api.get<Appointment[]>('/appointments/today')
      .then(({ data }) => setTodayAppointments(data))
      .catch(() => {})
  }, [])

  return (
    <div>
      <Navbar title="Dashboard" />
      <div className="p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard label="Receita do mês" value={BRL(stats?.monthRevenue ?? 0)} />
              <StatCard label="OS este mês" value={String(stats?.monthTotal ?? 0)} />
              <StatCard label="Em aberto" value={String(stats?.openCount ?? 0)} />
              <StatCard label="Prontas p/ entrega" value={String(stats?.readyCount ?? 0)} />
            </div>

            {/* Agendamentos de hoje */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">
                  Agendamentos Hoje
                  <span className="ml-2 text-xs font-normal text-gray-400">({todayAppointments.length})</span>
                </h2>
                <Link to="/appointments" className="text-sm text-brand-600 hover:underline">
                  Ver todos
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400 text-sm">
                  Nenhum agendamento para hoje.
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((apt) => (
                    <Link
                      key={apt.id}
                      to="/appointments"
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{apt.customerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {`${new Date(apt.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${apt.vehicleInfo.brand} ${apt.vehicleInfo.model} · ${apt.serviceDescription}`}
                        </p>
                      </div>
                      {apt.orderId && (
                        <span className="text-xs text-brand-600 font-semibold ml-3 shrink-0">OS</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">OS Recentes</h2>
                <Link to="/orders/new" className="text-sm text-brand-600 hover:underline">
                  + Nova OS
                </Link>
              </div>

              {stats?.recent.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
                  <p>Nenhuma OS ainda.</p>
                  <Link to="/orders/new" className="mt-2 inline-block text-sm text-brand-600 hover:underline">
                    Criar primeira OS
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {stats?.recent.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-200 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{order.customerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('pt-BR') : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-semibold text-sm text-gray-900">{BRL(order.total)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
