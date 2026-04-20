import type { Metadata } from 'next'
import { createTaskAction, deleteTaskAction, updateTaskAction, updateTaskStatusAction } from '@/app/app/actions'
import {
  boardStatuses,
  formatDateTime,
  formatDateTimeLocalValue,
  getBoardTasks,
  getDefaultDueAt,
  getTaskFormOptions,
  type BoardStatus,
} from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Канбан',
  description: 'Канбан-доска задач штаба.',
}

const statusMeta: Record<BoardStatus, { title: string; headerClass: string; dotClass: string }> = {
  todo: {
    title: 'К выполнению',
    headerClass: 'bg-red-50 border-red-200',
    dotClass: 'bg-red-400',
  },
  in_progress: {
    title: 'В работе',
    headerClass: 'bg-amber-50 border-amber-200',
    dotClass: 'bg-amber-400',
  },
  done: {
    title: 'Готово',
    headerClass: 'bg-emerald-50 border-emerald-200',
    dotClass: 'bg-emerald-400',
  },
}

const statusLabels: Record<BoardStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Готово',
}

const inputCls = 'h-8 w-full rounded border border-input bg-background px-2.5 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring'

export default async function BoardPage() {
  const [{ assignees, tags }, groupedTasks] = await Promise.all([
    getTaskFormOptions(),
    getBoardTasks(),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Канбан</h1>

      {/* Compact new task form */}
      <form action={createTaskAction} className="rounded-lg border bg-card p-3 shadow-sm">
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-[2] min-w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Название</label>
            <input name="title" required placeholder="Название задачи" className={inputCls} />
          </div>
          <div className="w-40">
            <label className="text-xs text-muted-foreground mb-1 block">Дедлайн</label>
            <input name="dueAt" type="datetime-local" placeholder={getDefaultDueAt()} className={inputCls} />
          </div>
          <div className="w-36">
            <label className="text-xs text-muted-foreground mb-1 block">Ответственный</label>
            <input
              name="assigneeName"
              list="assignees-list"
              placeholder="Имя..."
              className={inputCls}
              autoComplete="off"
            />
            <datalist id="assignees-list">
              {assignees.map((a) => <option key={a.id} value={a.name} />)}
            </datalist>
          </div>
          <div className="w-32">
            <label className="text-xs text-muted-foreground mb-1 block">Тег</label>
            <input
              name="tagName"
              list="tags-list"
              placeholder="Тег..."
              className={inputCls}
              autoComplete="off"
            />
            <datalist id="tags-list">
              {tags.map((t) => <option key={t.id} value={t.name} />)}
            </datalist>
          </div>
          <input type="hidden" name="status" value="todo" />
          <button
            type="submit"
            className="h-8 px-4 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity shrink-0"
          >
            Создать
          </button>
        </div>
      </form>

      {/* Kanban columns */}
      <div className="grid gap-4 xl:grid-cols-3">
        {boardStatuses.map((status) => {
          const meta = statusMeta[status]
          const taskList = groupedTasks[status]
          return (
            <div key={status} className="flex flex-col gap-2">
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${meta.headerClass}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} />
                <span className="text-sm font-semibold">{meta.title}</span>
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-white/70 rounded-full px-2 py-0.5">
                  {taskList.length}
                </span>
              </div>

              <div className="space-y-2">
                {taskList.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground text-center">
                    Пусто
                  </div>
                ) : (
                  taskList.map((task) => (
                    <div key={task.id} className="rounded-lg border bg-card p-3 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-snug">{task.title}</p>
                        {task.tagName ? (
                          <span
                            className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium text-white"
                            style={{ backgroundColor: task.tagColor ?? '#64748b' }}
                          >
                            {task.tagName}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>{formatDateTime(task.dueAt)}</span>
                        {task.assigneeName ? (
                          <span
                            className="px-2 py-0.5 rounded-full text-white font-medium"
                            style={{ backgroundColor: task.assigneeColor ?? '#64748b' }}
                          >
                            {task.assigneeName}
                          </span>
                        ) : null}
                      </div>

                      <details className="rounded-md border border-border/60 bg-muted/20 px-2 py-1.5">
                        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                          Редактировать
                        </summary>
                        <form action={updateTaskAction} className="mt-2 grid gap-2 sm:grid-cols-2">
                          <input type="hidden" name="taskId" value={task.id} />
                          <input type="hidden" name="status" value={task.status} />
                          <input name="title" required defaultValue={task.title} className={inputCls} />
                          <input
                            name="dueAt"
                            type="datetime-local"
                            defaultValue={task.dueAt ? formatDateTimeLocalValue(task.dueAt) : ''}
                            className={inputCls}
                          />
                          <input
                            name="assigneeName"
                            list="assignees-list"
                            defaultValue={task.assigneeName ?? ''}
                            placeholder="Ответственный"
                            className={inputCls}
                          />
                          <input
                            name="tagName"
                            list="tags-list"
                            defaultValue={task.tagName ?? ''}
                            placeholder="Тег"
                            className={inputCls}
                          />
                          <textarea
                            name="description"
                            defaultValue={task.description ?? ''}
                            placeholder="Описание"
                            className="min-h-16 rounded border border-input bg-background px-2.5 py-1 text-sm sm:col-span-2"
                          />
                          <button
                            type="submit"
                            className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted sm:col-span-2"
                          >
                            Сохранить
                          </button>
                        </form>
                      </details>

                      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/50">
                        {boardStatuses
                          .filter((s) => s !== task.status)
                          .map((nextStatus) => (
                            <form key={nextStatus} action={updateTaskStatusAction}>
                              <input type="hidden" name="taskId" value={task.id} />
                              <input type="hidden" name="status" value={nextStatus} />
                              <button
                                type="submit"
                                className="text-xs px-2.5 py-1 rounded border border-border hover:bg-muted transition-colors"
                              >
                                {statusLabels[nextStatus]}
                              </button>
                            </form>
                          ))}
                        <form action={deleteTaskAction} className="ml-auto">
                          <input type="hidden" name="taskId" value={task.id} />
                          <button
                            type="submit"
                            className="text-xs px-2.5 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
                          >
                            Удалить
                          </button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
