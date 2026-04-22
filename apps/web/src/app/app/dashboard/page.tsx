import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, getDashboardData } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Дашборд',
  description: 'Сводка по задачам, нагрузке и ближайшим дедлайнам штаба.',
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData()

  const stats = [
    { label: 'Всего задач', value: dashboard.total },
    { label: 'К выполнению', value: dashboard.todo },
    { label: 'В работе', value: dashboard.inProgress },
    { label: 'Просрочено', value: dashboard.overdue },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-muted-foreground">
          Сводка по задачам штаба, ближайшим дедлайнам и нагрузке по ответственным.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ближайшие задачи</CardTitle>
            <CardDescription>Следующие задачи, которые требуют внимания.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет активных задач без завершения.</p>
            ) : (
              dashboard.upcoming.map((task) => (
                <div key={task.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-medium">{task.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {task.assigneeName ?? 'Без ответственного'} • {formatDateTime(task.dueAt)}
                      </p>
                    </div>
                    {task.tagName ? <Badge variant="outline">{task.tagName}</Badge> : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Нагрузка по ответственным</CardTitle>
            <CardDescription>Сколько задач сейчас висит на каждом направлении.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.assigneeBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Данных пока нет.</p>
            ) : (
              dashboard.assigneeBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <span className="text-sm">{item.name}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
