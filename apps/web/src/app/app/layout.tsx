import { AppNav } from '@/components/AppNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppNav />
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
