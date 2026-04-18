'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Columns3,
  CalendarDays,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/app/board', label: 'Канбан', icon: Columns3 },
  { href: '/app/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/app/protocols', label: 'Протоколы', icon: FileText },
  { href: '/app/assistant', label: 'Ассистент', icon: MessageSquare },
  { href: '/app/dashboard', label: 'Дашборд', icon: LayoutDashboard },
]

const settingsItems = [
  { href: '/app/settings/assignees', label: 'Ответственные' },
  { href: '/app/settings/tags', label: 'Теги' },
  { href: '/app/settings/templates', label: 'Шаблоны задач' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const isSettings = pathname.startsWith('/app/settings')

  return (
    <aside className="flex flex-col w-60 shrink-0 border-r bg-sidebar min-h-screen">
      <div className="px-4 py-5 border-b">
        <span className="font-bold text-lg text-sidebar-foreground">Штаб</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4">
          <div className="px-3 pb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Настройки
          </div>
          {settingsItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0 opacity-60" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="px-2 py-4 border-t">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
