'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  Columns3,
  CalendarDays,
  FileText,
  MessageSquare,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/app/board', label: 'Канбан', icon: Columns3 },
  { href: '/app/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/app/protocols', label: 'Протоколы', icon: FileText },
  { href: '/app/assistant', label: 'Ассистент', icon: MessageSquare },
  { href: '/app/dashboard', label: 'Дашборд', icon: LayoutDashboard },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex shrink-0 flex-col border-b bg-sidebar md:min-h-screen md:w-56 md:border-b-0 md:border-r">
      <div className="flex items-center justify-between border-b px-3 py-3 md:block md:px-4 md:py-5">
        <span className="text-base font-semibold tracking-tight text-sidebar-foreground md:text-lg">Штаб</span>
        <div className="md:hidden">
          <ThemeToggle />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 py-2 md:block md:flex-1 md:space-y-1 md:overflow-y-auto md:py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors md:gap-3 ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t px-2 py-4 md:block">
        <ThemeToggle />
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="mt-1 flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
