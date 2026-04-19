import type { Metadata } from 'next'
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

export default async function CalendarPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const tasks = await getMonthTasks(year, month)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Календарь</h1>
        <span className="text-muted-foreground text-sm">
          {MONTH_NAMES[month]} {year}
        </span>
      </div>

      <CalendarGrid tasks={tasks} year={year} month={month} />
    </div>
  )
}
