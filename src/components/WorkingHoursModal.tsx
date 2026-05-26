import { useEffect, useRef, useState } from 'react'
import type { WorkingHours, DayHours } from '@/types'

interface Props {
  readonly initial: WorkingHours
  readonly onClose: () => void
  readonly onSave: (hours: WorkingHours) => Promise<void>
}

const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export function WorkingHoursModal({ initial, onClose, onSave }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [hours, setHours] = useState<WorkingHours>(() => structuredClone(initial))
  const [saving, setSaving] = useState(false)

  useEffect(() => { dialogRef.current?.showModal() }, [])

  const update = (dayIdx: number, patch: Partial<DayHours>) => {
    setHours((prev) => {
      const next = structuredClone(prev)
      next[dayIdx] = { ...next[dayIdx], ...patch }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(hours)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-lg rounded-2xl shadow-2xl p-0 backdrop:bg-black/40 bg-white"
    >
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Expediente de trabalho</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Fechar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-6 space-y-3">
        {DAY_NAMES.map((name, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Toggle */}
            <button
              type="button"
              onClick={() => update(i, { open: !hours[i].open })}
              aria-pressed={hours[i].open}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                hours[i].open ? 'bg-brand-400' : 'bg-gray-200'
              }`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                hours[i].open ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>

            {/* Day name */}
            <span className={`w-20 text-sm font-medium ${hours[i].open ? 'text-gray-900' : 'text-gray-400'}`}>
              {name}
            </span>

            {hours[i].open ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={hours[i].start}
                  onChange={(e) => update(i, { start: e.target.value })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                />
                <span className="text-gray-400 text-sm">até</span>
                <input
                  type="time"
                  value={hours[i].end}
                  onChange={(e) => update(i, { end: e.target.value })}
                  className="rounded-lg border border-gray-200 px-2 py-1 text-sm focus:border-brand-400 focus:outline-none"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400 flex-1">Fechado</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 px-6 pb-6">
        <button type="button" onClick={onClose}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="flex-1 rounded-lg bg-brand-400 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60 transition-colors">
          {saving ? 'Salvando…' : 'Salvar expediente'}
        </button>
      </div>
    </dialog>
  )
}
