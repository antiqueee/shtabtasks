const TZ = 'Europe/Moscow'

const relativeFormatter = new Intl.RelativeTimeFormat('ru', { numeric: 'auto' })
const dateFormatter = new Intl.DateTimeFormat('ru', { timeZone: TZ, dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('ru', {
  timeZone: TZ,
  dateStyle: 'medium',
  timeStyle: 'short',
})

export function formatDate(date: Date): string {
  return dateFormatter.format(date)
}

export function formatDateTime(date: Date): string {
  return dateTimeFormatter.format(date)
}

export function formatRelative(date: Date): string {
  const now = Date.now()
  const diffMs = date.getTime() - now
  const diffDays = Math.round(diffMs / 86_400_000)

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.round(diffMs / 3_600_000)
    if (Math.abs(diffHours) < 1) {
      const diffMinutes = Math.round(diffMs / 60_000)
      return relativeFormatter.format(diffMinutes, 'minute')
    }
    return relativeFormatter.format(diffHours, 'hour')
  }
  return relativeFormatter.format(diffDays, 'day')
}

export function startOfDayMoscow(date: Date = new Date()): Date {
  const str = date.toLocaleDateString('en-CA', { timeZone: TZ })
  return new Date(`${str}T00:00:00+03:00`)
}

export function endOfDayMoscow(date: Date = new Date()): Date {
  const str = date.toLocaleDateString('en-CA', { timeZone: TZ })
  return new Date(`${str}T23:59:59+03:00`)
}

export function tomorrowMoscow(): Date {
  const tomorrow = new Date(Date.now() + 86_400_000)
  const str = tomorrow.toLocaleDateString('en-CA', { timeZone: TZ })
  return new Date(`${str}T18:00:00+03:00`)
}

export function todayAt(hour: number, minute = 0): Date {
  const str = new Date().toLocaleDateString('en-CA', { timeZone: TZ })
  return new Date(`${str}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+03:00`)
}
