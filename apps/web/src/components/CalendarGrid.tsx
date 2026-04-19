'use client'

import { useState } from 'react'

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

export function CalendarGrid({ tasks, year, month }: CalendarGridProps) {
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

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
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7">
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
                    const isOpen = openTaskId === t.id
                    return (
                      <button
                      key={t.id}
                        type="button"
                        onClick={() => setOpenTaskId(isOpen ? null : t.id)}
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

              {dayTasks.map((t) =>
                openTaskId === t.id ? (
                  <div
                    key={`${t.id}-popover`}
                    className="absolute left-1 right-1 top-12 z-30 rounded-xl border bg-popover p-3 text-popover-foreground shadow-2xl sm:left-2 sm:right-auto sm:w-80"
                  >
                    <div className="flex items-start gap-2">
                        <span
                        className="mt-1 block h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: STATUS_COLOR[t.status] ?? '#94a3b8' }}
                        />
                        <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug">{t.title}</p>
                        {t.description ? (
                          <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">{t.description}</p>
                        ) : null}
                          <p className="mt-2 text-xs text-muted-foreground">{formatTime(t.dueAt)}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {t.assigneeName && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: t.assigneeColor ?? '#64748b' }}
                              >
                                {t.assigneeName}
                              </span>
                            )}
                            {t.tagName && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full text-white font-medium"
                                style={{ backgroundColor: t.tagColor ?? '#64748b' }}
                              >
                                {t.tagName}
                              </span>
                            )}
                          </div>
                        </div>
                      <button
                        type="button"
                        onClick={() => setOpenTaskId(null)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                      >
                        Закрыть
                      </button>
                      </div>
                  </div>
                ) : null,
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
