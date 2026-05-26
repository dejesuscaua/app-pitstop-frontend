import { useState, useEffect, useCallback } from 'react'
import type { Product } from '@/types'
import api from '@/services/api'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Product[]>('/products')
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setError('Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload: Omit<Product, 'id' | 'createdAt'>) => {
    const { data } = await api.post<Product>('/products', payload)
    setProducts((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
    return data
  }

  const update = async (id: string, payload: Partial<Omit<Product, 'id' | 'createdAt'>>) => {
    const { data } = await api.put<Product>(`/products/${id}`, payload)
    setProducts((prev) => prev.map((p) => (p.id === id ? data : p)))
    return data
  }

  const remove = async (id: string) => {
    await api.delete(`/products/${id}`)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }

  return { products, loading, error, create, update, remove, refetch: fetchAll }
}
