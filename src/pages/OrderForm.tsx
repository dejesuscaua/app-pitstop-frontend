import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { NewCustomerModal } from '@/components/NewCustomerModal'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister, FieldValues } from 'react-hook-form'
import { Navbar } from '@/components/Navbar'
import { ItemRow } from '@/components/ItemRow'
import { ProductCatalog } from '@/components/ProductCatalog'
import { PhotoUploadBlock } from '@/components/PhotoUploadBlock'
import { useCustomers } from '@/hooks/useCustomers'
import { useOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/services/api'
import type { Customer, Vehicle, VehicleInspection } from '@/types'

interface FromAppointment {
  appointmentId: string
  customerId: string
  customerName: string
  customerPhone: string
  vehicleInfo: { brand: string; model: string; plate: string; year: number }
}

const INSPECTION_LABELS: Record<keyof VehicleInspection, string> = {
  frontLeft: 'Dianteiro Esquerdo',
  frontRight: 'Dianteiro Direito',
  rearLeft: 'Traseiro Esquerdo',
  rearRight: 'Traseiro Direito',
  hood: 'Capô',
  trunk: 'Porta-malas',
  roof: 'Teto',
  frontBumper: 'Para-choque Dianteiro',
  rearBumper: 'Para-choque Traseiro',
}

const INSPECTION_KEYS = Object.keys(INSPECTION_LABELS) as (keyof VehicleInspection)[]

function defaultInspection(): VehicleInspection {
  return Object.fromEntries(
    INSPECTION_KEYS.map((k) => [k, { checked: false, note: '' }])
  ) as VehicleInspection
}

interface FormValues {
  customerId: string
  vehicleIndex: string
  laborPrice: number
  notes: string
  items: { name: string; qty: number; unitPrice: number }[]
  vehicleInspection: VehicleInspection
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function OrderForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromAppointment = (location.state as { fromAppointment?: FromAppointment } | null)?.fromAppointment

  const { tenantId } = useAuth()
  const { customers, create: createCustomer } = useCustomers()
  const { create } = useOrders()
  const { products, create: createProduct } = useProducts()
  const [selectedVehicles, setSelectedVehicles] = useState<Vehicle[]>([])
  const [showNewCustomer, setShowNewCustomer] = useState(false)

  const [draftOrderId] = useState(() => crypto.randomUUID())
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([])
  const [servicePhotos, setServicePhotos] = useState<string[]>([])
  const [itemPhotos, setItemPhotos] = useState<Record<number, { old?: string; new?: string }>>({})

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      customerId: '',
      vehicleIndex: '0',
      laborPrice: 0,
      notes: '',
      items: [{ name: '', qty: 1, unitPrice: 0 }],
      vehicleInspection: defaultInspection(),
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  const items = useWatch({ control, name: 'items' })
  const laborPrice = useWatch({ control, name: 'laborPrice' })
  const totalParts = (items ?? []).reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
    0
  )
  const total = totalParts + (Number(laborPrice) || 0)

  useEffect(() => {
    if (!fromAppointment || customers.length === 0) return
    const customer = customers.find((c) => c.id === fromAppointment.customerId)
    if (!customer) return
    setValue('customerId', customer.id)
    setSelectedVehicles(customer.vehicles)
    const vIdx = customer.vehicles.findIndex((v) => v.plate === fromAppointment.vehicleInfo.plate)
    setValue('vehicleIndex', String(Math.max(vIdx, 0)))
  }, [fromAppointment, customers, setValue])

  const handleCustomerCreated = (customer: Customer) => {
    setValue('customerId', customer.id)
    setValue('vehicleIndex', '0')
    setSelectedVehicles(customer.vehicles)
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value
    setValue('customerId', cid)
    setValue('vehicleIndex', '0')
    const customer = customers.find((c) => c.id === cid)
    setSelectedVehicles(customer?.vehicles ?? [])
  }

  const handleItemPhotoChange = (index: number, field: 'old' | 'new', url: string | undefined) => {
    setItemPhotos((prev) => ({
      ...prev,
      [index]: { ...prev[index], [field]: url },
    }))
  }

  const onSubmit = async (data: FormValues) => {
    const customer = customers.find((c) => c.id === data.customerId)
    if (!customer) return

    for (const item of data.items) {
      if (!item.name.trim()) continue
      const exists = products.some((p) => p.name.toLowerCase() === item.name.trim().toLowerCase())
      if (!exists) await createProduct({ name: item.name.trim(), unitPrice: Number(item.unitPrice) || 0, unit: 'un' })
    }

    const vehicle = customer.vehicles[Number(data.vehicleIndex)]
    const newOrder = await create({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleInfo: vehicle ?? { brand: '', model: '', plate: '', year: 0, km: 0 },
      laborPrice: Number(data.laborPrice) || 0,
      notes: data.notes,
      items: data.items.map((item, idx) => ({
        name: item.name,
        qty: Number(item.qty),
        unitPrice: Number(item.unitPrice),
        oldPartPhoto: itemPhotos[idx]?.old,
        newPartPhoto: itemPhotos[idx]?.new,
      })),
      vehicleInspection: data.vehicleInspection,
      vehiclePhotos,
      servicePhotos,
    })

    if (fromAppointment?.appointmentId && newOrder?.id) {
      await api.patch(`/appointments/${fromAppointment.appointmentId}/link-order`, { orderId: newOrder.id })
    }

    navigate('/orders')
  }

  const customerId = watch('customerId')
  const inspection = useWatch({ control, name: 'vehicleInspection' })

  const vehicleStoragePath = tenantId
    ? `tenants/${tenantId}/orders/${draftOrderId}/vehicle`
    : `orders/${draftOrderId}/vehicle`
  const serviceStoragePath = tenantId
    ? `tenants/${tenantId}/orders/${draftOrderId}/service`
    : `orders/${draftOrderId}/service`

  return (
    <div>
      <Navbar title="Nova OS" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Customer + Vehicle */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">Cliente *</label>
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
                onChange={handleCustomerChange}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white"
              >
                <option value="">Selecionar cliente…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {customerId && selectedVehicles.length > 0 && (
              <div>
                <label htmlFor="vehicleIndex" className="block text-sm font-medium text-gray-700 mb-1">Veículo *</label>
                <select
                  id="vehicleIndex"
                  {...register('vehicleIndex')}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white"
                >
                  {selectedVehicles.map((v) => (
                    <option key={v.plate} value={selectedVehicles.indexOf(v)}>
                      {v.brand} {v.model} — {v.plate}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Peças / Serviços</h3>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <ItemRow
                  key={field.id}
                  index={index}
                  register={register as unknown as UseFormRegister<FieldValues>}
                  control={control as unknown as Control<FieldValues>}
                  onRemove={() => remove(index)}
                  products={products}
                  onSelectProduct={(p) => {
                    setValue(`items.${index}.name`, p.name)
                    setValue(`items.${index}.unitPrice`, p.unitPrice)
                  }}
                  orderId={draftOrderId}
                  tenantId={tenantId ?? ''}
                  oldPartPhoto={itemPhotos[index]?.old}
                  newPartPhoto={itemPhotos[index]?.new}
                  onPhotoChange={(field, url) => handleItemPhotoChange(index, field, url)}
                />
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => append({ name: '', qty: 1, unitPrice: 0 })}
                className="text-sm text-brand-600 hover:underline self-start"
              >
                + Adicionar item manual
              </button>
              <ProductCatalog
                products={products}
                onSelect={(p) => append({ name: p.name, qty: 1, unitPrice: p.unitPrice })}
              />
            </div>
          </div>

          {/* Vistoria do veículo */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 text-sm mb-4">Vistoria do veículo</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {INSPECTION_KEYS.map((key) => (
                <div key={key} className="rounded-lg border border-gray-100 p-3 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register(`vehicleInspection.${key}.checked`)}
                      className="h-4 w-4 rounded border-gray-300 text-brand-400 focus:ring-brand-400"
                    />
                    <span className={`text-sm font-medium ${inspection?.[key]?.checked ? 'text-danger' : 'text-gray-700'}`}>
                      {INSPECTION_LABELS[key]}
                    </span>
                  </label>
                  {inspection?.[key]?.checked && (
                    <input
                      {...register(`vehicleInspection.${key}.note`)}
                      placeholder="Observação (ex: arranhado)"
                      className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:border-brand-400 focus:outline-none"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Fotos */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
            <h3 className="font-semibold text-gray-900 text-sm">Fotos</h3>
            <PhotoUploadBlock
              label="Fotos do veículo (entrada)"
              storagePath={vehicleStoragePath}
              urls={vehiclePhotos}
              onAdd={(url) => setVehiclePhotos((prev) => [...prev, url])}
              onRemove={(url) => setVehiclePhotos((prev) => prev.filter((u) => u !== url))}
            />
            <PhotoUploadBlock
              label="Fotos do serviço"
              storagePath={serviceStoragePath}
              urls={servicePhotos}
              onAdd={(url) => setServicePhotos((prev) => [...prev, url])}
              onRemove={(url) => setServicePhotos((prev) => prev.filter((u) => u !== url))}
            />
          </div>

          {/* Labor + Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label htmlFor="laborPrice" className="block text-sm font-medium text-gray-700 mb-1">Mão de obra (R$)</label>
              <input
                id="laborPrice"
                {...register('laborPrice', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min={0}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                id="notes"
                {...register('notes')}
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Peças</span>
              <span>{BRL(totalParts)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>Mão de obra</span>
              <span>{BRL(Number(laborPrice) || 0)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total</span>
              <span>{BRL(total)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !customerId}
              className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Salvando…' : 'Criar OS'}
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
