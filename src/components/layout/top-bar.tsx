'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Menu, Bell, ChevronRight, ClipboardList, XCircle, Edit, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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

interface PersonalTask {
  id: string
  type: 'approval' | 'request_draft' | 'request_rejected'
  entityType: string
  entityId: string
  title: string
  description: string
  role: string
  status: string
  createdAt: string
}

interface PersonalSummary {
  pendingApprovals: number
  rejectedRequests: number
  draftRequests: number
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Только что'
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  return `${diffDays} дн назад`
}

export function TopBar() {
  const { activeModule, sidebarCollapsed, toggleSidebar, setActiveModule } = useAppStore()
  const { user, logout } = useAuthStore()
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [summary, setSummary] = useState<PersonalSummary | null>(null)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const fetchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalTasks = summary
    ? summary.pendingApprovals + summary.rejectedRequests + summary.draftRequests
    : 0

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    setNotificationsLoading(true)
    try {
      const res = await fetch('/api/dashboard/personal')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setSummary(data.summary || null)
      }
    } catch {
      // silent
    } finally {
      setNotificationsLoading(false)
    }
  }, [user?.id])

  // Fetch notifications on mount and every 30 seconds
  useEffect(() => {
    fetchNotifications()
    fetchIntervalRef.current = setInterval(fetchNotifications, 30000)
    return () => {
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current)
    }
  }, [fetchNotifications])

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

  const handleTaskClick = (task: PersonalTask) => {
    if (task.entityType === 'zip-request') {
      setActiveModule('spare-parts')
    }
    setBellOpen(false)
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
        {/* Notifications Bell */}
        <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative size-8 text-gray-500 hover:text-gray-700"
            >
              <Bell className="size-4" />
              {totalTasks > 0 && (
                <span className="absolute right-1 top-1 flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FF9900] opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-[#FF9900]" />
                </span>
              )}
              <span className="sr-only">Уведомления</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-hidden flex flex-col">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span className="text-sm font-semibold">Уведомления</span>
              {totalTasks > 0 && (
                <Badge className="bg-[#FF9900]/15 text-[#FF9900] border-0 text-[10px] font-semibold px-1.5 py-0">
                  {totalTasks}
                </Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {notificationsLoading ? (
              <div className="p-2 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg p-2">
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="size-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Нет новых задач</p>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[340px]">
                {tasks.slice(0, 10).map((task) => (
                  <DropdownMenuItem
                    key={task.id}
                    className="flex items-center gap-3 py-2.5 px-2 cursor-pointer focus:bg-orange-50"
                    onClick={() => handleTaskClick(task)}
                  >
                    <div className={`flex size-8 items-center justify-center rounded-lg shrink-0 ${
                      task.type === 'approval' ? 'bg-amber-100' :
                      task.type === 'request_rejected' ? 'bg-red-100' : 'bg-slate-100'
                    }`}>
                      {task.type === 'approval' && <ClipboardList className="size-4 text-amber-600" />}
                      {task.type === 'request_rejected' && <XCircle className="size-4 text-red-600" />}
                      {task.type === 'request_draft' && <Edit className="size-4 text-slate-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate leading-tight">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>
                    </div>
                    <div className="flex flex-col items-end shrink-0 gap-0.5">
                      <p className="text-[10px] text-muted-foreground leading-tight">{formatTimeAgo(task.createdAt)}</p>
                      <ArrowRight className="size-3 text-muted-foreground/40" />
                    </div>
                  </DropdownMenuItem>
                ))}
                {tasks.length > 10 && (
                  <div className="border-t px-2 py-2 text-center">
                    <p className="text-xs text-muted-foreground">
                      и ещё {tasks.length - 10} задач...
                    </p>
                  </div>
                )}
              </div>
            )}
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
