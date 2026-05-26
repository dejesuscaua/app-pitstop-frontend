import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { useCustomers } from '@/hooks/useCustomers'

export function NotasFiscais() {
  const { customers, loading } = useCustomers()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = customers.filter((c) => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(q))
    )
  })

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )
    }
    if (filtered.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
          {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
        </div>
      )
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => navigate(`/customers/${c.id}/notas`)}
            className="text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-400 hover:shadow-sm transition-all group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 group-hover:text-brand-600 transition-colors">{c.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">{c.phone}</p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 shrink-0 text-gray-300 group-hover:text-brand-400 transition-colors mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            {c.vehicles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {c.vehicles.map((v) => (
                  <span key={v.plate} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {v.plate}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-brand-600 font-medium">Ver notas fiscais →</p>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Notas Fiscais" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente por nome, telefone ou placa…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <p className="text-xs text-gray-400">Selecione um cliente para ver ou adicionar notas fiscais.</p>
        {renderList()}
      </div>
    </div>
  )
}
