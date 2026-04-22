import type { Metadata } from 'next'
import { importProtocolAction, undoLastProtocolImportAction } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, getProtocolImports } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'Протоколы',
  description: 'Скрытая учебная страница: загрузка протоколов, LLM-разбор задач и база для RAG.',
}

export default async function ProtocolsPage() {
  const imports = await getProtocolImports()
  const lastActiveImport = imports.find((item) => item.undoneAt === null)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Скрытая страница для проверки учебных критериев</div>
        <h1 className="text-3xl font-semibold tracking-tight">Протоколы и файлы</h1>
        <p className="max-w-3xl text-muted-foreground">
          Загружай `.docx`, `.xlsx`, `.pdf`, `.txt` или вставляй текст. Система извлекает поручения через LLM,
          создаёт задачи и сохраняет текстовые фрагменты как контекст для RAG-ассистента.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Новая загрузка</CardTitle>
          <CardDescription>
            Если указаны файл и текст одновременно, приоритет у файла. Undo удаляет задачи последней активной загрузки
            в корзину.
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
            <Button type="submit">Разобрать протокол</Button>
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
                    <p className="text-sm text-muted-foreground">Загрузка: {formatDateTime(item.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{item.taskCount} задач</Badge>
                    <Badge variant={item.undoneAt ? 'outline' : 'default'}>
                      {item.undoneAt ? 'Отменено' : 'Активно'}
                    </Badge>
                  </div>
                </div>

                {item.undoneAt ? (
                  <p className="text-sm text-muted-foreground">Undo выполнен: {formatDateTime(item.undoneAt)}</p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
