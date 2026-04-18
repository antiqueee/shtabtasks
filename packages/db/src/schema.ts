import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
  jsonb,
  index,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'done'])

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const assignees = pgTable('assignees', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tgUsername: text('tg_username'),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: uuid('assignee_id').references(() => assignees.id),
  tagId: uuid('tag_id').references(() => tags.id),
  recurrenceRule: text('recurrence_rule'),
  activeWindowDays: integer('active_window_days').notNull().default(3),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const protocols = pgTable('protocols', {
  id: uuid('id').primaryKey().defaultRandom(),
  filename: text('filename').notNull(),
  originalText: text('original_text').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
})

export const tasks = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    templateId: uuid('template_id').references(() => taskTemplates.id),
    title: text('title').notNull(),
    description: text('description'),
    assigneeId: uuid('assignee_id').references(() => assignees.id),
    tagId: uuid('tag_id').references(() => tags.id),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    status: taskStatusEnum('status').notNull().default('todo'),
    source: text('source').notNull(),
    sourceProtocolId: uuid('source_protocol_id').references(() => protocols.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('tasks_due_at_idx').on(table.dueAt),
    index('tasks_status_idx').on(table.status),
    index('tasks_assignee_id_idx').on(table.assigneeId),
  ],
)

export const protocolChunks = pgTable(
  'protocol_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    protocolId: uuid('protocol_id')
      .notNull()
      .references(() => protocols.id, { onDelete: 'cascade' }),
    chunkText: text('chunk_text').notNull(),
    embedding: text('embedding'),
    chunkIndex: integer('chunk_index').notNull(),
  },
)

export const parseBatches = pgTable('parse_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  protocolId: uuid('protocol_id')
    .notNull()
    .references(() => protocols.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  undoneAt: timestamp('undone_at', { withTimezone: true }),
})

export const parseBatchTasks = pgTable(
  'parse_batch_tasks',
  {
    batchId: uuid('batch_id')
      .notNull()
      .references(() => parseBatches.id),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id),
  },
  (table) => [primaryKey({ columns: [table.batchId, table.taskId] })],
)

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventName: text('event_name').notNull(),
    payload: jsonb('payload'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('events_created_at_idx').on(table.createdAt.desc()),
    index('events_event_name_idx').on(table.eventName),
  ],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Assignee = typeof assignees.$inferSelect
export type Tag = typeof tags.$inferSelect
export type TaskTemplate = typeof taskTemplates.$inferSelect
export type Task = typeof tasks.$inferSelect
export type NewTask = typeof tasks.$inferInsert
export type Protocol = typeof protocols.$inferSelect
export type ProtocolChunk = typeof protocolChunks.$inferSelect
export type ParseBatch = typeof parseBatches.$inferSelect
export type Event = typeof events.$inferSelect
