import { useState, useCallback, useEffect } from 'react'
import api from '@/services/api'
import type { Appointment, AppointmentStatus } from '@/types'

type CreatePayload = Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'orderId'>
type UpdatePayload = Partial<Omit<Appointment, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const { data } = await api.get<Appointment[]>('/appointments')
      setAppointments(data)
    } catch {
      setError('Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const create = async (payload: CreatePayload) => {
    const { data } = await api.post<Appointment>('/appointments', payload)
    setAppointments((prev) => [...prev, data].sort((a, b) =>
      new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    ))
    return data
  }

  const update = async (id: string, payload: UpdatePayload) => {
    const { data } = await api.put<Appointment>(`/appointments/${id}`, payload)
    setAppointments((prev) => prev.map((a) => (a.id === id ? data : a)))
    return data
  }

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    await api.patch(`/appointments/${id}/status`, { status })
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    )
  }

  const linkOrder = async (id: string, orderId: string) => {
    await api.patch(`/appointments/${id}/link-order`, { orderId })
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, orderId } : a))
    )
  }

  const remove = async (id: string) => {
    await api.delete(`/appointments/${id}`)
    setAppointments((prev) => prev.filter((a) => a.id !== id))
  }

  return { appointments, loading, error, create, update, updateStatus, linkOrder, remove, refetch: fetchAll }
}
