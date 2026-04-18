import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-6 py-16">
      <div className="max-w-md space-y-5 rounded-3xl border bg-background p-8 text-center shadow-sm">
        <div className="text-sm uppercase tracking-[0.3em] text-muted-foreground">404</div>
        <h1 className="text-3xl font-semibold">Страница не найдена</h1>
        <p className="text-sm leading-7 text-muted-foreground">
          Такой страницы нет или она скрыта. Вернись на главную или в рабочий контур.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/" className="rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
            На главную
          </Link>
          <Link href="/app/board" className="rounded-full border px-5 py-2 text-sm">
            В канбан
          </Link>
        </div>
      </div>
    </main>
  )
}
