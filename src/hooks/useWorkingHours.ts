import { useState, useEffect } from 'react'
import api from '@/services/api'
import type { WorkingHours } from '@/types'

const DEFAULT: WorkingHours = [
  { open: false, start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '18:00' },
  { open: true,  start: '08:00', end: '13:00' },
]

export function useWorkingHours() {
  const [workingHours, setWorkingHours] = useState<WorkingHours>(DEFAULT)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<WorkingHours>('/settings/working-hours')
      .then(({ data }) => setWorkingHours(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async (hours: WorkingHours) => {
    await api.put('/settings/working-hours', { workingHours: hours })
    setWorkingHours(hours)
  }

  return { workingHours, loading, save }
}
