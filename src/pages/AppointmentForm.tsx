import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Navbar } from '@/components/Navbar'
import { NewCustomerModal } from '@/components/NewCustomerModal'
import { useCustomers } from '@/hooks/useCustomers'
import { useAppointments } from '@/hooks/useAppointments'
import type { AppointmentStatus, Customer } from '@/types'

interface FormValues {
  customerId: string
  vehicleIndex: string
  date: string
  time: string
  estimatedDuration: number
  serviceDescription: string
  status: AppointmentStatus
  notes: string
}

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
]

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nowTimeStr() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function AppointmentForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isEditing = Boolean(id)

  const { customers, loading: loadingCustomers, create: createCustomer } = useCustomers()
  const { appointments, create, update } = useAppointments()
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      customerId: '',
      vehicleIndex: '0',
      date: todayStr(),
      time: nowTimeStr(),
      estimatedDuration: 60,
      serviceDescription: '',
      status: 'agendado',
      notes: '',
    },
  })

  const customerId = watch('customerId')
  const selectedCustomer = customers.find((c) => c.id === customerId)

  useEffect(() => {
    if (!isEditing || !id) return
    const apt = appointments.find((a) => a.id === id)
    if (!apt) return

    const dt = new Date(apt.scheduledAt)
    setValue('customerId', apt.customerId)
    setValue('date', dt.toISOString().slice(0, 10))
    setValue('time', `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`)
    setValue('estimatedDuration', apt.estimatedDuration)
    setValue('serviceDescription', apt.serviceDescription)
    setValue('status', apt.status)
    setValue('notes', apt.notes ?? '')

    const customer = customers.find((c) => c.id === apt.customerId)
    if (customer) {
      const vIdx = customer.vehicles.findIndex((v) => v.plate === apt.vehicleInfo.plate)
      setValue('vehicleIndex', String(Math.max(vIdx, 0)))
    }
  }, [isEditing, id, appointments, customers, setValue])

  useEffect(() => {
    const state = location.state as { prefillDate?: string; prefillTime?: string } | null
    if (state?.prefillDate) setValue('date', state.prefillDate)
    if (state?.prefillTime) setValue('time', state.prefillTime)
  }, [location.state, setValue])

  const handleCustomerCreated = (customer: Customer) => {
    setValue('customerId', customer.id)
    setValue('vehicleIndex', '0')
  }

  const onSubmit = async (data: FormValues) => {
    const customer = customers.find((c) => c.id === data.customerId)
    if (!customer) return

    const vehicle = customer.vehicles[Number(data.vehicleIndex)]
    const scheduledAt = new Date(`${data.date}T${data.time}:00`).toISOString()

    const payload = {
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleInfo: vehicle
        ? { brand: vehicle.brand, model: vehicle.model, plate: vehicle.plate, year: vehicle.year }
        : { brand: '', model: '', plate: '', year: 0 },
      scheduledAt,
      estimatedDuration: Number(data.estimatedDuration),
      serviceDescription: data.serviceDescription,
      status: data.status,
      notes: data.notes,
    }

    if (isEditing && id) {
      await update(id, payload)
    } else {
      await create(payload)
    }
    navigate('/appointments')
  }

  const submitLabel = (() => {
    if (isSubmitting) return 'Salvando…'
    return isEditing ? 'Salvar' : 'Agendar'
  })()

  return (
    <div>
      <Navbar title={isEditing ? 'Editar Agendamento' : 'Novo Agendamento'} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Cliente e Veículo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Cliente e Veículo</h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="flex items-center gap-1 text-xs text-brand-600 hover:underline font-medium"
                >
                  <span className="text-base leading-none">+</span> Novo cliente
                </button>
              </div>
              <select
                id="customerId"
                {...register('customerId', { required: true })}
                onChange={(e) => {
                  setValue('customerId', e.target.value)
                  setValue('vehicleIndex', '0')
                }}
                disabled={loadingCustomers}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white disabled:opacity-60"
              >
                <option value="">Selecionar cliente…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-xs text-red-500 mt-1">Selecione um cliente</p>
              )}
            </div>

            {customerId && selectedCustomer && selectedCustomer.vehicles.length > 0 && (
              <div>
                <label htmlFor="vehicleIndex" className="block text-sm font-medium text-gray-700 mb-1">
                  Veículo *
                </label>
                <select
                  id="vehicleIndex"
                  {...register('vehicleIndex')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white"
                >
                  {selectedCustomer.vehicles.map((v, i) => (
                    <option key={v.plate} value={i}>
                      {v.brand} {v.model} — {v.plate}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Data e Hora */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Data e Hora</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input id="date" type="date" {...register('date', { required: true })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">Hora *</label>
                <input id="time" type="time" {...register('time', { required: true })}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>

            <div>
              <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-1">
                Duração estimada
              </label>
              <select id="estimatedDuration" {...register('estimatedDuration', { valueAsNumber: true })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white">
                {DURATION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Serviço */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">Serviço</h3>

            <div>
              <label htmlFor="serviceDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do serviço *
              </label>
              <textarea id="serviceDescription" {...register('serviceDescription', { required: true })}
                rows={3} placeholder="Ex: Troca de óleo e filtros, revisão geral…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none resize-none" />
              {errors.serviceDescription && (
                <p className="text-xs text-red-500 mt-1">Descreva o serviço</p>
              )}
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status" {...register('status')}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea id="notes" {...register('notes')} rows={2}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none resize-none" />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/appointments')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || !customerId}
              className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>

      {showNewCustomer && (
        <NewCustomerModal
          onCreate={createCustomer}
          onClose={() => setShowNewCustomer(false)}
          onCreated={handleCustomerCreated}
        />
      )}
    </div>
  )
}
