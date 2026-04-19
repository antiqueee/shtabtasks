const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  model: string
  messages: ChatMessage[]
  responseFormat?: { type: 'json_object' } | { type: 'json_schema'; json_schema: unknown }
  temperature?: number
}

async function chatCompletion(opts: ChatOptions): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const body: Record<string, unknown> = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
  }
  if (opts.responseFormat) body.response_format = opts.responseFormat

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.PUBLIC_URL ?? 'http://localhost:3000',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`OpenRouter ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> }
  return data.choices[0]?.message?.content ?? ''
}

function getFastModel(): string {
  return process.env.OPENROUTER_MODEL_FAST ?? 'google/gemini-2.5-flash'
}

function getSmartModel(): string {
  return process.env.OPENROUTER_MODEL_SMART ?? 'google/gemini-2.5-pro'
}

export interface QuickTaskResult {
  title: string
  description?: string
  assigneeName?: string
  tagName?: string
  dueAt?: string
  recurrenceRule?: string
  isRecurring?: boolean
}

export interface ParsedTask {
  title: string
  description?: string
  assigneeName?: string
  tagName?: string
  dueAt?: string
}

export interface ParseProtocolResult {
  tasks: ParsedTask[]
}

export interface RagSource {
  filename: string
  snippet: string
}

export interface RagResult {
  answer: string
  sources: RagSource[]
}

export async function parseQuickTask(text: string): Promise<QuickTaskResult> {
  const now = new Date().toLocaleString('ru', { timeZone: 'Europe/Moscow' })

  const systemPrompt = `Ты помощник по управлению задачами избирательного штаба.
Текущее время (Europe/Moscow): ${now}

Из сообщения пользователя извлеки задачу и верни JSON по схеме:
{
  "title": "краткое название задачи",
  "description": "подробности если есть, иначе null",
  "assigneeName": "имя ответственного если упомянут, иначе null",
  "tagName": "категория если понятна (Агитация/Юристы/Медиа/АХО/Аналитика/Финансы/Полевая работа), иначе null",
  "dueAt": "ISO 8601 дата-время если упомянуто (сегодня/завтра/в среду/через N дней и т.д.), иначе null",
  "isRecurring": true/false,
  "recurrenceRule": "RRULE или DTSTART+RRULE для регулярной задачи, иначе null"
}

Обрабатывай относительные даты: "сегодня"=сегодня 18:00, "завтра"=завтра 18:00, "в среду"=ближайшая среда 10:00.
Если дедлайн не назван явно — dueAt должен быть null, не придумывай дату.
Если задача регулярная ("каждое воскресенье", "по понедельникам", "ежедневно", "каждый месяц 1 числа") — верни isRecurring=true и recurrenceRule.
Для регулярных задач с временем используй формат:
DTSTART:YYYYMMDDTHHMMSSZ
RRULE:FREQ=WEEKLY;BYDAY=SU
В DTSTART ставь ближайшее будущее наступление в UTC с указанным временем Europe/Moscow.
Верни ТОЛЬКО JSON, без markdown и пояснений.`

  const raw = await chatCompletion({
    model: getFastModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: text },
    ],
    responseFormat: { type: 'json_object' },
  })

  try {
    return JSON.parse(raw) as QuickTaskResult
  } catch {
    return { title: text }
  }
}

export async function parseProtocol(text: string): Promise<ParseProtocolResult> {
  const systemPrompt = `Ты помощник по управлению задачами избирательного штаба.
Проанализируй протокол встречи и извлеки задачи. Используй следующий порядок рассуждений:

1. Сначала выдели всех упомянутых ответственных/исполнителей
2. Для каждого найди их обязательства и поручения
3. Сформируй список задач

Верни JSON по схеме:
{
  "tasks": [
    {
      "title": "краткое название задачи",
      "description": "подробности или контекст из протокола",
      "assigneeName": "имя ответственного или null",
      "tagName": "категория (Агитация/Юристы/Медиа/АХО/Аналитика/Финансы/Полевая работа) или null",
      "dueAt": "ISO 8601 дедлайн если упомянут или null"
    }
  ]
}

Верни ТОЛЬКО JSON, без markdown и пояснений.`

  const raw = await chatCompletion({
    model: getSmartModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Протокол встречи:\n\n${text}` },
    ],
    responseFormat: { type: 'json_object' },
    temperature: 0.1,
  })

  try {
    return JSON.parse(raw) as ParseProtocolResult
  } catch {
    return { tasks: [] }
  }
}

export async function answerWithRag(
  question: string,
  chunks: Array<{ text: string; protocolFilename: string }>,
): Promise<RagResult> {
  if (chunks.length === 0) {
    return {
      answer: 'По данному вопросу в загруженных протоколах ничего не найдено.',
      sources: [],
    }
  }

  const chunksText = chunks
    .map((c, i) => `[${i + 1}] Файл: ${c.protocolFilename}\n${c.text}`)
    .join('\n\n---\n\n')

  const systemPrompt = `Ты помощник по протоколам избирательного штаба.
Отвечай ТОЛЬКО на основе предоставленных фрагментов протоколов.
Если информации нет в фрагментах — прямо скажи об этом.
Ссылайся на источники по номерам [1], [2] и т.д.
Отвечай на русском языке.

Фрагменты протоколов:
${chunksText}`

  const raw = await chatCompletion({
    model: getFastModel(),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
  })

  const sources: RagSource[] = chunks.map((c) => ({
    filename: c.protocolFilename,
    snippet: c.text.slice(0, 200),
  }))

  return { answer: raw, sources }
}
