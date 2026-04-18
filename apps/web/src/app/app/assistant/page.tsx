import { AssistantClient } from '@/components/AssistantClient'
import { Card, CardContent } from '@/components/ui/card'
import { getProtocolImports } from '@/lib/app-data'

export default async function AssistantPage() {
  const imports = await getProtocolImports()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Ассистент</h1>
        <p className="text-muted-foreground">
          Вопросы по протоколам, встречам и поручениям. Ответ формируется только по загруженным документам.
        </p>
      </div>

      {imports.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Сначала загрузи хотя бы один протокол, потом ассистент сможет по нему отвечать.
          </CardContent>
        </Card>
      ) : (
        <AssistantClient />
      )}
    </div>
  )
}
