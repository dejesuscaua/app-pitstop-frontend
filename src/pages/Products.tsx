import { useState } from 'react'
import { Navbar } from '@/components/Navbar'
import { useProducts } from '@/hooks/useProducts'
import type { Product } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const UNITS = ['un', 'h', 'kg', 'm', 'm²', 'L', 'cx', 'par']

interface EditState {
  name: string
  unitPrice: string
  unit: string
}

function ProductRow({ product, onSave, onDelete }: Readonly<{
  product: Product
  onSave: (id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}>) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditState>({
    name: product.name,
    unitPrice: String(product.unitPrice),
    unit: product.unit,
  })

  const handleSave = async () => {
    setSaving(true)
    await onSave(product.id, {
      name: form.name,
      unitPrice: parseFloat(form.unitPrice) || 0,
      unit: form.unit,
    })
    setSaving(false)
    setEditing(false)
  }

  const handleCancel = () => {
    setForm({ name: product.name, unitPrice: String(product.unitPrice), unit: product.unit })
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-xl border border-brand-300 bg-white p-3">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="flex-1 min-w-0 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          placeholder="Nome do produto / serviço"
          autoFocus
        />
        <input
          value={form.unitPrice}
          onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
          type="number"
          step="0.01"
          min={0}
          placeholder="Preço"
          className="w-28 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
        />
        <select
          value={form.unit}
          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none bg-white"
        >
          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {saving ? '…' : 'Salvar'}
          </button>
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{product.name}</p>
        <p className="text-xs text-gray-400 mt-0.5">{BRL(product.unitPrice)} / {product.unit}</p>
      </div>
      <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-brand-600 hover:underline"
        >
          Editar
        </button>
        <button
          onClick={() => onDelete(product.id)}
          className="text-xs text-red-500 hover:underline"
        >
          Excluir
        </button>
      </div>
    </div>
  )
}

interface NewForm {
  name: string
  unitPrice: string
  unit: string
}

export function Products() {
  const { products, loading, create, update, remove } = useProducts()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newForm, setNewForm] = useState<NewForm>({ name: '', unitPrice: '', unit: 'un' })

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async () => {
    if (!newForm.name.trim()) return
    setSaving(true)
    await create({
      name: newForm.name,
      unitPrice: parseFloat(newForm.unitPrice) || 0,
      unit: newForm.unit,
    })
    setSaving(false)
    setNewForm({ name: '', unitPrice: '', unit: 'un' })
    setAdding(false)
  }

  const renderContent = () => {
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
          {search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado ainda.'}
        </div>
      )
    }
    return (
      <div className="space-y-2">
        {filtered.map((p) => (
          <ProductRow key={p.id} product={p} onSave={update} onDelete={remove} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Produtos / Serviços" />
      <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">

        {/* Add form */}
        {adding ? (
          <div className="bg-white rounded-xl border border-brand-300 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Novo produto / serviço</h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome (ex: Óleo 5W30, Alinhamento…)"
                className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <input
                value={newForm.unitPrice}
                onChange={(e) => setNewForm((f) => ({ ...f, unitPrice: e.target.value }))}
                type="number"
                step="0.01"
                min={0}
                placeholder="Preço (R$)"
                className="w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
              />
              <select
                value={newForm.unit}
                onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
                className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-sm focus:border-brand-400 focus:outline-none bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={saving || !newForm.name.trim()}
                className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {saving ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                onClick={() => { setAdding(false); setNewForm({ name: '', unitPrice: '', unit: 'un' }) }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto ou serviço…"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none"
            />
            <button
              onClick={() => setAdding(true)}
              className="rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              + Novo produto
            </button>
          </div>
        )}

        {!adding && renderContent()}
      </div>
    </div>
  )
}
