import { useState, useEffect, useCallback } from 'react'
import type { Customer } from '@/types'
import api from '@/services/api'

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Customer[]>('/customers')
      setCustomers(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload: Omit<Customer, 'id' | 'createdAt'>) => {
    const { data } = await api.post<Customer>('/customers', payload)
    setCustomers((prev) => [data, ...prev])
    return data
  }

  const update = async (id: string, payload: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    const { data } = await api.put<Customer>(`/customers/${id}`, payload)
    setCustomers((prev) => prev.map((c) => (c.id === id ? data : c)))
    return data
  }

  const remove = async (id: string) => {
    await api.delete(`/customers/${id}`)
    setCustomers((prev) => prev.filter((c) => c.id !== id))
  }

  return { customers, loading, error, create, update, remove, refetch: fetchAll }
}
