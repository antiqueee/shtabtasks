import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Календарь задач штаба на голосе и протоколах',
  description: 'Веб-приложение и Telegram-бот для задач штаба: голос, протоколы встреч, календарь, канбан и ассистент.',
}

const steps = [
  {
    title: 'Голосовое в Telegram',
    text: 'Сказал задачу в бот, получил готовую запись с дедлайном, тегом и ответственным.',
  },
  {
    title: 'Загрузка протокола',
    text: 'Загрузил `.docx`, `.xlsx` или вставил текст. Система извлекла поручения и сохранила историю разбора.',
  },
  {
    title: 'Вопрос ассистенту',
    text: 'Спросил по протоколам и получил ответ с привязкой к найденным фрагментам.',
  },
]

const features = [
  'Канбан и календарь в одном контуре',
  'Telegram-бот с текстом и голосом',
  'Парсинг поручений из протоколов',
  'Undo последней загрузки',
  'Регулярные задачи и напоминания',
  'RAG-ассистент по встречам и решениям',
]

export default function LandingPage() {
  const ownerEmail = process.env.AUTH_OWNER_EMAIL ?? 'owner@example.com'

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.18),_transparent_32%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(241,245,249,1)_100%)] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-700 shadow-sm backdrop-blur">
              Штабной операционный контур
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Календарь задач штаба на голосе и протоколах
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Один главный технолог, один рабочий контур и никакой ручной возни между Telegram, заметками,
                таблицами и протоколами встреч.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Войти
              </Link>
              <a
                href={`mailto:${ownerEmail}`}
                className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-400"
              >
                Связаться
              </a>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur">
            <div className="grid gap-4">
              <div className="rounded-2xl bg-slate-950 p-5 text-white">
                <div className="text-sm text-slate-300">Telegram-бот</div>
                <div className="mt-2 text-lg font-medium">“Завтра до 18:00 собрать отчёт по полю”</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-5">
                <div className="text-sm text-slate-500">Автозадача</div>
                <div className="mt-2 font-medium">Отчёт по полевой работе</div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">Полевая работа</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">18:00 завтра</span>
                </div>
              </div>
              <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
                Протоколы, календарь, канбан, напоминания и ассистент работают в одном месте.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Как это работает</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 text-sm font-medium text-white">
                {index + 1}
              </div>
              <h3 className="text-xl font-medium">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold tracking-tight">Что внутри</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="text-lg font-medium">{feature}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>Штабные задачи</div>
          <div className="flex flex-wrap gap-4">
            <Link href="/login" className="hover:text-slate-950">
              Войти
            </Link>
            <a href={`mailto:${ownerEmail}`} className="hover:text-slate-950">
              {ownerEmail}
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
