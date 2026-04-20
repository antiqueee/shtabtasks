import { db, assignees, parseBatches, parseBatchTasks, protocolChunks, protocols, tags, taskTemplates, tasks } from '@/lib/workspace-db'
import { and, asc, desc, eq, gte, isNotNull, isNull, lte, sql } from 'drizzle-orm'

export const boardStatuses = ['todo', 'in_progress', 'done'] as const

export type BoardStatus = (typeof boardStatuses)[number]
type DbTask = typeof tasks.$inferSelect
type DbAssignee = typeof assignees.$inferSelect
type DbTag = typeof tags.$inferSelect
type DbTemplate = typeof taskTemplates.$inferSelect

export interface TaskView {
  id: string
  title: string
  description: string | null
  dueAt: Date | null
  status: BoardStatus
  source: string
  completedAt: Date | null
  deletedAt: Date | null
  assigneeId: string | null
  assigneeName: string | null
  assigneeColor: string | null
  tagId: string | null
  tagName: string | null
  tagColor: string | null
}

function mapTaskRow(row: {
  task: DbTask
  assignee: DbAssignee | null
  tag: DbTag | null
}): TaskView {
  return {
    id: row.task.id,
    title: row.task.title,
    description: row.task.description,
    dueAt: row.task.dueAt,
    status: row.task.status === 'scheduled' ? 'todo' : row.task.status,
    source: row.task.source,
    completedAt: row.task.completedAt,
    deletedAt: row.task.deletedAt,
    assigneeId: row.assignee?.id ?? null,
    assigneeName: row.assignee?.name ?? null,
    assigneeColor: row.assignee?.color ?? null,
    tagId: row.tag?.id ?? null,
    tagName: row.tag?.name ?? null,
    tagColor: row.tag?.color ?? null,
  }
}

export async function getBoardTasks(): Promise<Record<BoardStatus, TaskView[]>> {
  const rows = await db
    .select({
      task: tasks,
      assignee: assignees,
      tag: tags,
    })
    .from(tasks)
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .leftJoin(tags, eq(tasks.tagId, tags.id))
    .where(isNull(tasks.deletedAt))
    .orderBy(asc(tasks.boardOrder), asc(tasks.dueAt), desc(tasks.createdAt))

  const grouped: Record<BoardStatus, TaskView[]> = {
    todo: [],
    in_progress: [],
    done: [],
  }

  for (const row of rows) {
    const task = mapTaskRow(row)
    grouped[task.status].push(task)
  }

  return grouped
}

export async function getDeletedTasks(): Promise<TaskView[]> {
  const rows = await db
    .select({
      task: tasks,
      assignee: assignees,
      tag: tags,
    })
    .from(tasks)
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .leftJoin(tags, eq(tasks.tagId, tags.id))
    .where(isNotNull(tasks.deletedAt))
    .orderBy(desc(tasks.deletedAt), desc(tasks.createdAt))

  return rows.map(mapTaskRow)
}

export async function getCalendarTasks(daysAhead = 21): Promise<TaskView[]> {
  const now = new Date()
  const until = new Date(now)
  until.setDate(until.getDate() + daysAhead)

  const rows = await db
    .select({
      task: tasks,
      assignee: assignees,
      tag: tags,
    })
    .from(tasks)
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .leftJoin(tags, eq(tasks.tagId, tags.id))
    .where(and(isNull(tasks.deletedAt), isNotNull(tasks.dueAt), gte(tasks.dueAt, now), lte(tasks.dueAt, until)))
    .orderBy(asc(tasks.dueAt), asc(tasks.boardOrder))

  return rows.map(mapTaskRow)
}

export async function getMonthTasks(year: number, month: number): Promise<TaskView[]> {
  const from = new Date(year, month, 1)
  const to = new Date(year, month + 1, 0, 23, 59, 59)

  const rows = await db
    .select({ task: tasks, assignee: assignees, tag: tags })
    .from(tasks)
    .leftJoin(assignees, eq(tasks.assigneeId, assignees.id))
    .leftJoin(tags, eq(tasks.tagId, tags.id))
    .where(and(isNull(tasks.deletedAt), isNotNull(tasks.dueAt), gte(tasks.dueAt, from), lte(tasks.dueAt, to)))
    .orderBy(asc(tasks.dueAt))

  return rows.map(mapTaskRow)
}

export async function getDashboardData() {
  const grouped = await getBoardTasks()
  const allTasks = [...grouped.todo, ...grouped.in_progress, ...grouped.done]
  const now = new Date()

  const overdue = allTasks.filter((task) => task.status !== 'done' && task.dueAt && task.dueAt < now)

  const byAssignee = new Map<string, number>()
  for (const task of allTasks) {
    const key = task.assigneeName ?? 'Без ответственного'
    byAssignee.set(key, (byAssignee.get(key) ?? 0) + 1)
  }

  return {
    total: allTasks.length,
    overdue: overdue.length,
    todo: grouped.todo.length,
    inProgress: grouped.in_progress.length,
    done: grouped.done.length,
    upcoming: allTasks
      .filter((task) => task.status !== 'done')
      .filter((task) => task.dueAt)
      .sort((a, b) => (a.dueAt?.getTime() ?? 0) - (b.dueAt?.getTime() ?? 0))
      .slice(0, 5),
    assigneeBreakdown: [...byAssignee.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  }
}

export async function getAssignees() {
  return db.select().from(assignees).orderBy(asc(assignees.name))
}

export async function getTags() {
  return db.select().from(tags).orderBy(asc(tags.name))
}

export async function getTaskTemplates(): Promise<
  Array<DbTemplate & { assigneeName: string | null; tagName: string | null }>
> {
  const rows = await db
    .select({
      template: taskTemplates,
      assignee: assignees,
      tag: tags,
    })
    .from(taskTemplates)
    .leftJoin(assignees, eq(taskTemplates.assigneeId, assignees.id))
    .leftJoin(tags, eq(taskTemplates.tagId, tags.id))
    .orderBy(desc(taskTemplates.createdAt))

  return rows.map((row) => ({
    ...row.template,
    assigneeName: row.assignee?.name ?? null,
    tagName: row.tag?.name ?? null,
  }))
}

export async function getTaskFormOptions() {
  const [assigneeRows, tagRows] = await Promise.all([getAssignees(), getTags()])

  return {
    assignees: assigneeRows,
    tags: tagRows,
  }
}

export async function getProtocolImports() {
  const rows = await db
    .select({
      batchId: parseBatches.id,
      createdAt: parseBatches.createdAt,
      undoneAt: parseBatches.undoneAt,
      protocolId: protocols.id,
      filename: protocols.filename,
      taskCount: sql<number>`count(${parseBatchTasks.taskId})`,
    })
    .from(parseBatches)
    .innerJoin(protocols, eq(parseBatches.protocolId, protocols.id))
    .leftJoin(parseBatchTasks, eq(parseBatchTasks.batchId, parseBatches.id))
    .groupBy(parseBatches.id, protocols.id)
    .orderBy(desc(parseBatches.createdAt))

  return rows
}

export async function getAssistantProtocolContext() {
  const chunks = await db
    .select({
      chunkText: protocolChunks.chunkText,
      protocolFilename: protocols.filename,
      chunkIndex: protocolChunks.chunkIndex,
      uploadedAt: protocols.uploadedAt,
    })
    .from(protocolChunks)
    .innerJoin(protocols, eq(protocolChunks.protocolId, protocols.id))
    .orderBy(desc(protocols.uploadedAt), asc(protocolChunks.chunkIndex))
    .limit(200)

  return chunks
}

export async function getAnalyticsData() {
  const dashboard = await getDashboardData()
  const imports = await getProtocolImports()

  const [tasksBySourceRows, eventRows] = await Promise.all([
    db
      .select({
        source: tasks.source,
        count: sql<number>`count(*)`,
      })
      .from(tasks)
      .where(isNull(tasks.deletedAt))
      .groupBy(tasks.source)
      .orderBy(desc(sql<number>`count(*)`)),
    db
      .select({
        eventName: protocols.filename,
        count: sql<number>`count(*)`,
      })
      .from(protocols)
      .groupBy(protocols.filename),
  ])

  return {
    dashboard,
    totalImports: imports.length,
    activeImports: imports.filter((item) => item.undoneAt === null).length,
    extractedTasks: imports.reduce((sum, item) => sum + item.taskCount, 0),
    tasksBySource: tasksBySourceRows,
    protocolCount: eventRows.length,
    completionRate:
      dashboard.total > 0 ? Math.round((dashboard.done / dashboard.total) * 100) : 0,
  }
}

export function formatDateTime(date: Date | null): string {
  if (!date) return 'Без дедлайна'

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

export function formatDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function getDefaultDueAt(): string {
  const dueAt = new Date()
  dueAt.setHours(18, 0, 0, 0)

  if (dueAt.getTime() <= Date.now()) {
    dueAt.setDate(dueAt.getDate() + 1)
  }

  return formatDateTimeLocalValue(dueAt)
}
