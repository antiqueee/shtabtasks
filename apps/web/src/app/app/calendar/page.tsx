import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, getCalendarTasks } from '@/lib/app-data'

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  }).format(date)
}

export default async function CalendarPage() {
  const tasks = await getCalendarTasks()
  const grouped = new Map<string, typeof tasks>()

  for (const task of tasks) {
    const key = task.dueAt.toISOString().slice(0, 10)
    const existing = grouped.get(key)
    if (existing) {
      existing.push(task)
    } else {
      grouped.set(key, [task])
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Календарь</h1>
        <p className="text-muted-foreground">
          Ближайшие 3 недели по дедлайнам. Детальные карточки задач откроем следующими итерациями.
        </p>
      </div>

      {tasks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            На ближайшие 3 недели задач пока нет.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Array.from(grouped.entries()).map(([day, dayTasks]) => (
            <Card key={day}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="capitalize">{formatDayLabel(dayTasks[0].dueAt)}</CardTitle>
                    <CardDescription>{dayTasks.length} задач в этот день</CardDescription>
                  </div>
                  <Badge variant="secondary">{dayTasks.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-medium">{task.title}</h2>
                        {task.tagName ? <Badge variant="outline">{task.tagName}</Badge> : null}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {task.assigneeName ?? 'Без ответственного'} • {formatDateTime(task.dueAt)}
                      </p>
                      {task.description ? (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      ) : null}
                    </div>

                    <Badge variant={task.status === 'done' ? 'secondary' : 'default'}>
                      {task.status === 'todo'
                        ? 'К выполнению'
                        : task.status === 'in_progress'
                          ? 'В работе'
                          : 'Готово'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
