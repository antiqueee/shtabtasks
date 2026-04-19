'use client'

import { useState } from 'react'

interface Task {
  id: string
  title: string
  dueAt: Date
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

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

export function CalendarGrid({ tasks, year, month }: CalendarGridProps) {
  const [openDay, setOpenDay] = useState<string | null>(null)

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  // Monday-based weekday (0=Mon, 6=Sun)
  const startWday = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((daysInMonth + startWday) / 7) * 7

  // Group tasks by day (YYYY-MM-DD in Moscow time)
  const byDay = new Map<string, Task[]>()
  for (const task of tasks) {
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
          const isOpen = openDay === dateStr

          return (
            <div
              key={dateStr}
              className={`min-h-20 border-b border-r last-in-row:border-r-0 p-1.5 cursor-pointer transition-colors ${
                isOpen ? 'bg-primary/5' : 'hover:bg-muted/40'
              } ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}`}
              onClick={() => setOpenDay(isOpen ? null : dateStr)}
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

              {/* Task dots preview */}
              {!isOpen && dayTasks.length > 0 && (
                <div className="flex flex-wrap gap-0.5">
                  {dayTasks.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="block h-1.5 flex-1 min-w-2 max-w-6 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[t.status] ?? '#94a3b8' }}
                      title={t.title}
                    />
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{dayTasks.length - 3}</span>
                  )}
                </div>
              )}

              {/* Expanded task list */}
              {isOpen && (
                <div className="mt-1 space-y-1">
                  {dayTasks.map((t) => (
                    <div key={t.id} className="rounded bg-white border p-1.5 shadow-sm">
                      <div className="flex items-start gap-1.5">
                        <span
                          className="mt-1 block w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: STATUS_COLOR[t.status] ?? '#94a3b8' }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight truncate">{t.title}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(t.dueAt)}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
