'use client'

import { Menu, Bell, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAppStore, type ModuleKey } from '@/store/app-store'
import { useAuthStore } from '@/store/auth-store'

const breadcrumbMap: Record<ModuleKey, string> = {
  dashboard: 'Панель управления',
  equipment: 'Оборудование',
  personnel: 'Персонал',
  'spare-parts': 'Запасные части',
  planning: 'Планирование ППР',
  requests: 'Неплановые заявки',
  analytics: 'Аналитика',
}

export function TopBar() {
  const { activeModule, sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user, logout } = useAuthStore()

  const breadcrumb = breadcrumbMap[activeModule]

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
    <header className="sticky top-0 z-30 flex h-14 items-center border-b border-gray-200 bg-white px-4">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="size-8 text-gray-500 hover:text-gray-700"
        >
          <Menu className="size-4" />
          <span className="sr-only">Переключить боковую панель</span>
        </Button>

        {/* Breadcrumb */}
        <nav aria-label="Навигация" className="flex items-center gap-1.5 text-sm">
          <span className="text-gray-400">ЦС ТОРО</span>
          <ChevronRight className="size-3.5 text-gray-300" />
          <span className="font-medium text-gray-800">{breadcrumb}</span>
        </nav>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 text-gray-500 hover:text-gray-700"
            >
              <Bell className="size-4" />
              <span className="absolute right-1 top-1 flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF9900] opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-[#FF9900]" />
              </span>
              <span className="sr-only">Уведомления</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Уведомления</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">Новая заявка</span>
              <span className="text-xs text-muted-foreground">
                Создана заявка на ремонт насоса #452
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">ППР просрочен</span>
              <span className="text-xs text-muted-foreground">
                Плановое ТО компрессора К-12 просрочено на 3 дня
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="text-sm font-medium">Запчасть получена</span>
              <span className="text-xs text-muted-foreground">
                Поступил заказ на подшипники SKF-6205
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User dropdown */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="ml-1 flex items-center gap-2 px-2 hover:bg-gray-100"
              >
                <Avatar className="size-7">
                  <AvatarFallback className="bg-[#FF9900]/15 text-[#FF9900] text-[11px] font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden items-center gap-1.5 md:flex">
                  <span className="text-sm font-medium text-gray-700">{user.name}</span>
                  <Badge
                    variant="secondary"
                    className="bg-[#FF9900]/10 text-[#FF9900] border-0 text-[10px] font-medium"
                  >
                    {getRoleLabel(user.role)}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-[#FF9900]">{getRoleLabel(user.role)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  logout()
                }}
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
