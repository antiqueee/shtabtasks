import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">Штабные задачи</h1>
      <p className="text-gray-500 text-center max-w-md">
        Система управления задачами избирательного штаба
      </p>
      <Link
        href="/app/board"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Войти в систему
      </Link>
    </main>
  )
}
