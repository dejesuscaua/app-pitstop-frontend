import { useRef, useState, useId } from 'react'
import type { UseFormRegister, Control, FieldValues } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { storage } from '@/services/firebase'
import type { Product } from '@/types'

const BRL = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

interface Props {
  readonly index: number
  readonly register: UseFormRegister<FieldValues>
  readonly control: Control<FieldValues>
  readonly onRemove: () => void
  readonly products: Product[]
  readonly onSelectProduct: (product: Pick<Product, 'name' | 'unitPrice'>) => void
  readonly orderId: string
  readonly tenantId: string
  readonly oldPartPhoto?: string
  readonly newPartPhoto?: string
  readonly onPhotoChange: (field: 'old' | 'new', url: string | undefined) => void
}

function MiniPhotoUpload({
  label,
  storagePath,
  url,
  onUrl,
}: {
  readonly label: string
  readonly storagePath: string
  readonly url?: string
  readonly onUrl: (url: string | undefined) => void
}) {
  const inputId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = (file: File) => {
    const path = `${storagePath}/${Date.now()}_${file.name}`
    const sRef = storageRef(storage, path)
    setUploading(true)
    const task = uploadBytesResumable(sRef, file)
    task.on('state_changed', null, () => setUploading(false), async () => {
      const dlUrl = await getDownloadURL(task.snapshot.ref)
      onUrl(dlUrl)
      setUploading(false)
    })
  }

  if (url) {
    return (
      <div className="relative">
        <img
          src={url}
          alt={label}
          className="h-10 w-10 object-cover rounded-md border border-gray-200"
          title={label}
        />
        <button
          type="button"
          onClick={() => onUrl(undefined)}
          className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-[10px] leading-none"
          aria-label={`Remover ${label}`}
        >
          ×
        </button>
      </div>
    )
  }

  return (
    <>
      <input
        ref={fileRef}
        id={inputId}
        type="file"
        accept="image/*"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        disabled={uploading}
        className="hidden"
      />
      <label
        htmlFor={inputId}
        className="flex items-center gap-1 rounded-md border border-dashed border-gray-300 px-2 py-1 text-xs text-gray-400 cursor-pointer hover:border-brand-300 hover:text-brand-600 transition-colors"
        title={label}
      >
        {uploading ? '…' : (
          <>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {label}
          </>
        )}
      </label>
    </>
  )
}

export function ItemRow({
  index,
  register,
  control,
  onRemove,
  products,
  onSelectProduct,
  orderId,
  tenantId,
  oldPartPhoto,
  newPartPhoto,
  onPhotoChange,
}: Props) {
  const qty = useWatch({ control, name: `items.${index}.qty` }) as number | undefined
  const unitPrice = useWatch({ control, name: `items.${index}.unitPrice` }) as number | undefined
  const lineTotal = (Number(qty) || 0) * (Number(unitPrice) || 0)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = query.trim().length > 0
    ? products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : products
  const suggestions = filtered.slice(0, 8)

  const nameField = register(`items.${index}.name`)

  const basePartPath = tenantId
    ? `tenants/${tenantId}/orders/${orderId}/parts/${index}`
    : `orders/${orderId}/parts/${index}`

  return (
    <div className="rounded-lg border border-gray-100 p-3 space-y-2 bg-gray-50">
      {/* Description with autocomplete */}
      <div className="relative">
        <div className="relative">
          <input
            {...nameField}
            onChange={(e) => {
              nameField.onChange(e)
              setQuery(e.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder={products.length > 0 ? `Nome do produto (${products.length} no catálogo)` : 'Nome do produto ou serviço'}
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 bg-white pl-3 pr-8 py-2 text-sm focus:border-brand-400 focus:outline-none"
          />
          {products.length > 0 && (
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>

        {open && suggestions.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {query.trim().length === 0 && (
              <p className="px-3 py-1.5 text-xs text-gray-400 bg-gray-50 border-b border-gray-100">
                Produtos cadastrados
              </p>
            )}
            {suggestions.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => {
                  onSelectProduct({ name: p.name, unitPrice: p.unitPrice })
                  setQuery(p.name)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-brand-50 transition-colors"
              >
                <span className="text-gray-800 font-medium text-left">{p.name}</span>
                <span className="text-gray-400 text-xs ml-3 shrink-0">{BRL(p.unitPrice)} / {p.unit}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Qty + Unit price + Total + Remove */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 min-w-0">
          <label htmlFor={`qty-${index}`} className="text-xs text-gray-400 shrink-0">Qtd</label>
          <input
            id={`qty-${index}`}
            {...register(`items.${index}.qty`, { valueAsNumber: true })}
            type="number"
            min={1}
            className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1 flex-1 min-w-0">
          <label htmlFor={`price-${index}`} className="text-xs text-gray-400 shrink-0">R$</label>
          <input
            id={`price-${index}`}
            {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
            type="number"
            step="0.01"
            min={0}
            placeholder="0,00"
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none"
          />
        </div>
        <span className="text-sm font-semibold text-gray-700 shrink-0 min-w-[72px] text-right">
          {BRL(lineTotal)}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-gray-300 hover:text-red-400 transition-colors"
          aria-label="Remover item"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Part photos */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-gray-400 shrink-0">Fotos da peça:</span>
        <MiniPhotoUpload
          label="Retirada"
          storagePath={`${basePartPath}/old`}
          url={oldPartPhoto}
          onUrl={(url) => onPhotoChange('old', url)}
        />
        <MiniPhotoUpload
          label="Nova"
          storagePath={`${basePartPath}/new`}
          url={newPartPhoto}
          onUrl={(url) => onPhotoChange('new', url)}
        />
      </div>
    </div>
  )
}
