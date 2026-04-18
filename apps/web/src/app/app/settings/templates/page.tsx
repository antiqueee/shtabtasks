import type { Metadata } from 'next'
import { createTemplateAction } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTaskFormOptions, getTaskTemplates } from '@/lib/app-data'
import { RRULE_PRESETS } from '../../../../../../../packages/shared/dist/index.js'

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export const metadata: Metadata = {
  title: 'Шаблоны задач',
  description: 'RRULE-шаблоны для регулярных задач штаба.',
}

export default async function TemplatesPage() {
  const [{ assignees, tags }, templates] = await Promise.all([getTaskFormOptions(), getTaskTemplates()])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Шаблоны задач</h1>
        <p className="text-muted-foreground">
          Правила регулярных задач уже можно хранить. Автогенерацию экземпляров подключу в фазе scheduler/rrule.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новый шаблон</CardTitle>
          <CardDescription>
            Примеры RRULE: <code>{RRULE_PRESETS.weekdays}</code>, <code>{RRULE_PRESETS.weekly_mon}</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTemplateAction} className="grid gap-4 lg:grid-cols-2">
            <input name="title" required placeholder="Еженедельный отчёт по УИК" className={inputClassName} />
            <input
              name="activeWindowDays"
              type="number"
              min={1}
              max={365}
              defaultValue={3}
              className={inputClassName}
            />
            <textarea
              name="description"
              placeholder="Что именно должно быть сделано по шаблону"
              className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm lg:col-span-2"
            />
            <select name="assigneeId" defaultValue="" className={inputClassName}>
              <option value="">Без ответственного</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name}
                </option>
              ))}
            </select>
            <select name="tagId" defaultValue="" className={inputClassName}>
              <option value="">Без тега</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            <input
              name="recurrenceRule"
              placeholder="FREQ=WEEKLY;BYDAY=MO,WE,FR"
              className={`${inputClassName} lg:col-span-2`}
            />
            <div className="lg:col-span-2 flex justify-end">
              <Button type="submit">Сохранить шаблон</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">Шаблонов пока нет.</CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardContent className="space-y-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{template.title}</h2>
                    {template.description ? (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    ) : null}
                  </div>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Активен' : 'Выключен'}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Ответственный: {template.assigneeName ?? 'не задан'}</span>
                  <span>Тег: {template.tagName ?? 'не задан'}</span>
                  <span>Окно активности: {template.activeWindowDays} дн.</span>
                  <span>RRULE: {template.recurrenceRule ?? 'не задан'}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
