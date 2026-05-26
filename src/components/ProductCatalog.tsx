import { useState } from 'react'
import type { Product } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Props {
  readonly products: Product[]
  readonly onSelect: (product: Pick<Product, 'name' | 'unitPrice'>) => void
}

export function ProductCatalog({ products, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (products.length === 0) return null

  return (
    <div>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch('') }}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a1 1 0 00-1 1v10a1 1 0 001 1h16a1 1 0 001-1V8a1 1 0 00-1-1zM16 3H8l-1 4h10l-1-4z" />
        </svg>
        {open ? 'Fechar catálogo' : '+ Adicionar do catálogo'}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
            autoFocus
          />

          {filtered.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-3">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid gap-1.5 sm:grid-cols-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect({ name: p.name, unitPrice: p.unitPrice })
                    setOpen(false)
                    setSearch('')
                  }}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left hover:border-brand-400 hover:bg-brand-50 transition-colors group"
                >
                  <span className="text-sm font-medium text-gray-800 group-hover:text-brand-700">{p.name}</span>
                  <span className="text-xs text-gray-400 ml-2 shrink-0">{BRL(p.unitPrice)}<span className="text-gray-300"> / {p.unit}</span></span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
