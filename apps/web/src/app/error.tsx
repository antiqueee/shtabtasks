'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="max-w-md space-y-5 rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Ошибка</div>
        <h1 className="text-3xl font-semibold">Что-то пошло не так</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Интерфейс словил исключение. Попробуй перезагрузить текущий экран.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground"
        >
          Попробовать снова
        </button>
      </div>
    </main>
  )
}
