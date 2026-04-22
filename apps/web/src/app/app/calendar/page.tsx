import type { Metadata } from 'next'
import Link from 'next/link'
import { getMonthTasks } from '@/lib/app-data'
import { CalendarGrid } from '@/components/CalendarGrid'

export const metadata: Metadata = {
  title: 'Календарь',
  description: 'Месячный вид задач штаба.',
}

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

interface CalendarPageProps {
  searchParams?: Promise<{
    year?: string
    month?: string
  }>
}

function normalizeMonth(year: number, month: number) {
  const date = new Date(year, month, 1)
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  }
}

function monthHref(year: number, month: number) {
  const normalized = normalizeMonth(year, month)
  return `/app/calendar?year=${normalized.year}&month=${normalized.month + 1}`
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams
  const now = new Date()
  const parsedYear = Number(params?.year)
  const parsedMonth = Number(params?.month)
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100
    ? parsedYear
    : now.getFullYear()
  const rawMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12
    ? parsedMonth - 1
    : now.getMonth()
  const { year: viewYear, month } = normalizeMonth(year, rawMonth)

  const tasks = await getMonthTasks(viewYear, month)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Календарь</h1>
          <span className="text-muted-foreground text-sm">
            {MONTH_NAMES[month]} {viewYear}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={monthHref(viewYear, month - 1)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Назад
          </Link>
          <Link
            href="/app/calendar"
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Сегодня
          </Link>
          <Link
            href={monthHref(viewYear, month + 1)}
            className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Вперёд
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible pb-28">
        <div className="min-w-[760px]">
          <CalendarGrid tasks={tasks} year={viewYear} month={month} />
        </div>
      </div>
    </div>
  )
}
