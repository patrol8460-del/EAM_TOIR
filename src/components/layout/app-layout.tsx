'use client'

import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { useAppStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div
        className={cn(
          'flex flex-1 flex-col min-h-screen min-w-0 overflow-hidden transition-[margin-left] duration-200 ease-in-out',
          sidebarCollapsed ? 'ml-16' : 'ml-[260px]'
        )}
      >
        <TopBar />

        <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
