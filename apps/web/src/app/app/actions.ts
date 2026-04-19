'use server'

import {
  db,
  assignees,
  parseBatches,
  parseBatchTasks,
  protocolChunks,
  protocols,
  tags,
  taskTemplates,
  tasks,
} from '@/lib/workspace-db'
import { answerWithRag, isValidRRule, parseProtocol } from '@/lib/workspace-shared'
import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { chunkProtocolText, parseProtocolInput } from '@/lib/protocols'
import { pickRelevantChunks } from '@/lib/assistant'

const RANDOM_COLORS = [
  '#e11d48', '#f97316', '#eab308', '#16a34a', '#0891b2',
  '#4f46e5', '#9333ea', '#db2777', '#059669', '#d97706',
  '#0284c7', '#7c3aed', '#be123c', '#b45309', '#15803d',
]

function randomColor(): string {
  return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]
}

const boardStatusSchema = z.enum(['todo', 'in_progress', 'done'])

const nullableUuidSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))
  .pipe(z.string().uuid().nullable())

const nullableTextSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null))

const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: nullableTextSchema,
  assigneeName: nullableTextSchema,
  tagName: nullableTextSchema,
  dueAt: z.string().trim().min(1),
  status: boardStatusSchema.default('todo'),
})

const assigneeInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  tgUsername: nullableTextSchema.transform((value) => value?.replace(/^@/, '') ?? null),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

const tagInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

const templateInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: nullableTextSchema,
  assigneeId: nullableUuidSchema,
  tagId: nullableUuidSchema,
  recurrenceRule: nullableTextSchema,
  activeWindowDays: z.coerce.number().int().min(1).max(365),
})

const taskStatusUpdateSchema = z.object({
  taskId: z.string().uuid(),
  status: boardStatusSchema,
})

function revalidateTaskPages() {
  revalidatePath('/app/board')
  revalidatePath('/app/calendar')
  revalidatePath('/app/dashboard')
}

function revalidateProtocolPages() {
  revalidatePath('/app/protocols')
  revalidatePath('/app/assistant')
  revalidateTaskPages()
}

async function findOrCreateAssigneeId(name: string | null | undefined) {
  if (!name?.trim()) {
    return null
  }

  const normalized = name.trim().toLocaleLowerCase('ru-RU')
  const rows = await db.select().from(assignees).orderBy(asc(assignees.name))
  const found = rows.find((row) => row.name.trim().toLocaleLowerCase('ru-RU') === normalized)

  if (found) {
    return found.id
  }

  const [created] = await db
    .insert(assignees)
    .values({
      name: name.trim(),
      color: randomColor(),
    })
    .returning({ id: assignees.id })

  return created?.id ?? null
}

async function findOrCreateTagId(name: string | null | undefined) {
  if (!name?.trim()) {
    return null
  }

  const normalized = name.trim().toLocaleLowerCase('ru-RU')
  const rows = await db.select().from(tags).orderBy(asc(tags.name))
  const found = rows.find((row) => row.name.trim().toLocaleLowerCase('ru-RU') === normalized)

  if (found) {
    return found.id
  }

  const inserted = await db
    .insert(tags)
    .values({
      name: name.trim(),
      color: randomColor(),
    })
    .onConflictDoNothing()
    .returning({ id: tags.id })

  if (inserted[0]?.id) {
    return inserted[0].id
  }

  const [created] = await db.select().from(tags).where(eq(tags.name, name.trim())).limit(1)
  return created?.id ?? null
}

export async function createTaskAction(formData: FormData) {
  const parsed = taskInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    assigneeName: formData.get('assigneeName'),
    tagName: formData.get('tagName'),
    dueAt: formData.get('dueAt'),
    status: formData.get('status'),
  })

  if (!parsed.success) return

  const dueAt = new Date(parsed.data.dueAt)
  if (Number.isNaN(dueAt.getTime())) return

  const assigneeId = await findOrCreateAssigneeId(parsed.data.assigneeName)
  const tagId = await findOrCreateTagId(parsed.data.tagName)

  await db.insert(tasks).values({
    title: parsed.data.title,
    description: parsed.data.description,
    assigneeId,
    tagId,
    dueAt,
    status: parsed.data.status,
    source: 'manual',
  })

  revalidateTaskPages()
}

export async function updateTaskStatusAction(formData: FormData) {
  const parsed = taskStatusUpdateSchema.safeParse({
    taskId: formData.get('taskId'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return
  }

  await db
    .update(tasks)
    .set({
      status: parsed.data.status,
      completedAt: parsed.data.status === 'done' ? new Date() : null,
    })
    .where(eq(tasks.id, parsed.data.taskId))

  revalidateTaskPages()
}

export async function createAssigneeAction(formData: FormData) {
  const parsed = assigneeInputSchema.safeParse({
    name: formData.get('name'),
    tgUsername: formData.get('tgUsername'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return
  }

  await db.insert(assignees).values(parsed.data)
  revalidatePath('/app/settings/assignees')
  revalidatePath('/app/board')
}

export async function createTagAction(formData: FormData) {
  const parsed = tagInputSchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  })

  if (!parsed.success) {
    return
  }

  await db.insert(tags).values(parsed.data).onConflictDoNothing()
  revalidatePath('/app/settings/tags')
  revalidatePath('/app/board')
}

export async function createTemplateAction(formData: FormData) {
  const parsed = templateInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    assigneeId: formData.get('assigneeId'),
    tagId: formData.get('tagId'),
    recurrenceRule: formData.get('recurrenceRule'),
    activeWindowDays: formData.get('activeWindowDays'),
  })

  if (!parsed.success) {
    return
  }

  if (parsed.data.recurrenceRule && !isValidRRule(parsed.data.recurrenceRule)) {
    return
  }

  await db.insert(taskTemplates).values({
    title: parsed.data.title,
    description: parsed.data.description,
    assigneeId: parsed.data.assigneeId,
    tagId: parsed.data.tagId,
    recurrenceRule: parsed.data.recurrenceRule,
    activeWindowDays: parsed.data.activeWindowDays,
  })

  revalidatePath('/app/settings/templates')
}

export async function importProtocolAction(formData: FormData) {
  const fileEntry = formData.get('protocolFile')
  const pastedText = String(formData.get('protocolText') ?? '')
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null

  const parsedInput = await parseProtocolInput(file, pastedText)
  if (!parsedInput.text) {
    return
  }

  const [protocol] = await db
    .insert(protocols)
    .values({
      filename: parsedInput.filename,
      originalText: parsedInput.text,
    })
    .returning({ id: protocols.id, filename: protocols.filename })

  if (!protocol) {
    return
  }

  const chunks = chunkProtocolText(parsedInput.text)
  if (chunks.length > 0) {
    await db.insert(protocolChunks).values(
      chunks.map((chunkText, chunkIndex) => ({
        protocolId: protocol.id,
        chunkText,
        chunkIndex,
        embedding: null,
      })),
    )
  }

  const [batch] = await db
    .insert(parseBatches)
    .values({
      protocolId: protocol.id,
    })
    .returning({ id: parseBatches.id })

  if (!batch) {
    return
  }

  const parsed = await parseProtocol(parsedInput.text)
  for (const item of parsed.tasks) {
    if (!item.title?.trim()) {
      continue
    }

    const assigneeId = await findOrCreateAssigneeId(item.assigneeName)
    const tagId = await findOrCreateTagId(item.tagName)
    const dueAt = item.dueAt ? new Date(item.dueAt) : null

    const [task] = await db
      .insert(tasks)
      .values({
        templateId: null,
        title: item.title.trim(),
        description: item.description?.trim() || null,
        assigneeId,
        tagId,
        dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : new Date(),
        status: 'todo',
        source: parsedInput.source,
        sourceProtocolId: protocol.id,
      })
      .returning({ id: tasks.id })

    if (task) {
      await db.insert(parseBatchTasks).values({
        batchId: batch.id,
        taskId: task.id,
      })
    }
  }

  revalidateProtocolPages()
}

export async function undoLastProtocolImportAction() {
  const [lastBatch] = await db
    .select()
    .from(parseBatches)
    .where(isNull(parseBatches.undoneAt))
    .orderBy(desc(parseBatches.createdAt))
    .limit(1)

  if (!lastBatch) {
    return
  }

  const linkedTasks = await db
    .select({ taskId: parseBatchTasks.taskId })
    .from(parseBatchTasks)
    .where(eq(parseBatchTasks.batchId, lastBatch.id))

  if (linkedTasks.length > 0) {
    await db
      .update(tasks)
      .set({
        deletedAt: new Date(),
      })
      .where(and(inArray(tasks.id, linkedTasks.map((item) => item.taskId)), isNull(tasks.deletedAt)))
  }

  await db
    .update(parseBatches)
    .set({
      undoneAt: new Date(),
    })
    .where(eq(parseBatches.id, lastBatch.id))

  revalidateProtocolPages()
}

export interface AssistantAnswerState {
  question: string
  answer: string
  sources: Array<{ filename: string; snippet: string }>
}

export async function askAssistantAction(
  _prevState: AssistantAnswerState | null,
  formData: FormData,
): Promise<AssistantAnswerState> {
  const question = String(formData.get('question') ?? '').trim()
  if (!question) {
    return {
      question: '',
      answer: 'Нужен вопрос по загруженным протоколам.',
      sources: [],
    }
  }

  const chunks = await db
    .select({
      chunkText: protocolChunks.chunkText,
      protocolFilename: protocols.filename,
    })
    .from(protocolChunks)
    .innerJoin(protocols, eq(protocolChunks.protocolId, protocols.id))
    .orderBy(desc(protocols.uploadedAt), asc(protocolChunks.chunkIndex))
    .limit(250)

  const relevant = pickRelevantChunks(question, chunks)

  const result = await answerWithRag(
    question,
    relevant.map((item) => ({
      text: item.chunkText,
      protocolFilename: item.protocolFilename,
    })),
  )

  return {
    question,
    answer: result.answer,
    sources: result.sources,
  }
}
