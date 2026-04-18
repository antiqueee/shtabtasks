import type { Metadata } from 'next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAnalyticsData } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Скрытая аналитика',
  description: 'Внутренняя аналитика загрузки протоколов и выполнения задач штаба.',
}

export default async function AnalyticsPage() {
  const analytics = await getAnalyticsData()

  const funnel = [
    { label: 'Загружено протоколов', value: analytics.totalImports },
    { label: 'Активных импортов', value: analytics.activeImports },
    { label: 'Извлечено задач', value: analytics.extractedTasks },
    { label: 'Всего задач в системе', value: analytics.dashboard.total },
    { label: 'Завершено задач', value: analytics.dashboard.done },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Скрытая аналитика</h1>
        <p className="text-muted-foreground">
          Внутренний срез по воронке протоколов, каналам появления задач и темпу закрытия.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {funnel.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Источники задач</CardTitle>
            <CardDescription>Какими каналами задачи попадают в систему чаще всего.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.tasksBySource.map((row) => (
              <div key={row.source} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span className="text-sm">{row.source}</span>
                <Badge variant="secondary">{row.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Темп закрытия</CardTitle>
            <CardDescription>Грубая оценка текущей дисциплины исполнения.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-5xl font-semibold">{analytics.completionRate}%</div>
            <p className="text-sm text-muted-foreground">
              Доля завершённых задач от общего числа активных и исторических записей.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
