import { useState, useEffect, useCallback } from 'react'
import type { Order, OrderStatus } from '@/types'
import api from '@/services/api'

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Order[]>('/orders')
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar ordens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload: Omit<Order, 'id' | 'createdAt' | 'updatedAt' | 'totalParts' | 'total' | 'status' | 'pdfUrl' | 'customerPhone'> & { customerPhone?: string }) => {
    const { data } = await api.post<Order>('/orders', payload)
    setOrders((prev) => [data, ...prev])
    return data
  }

  const update = async (
    id: string,
    payload: Pick<Order, 'items' | 'laborPrice' | 'notes'>
  ) => {
    const { data } = await api.put<Order>(`/orders/${id}`, payload)
    setOrders((prev) => prev.map((o) => (o.id === id ? data : o)))
    return data
  }

  const updateStatus = async (id: string, status: OrderStatus) => {
    await api.patch(`/orders/${id}/status`, { status })
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    )
  }

  const remove = async (id: string) => {
    await api.delete(`/orders/${id}`)
    setOrders((prev) => prev.filter((o) => o.id !== id))
  }

  return { orders, loading, error, create, update, updateStatus, remove, refetch: fetchAll }
}
