import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { Navbar } from '@/components/Navbar'
import { useCustomers } from '@/hooks/useCustomers'
import type { Customer } from '@/types'

type FormValues = Omit<Customer, 'id' | 'createdAt'>

const maskCPF = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')

const maskPhone = (v: string) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')

export function CustomerForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { customers, create, update } = useCustomers()

  const { register, handleSubmit, control, reset, setValue, formState: { isSubmitting, errors } } =
    useForm<FormValues>({
      defaultValues: { name: '', phone: '', cpf: '', vehicles: [] },
    })

  const { fields, append, remove } = useFieldArray({ control, name: 'vehicles' })

  useEffect(() => {
    if (isEdit && id) {
      const found = customers.find((c) => c.id === id)
      if (found) reset({ name: found.name, phone: found.phone, cpf: found.cpf, vehicles: found.vehicles })
    }
  }, [isEdit, id, customers, reset])

  const onSubmit = async (data: FormValues) => {
    data.vehicles = data.vehicles.map((v) => ({ ...v, plate: v.plate.toUpperCase() }))
    if (isEdit && id) {
      await update(id, data)
    } else {
      await create(data)
    }
    navigate('/customers')
  }

  return (
    <div>
      <Navbar title={isEdit ? 'Editar cliente' : 'Novo cliente'} />
      <div className="p-4 sm:p-6 max-w-xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input
                id="name"
                {...register('name', { required: 'Campo obrigatório' })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.name && <p className="text-xs text-danger mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone *</label>
              <input
                id="phone"
                {...register('phone', { required: 'Campo obrigatório' })}
                onChange={(e) => setValue('phone', maskPhone(e.target.value))}
                placeholder="(11) 99999-9999"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              {errors.phone && <p className="text-xs text-danger mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
              <input
                id="cpf"
                {...register('cpf')}
                onChange={(e) => setValue('cpf', maskCPF(e.target.value))}
                placeholder="000.000.000-00"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Vehicles */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 text-sm">Veículos</h3>
              <button
                type="button"
                onClick={() => append({ brand: '', model: '', plate: '', year: new Date().getFullYear(), km: 0 })}
                className="text-xs text-brand-600 hover:underline"
              >
                + Adicionar veículo
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Nenhum veículo adicionado.</p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="rounded-lg border border-gray-100 p-3 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`vehicles.${index}.brand`} className="block text-xs text-gray-500 mb-1">Marca</label>
                      <input
                        id={`vehicles.${index}.brand`}
                        {...register(`vehicles.${index}.brand`)}
                        placeholder="Ex: Fiat"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor={`vehicles.${index}.model`} className="block text-xs text-gray-500 mb-1">Modelo</label>
                      <input
                        id={`vehicles.${index}.model`}
                        {...register(`vehicles.${index}.model`)}
                        placeholder="Ex: Siena"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor={`vehicles.${index}.plate`} className="block text-xs text-gray-500 mb-1">Placa *</label>
                      <input
                        id={`vehicles.${index}.plate`}
                        {...register(`vehicles.${index}.plate`, {
                          validate: (v) =>
                            /^[A-Z]{3}\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/.test(v.toUpperCase()) ||
                            'Placa inválida',
                        })}
                        placeholder="ABC1234"
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm uppercase focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor={`vehicles.${index}.year`} className="block text-xs text-gray-500 mb-1">Ano</label>
                      <input
                        id={`vehicles.${index}.year`}
                        {...register(`vehicles.${index}.year`, { valueAsNumber: true })}
                        type="number"
                        min={1950}
                        max={new Date().getFullYear() + 1}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor={`vehicles.${index}.km`} className="block text-xs text-gray-500 mb-1">KM</label>
                      <input
                        id={`vehicles.${index}.km`}
                        {...register(`vehicles.${index}.km`, { valueAsNumber: true })}
                        type="number"
                        min={0}
                        className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-xs text-danger hover:underline"
                  >
                    Remover veículo
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors"
            >
              {isSubmitting ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
