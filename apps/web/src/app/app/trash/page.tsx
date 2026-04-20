import type { Metadata } from 'next'
import { deleteTaskPermanentlyAction, restoreTaskAction } from '@/app/app/actions'
import { formatDateTime, getDeletedTasks } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Корзина',
  description: 'Удалённые задачи штаба.',
}

export default async function TrashPage() {
  const tasks = await getDeletedTasks()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
        <p className="text-sm text-muted-foreground">
          Здесь лежат удалённые задачи. Их можно восстановить или удалить окончательно.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
          Корзина пуста
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div key={task.id} className="rounded-lg border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <h2 className="font-medium leading-snug">{task.title}</h2>
                  {task.description ? (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{formatDateTime(task.dueAt)}</span>
                    {task.assigneeName ? <span>Ответственный: {task.assigneeName}</span> : null}
                    {task.tagName ? <span>Тег: {task.tagName}</span> : null}
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <form action={restoreTaskAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      type="submit"
                      className="rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted"
                    >
                      Восстановить
                    </button>
                  </form>
                  <form action={deleteTaskPermanentlyAction}>
                    <input type="hidden" name="taskId" value={task.id} />
                    <button
                      type="submit"
                      className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                    >
                      Удалить навсегда
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
