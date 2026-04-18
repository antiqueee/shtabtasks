import { createTagAction } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getTags } from '@/lib/app-data'

const inputClassName =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export default async function TagsPage() {
  const tags = await getTags()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Теги</h1>
        <p className="text-muted-foreground">Категории для канбана, календаря и будущей аналитики.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Добавить тег</CardTitle>
          <CardDescription>Например: агитация, медиа, юристы, полевая работа.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createTagAction} className="grid gap-4 md:grid-cols-[1fr_140px_auto]">
            <input name="name" required placeholder="Штабы УИК" className={inputClassName} />
            <input name="color" type="color" defaultValue="#16a34a" className="h-10 w-full rounded-md border" />
            <Button type="submit">Сохранить</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {tags.map((tag) => (
          <Card key={tag.id}>
            <CardContent className="flex items-center justify-between gap-3 py-5">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: tag.color }} aria-hidden="true" />
                <span className="font-medium">{tag.name}</span>
              </div>
              <Badge variant="outline">{tag.color}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
