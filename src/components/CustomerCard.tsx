import { useNavigate } from 'react-router-dom'
import type { Customer } from '@/types'

interface Props {
  customer: Customer
  onEdit: (customer: Customer) => void
  onDelete: (id: string) => void
}

export function CustomerCard({ customer, onEdit, onDelete }: Readonly<Props>) {
  const navigate = useNavigate()

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900">{customer.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{customer.phone}</p>
          {customer.cpf && (
            <p className="text-xs text-gray-400 mt-0.5">CPF: {customer.cpf}</p>
          )}
        </div>
        <span className="shrink-0 text-xs bg-brand-50 text-brand-800 px-2 py-0.5 rounded-full">
          {(customer.vehicles ?? []).length} veículo{(customer.vehicles ?? []).length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Vehicles */}
      {(customer.vehicles ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(customer.vehicles ?? []).map((v) => (
            <span key={v.plate} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {v.plate} · {v.brand} {v.model}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onEdit(customer)}
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar
        </button>

        <button
          onClick={() => navigate(`/customers/${customer.id}/notas`)}
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Notas fiscais
        </button>

        <button
          onClick={() => onDelete(customer.id)}
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Excluir
        </button>
      </div>
    </div>
  )
}
