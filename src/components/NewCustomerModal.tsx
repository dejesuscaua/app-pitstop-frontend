import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Customer } from '@/types'

interface Props {
  readonly onCreate: (payload: Omit<Customer, 'id' | 'createdAt'>) => Promise<Customer>
  readonly onClose: () => void
  readonly onCreated: (customer: Customer) => void
}

interface FormValues {
  name: string
  phone: string
  cpf: string
  brand: string
  model: string
  plate: string
  year: number
  km: number
}

const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')

const maskCPF = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

export function NewCustomerModal({ onCreate, onClose, onCreated }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [showVehicle, setShowVehicle] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: '', phone: '', cpf: '',
      brand: '', model: '', plate: '',
      year: new Date().getFullYear(), km: 0,
    },
  })

  const onSubmit = async (data: FormValues) => {
    const vehicles = showVehicle && data.plate.trim()
      ? [{ brand: data.brand, model: data.model, plate: data.plate.toUpperCase(), year: Number(data.year), km: Number(data.km) }]
      : []
    const created = await onCreate({ name: data.name, phone: data.phone, cpf: data.cpf, vehicles })
    onCreated(created)
    onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-md rounded-2xl shadow-2xl p-0 backdrop:bg-black/40 bg-white"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Novo cliente</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
        <div>
          <label htmlFor="nc-name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
          <input id="nc-name" {...register('name', { required: 'Campo obrigatório' })} autoFocus
            placeholder="Nome completo"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label htmlFor="nc-phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
          <input id="nc-phone" {...register('phone', { required: 'Campo obrigatório' })}
            onChange={(e) => setValue('phone', maskPhone(e.target.value))}
            placeholder="(11) 99999-9999"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
          {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <label htmlFor="nc-cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
          <input id="nc-cpf" {...register('cpf')}
            onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
            placeholder="000.000.000-00"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none" />
        </div>

        <div>
          <button type="button" onClick={() => setShowVehicle((v) => !v)}
            className="text-sm text-brand-600 hover:underline">
            {showVehicle ? '− Remover veículo' : '+ Adicionar veículo'}
          </button>

          {showVehicle && (
            <div className="mt-3 rounded-lg border border-gray-100 p-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="nc-brand" className="block text-xs text-gray-500 mb-1">Marca</label>
                <input id="nc-brand" {...register('brand')} placeholder="Ex: Fiat"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="nc-model" className="block text-xs text-gray-500 mb-1">Modelo</label>
                <input id="nc-model" {...register('model')} placeholder="Ex: Siena"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="nc-plate" className="block text-xs text-gray-500 mb-1">Placa</label>
                <input id="nc-plate" {...register('plate')} placeholder="ABC1234"
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm uppercase focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="nc-year" className="block text-xs text-gray-500 mb-1">Ano</label>
                <input id="nc-year" {...register('year', { valueAsNumber: true })} type="number"
                  min={1950} max={new Date().getFullYear() + 1}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="nc-km" className="block text-xs text-gray-500 mb-1">KM</label>
                <input id="nc-km" {...register('km', { valueAsNumber: true })} type="number" min={0}
                  className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
            {isSubmitting ? 'Salvando…' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
