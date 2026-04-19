import { createRequire } from 'module'
const _require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { RRule } = _require('rrule') as { RRule: typeof import('rrule').RRule }

export interface TemplateInstance {
  dueAt: Date
}

export function generateInstances(
  recurrenceRule: string,
  fromDate: Date,
  toDate: Date,
): TemplateInstance[] {
  try {
    const rule = RRule.fromString(recurrenceRule)
    const dates = rule.between(fromDate, toDate, true)
    return dates.map((dueAt) => ({ dueAt }))
  } catch {
    return []
  }
}

export function isValidRRule(rule: string): boolean {
  try {
    RRule.fromString(rule)
    return true
  } catch {
    return false
  }
}

export const RRULE_PRESETS = {
  daily: 'FREQ=DAILY',
  weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
  weekly_mon: 'FREQ=WEEKLY;BYDAY=MO',
  weekly_tue: 'FREQ=WEEKLY;BYDAY=TU',
  weekly_wed: 'FREQ=WEEKLY;BYDAY=WE',
  weekly_thu: 'FREQ=WEEKLY;BYDAY=TH',
  weekly_fri: 'FREQ=WEEKLY;BYDAY=FR',
  monthly_1: 'FREQ=MONTHLY;BYMONTHDAY=1',
  monthly_15: 'FREQ=MONTHLY;BYMONTHDAY=15',
} as const
