import { z } from 'zod'

export const taskSourceSchema = z.enum([
  'voice_tg',
  'text_tg',
  'voice_web',
  'text_web',
  'protocol_docx',
  'protocol_xlsx',
  'protocol_paste',
  'manual',
])

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done'])

export const taskSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid().nullable(),
  title: z.string().min(1),
  description: z.string().nullable(),
  assigneeId: z.string().uuid().nullable(),
  tagId: z.string().uuid().nullable(),
  dueAt: z.coerce.date(),
  status: taskStatusSchema,
  source: taskSourceSchema,
  sourceProtocolId: z.string().uuid().nullable(),
  createdAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
})

export const taskTemplateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().nullable(),
  assigneeId: z.string().uuid().nullable(),
  tagId: z.string().uuid().nullable(),
  recurrenceRule: z.string().nullable(),
  activeWindowDays: z.number().int().positive().default(3),
  isActive: z.boolean().default(true),
  createdAt: z.coerce.date(),
})

export const parsedTaskFromProtocolSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  assigneeName: z.string().nullable(),
  dueAt: z.coerce.date().nullable(),
  tagName: z.string().nullable(),
})

export type Task = z.infer<typeof taskSchema>
export type TaskTemplate = z.infer<typeof taskTemplateSchema>
export type ParsedTaskFromProtocol = z.infer<typeof parsedTaskFromProtocolSchema>
export type TaskSource = z.infer<typeof taskSourceSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
