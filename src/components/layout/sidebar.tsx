'use client'

import {
  LayoutDashboard,
  Server,
  Users,
  Package,
  CalendarDays,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { useAppStore, type ModuleKey } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'

interface NavItem {
  module: ModuleKey
  label: string
  icon: LucideIcon
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'Основное',
    items: [
      { module: 'dashboard', label: 'Панель управления', icon: LayoutDashboard },
      { module: 'equipment', label: 'Оборудование', icon: Server },
    ],
  },
  {
    title: 'Персонал',
    items: [
      { module: 'personnel', label: 'Подразделения', icon: Users },
    ],
  },
  {
    title: 'Материалы',
    items: [
      { module: 'spare-parts', label: 'Запасные части', icon: Package },
    ],
  },
  {
    title: 'Планирование',
    items: [
      { module: 'planning', label: 'График ППР', icon: CalendarDays },
    ],
  },
  {
    title: 'Обращения',
    items: [
      { module: 'requests', label: 'Неплановые заявки', icon: AlertTriangle },
    ],
  },
  {
    title: 'Отчёты',
    items: [
      { module: 'analytics', label: 'Аналитика', icon: BarChart3 },
    ],
  },
]

export function Sidebar() {
  const { activeModule, sidebarCollapsed, setActiveModule, toggleSidebar } = useAppStore()
  const { user } = useAuthStore()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор'
      case 'manager':
        return 'Менеджер'
      case 'engineer':
        return 'Инженер'
      default:
        return role
    }
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#0F1B2D] transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-16' : 'w-[260px]'
      )}
    >
      {/* Logo area */}
      <div className="flex h-14 items-center gap-3 border-b border-white/10 px-4 overflow-hidden">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-[#FF9900]">
          <Wrench className="size-4 text-white" />
        </div>
        <span
          className={cn(
            'whitespace-nowrap text-sm font-semibold text-white transition-all duration-200',
            sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
          )}
        >
          ЦС ТОРО
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3">
        <div className="space-y-1 px-2">
          {navSections.map((section) => (
            <div key={section.title} className="mb-3">
              {/* Section title */}
              {!sidebarCollapsed && (
                <p className="mb-1 px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </p>
              )}
              {sidebarCollapsed && <div className="my-2 border-t border-white/5 mx-2" />}

              {section.items.map((item) => {
                const isActive = activeModule === item.module
                const navButton = (
                  <button
                    key={item.module}
                    onClick={() => setActiveModule(item.module)}
                    className={cn(
                      'group relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
                      sidebarCollapsed && 'justify-center px-0',
                      isActive
                        ? 'border-l-2 border-[#FF9900] bg-white/10 text-white'
                        : 'border-l-2 border-transparent text-slate-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <item.icon
                      className={cn(
                        'shrink-0 transition-colors',
                        sidebarCollapsed ? 'size-5' : 'size-4',
                        isActive ? 'text-[#FF9900]' : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    <span
                      className={cn(
                        'truncate transition-all duration-200',
                        sidebarCollapsed ? 'hidden' : 'block'
                      )}
                    >
                      {item.label}
                    </span>
                  </button>
                )

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.module} delayDuration={0}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12}>
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return <div key={item.module}>{navButton}</div>
              })}
            </div>
          ))}
        </div>
      </nav>

      {/* Bottom section: user info + collapse toggle */}
      <div className="border-t border-white/10">
        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center gap-2 py-2.5 text-slate-500 transition-colors hover:text-white"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <>
              <ChevronLeft className="size-4" />
              <span className="text-xs">Свернуть</span>
            </>
          )}
        </button>

        {/* User info */}
        {user && (
          <div
            className={cn(
              'flex items-center gap-3 px-4 py-3 overflow-hidden',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-[#FF9900]/20 text-[#FF9900] text-xs font-semibold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                'min-w-0 transition-all duration-200',
                sidebarCollapsed ? 'hidden w-0 opacity-0' : 'block opacity-100'
              )}
            >
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-500">{getRoleLabel(user.role)}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
