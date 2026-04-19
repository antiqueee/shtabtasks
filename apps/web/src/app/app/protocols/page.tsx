import type { Metadata } from 'next'
import { importProtocolAction, undoLastProtocolImportAction } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, getProtocolImports } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Протоколы',
  description: 'Загрузка и разбор протоколов встреч в задачи с undo последнего импорта.',
}

export default async function ProtocolsPage() {
  const imports = await getProtocolImports()
  const lastActiveImport = imports.find((item) => item.undoneAt === null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Протоколы</h1>
        <p className="text-muted-foreground">
          Загружай `.docx`, `.xlsx`, `.pdf` или вставляй текст. Система извлечёт задачи через LLM и сохранит историю импорта.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая загрузка</CardTitle>
          <CardDescription>
            Можно загрузить файл или просто вставить текст стенограммы/протокола. Если указаны оба источника, приоритет у файла.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={importProtocolAction} className="space-y-4">
            <input
              name="protocolFile"
              type="file"
              accept=".docx,.xlsx,.xls,.pdf,.txt,.md"
              className="block w-full text-sm text-muted-foreground"
            />
            <textarea
              name="protocolText"
              className="min-h-56 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Вставь сюда текст протокола, если не загружаешь файл"
            />
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Разобрать протокол</Button>
            </div>
          </form>
          <form action={undoLastProtocolImportAction}>
            <Button type="submit" variant="outline" disabled={!lastActiveImport}>
              Undo последней загрузки
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {imports.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Импортов протоколов пока не было.
            </CardContent>
          </Card>
        ) : (
          imports.map((item) => (
            <Card key={item.batchId}>
              <CardContent className="space-y-3 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-medium">{item.filename}</h2>
                    <p className="text-sm text-muted-foreground">
                      Загрузка: {formatDateTime(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{item.taskCount} задач</Badge>
                    <Badge variant={item.undoneAt ? 'outline' : 'default'}>
                      {item.undoneAt ? 'Отменено' : 'Активно'}
                    </Badge>
                  </div>
                </div>

                {item.undoneAt ? (
                  <p className="text-sm text-muted-foreground">
                    Undo выполнен: {formatDateTime(item.undoneAt)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
