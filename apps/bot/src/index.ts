import { db, assignees, events, tags, tasks } from '@shtab/db'
import { parseQuickTask } from '@shtab/shared/llm'
import { transcribeAudio } from '@shtab/shared/stt'
import { asc, eq } from 'drizzle-orm'
import { Bot, GrammyError, HttpError } from 'grammy'

const token = process.env.TELEGRAM_BOT_TOKEN
const ownerId = process.env.TELEGRAM_OWNER_ID

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
if (!ownerId) throw new Error('TELEGRAM_OWNER_ID is not set')

const bot = new Bot(token)

interface StoredTaskResult {
  id: string
  title: string
  dueAt: Date
  assigneeName: string | null
  tagName: string | null
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU')
}

function getFallbackDueAt(): Date {
  const dueAt = new Date()
  dueAt.setHours(18, 0, 0, 0)

  if (dueAt.getTime() <= Date.now()) {
    dueAt.setDate(dueAt.getDate() + 1)
  }

  return dueAt
}

function parseDueAt(value?: string): Date {
  if (!value) return getFallbackDueAt()

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return getFallbackDueAt()
  }

  return date
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

async function findOrCreateAssignee(name?: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null

  const normalized = normalizeName(name)
  const existing = await db.select().from(assignees).orderBy(asc(assignees.name))
  const matched = existing.find((item) => normalizeName(item.name) === normalized)

  if (matched) {
    return { id: matched.id, name: matched.name }
  }

  const [created] = await db
    .insert(assignees)
    .values({
      name: name.trim(),
      color: '#64748b',
    })
    .returning({ id: assignees.id, name: assignees.name })

  return created ?? null
}

async function findOrCreateTag(name?: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null

  const normalized = normalizeName(name)
  const existing = await db.select().from(tags).orderBy(asc(tags.name))
  const matched = existing.find((item) => normalizeName(item.name) === normalized)

  if (matched) {
    return { id: matched.id, name: matched.name }
  }

  const inserted = await db
    .insert(tags)
    .values({
      name: name.trim(),
      color: '#0f766e',
    })
    .onConflictDoNothing()
    .returning({ id: tags.id, name: tags.name })

  if (inserted[0]) {
    return inserted[0]
  }

  const [created] = await db.select().from(tags).where(eq(tags.name, name.trim())).limit(1)
  return created ? { id: created.id, name: created.name } : null
}

async function storeTaskFromText(text: string, source: 'text_tg' | 'voice_tg'): Promise<StoredTaskResult> {
  const parsed = await parseQuickTask(text)
  const title = parsed.title?.trim() || text.trim()
  const dueAt = parseDueAt(parsed.dueAt)
  const assignee = await findOrCreateAssignee(parsed.assigneeName)
  const tag = await findOrCreateTag(parsed.tagName)

  const [task] = await db
    .insert(tasks)
    .values({
      title,
      description: parsed.description?.trim() || null,
      assigneeId: assignee?.id ?? null,
      tagId: tag?.id ?? null,
      dueAt,
      status: 'todo',
      source,
    })
    .returning({ id: tasks.id, title: tasks.title, dueAt: tasks.dueAt })

  if (!task) {
    throw new Error('Task was not created')
  }

  await db.insert(events).values({
    eventName: 'task_created_from_bot',
    payload: {
      taskId: task.id,
      source,
      assigneeName: assignee?.name ?? null,
      tagName: tag?.name ?? null,
    },
  })

  return {
    id: task.id,
    title: task.title,
    dueAt: task.dueAt,
    assigneeName: assignee?.name ?? null,
    tagName: tag?.name ?? null,
  }
}

function formatTaskReply(task: StoredTaskResult, originalText?: string): string {
  const lines = [
    `Задача создана: ${task.title}`,
    `Дедлайн: ${formatDateTime(task.dueAt)}`,
    `Ответственный: ${task.assigneeName ?? 'не назначен'}`,
    `Тег: ${task.tagName ?? 'не указан'}`,
  ]

  if (originalText) {
    lines.push('', `Расшифровка: ${originalText}`)
  }

  return lines.join('\n')
}

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id?.toString()
  if (userId !== ownerId) {
    await ctx.reply('Доступ ограничен')
    return
  }
  await next()
})

bot.command('start', async (ctx) => {
  await ctx.reply(
    [
      'Бот штабных задач готов.',
      'Просто пришли текст задачи или голосовое сообщение.',
      'Я создам задачу, попробую определить дедлайн, ответственного и тег.',
    ].join('\n'),
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    [
      'Что умею сейчас:',
      '• текстовое сообщение -> новая задача',
      '• голосовое сообщение -> распознавание и новая задача',
      '• доступ только для владельца',
    ].join('\n'),
  )
})

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim()

  if (!text || text.startsWith('/')) {
    return
  }

  await ctx.replyWithChatAction('typing')
  const task = await storeTaskFromText(text, 'text_tg')
  await ctx.reply(formatTaskReply(task))
})

bot.on('message:voice', async (ctx) => {
  await ctx.reply('Обрабатываю голосовое сообщение...')

  const file = await ctx.getFile()
  if (!file.file_path) {
    throw new Error('Voice file path is missing')
  }

  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`
  const response = await fetch(fileUrl)
  if (!response.ok) {
    throw new Error(`Failed to download voice file: ${response.status}`)
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer())
  const transcript = (await transcribeAudio(audioBuffer)).trim()

  if (!transcript) {
    await ctx.reply('Не удалось распознать речь. Попробуй ещё раз или отправь текстом.')
    return
  }

  const task = await storeTaskFromText(transcript, 'voice_tg')
  await ctx.reply(formatTaskReply(task, transcript))
})

bot.catch(async (err) => {
  const { ctx } = err
  console.error('Bot error while handling update', err.error)

  if (ctx?.chat?.id) {
    try {
      if (err.error instanceof GrammyError) {
        await ctx.reply(`Ошибка Telegram API: ${err.error.description}`)
        return
      }

      if (err.error instanceof HttpError) {
        await ctx.reply('Сетевая ошибка при обращении к Telegram. Попробуй ещё раз.')
        return
      }

      await ctx.reply('Не удалось обработать сообщение. Проверь текст или повтори позже.')
    } catch (replyError) {
      console.error('Failed to report bot error', replyError)
    }
  }
})

async function main() {
  const me = await bot.api.getMe()
  console.log(`Bot started: @${me.username}`)
  console.log(`Owner ID: ${ownerId}`)

  await bot.start({
    onStart: (info) => console.log(`Polling started for @${info.username}`),
  })
}

function shutdown(signal: string) {
  console.log(`Received ${signal}, shutting down...`)
  bot.stop()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
