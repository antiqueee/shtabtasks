'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface Task {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  status: string
  assigneeName: string | null
  assigneeColor: string | null
  tagName: string | null
  tagColor: string | null
}

interface CalendarGridProps {
  tasks: Task[]
  year: number
  month: number
}

const STATUS_COLOR: Record<string, string> = {
  todo: '#f87171',
  in_progress: '#fbbf24',
  done: '#34d399',
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function formatTime(date: Date | null): string {
  if (!date) return 'без времени'

  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

interface OpenTaskState {
  task: Task
  top: number
  left: number
}

function getFloatingPosition(target: HTMLElement): { top: number; left: number } {
  const rect = target.getBoundingClientRect()
  const width = Math.min(352, window.innerWidth - 24)
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
  const belowTop = rect.bottom + 8
  const top = belowTop + 260 > window.innerHeight ? Math.max(12, rect.top - 268) : belowTop

  return { top, left }
}

export function CalendarGrid({ tasks, year, month }: CalendarGridProps) {
  const [openTask, setOpenTask] = useState<OpenTaskState | null>(null)

  useEffect(() => {
    if (!openTask) return

    const close = () => setOpenTask(null)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)

    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [openTask])

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday-based weekday (0=Mon, 6=Sun)
  const startWday = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((daysInMonth + startWday) / 7) * 7

  // Group tasks by day (YYYY-MM-DD in Moscow time)
  const byDay = new Map<string, Task[]>()
  for (const task of tasks) {
    if (!task.dueAt) continue
    const key = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(task.dueAt)
    const arr = byDay.get(key) ?? []
    arr.push(task)
    byDay.set(key, arr)
  }

  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Moscow' }).format(new Date())

  const cells: (number | null)[] = []
  for (let i = 0; i < totalCells; i++) {
    const day = i - startWday + 1
    cells.push(day >= 1 && day <= daysInMonth ? day : null)
  }

  return (
    <div className="relative rounded-xl border bg-card shadow-sm overflow-visible">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 overflow-hidden rounded-t-xl border-b">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 overflow-visible">
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="min-h-20 border-b border-r last:border-r-0 bg-muted/20" />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = byDay.get(dateStr) ?? []
          const isToday = dateStr === today
          return (
            <div
              key={dateStr}
              className={`relative min-h-24 border-b border-r p-1.5 transition-colors hover:bg-muted/30 ${
                (idx + 1) % 7 === 0 ? 'border-r-0' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${
                    isToday
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  {day}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="space-y-1">
                  {dayTasks.slice(0, 4).map((t) => {
                    const isOpen = openTask?.task.id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={(event) => {
                          setOpenTask(isOpen ? null : { task: t, ...getFloatingPosition(event.currentTarget) })
                        }}
                        className="block w-full truncate rounded-full border bg-background px-2 py-1 text-left text-[11px] leading-none shadow-sm hover:border-foreground/30"
                        style={{ borderColor: STATUS_COLOR[t.status] ?? '#94a3b8' }}
                        title={t.title}
                      >
                        {formatTime(t.dueAt)}
                        {' · '}
                        {t.title}
                      </button>
                    )
                  })}
                  {dayTasks.length > 4 && (
                    <span className="block text-xs text-muted-foreground">+{dayTasks.length - 4}</span>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {openTask
        ? createPortal(
            <div
              className="fixed z-[1000] w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border bg-popover p-4 text-popover-foreground shadow-2xl"
              style={{ top: openTask.top, left: openTask.left }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 block h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STATUS_COLOR[openTask.task.status] ?? '#94a3b8' }}
                />
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-tight">{openTask.task.title}</p>
                  {openTask.task.description ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                      {openTask.task.description}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-muted-foreground">{formatTime(openTask.task.dueAt)}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {openTask.task.assigneeName && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: openTask.task.assigneeColor ?? '#64748b' }}
                      >
                        {openTask.task.assigneeName}
                      </span>
                    )}
                    {openTask.task.tagName && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium text-white"
                        style={{ backgroundColor: openTask.task.tagColor ?? '#64748b' }}
                      >
                        {openTask.task.tagName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenTask(null)}
                  className="ml-auto text-sm text-muted-foreground hover:text-foreground"
                >
                  Закрыть
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
