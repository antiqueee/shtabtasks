import https from 'https'
import { db, assignees, events, tags, taskTemplates, tasks } from '@shtab/db'
import { parseProtocol, parseQuickTask } from '@shtab/shared/llm'
import { transcribeAudio } from '@shtab/shared/stt'
import { asc, eq } from 'drizzle-orm'
import { Bot, GrammyError, HttpError } from 'grammy'
import mammoth from 'mammoth'
import { SocksProxyAgent } from 'socks-proxy-agent'
import * as XLSX from 'xlsx'

const token = process.env.TELEGRAM_BOT_TOKEN
const ownerId = process.env.TELEGRAM_OWNER_ID

if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set')
if (!ownerId) throw new Error('TELEGRAM_OWNER_ID is not set')

const socksProxy = process.env.SOCKS_PROXY_URL
const proxyAgent = socksProxy ? new SocksProxyAgent(socksProxy) : undefined

const bot = new Bot(token, proxyAgent ? {
  client: { baseFetchConfig: { agent: proxyAgent } }
} : {})

function getFallbackDueAt(): Date {
  const dueAt = new Date()
  dueAt.setHours(18, 0, 0, 0)
  if (dueAt.getTime() <= Date.now()) {
    dueAt.setDate(dueAt.getDate() + 1)
  }
  return dueAt
}

function parseDueAt(value?: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function formatDateTime(date: Date | null): string {
  if (!date) return 'без дедлайна'

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

function normalizeName(value: string): string {
  return value.trim().toLocaleLowerCase('ru-RU')
}

const RANDOM_COLORS = [
  '#e11d48', '#f97316', '#eab308', '#16a34a', '#0891b2',
  '#4f46e5', '#9333ea', '#db2777', '#059669', '#0284c7',
]

function randomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
}

async function findOrCreateAssignee(name?: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null
  const normalized = normalizeName(name)
  const existing = await db.select().from(assignees).orderBy(asc(assignees.name))
  const matched = existing.find((item) => normalizeName(item.name) === normalized)
  if (matched) return { id: matched.id, name: matched.name }
  const [created] = await db
    .insert(assignees)
    .values({ name: name.trim(), color: randomColor() })
    .returning({ id: assignees.id, name: assignees.name })
  return created ?? null
}

async function findOrCreateTag(name?: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null

  const normalized = normalizeName(name)
  const existing = await db.select().from(tags).orderBy(asc(tags.name))
  const matched = existing.find((item) => normalizeName(item.name) === normalized)
  if (matched) return { id: matched.id, name: matched.name }

  const inserted = await db
    .insert(tags)
    .values({ name: name.trim(), color: randomColor() })
    .onConflictDoNothing()
    .returning({ id: tags.id, name: tags.name })

  if (inserted[0]) return inserted[0]

  const [created] = await db.select().from(tags).where(eq(tags.name, name.trim())).limit(1)
  return created ? { id: created.id, name: created.name } : null
}

async function storeTask(
  text: string,
  source: 'text_tg' | 'voice_tg',
): Promise<{ title: string; dueAt: Date | null; assigneeName: string | null; tagName: string | null }> {
  const parsed = await parseQuickTask(text)
  const title = parsed.title?.trim() || text.trim()
  const dueAt = parseDueAt(parsed.dueAt)
  const assignee = await findOrCreateAssignee(parsed.assigneeName)
  const tag = await findOrCreateTag(parsed.tagName)

  if (parsed.isRecurring && parsed.recurrenceRule?.trim()) {
    const [template] = await db
      .insert(taskTemplates)
      .values({
        title,
        description: parsed.description?.trim() || null,
        assigneeId: assignee?.id ?? null,
        tagId: tag?.id ?? null,
        recurrenceRule: parsed.recurrenceRule.trim(),
        activeWindowDays: 90,
      })
      .returning({ id: taskTemplates.id })

    await db.insert(events).values({
      eventName: 'recurring_task_created_from_bot',
      payload: { templateId: template?.id ?? null, source, recurrenceRule: parsed.recurrenceRule },
    })

    return { title: `${title} (регулярная)`, dueAt, assigneeName: assignee?.name ?? null, tagName: tag?.name ?? null }
  }

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

  if (!task) throw new Error('Task was not created')

  await db.insert(events).values({
    eventName: 'task_created_from_bot',
    payload: { taskId: task.id, source, assigneeName: assignee?.name ?? null, tagName: tag?.name ?? null },
  })

  return { title: task.title, dueAt: task.dueAt, assigneeName: assignee?.name ?? null, tagName: tag?.name ?? null }
}

function formatTaskReply(task: { title: string; dueAt: Date | null; assigneeName: string | null; tagName: string | null }, transcript?: string): string {
  const lines = [
    `Задача создана: ${task.title}`,
    `Дедлайн: ${formatDateTime(task.dueAt)}`,
    `Ответственный: ${task.assigneeName ?? 'не назначен'}`,
    `Тег: ${task.tagName ?? 'не указан'}`,
  ]
  if (transcript) lines.push('', `Расшифровка: ${transcript}`)
  return lines.join('\n')
}

function readXlsx(buffer: Buffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const parts: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
      header: 1,
      raw: false,
      blankrows: false,
    })

    parts.push(`# Лист: ${sheetName}`)
    for (const row of rows) {
      const line = row
        .map((cell) => (cell == null ? '' : String(cell).trim()))
        .filter(Boolean)
        .join(' | ')
      if (line) parts.push(line)
    }
  }

  return parts.join('\n').trim()
}

function downloadBuffer(url: string, agent?: https.Agent): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { agent }, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (chunk: Buffer) => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
  })
}

bot.use(async (ctx, next) => {
  if (ctx.from?.id?.toString() !== ownerId) {
    await ctx.reply('Доступ ограничен')
    return
  }
  await next()
})

bot.command('start', async (ctx) => {
  await ctx.reply(
    'Бот штабных задач готов.\nПросто пришли текст задачи или голосовое сообщение.\nЯ создам задачу, определю дедлайн и тег.',
  )
})

bot.command('help', async (ctx) => {
  await ctx.reply(
    'Что умею:\n• текстовое сообщение → новая задача\n• голосовое сообщение → распознавание и новая задача\n• доступ только для владельца',
  )
})

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim()
  if (!text || text.startsWith('/')) return

  await ctx.replyWithChatAction('typing')
  const task = await storeTask(text, 'text_tg')
  await ctx.reply(formatTaskReply(task))
})

bot.on('message:voice', async (ctx) => {
  await ctx.reply('Обрабатываю голосовое сообщение...')

  const file = await ctx.getFile()
  if (!file.file_path) throw new Error('Voice file path is missing')

  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`
  const audioBuffer = await downloadBuffer(fileUrl, proxyAgent)
  const transcript = (await transcribeAudio(audioBuffer)).trim()

  if (!transcript) {
    await ctx.reply('Не удалось распознать речь. Попробуй ещё раз или отправь текстом.')
    return
  }

  const task = await storeTask(transcript, 'voice_tg')
  await ctx.reply(formatTaskReply(task, transcript))
})

bot.on('message:document', async (ctx) => {
  const doc = ctx.message.document
  const name = doc.file_name ?? ''
  const isDocx = name.toLowerCase().endsWith('.docx')
  const isXlsx = name.toLowerCase().endsWith('.xlsx') || name.toLowerCase().endsWith('.xls')
  const isPdf = name.toLowerCase().endsWith('.pdf')
  const isTxt = name.toLowerCase().endsWith('.txt') || name.toLowerCase().endsWith('.md')
  const protocolSource = isDocx ? 'protocol_docx' : isXlsx ? 'protocol_xlsx' : isPdf ? 'protocol_pdf' : 'protocol_paste'

  if (!isDocx && !isXlsx && !isPdf && !isTxt) {
    await ctx.reply('Поддерживаются .docx, .xlsx, .pdf и .txt файлы с протоколами.')
    return
  }

  await ctx.reply(`Обрабатываю протокол: ${name}...`)

  const file = await ctx.getFile()
  if (!file.file_path) throw new Error('Document file path is missing')

  const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`
  const buf = await downloadBuffer(fileUrl, proxyAgent)

  let text = ''
  if (isDocx) {
    const result = await mammoth.extractRawText({ buffer: buf })
    text = result.value.trim()
  } else if (isXlsx) {
    text = readXlsx(buf)
  } else if (isPdf) {
    const { PDFParse } = await import('pdf-parse')
    const parser = new PDFParse({ data: buf })
    const result = await parser.getText()
    await parser.destroy()
    text = result.text.trim()
  } else {
    text = buf.toString('utf-8').trim()
  }

  if (!text) {
    await ctx.reply('Не удалось извлечь текст из файла.')
    return
  }

  const parsed = await parseProtocol(text)
  const created: string[] = []

  for (const item of parsed.tasks) {
    if (!item.title?.trim()) continue

    const assignee = await findOrCreateAssignee(item.assigneeName ?? undefined)
    const tag = await findOrCreateTag(item.tagName ?? undefined)
    const dueAt = item.dueAt ? new Date(item.dueAt) : null

    await db.insert(tasks).values({
      title: item.title.trim(),
      description: item.description?.trim() || null,
      assigneeId: assignee?.id ?? null,
      tagId: tag?.id ?? null,
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
      status: 'todo',
      source: protocolSource,
    })

    created.push(`• ${item.title.trim()}${assignee ? ` (${assignee.name})` : ''}`)
  }

  if (created.length === 0) {
    await ctx.reply('Задачи в протоколе не найдены.')
    return
  }

  await ctx.reply(`Создано ${created.length} задач:\n${created.slice(0, 10).join('\n')}${created.length > 10 ? `\n...и ещё ${created.length - 10}` : ''}`)
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

process.on('SIGTERM', () => { bot.stop(); process.exit(0) })
process.on('SIGINT', () => { bot.stop(); process.exit(0) })

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
