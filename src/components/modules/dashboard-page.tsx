'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Server,
  AlertTriangle,
  CalendarDays,
  Package,
  ArrowRight,
  Activity,
  Clock,
  Wrench,
  BarChart3,
  Users,
  Loader2,
  FileText,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle2,
  XCircle,
  Bell,
  ClipboardList,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore, type ModuleKey } from '@/store/app-store'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

interface DashboardStats {
  totalEquipment: number
  activeRequests: number
  activeMaintenancePlans: number
  totalSpareParts: number
  equipmentByStatus: Record<string, number>
  requestsByStatus: Record<string, number>
  requestsByPriority: Record<string, number>
}

interface ActivityItem {
  id: string
  action: string
  entity: string
  details: string | null
  userName: string
  createdAt: string
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

const actionLabels: Record<string, string> = {
  CREATE: 'Создано',
  UPDATE: 'Обновлено',
  DELETE: 'Удалено',
  LOGIN: 'Вход в систему',
}

const entityIcons: Record<string, typeof AlertTriangle> = {
  UnplannedRequest: AlertTriangle,
  Equipment: Activity,
  SparePart: Package,
  WorkPermit: FileText,
  User: Users,
  MaintenancePlan: CalendarDays,
}

const entityColors: Record<string, string> = {
  UnplannedRequest: 'text-amber-500',
  Equipment: 'text-blue-500',
  SparePart: 'text-purple-500',
  WorkPermit: 'text-emerald-500',
  User: 'text-rose-500',
  MaintenancePlan: 'text-cyan-500',
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

function formatActivityText(item: ActivityItem): string {
  const actionLabel = actionLabels[item.action] || item.action
  const entityLabel = item.entity || 'Объект'

  if (item.details) {
    try {
      const details = JSON.parse(item.details)
      if (details.number && details.title) {
        return `${actionLabel}: ${details.number} — ${details.title}`
      }
      if (details.title) {
        return `${actionLabel} ${entityLabel}: ${details.title}`
      }
      if (details.description) {
        return `${actionLabel} ${entityLabel}: ${details.description}`
      }
      if (details.field) {
        return `${actionLabel} ${entityLabel}: поле ${details.field}`
      }
    } catch {
      // not JSON
    }
  }

  return `${actionLabel} ${entityLabel}`
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const setActiveModule = useAppStore((s) => s.setActiveModule)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [tasks, setTasks] = useState<PersonalTask[]>([])
  const [taskSummary, setTaskSummary] = useState<PersonalSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [tasksLoading, setTasksLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setActivity(data.recentActivity || [])
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPersonalTasks = useCallback(async () => {
    setTasksLoading(true)
    try {
      const res = await fetch('/api/dashboard/personal')
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks || [])
        setTaskSummary(data.summary)
      }
    } catch {
      // silent
    } finally {
      setTasksLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchPersonalTasks()
  }, [fetchData, fetchPersonalTasks])

  const statCards = [
    {
      title: 'Всего оборудования',
      value: loading ? null : stats?.totalEquipment ?? 0,
      subtitle: 'единиц',
      icon: Server,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Активные заявки',
      value: loading ? null : stats?.activeRequests ?? 0,
      subtitle: 'заявок',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Запланировано ППР',
      value: loading ? null : stats?.activeMaintenancePlans ?? 0,
      subtitle: 'на месяц',
      icon: CalendarDays,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Запасные части',
      value: loading ? null : stats?.totalSpareParts ?? 0,
      subtitle: 'наименований',
      icon: Package,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ]

  const quickActions = [
    {
      title: 'Оборудование',
      description: 'Классификатор объектов предприятия',
      icon: Server,
      module: 'equipment' as ModuleKey,
      color: 'text-blue-600',
    },
    {
      title: 'Неплановые заявки',
      description: 'Обращения на проведение работ',
      icon: AlertTriangle,
      module: 'requests' as ModuleKey,
      color: 'text-amber-600',
      underDevelopment: true,
    },
    {
      title: 'Планирование ППР',
      description: 'График плановых ремонтов',
      icon: CalendarDays,
      module: 'planning' as ModuleKey,
      color: 'text-emerald-600',
      underDevelopment: true,
    },
    {
      title: 'Запасные части',
      description: 'Учёт и заказ комплектующих',
      icon: Package,
      module: 'spare-parts' as ModuleKey,
      color: 'text-purple-600',
      underDevelopment: true,
    },
    {
      title: 'Персонал',
      description: 'Управление бригадами и заданиями',
      icon: Users,
      module: 'personnel' as ModuleKey,
      color: 'text-rose-600',
      underDevelopment: true,
    },
    {
      title: 'Аналитика',
      description: 'KPI и отчёты ремонтной службы',
      icon: BarChart3,
      module: 'analytics' as ModuleKey,
      color: 'text-cyan-600',
      underDevelopment: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Добро пожаловать, {user?.name?.split(' ')[0] || 'пользователь'}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Ремонтная служба предприятия
        </p>
      </div>

      {/* Personal Tasks */}
      {(taskSummary && (taskSummary.pendingApprovals + taskSummary.rejectedRequests + taskSummary.draftRequests > 0)) && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="size-5 text-orange-600" />
                Мои задачи
              </CardTitle>
              <div className="flex gap-2">
                {taskSummary.pendingApprovals > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    На согласовании: {taskSummary.pendingApprovals}
                  </Badge>
                )}
                {taskSummary.rejectedRequests > 0 && (
                  <Badge className="bg-red-100 text-red-700 border-red-200">
                    Отклонено: {taskSummary.rejectedRequests}
                  </Badge>
                )}
                {taskSummary.draftRequests > 0 && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                    Черновики: {taskSummary.draftRequests}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tasksLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-white p-3">
                    <Skeleton className="size-8 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
              ) : (
                tasks.slice(0, 8).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg bg-white p-3 transition-colors hover:bg-orange-50 cursor-pointer"
                    onClick={() => {
                      if (task.entityType === 'zip-request') {
                        setActiveModule('spare-parts')
                      }
                    }}
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
                      <p className="text-sm font-medium truncate">{task.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{task.status}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(task.createdAt)}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground/50 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex size-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  {stat.value === null ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            const isWip = 'underDevelopment' in action && action.underDevelopment
            return (
              <Card
                key={action.module}
                className={`group cursor-pointer transition-all hover:shadow-md hover:border-primary/30 relative overflow-hidden ${isWip ? 'opacity-80' : ''}`}
                onClick={() => setActiveModule(action.module)}
              >
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <Icon className={`size-5 ${action.color}`} />
                    <div>
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
                {isWip && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative rotate-[-20deg]">
                      <span className="text-sm font-bold tracking-widest uppercase text-muted-foreground/50 border-2 border-dashed border-muted-foreground/30 px-4 py-1.5 rounded-md select-none">
                        В разработке
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Последняя активность</h2>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => setActiveModule('requests')}>
            Все события
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y max-h-96 overflow-y-auto">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-4">
                    <Skeleton className="size-9 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))
              ) : activity.length === 0 ? (
                <div className="py-12 text-center">
                  <Clock className="size-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Нет записей о действиях</p>
                </div>
              ) : (
                activity.slice(0, 10).map((item) => {
                  const Icon = entityIcons[item.entity] || Activity
                  const color = entityColors[item.entity] || 'text-gray-500'
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                        <Icon className={`size-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{formatActivityText(item)}</p>
                        <p className="text-xs text-muted-foreground">{item.userName}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="size-3" />
                        {formatTimeAgo(item.createdAt)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
