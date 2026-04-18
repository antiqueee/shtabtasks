'use client'

import { useActionState } from 'react'
import { askAssistantAction, type AssistantAnswerState } from '@/app/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const initialState: AssistantAnswerState = {
  question: '',
  answer: 'Задай вопрос по загруженным протоколам, и я отвечу только на их основе.',
  sources: [],
}

export function AssistantClient() {
  const [state, formAction, pending] = useActionState(askAssistantAction, initialState)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Вопрос к протоколам</CardTitle>
          <CardDescription>
            Например: кто отвечает за агитацию на этой неделе, какие дедлайны по юристам, что решили по полевой работе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <textarea
              name="question"
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Спроси что-то по загруженным протоколам"
              defaultValue={state.question}
            />
            <Button type="submit" disabled={pending}>
              {pending ? 'Думаю...' : 'Спросить ассистента'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ответ</CardTitle>
          <CardDescription>Ассистент отвечает только по найденным фрагментам загруженных протоколов.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-6">{state.answer}</div>

          {state.sources.length > 0 ? (
            <div className="space-y-3">
              <div className="text-sm font-medium">Источники</div>
              {state.sources.map((source, index) => (
                <div key={`${source.filename}-${index}`} className="rounded-lg border p-3">
                  <div className="mb-2">
                    <Badge variant="outline">{source.filename}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{source.snippet}</p>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
