import { createTaskAction, updateTaskStatusAction } from '@/app/app/actions'
import {
  boardStatuses,
  formatDateTime,
  getBoardTasks,
  getDefaultDueAt,
  getTaskFormOptions,
  type BoardStatus,
} from '@/lib/app-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const statusMeta: Record<BoardStatus, { title: string; description: string }> = {
  todo: {
    title: 'К выполнению',
    description: 'Новые и отложенные задачи',
  },
  in_progress: {
    title: 'В работе',
    description: 'Задачи, которые сейчас двигаются',
  },
  done: {
    title: 'Готово',
    description: 'Закрытые задачи',
  },
}

const selectClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export default async function BoardPage() {
  const [{ assignees, tags }, groupedTasks] = await Promise.all([
    getTaskFormOptions(),
    getBoardTasks(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Канбан-доска</h1>
        <p className="text-muted-foreground">
          Ручной ввод задач уже работает. Голос, drag-and-drop и протоколы пойдут следующими фазами.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая задача</CardTitle>
          <CardDescription>Создаётся сразу в системе с дедлайном, ответственным и тегом.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTaskAction} className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Название
              </label>
              <input
                id="title"
                name="title"
                required
                className={selectClassName}
                placeholder="Подготовить план полевой агитации"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dueAt">
                Дедлайн
              </label>
              <input
                id="dueAt"
                name="dueAt"
                type="datetime-local"
                required
                defaultValue={getDefaultDueAt()}
                className={selectClassName}
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium" htmlFor="description">
                Описание
              </label>
              <textarea
                id="description"
                name="description"
                className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Контекст, ожидаемый результат, детали"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="assigneeId">
                Ответственный
              </label>
              <select id="assigneeId" name="assigneeId" className={selectClassName} defaultValue="">
                <option value="">Без ответственного</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="tagId">
                Тег
              </label>
              <select id="tagId" name="tagId" className={selectClassName} defaultValue="">
                <option value="">Без тега</option>
                {tags.map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            <input type="hidden" name="status" value="todo" />

            <div className="lg:col-span-2 flex justify-end">
              <Button type="submit">Создать задачу</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {boardStatuses.map((status) => (
          <Card key={status} className="border-border/70">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{statusMeta[status].title}</CardTitle>
                  <CardDescription>{statusMeta[status].description}</CardDescription>
                </div>
                <Badge variant="secondary">{groupedTasks[status].length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {groupedTasks[status].length === 0 ? (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Пусто
                </div>
              ) : (
                groupedTasks[status].map((task) => (
                  <div key={task.id} className="rounded-xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <h2 className="font-medium leading-snug">{task.title}</h2>
                        {task.description ? (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        ) : null}
                      </div>
                      {task.tagName ? (
                        <Badge variant="outline" className="shrink-0">
                          {task.tagName}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>Дедлайн: {formatDateTime(task.dueAt)}</span>
                      <span>Источник: {task.source}</span>
                      <span>Ответственный: {task.assigneeName ?? 'не назначен'}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {boardStatuses
                        .filter((nextStatus) => nextStatus !== task.status)
                        .map((nextStatus) => (
                          <form key={nextStatus} action={updateTaskStatusAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <input type="hidden" name="status" value={nextStatus} />
                            <Button type="submit" variant="outline" size="sm">
                              {statusMeta[nextStatus].title}
                            </Button>
                          </form>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
