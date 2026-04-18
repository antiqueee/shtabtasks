'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/app/board', label: 'Канбан' },
  { href: '/app/calendar', label: 'Календарь' },
  { href: '/app/protocols', label: 'Протоколы' },
  { href: '/app/assistant', label: 'Ассистент' },
  { href: '/app/dashboard', label: 'Дашборд' },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <header className="border-b px-6 py-3 flex items-center gap-4">
      <span className="font-bold text-lg shrink-0">Штаб</span>

      <nav className="flex-1 flex items-center justify-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              pathname === item.href
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="shrink-0 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      >
        Выйти
      </button>
    </header>
  )
}
