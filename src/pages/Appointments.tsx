import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Navbar } from '@/components/Navbar'
import { WorkingHoursModal } from '@/components/WorkingHoursModal'
import { useAppointments } from '@/hooks/useAppointments'
import { useWorkingHours } from '@/hooks/useWorkingHours'
import type { Appointment, AppointmentStatus } from '@/types'

// ── Constants ──────────────────────────────────────────────────────────────────

const ROW_H = 64
const HOUR_START = 0
const HOUR_END = 23
const HOURS = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  confirmado: 'Confirmado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  agendado: 'bg-green-100 text-green-700 border-green-200',
  confirmado: 'bg-green-200 text-green-800 border-green-300',
  em_andamento: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  concluido: 'bg-gray-100 text-gray-600 border-gray-200',
  cancelado: 'bg-red-100 text-red-600 border-red-200',
}

const STATUS_BLOCK: Record<AppointmentStatus, string> = {
  agendado: 'bg-green-500 border-green-600',
  confirmado: 'bg-green-700 border-green-800',
  em_andamento: 'bg-yellow-400 border-yellow-500',
  concluido: 'bg-gray-400 border-gray-500',
  cancelado: 'bg-red-400 border-red-500',
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  d.setDate(d.getDate() - d.getDay())
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function formatDate(d: Date) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function minutesFromMidnight(isoStr: string) {
  const d = new Date(isoStr)
  return d.getHours() * 60 + d.getMinutes()
}


// ── Current time hook ──────────────────────────────────────────────────────────

function useCurrentTime() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ── Appointment detail panel ───────────────────────────────────────────────────

function AppointmentPanel({
  apt,
  onClose,
  onStatusChange,
  onDelete,
}: {
  readonly apt: Appointment
  readonly onClose: () => void
  readonly onStatusChange: (id: string, s: AppointmentStatus) => void
  readonly onDelete: (id: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()

  useEffect(() => { dialogRef.current?.showModal() }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-md rounded-2xl shadow-2xl p-0 backdrop:bg-black/40 bg-white"
    >
      <div className="flex items-start justify-between px-6 pt-5 pb-0">
        <div>
          <p className="font-bold text-gray-900 text-lg">{apt.customerName}</p>
          <p className="text-xs text-gray-400">{apt.customerPhone}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-1" aria-label="Fechar">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-6 py-4 space-y-2 text-sm text-gray-700">
        <div className="flex gap-2">
          <span className="text-gray-400 w-20 shrink-0">Veículo</span>
          <span>{apt.vehicleInfo.brand} {apt.vehicleInfo.model} — {apt.vehicleInfo.plate}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-20 shrink-0">Data/Hora</span>
          <span>{new Date(apt.scheduledAt).toLocaleDateString('pt-BR')} às {formatTime(apt.scheduledAt)}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-20 shrink-0">Duração</span>
          <span>{apt.estimatedDuration} min</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-400 w-20 shrink-0">Serviço</span>
          <span>{apt.serviceDescription}</span>
        </div>
        {apt.notes && (
          <div className="flex gap-2">
            <span className="text-gray-400 w-20 shrink-0">Notas</span>
            <span>{apt.notes}</span>
          </div>
        )}
      </div>

      <div className="px-6 pb-3">
        <p className="text-xs font-medium text-gray-500 mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
            <button key={s} type="button"
              onClick={() => { onStatusChange(apt.id, s) }}
              className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-opacity ${
                apt.status === s ? STATUS_COLOR[s] : 'bg-gray-50 text-gray-400 border-gray-200 opacity-60 hover:opacity-100'
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 px-6 pb-6 pt-2">
        <Link to={`/appointments/${apt.id}/edit`}
          className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
          Editar
        </Link>
        {apt.orderId ? (
          <Link to={`/orders/${apt.orderId}`}
            className="flex-1 text-center rounded-lg bg-brand-50 border border-brand-200 px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-100 transition-colors">
            Ver OS →
          </Link>
        ) : (
          <button type="button"
            onClick={() => navigate('/orders/new', { state: { fromAppointment: { appointmentId: apt.id, customerId: apt.customerId, customerName: apt.customerName, customerPhone: apt.customerPhone, vehicleInfo: apt.vehicleInfo } } })}
            className="flex-1 rounded-lg bg-brand-400 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Gerar OS
          </button>
        )}
        <button type="button"
          onClick={() => { onDelete(apt.id); onClose() }}
          className="rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors">
          Excluir
        </button>
      </div>
    </dialog>
  )
}

// ── Teams-style calendar ───────────────────────────────────────────────────────

const GUTTER_W = 52 // px — fixed width for the time gutter

function TeamsCalendar({
  appointments,
  weekStart,
  workingHoursClosed,
  onSelectSlot,
  onSelectApt,
}: {
  readonly appointments: Appointment[]
  readonly weekStart: Date
  readonly workingHoursClosed: boolean[]
  readonly onSelectSlot: (date: string, time: string) => void
  readonly onSelectApt: (apt: Appointment) => void
}) {
  const now = useCurrentTime()
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const scrollRef = useRef<HTMLDivElement>(null)
  const GRID_HEIGHT = HOURS.length * ROW_H

  // Scroll to show current hour (or HOUR_START) on mount
  useEffect(() => {
    if (!scrollRef.current) return
    const clampedHour = Math.max(HOUR_START, Math.min(now.getHours(), HOUR_END - 1))
    scrollRef.current.scrollTop = (clampedHour - HOUR_START - 1) * ROW_H
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  // top offset relative to HOUR_START
  const nowTop = ((nowMinutes - HOUR_START * 60) / 60) * ROW_H

  const aptsByDay = weekDays.map((day) =>
    appointments.filter((apt) => isSameDay(new Date(apt.scheduledAt), day))
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">

      {/* ── Header row ── */}
      <div className="flex border-b border-gray-200 bg-white">
        <div style={{ width: GUTTER_W, minWidth: GUTTER_W }} className="shrink-0 border-r border-gray-100" />
        {weekDays.map((day, di) => {
          const isToday = isSameDay(day, now)
          const isClosed = workingHoursClosed[day.getDay()]
          const count = aptsByDay[di].length
          let hBg = ''
          if (isClosed) { hBg = 'bg-gray-50' }
          else if (isToday) { hBg = 'bg-brand-50/50' }
          return (
            <div key={day.toISOString()}
              className={`flex-1 flex flex-col items-center py-2 border-l border-gray-100 select-none ${hBg}`}>
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${isToday ? 'text-brand-500' : 'text-gray-400'}`}>
                {WEEK_DAYS_SHORT[day.getDay()]}
              </span>
              <div className={`mt-1 w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold
                ${isToday ? 'bg-brand-500 text-white' : 'text-gray-700'}`}>
                {day.getDate()}
              </div>
              {count > 0 && (
                <span className={`text-[10px] font-semibold tabular-nums ${isToday ? 'text-brand-400' : 'text-gray-300'}`}>
                  {count}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Scrollable grid ── */}
      <div ref={scrollRef} style={{ height: 'calc(100vh - 280px)', overflowY: 'auto' }}>
        {/* Inner: gutter + day columns, all same fixed height */}
        <div style={{ display: 'flex', height: GRID_HEIGHT, position: 'relative' }}>

          {/* Time gutter */}
          <div style={{ width: GUTTER_W, minWidth: GUTTER_W, height: GRID_HEIGHT, position: 'relative', flexShrink: 0 }}
            className="border-r border-gray-100 bg-gray-50/40 select-none">
            {HOURS.map((h) => (
              <div key={h} style={{ position: 'absolute', top: (h - HOUR_START) * ROW_H, left: 0, right: 0 }}
                className="flex justify-end pr-2 pt-0.5">
                <span className={`text-[10px] font-mono leading-none ${h === now.getHours() ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => {
            const isClosed = workingHoursClosed[day.getDay()]
            const isToday = isSameDay(day, now)
            const dateStr = day.toISOString().slice(0, 10)
            let bg = '#fff'
            if (isClosed) { bg = '#f9fafb' }
            else if (isToday) { bg = 'rgb(240 253 244 / 0.3)' }

            return (
              <div key={dateStr}
                style={{ flex: 1, minWidth: 0, height: GRID_HEIGHT, position: 'relative', background: bg, borderLeft: '1px solid #f3f4f6' }}>

                {/* Hour grid lines */}
                {HOURS.map((h) => (
                  <div key={h}
                    style={{ position: 'absolute', top: (h - HOUR_START) * ROW_H, left: 0, right: 0, height: 1, background: '#f3f4f6' }} />
                ))}
                {HOURS.map((h) => (
                  <div key={`hh-${h}`}
                    style={{ position: 'absolute', top: (h - HOUR_START) * ROW_H + ROW_H / 2, left: 0, right: 0, height: 1, borderTop: '1px dashed #e5e7eb' }} />
                ))}

                {/* Closed overlay */}
                {isClosed && (
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
                    backgroundImage: 'repeating-linear-gradient(45deg,transparent,transparent 6px,rgba(0,0,0,0.04) 6px,rgba(0,0,0,0.04) 7px)' }} />
                )}

                {/* Click to schedule */}
                {!isClosed && (
                  <button type="button"
                    onClick={() => onSelectSlot(dateStr, '08:00')}
                    style={{ position: 'absolute', inset: 0, width: '100%', zIndex: 0 }}
                    className="opacity-0 hover:opacity-100 hover:bg-brand-400/5 transition-opacity cursor-pointer"
                    aria-label={`Agendar em ${formatDate(day)}`} />
                )}

                {/* Appointment blocks */}
                {aptsByDay[di].map((apt) => {
                  const startMin = minutesFromMidnight(apt.scheduledAt)
                  const topPx = ((startMin - HOUR_START * 60) / 60) * ROW_H
                  const heightPx = Math.max((apt.estimatedDuration / 60) * ROW_H, 24)
                  return (
                    <button key={apt.id} type="button"
                      onClick={(e) => { e.stopPropagation(); onSelectApt(apt) }}
                      style={{ position: 'absolute', top: topPx + 1, height: heightPx - 2, left: 2, right: 2, zIndex: 10 }}
                      className={`rounded-md text-left px-1.5 py-0.5 text-white text-[10px] font-medium border-l-[3px] shadow-sm overflow-hidden hover:brightness-95 transition-all ${STATUS_BLOCK[apt.status]}`}
                      title={`${apt.customerName} — ${apt.serviceDescription}`}>
                      <span className="font-bold block leading-tight tabular-nums">{formatTime(apt.scheduledAt)}</span>
                      <span className="block truncate leading-tight">{apt.customerName}</span>
                      {heightPx > 46 && (
                        <span className="block truncate opacity-80 text-[9px]">{apt.serviceDescription}</span>
                      )}
                    </button>
                  )
                })}

                {/* Now line */}
                {isToday && nowTop >= 0 && nowTop <= GRID_HEIGHT && (
                  <div style={{ position: 'absolute', top: nowTop, left: 0, right: 0, zIndex: 20, pointerEvents: 'none', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginLeft: -4, flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 1, background: '#ef4444' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── List view ──────────────────────────────────────────────────────────────────

function ListView({
  appointments,
  filter,
  onSelectApt,
}: {
  readonly appointments: Appointment[]
  readonly filter: 'hoje' | 'semana' | 'todos'
  readonly onSelectApt: (apt: Appointment) => void
}) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekEnd = addDays(todayStart, 7)

  const filtered = appointments.filter((apt) => {
    const d = new Date(apt.scheduledAt)
    if (filter === 'hoje') return isSameDay(d, now)
    if (filter === 'semana') return d >= todayStart && d <= weekEnd
    return true
  })

  if (filtered.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-400">
        Nenhum agendamento encontrado.
      </div>
    )
  }

  const grouped: Record<string, Appointment[]> = {}
  for (const apt of filtered) {
    const key = new Date(apt.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(apt)
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateLabel, apts]) => (
        <div key={dateLabel}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2 capitalize">{dateLabel}</p>
          <div className="space-y-2">
            {apts.map((apt) => (
              <button key={apt.id} type="button" onClick={() => onSelectApt(apt)}
                className="w-full text-left flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 hover:border-brand-200 transition-colors">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{apt.customerName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {`${formatTime(apt.scheduledAt)} · ${apt.vehicleInfo.brand} ${apt.vehicleInfo.model} · ${apt.serviceDescription}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  {apt.orderId && <span className="text-xs text-brand-600 font-medium">OS</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLOR[apt.status]}`}>
                    {STATUS_LABEL[apt.status]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function Appointments() {
  const navigate = useNavigate()
  const { appointments, loading, updateStatus, remove } = useAppointments()
  const { workingHours, loading: loadingHours, save: saveHours } = useWorkingHours()

  const [view, setView] = useState<'calendario' | 'lista'>('calendario')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [listFilter, setListFilter] = useState<'hoje' | 'semana' | 'todos'>('semana')
  const [selected, setSelected] = useState<Appointment | null>(null)
  const [showHours, setShowHours] = useState(false)

  const prevWeek = () => setWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setWeekStart((d) => addDays(d, 7))
  const goToday = () => setWeekStart(startOfWeek(new Date()))

  const weekLabel = () => {
    const end = addDays(weekStart, 6)
    return `${formatDate(weekStart)} – ${formatDate(end)}`
  }

  const workingHoursClosed = workingHours.map((d) => !d.open)

  if (loading || loadingHours) {
    return (
      <div>
        <Navbar title="Agendamentos" />
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-400 border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navbar title="Agendamentos" />

      <div className="p-4 sm:p-6 space-y-4">
        {/* Top bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
            <button type="button" onClick={() => setView('calendario')}
              className={`px-4 py-2 transition-colors ${view === 'calendario' ? 'bg-brand-400 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Calendário
            </button>
            <button type="button" onClick={() => setView('lista')}
              className={`px-4 py-2 transition-colors ${view === 'lista' ? 'bg-brand-400 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
              Lista
            </button>
          </div>

          {/* Week nav */}
          {view === 'calendario' && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={prevWeek} aria-label="Semana anterior"
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button type="button" onClick={goToday}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Hoje
              </button>
              <button type="button" onClick={nextWeek} aria-label="Próxima semana"
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <span className="text-sm text-gray-500 font-medium">{weekLabel()}</span>
            </div>
          )}

          {/* List filter */}
          {view === 'lista' && (
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
              {(['hoje', 'semana', 'todos'] as const).map((f) => {
                const FILTER_LABELS = { hoje: 'Hoje', semana: 'Esta semana', todos: 'Todos' } as const
                const filterLabel = FILTER_LABELS[f]
                return (
                  <button key={f} type="button" onClick={() => setListFilter(f)}
                    className={`px-3 py-2 transition-colors ${listFilter === f ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400 hover:bg-gray-50'}`}>
                    {filterLabel}
                  </button>
                )
              })}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => setShowHours(true)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m-4-8a8 8 0 100 16 8 8 0 000-16z" />
              </svg>
              Expediente
            </button>
            <Link to="/appointments/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
              + Agendar
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
            <span key={s} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${STATUS_COLOR[s]}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_BLOCK[s].split(' ')[0]}`} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>

        {/* Content */}
        {view === 'calendario' ? (
          <TeamsCalendar
            appointments={appointments}
            weekStart={weekStart}
            workingHoursClosed={workingHoursClosed}
            onSelectSlot={(date, time) => navigate('/appointments/new', { state: { prefillDate: date, prefillTime: time } })}
            onSelectApt={setSelected}
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <ListView appointments={appointments} filter={listFilter} onSelectApt={setSelected} />
          </div>
        )}
      </div>

      {/* Appointment detail */}
      {selected && (
        <AppointmentPanel
          apt={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(id, s) => {
            updateStatus(id, s)
            setSelected((prev) => prev ? { ...prev, status: s } : null)
          }}
          onDelete={(id) => { remove(id); setSelected(null) }}
        />
      )}

      {/* Working hours */}
      {showHours && (
        <WorkingHoursModal
          initial={workingHours}
          onClose={() => setShowHours(false)}
          onSave={saveHours}
        />
      )}
    </div>
  )
}
