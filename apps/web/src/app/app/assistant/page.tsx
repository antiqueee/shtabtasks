import type { Metadata } from 'next'
import Link from 'next/link'
import { AssistantClient } from '@/components/AssistantClient'
import { Card, CardContent } from '@/components/ui/card'
import { getProtocolImports } from '@/lib/app-data'

export const metadata: Metadata = {
  title: 'RAG-ассистент',
  description: 'Скрытая учебная страница: вопросы к загруженным протоколам и решениям штаба.',
}

export default async function AssistantPage() {
  const imports = await getProtocolImports()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="text-sm text-muted-foreground">Скрытая страница для проверки учебного критерия</div>
        <h1 className="text-3xl font-semibold tracking-tight">RAG-ассистент по протоколам</h1>
        <p className="max-w-3xl text-muted-foreground">
          Ассистент отвечает на вопросы только по фрагментам загруженных протоколов. Страница не вынесена в боковое
          меню, чтобы не мешать основному рабочему интерфейсу, но доступна по прямой ссылке для проверки.
        </p>
      </div>

      {imports.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-10 text-center text-muted-foreground">
            <p>Сначала загрузи хотя бы один протокол, потом ассистент сможет по нему отвечать.</p>
            <Link href="/app/protocols" className="text-sm font-medium text-foreground underline underline-offset-4">
              Открыть загрузку протоколов
            </Link>
          </CardContent>
        </Card>
      ) : (
        <AssistantClient />
      )}
    </div>
  )
}
