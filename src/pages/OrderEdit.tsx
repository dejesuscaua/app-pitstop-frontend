import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import type { Control, UseFormRegister, FieldValues } from 'react-hook-form'
import { Navbar } from '@/components/Navbar'
import { ItemRow } from '@/components/ItemRow'
import { ProductCatalog } from '@/components/ProductCatalog'
import { useOrders } from '@/hooks/useOrders'
import { useProducts } from '@/hooks/useProducts'

interface FormValues {
  laborPrice: number
  notes: string
  items: { name: string; qty: number; unitPrice: number }[]
}

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function OrderEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { orders, update } = useOrders()
  const { products, create: createProduct } = useProducts()

  const order = orders.find((o) => o.id === id)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { laborPrice: 0, notes: '', items: [] },
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
    if (order) {
      reset({
        laborPrice: order.laborPrice,
        notes: order.notes,
        items: (order.items ?? []).map((i) => ({ name: i.name, qty: i.qty, unitPrice: i.unitPrice })),
      })
    }
  }, [order, reset])

  if (!order) {
    return (
      <div>
        <Navbar title="OS não encontrada" />
        <div className="p-6 text-gray-400">OS não encontrada.</div>
      </div>
    )
  }

  if (order.status !== 'open') {
    return (
      <div>
        <Navbar title="Editar OS" />
        <div className="p-6 text-gray-500">Só é possível editar ordens com status <strong>aberta</strong>.</div>
      </div>
    )
  }

  const onSubmit = async (data: FormValues) => {
    for (const item of data.items) {
      if (!item.name.trim()) continue
      const exists = products.some((p) => p.name.toLowerCase() === item.name.trim().toLowerCase())
      if (!exists) await createProduct({ name: item.name.trim(), unitPrice: Number(item.unitPrice) || 0, unit: 'un' })
    }

    await update(order.id, {
      items: data.items.map((i) => ({
        name: i.name,
        qty: Number(i.qty),
        unitPrice: Number(i.unitPrice),
      })),
      laborPrice: Number(data.laborPrice) || 0,
      notes: data.notes,
    })
    navigate(`/orders/${order.id}`)
  }

  const v = order.vehicleInfo

  return (
    <div>
      <Navbar title={`Editar OS #${order.id.slice(0, 8).toUpperCase()}`} />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* Read-only customer + vehicle */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-1">
            <p className="font-semibold text-gray-900">{order.customerName}</p>
            <p className="text-sm text-gray-500">
              {v.brand} {v.model} {v.year} · {v.plate} · {v.km.toLocaleString('pt-BR')} km
            </p>
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
              onClick={() => navigate(`/orders/${order.id}`)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
