import { db, events, taskTemplates, tasks } from '@shtab/db'
import { generateInstances } from '@shtab/shared/utils/rrule'
import { and, asc, eq, gte, isNotNull, isNull, lt, ne, or } from 'drizzle-orm'
import cron from 'node-cron'

const token = process.env.TELEGRAM_BOT_TOKEN
const ownerId = process.env.TELEGRAM_OWNER_ID

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
if (!ownerId) throw new Error('TELEGRAM_OWNER_ID is not set')

function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

async function sendTelegramMessage(text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: ownerId,
      text,
    }),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Telegram sendMessage failed: ${response.status} ${message}`)
  }
}

async function generateRecurringTasks() {
  const templates = await db
    .select()
    .from(taskTemplates)
    .where(and(eq(taskTemplates.isActive, true), isNotNull(taskTemplates.recurrenceRule)))
    .orderBy(asc(taskTemplates.createdAt))

  let createdCount = 0

  for (const template of templates) {
    if (!template.recurrenceRule) {
      continue
    }

    const now = new Date()
    const horizon = addDays(now, template.activeWindowDays)
    const dueDates = generateInstances(template.recurrenceRule, now, horizon)

    if (dueDates.length === 0) {
      continue
    }

    const existing = await db
      .select({
        dueAt: tasks.dueAt,
      })
      .from(tasks)
      .where(and(eq(tasks.templateId, template.id), isNull(tasks.deletedAt), gte(tasks.dueAt, now), lt(tasks.dueAt, addDays(horizon, 1))))

    const existingKeys = new Set(existing.map((task) => task.dueAt.toISOString()))

    for (const instance of dueDates) {
      const dueKey = instance.dueAt.toISOString()
      if (existingKeys.has(dueKey)) {
        continue
      }

      await db.insert(tasks).values({
        templateId: template.id,
        title: template.title,
        description: template.description,
        assigneeId: template.assigneeId,
        tagId: template.tagId,
        dueAt: instance.dueAt,
        status: 'todo',
        source: 'scheduled',
      })

      await db.insert(events).values({
        eventName: `recurring_task_generated:${template.id}:${dueKey}`,
        payload: {
          templateId: template.id,
          dueAt: dueKey,
        },
      })

      createdCount += 1
    }
  }

  if (createdCount > 0) {
    console.log(`[${new Date().toISOString()}] recurring tasks created: ${createdCount}`)
  }
}

async function remindAboutTasks() {
  const now = new Date()
  const soonLimit = addDays(now, 1)

  const activeTasks = await db
    .select()
    .from(tasks)
    .where(
      and(
        isNull(tasks.deletedAt),
        ne(tasks.status, 'done'),
        or(and(gte(tasks.dueAt, now), lt(tasks.dueAt, soonLimit)), lt(tasks.dueAt, now)),
      ),
    )
    .orderBy(asc(tasks.dueAt))

  for (const task of activeTasks) {
    const overdue = task.dueAt < now
    const eventKey = overdue ? `task_overdue_reminder:${task.id}` : `task_due_soon_reminder:${task.id}`

    const [existingReminder] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.eventName, eventKey))
      .limit(1)

    if (existingReminder) {
      continue
    }

    const message = overdue
      ? [
          'Просроченная задача:',
          task.title,
          `Дедлайн был: ${formatDateTime(task.dueAt)}`,
        ].join('\n')
      : [
          'Напоминание по задаче:',
          task.title,
          `Дедлайн: ${formatDateTime(task.dueAt)}`,
        ].join('\n')

    await sendTelegramMessage(message)
    await db.insert(events).values({
      eventName: eventKey,
      payload: {
        taskId: task.id,
        dueAt: task.dueAt.toISOString(),
      },
    })
  }
}

async function runSchedulerCycle() {
  console.log(`[${new Date().toISOString()}] scheduler tick`)
  await generateRecurringTasks()
  await remindAboutTasks()
}

console.log('Scheduler started')

cron.schedule('*/5 * * * *', async () => {
  try {
    await runSchedulerCycle()
  } catch (error) {
    console.error('Scheduler cycle failed', error)
  }
})

void runSchedulerCycle().catch((error) => {
  console.error('Initial scheduler cycle failed', error)
})

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down scheduler...`)
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
