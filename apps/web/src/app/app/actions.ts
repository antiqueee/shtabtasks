'use server'

import { db, assignees, tags, taskTemplates, tasks } from '@shtab/db'
import { isValidRRule } from '@shtab/shared/utils/rrule'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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
  assigneeId: nullableUuidSchema,
  tagId: nullableUuidSchema,
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

export async function createTaskAction(formData: FormData) {
  const parsed = taskInputSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    assigneeId: formData.get('assigneeId'),
    tagId: formData.get('tagId'),
    dueAt: formData.get('dueAt'),
    status: formData.get('status'),
  })

  if (!parsed.success) {
    return
  }

  const dueAt = new Date(parsed.data.dueAt)
  if (Number.isNaN(dueAt.getTime())) {
    return
  }

  await db.insert(tasks).values({
    title: parsed.data.title,
    description: parsed.data.description,
    assigneeId: parsed.data.assigneeId,
    tagId: parsed.data.tagId,
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
