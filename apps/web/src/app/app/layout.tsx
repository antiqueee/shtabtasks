import { AppSidebar } from '@/components/AppSidebar'
import { Toaster } from '@/components/ui/sonner'

export const dynamic = 'force-dynamic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen md:flex">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="p-3 sm:p-5 lg:p-6">{children}</div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}
