import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { CustomerCard } from '@/components/CustomerCard'
import { useCustomers } from '@/hooks/useCustomers'
import type { Customer } from '@/types'

export function Customers() {
  const { customers, loading, remove } = useCustomers()
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

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cliente?')) return
    await remove(id)
  }

  const renderList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      )
    }
    if (filtered.length === 0) {
      const msg = search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'
      return (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
          {msg}
        </div>
      )
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <CustomerCard
            key={c.id}
            customer={c}
            onEdit={(customer: Customer) => navigate(`/customers/${customer.id}/edit`)}
            onDelete={handleDelete}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Clientes" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, telefone ou placa…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          <button
            onClick={() => navigate('/customers/new')}
            className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors sm:w-auto"
          >
            + Novo cliente
          </button>
        </div>
        {renderList()}
      </div>
    </div>
  )
}
