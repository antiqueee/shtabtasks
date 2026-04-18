import type { Metadata } from 'next'
import { createAssigneeAction } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAssignees } from '@/lib/app-data'

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export const metadata: Metadata = {
  title: 'Ответственные',
  description: 'Справочник ответственных для задач штаба.',
}

export default async function AssigneesPage() {
  const assignees = await getAssignees()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ответственные</h1>
        <p className="text-muted-foreground">
          Это справочник людей и направлений. Аккаунты им не нужны, но их можно назначать на задачи.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить ответственного</CardTitle>
          <CardDescription>Имя, Telegram username и цвет для быстрой визуальной навигации.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createAssigneeAction} className="grid gap-4 md:grid-cols-[1fr_1fr_140px_auto]">
            <input name="name" required placeholder="Мария К." className={inputClassName} />
            <input name="tgUsername" placeholder="@maria_field" className={inputClassName} />
            <input name="color" type="color" defaultValue="#2563eb" className="h-10 w-full rounded-md border" />
            <Button type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {assignees.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Справочник пока пуст.</CardContent>
          </Card>
        ) : (
          assignees.map((assignee) => (
            <Card key={assignee.id}>
              <CardContent className="flex flex-col gap-3 py-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: assignee.color }}
                    aria-hidden="true"
                  />
                  <div>
                    <div className="font-medium">{assignee.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignee.tgUsername ? `@${assignee.tgUsername}` : 'Telegram не указан'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline">{assignee.color}</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
