'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  CalendarDays,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Loader2,
  CheckCircle2,
  Wrench,
  Clock,
  RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface MaintenanceTask {
  id: string
  scheduledDate: string
  description: string
  status: string
  completedAt: string | null
  notes: string | null
  brigade: { name: string; code: string } | null
  planId?: string
}

interface MaintenancePlan {
  id: string
  planName: string
  lastMaintenance: string | null
  nextMaintenance: string
  intervalDays: number
  status: string
  description: string | null
  equipment: {
    name: string
    code: string
    department: { name: string } | null
  }
  tasks: MaintenanceTask[]
}

interface EquipmentOption {
  id: string
  name: string
  code: string
}

function PlanStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    active: { label: 'Активен', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    paused: { label: 'Приостановлен', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    completed: { label: 'Завершён', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function TaskStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    planned: { label: 'Запланировано', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    assigned: { label: 'Назначено', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    in_progress: { label: 'В работе', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    completed: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    overdue: { label: 'Просрочено', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff
}

const emptyCreateForm = {
  equipmentId: '',
  planName: '',
  intervalDays: '',
  description: '',
}

export default function PlanningPage() {
  const [plans, setPlans] = useState<MaintenancePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  })

  // Create plan dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createForm, setCreateForm] = useState(emptyCreateForm)
  const [equipment, setEquipment] = useState<EquipmentOption[]>([])

  // View plan dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewPlan, setViewPlan] = useState<MaintenancePlan | null>(null)

  // Task completing
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/planning')
      if (res.ok) {
        const data = await res.json()
        setPlans(data.plans || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEquipment = useCallback(async () => {
    try {
      const res = await fetch('/api/equipment?limit=200')
      if (res.ok) {
        const data = await res.json()
        const items = data.items || data.equipment || []
        setEquipment(items.map((e: EquipmentOption) => ({ id: e.id, name: e.name, code: e.code })))
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchEquipment()
  }, [fetchData, fetchEquipment])

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })

  const navigateMonth = (delta: number) => {
    setCurrentMonth((prev) => {
      let m = prev.month + delta
      let y = prev.year
      if (m > 11) { m = 0; y++ }
      if (m < 0) { m = 11; y-- }
      return { month: m, year: y }
    })
  }

  // Get tasks for current month (include planId for lookups)
  const currentMonthTasks = plans
    .flatMap((plan) => plan.tasks.map((task) => ({ ...task, planId: plan.id, equipmentCode: plan.equipment.code, equipmentName: plan.equipment.name })))
    .filter((task) => {
      const taskDate = new Date(task.scheduledDate)
      return taskDate.getMonth() === currentMonth.month && taskDate.getFullYear() === currentMonth.year
    })
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  // Status counts for calendar
  const calendarStats = {
    planned: currentMonthTasks.filter((t) => t.status === 'planned').length,
    completed: currentMonthTasks.filter((t) => t.status === 'completed').length,
    inProgress: currentMonthTasks.filter((t) => t.status === 'in_progress').length,
    overdue: currentMonthTasks.filter((t) => t.status === 'overdue').length,
  }

  // Generate days for current month
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentMonth.year, currentMonth.month, 1).getDay()
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // Monday = 0

  const tasksByDay: Record<number, (MaintenanceTask & { planId: string; equipmentCode: string; equipmentName: string })[]> = {}
  currentMonthTasks.forEach((task) => {
    const day = new Date(task.scheduledDate).getDate()
    if (!tasksByDay[day]) tasksByDay[day] = []
    tasksByDay[day].push(task)
  })

  // ─── Create Plan ───
  const handleCreateSubmit = async () => {
    if (!createForm.equipmentId || !createForm.intervalDays) {
      toast.error('Укажите оборудование и интервал (дни)')
      return
    }
    const interval = Number(createForm.intervalDays)
    if (isNaN(interval) || interval <= 0) {
      toast.error('Интервал должен быть положительным числом')
      return
    }

    setCreateSubmitting(true)
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: createForm.equipmentId,
          planName: createForm.planName || undefined,
          intervalDays: interval,
          description: createForm.description || undefined,
        }),
      })
      if (res.ok) {
        toast.success('План ППР успешно создан')
        setCreateDialogOpen(false)
        setCreateForm(emptyCreateForm)
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при создании плана')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setCreateSubmitting(false)
    }
  }

  // ─── Complete Task ───
  const handleCompleteTask = async (taskId: string) => {
    setCompletingTaskId(taskId)
    try {
      const res = await fetch('/api/planning', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          status: 'completed',
          completedAt: new Date().toISOString(),
        }),
      })
      if (res.ok) {
        toast.success('Задача отмечена как завершённая')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при завершении задачи')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setCompletingTaskId(null)
    }
  }

  // ─── View Plan Details ───
  const handleViewPlan = (plan: MaintenancePlan) => {
    setViewPlan(plan)
    setViewDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Планирование ППР</h1>
          <p className="text-sm text-muted-foreground">
            График планово-предупредительных ремонтов
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) setCreateForm(emptyCreateForm) }}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="size-4" />
              Создать план ППР
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Создать план ППР</DialogTitle>
              <DialogDescription>
                Настройте планово-предупредительный ремонт для оборудования
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Оборудование *</Label>
                <Select
                  value={createForm.equipmentId}
                  onValueChange={(v) => {
                    const eq = equipment.find((e) => e.id === v)
                    setCreateForm({
                      ...createForm,
                      equipmentId: v,
                      planName: createForm.planName || (eq ? `ППР для ${eq.name}` : ''),
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите оборудование" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.code} — {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-name">Название плана</Label>
                <Input
                  id="plan-name"
                  value={createForm.planName}
                  onChange={(e) => setCreateForm({ ...createForm, planName: e.target.value })}
                  placeholder="Автогенерация при выборе оборудования"
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-interval">Интервал (дни) *</Label>
                <Input
                  id="plan-interval"
                  type="number"
                  min="1"
                  value={createForm.intervalDays}
                  onChange={(e) => setCreateForm({ ...createForm, intervalDays: e.target.value })}
                  placeholder="Например: 90 (квартальный), 365 (годовой)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-desc">Описание</Label>
                <Textarea
                  id="plan-desc"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Дополнительная информация о плане..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setCreateForm(emptyCreateForm) }}>
                Отмена
              </Button>
              <Button
                onClick={handleCreateSubmit}
                disabled={createSubmitting || !createForm.equipmentId || !createForm.intervalDays}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {createSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-5 text-muted-foreground" />
              <CardTitle className="text-base capitalize">{monthName}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-3 mr-4 text-xs">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Запланировано ({calendarStats.planned})</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-amber-500" /> В работе ({calendarStats.inProgress})</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" /> Завершено ({calendarStats.completed})</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-red-500" /> Просрочено ({calendarStats.overdue})</span>
              </div>
              <Button variant="outline" size="icon" className="size-8" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={() => navigateMonth(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayTasks = tasksByDay[day] || []
                  const hasTasks = dayTasks.length > 0
                  const hasOverdue = dayTasks.some((t) => t.status === 'overdue')
                  const allCompleted = hasTasks && dayTasks.every((t) => t.status === 'completed')

                  return (
                    <div
                      key={day}
                      className={`aspect-square rounded-md flex flex-col items-center justify-start p-1 text-sm border
                        ${hasOverdue ? 'border-red-200 bg-red-50' : allCompleted ? 'border-emerald-200 bg-emerald-50' : hasTasks ? 'border-blue-200 bg-blue-50/50' : 'border-transparent'}
                      `}
                    >
                      <span className={`text-xs ${hasTasks ? 'font-bold' : 'text-muted-foreground'}`}>{day}</span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                          {dayTasks.length} задач{dayTasks.length > 1 ? 'и' : 'а'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Tasks list for selected month */}
              {currentMonthTasks.length > 0 && (
                <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">
                  <h4 className="text-sm font-medium text-muted-foreground">Задачи на месяц:</h4>
                  {currentMonthTasks.map((task) => {
                    const isCompleted = task.status === 'completed'
                    const isCompleting = completingTaskId === task.id
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-2 rounded-md bg-muted/30">
                        <span className="text-xs font-mono text-muted-foreground whitespace-nowrap w-16">
                          {new Date(task.scheduledDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <TaskStatusBadge status={task.status} />
                        <span className="text-sm flex-1 truncate">{task.description}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{task.equipmentCode}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{task.brigade?.name || ''}</span>
                        {!isCompleted && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={isCompleting}
                          >
                            {isCompleting ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Завершить
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {currentMonthTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 py-12">
                  <CalendarDays className="size-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Нет запланированных задач на {monthName}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Реестр планов ППР</CardTitle>
          <CardDescription>Список всех плановых ремонтов с указанием интервалов и статусов</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Оборудование</TableHead>
                <TableHead>Последний ремонт</TableHead>
                <TableHead>Следующий ремонт</TableHead>
                <TableHead className="text-right">Интервал (дни)</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="pr-6 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? 'pl-6' : j === 5 ? 'pr-6 text-right' : ''}>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="size-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm max-w-md">
                        Планы ППР ещё не созданы. Нажмите кнопку «Создать план ППР» для добавления.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => {
                  const daysUntil = getDaysUntil(plan.nextMaintenance)
                  const isOverdue = daysUntil < 0
                  const isDueSoon = daysUntil >= 0 && daysUntil <= 14

                  return (
                    <TableRow key={plan.id} className={isOverdue ? 'bg-red-50/50' : isDueSoon ? 'bg-amber-50/50' : ''}>
                      <TableCell className="pl-6">
                        <div>
                          <p className="font-medium text-sm">{plan.equipment?.name || plan.planName}</p>
                          <p className="text-xs text-muted-foreground">{plan.equipment?.code}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(plan.lastMaintenance)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{formatDate(plan.nextMaintenance)}</span>
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Просрочено</Badge>
                          )}
                          {!isOverdue && isDueSoon && (
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-700 border-amber-200">Скоро</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm">{plan.intervalDays}</TableCell>
                      <TableCell><PlanStatusBadge status={plan.status} /></TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2" onClick={() => handleViewPlan(plan)}>
                              <Eye className="size-4" /> Просмотр
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════ View Plan Details Dialog ═══════════ */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setViewPlan(null) }}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          {viewPlan ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-base">
                  {viewPlan.planName}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2 pt-1">
                  <PlanStatusBadge status={viewPlan.status} />
                  <Badge variant="outline" className="text-xs">{viewPlan.equipment.code}</Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Equipment */}
                <div className="flex items-start gap-3">
                  <Wrench className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Оборудование</p>
                    <p className="text-sm font-medium">{viewPlan.equipment.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {viewPlan.equipment.department?.name || '—'}
                    </p>
                  </div>
                </div>

                {/* Interval & Dates */}
                <div className="flex items-start gap-3">
                  <RotateCcw className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Интервал</p>
                      <p className="text-sm font-medium">{viewPlan.intervalDays} дней</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Статус</p>
                      <PlanStatusBadge status={viewPlan.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Последний ремонт</p>
                      <p className="text-sm">{formatDate(viewPlan.lastMaintenance)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Следующий ремонт</p>
                      <p className="text-sm">{formatDate(viewPlan.nextMaintenance)}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewPlan.description && (
                  <div className="flex items-start gap-3">
                    <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Описание</p>
                      <p className="text-sm whitespace-pre-wrap break-words">{viewPlan.description}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Tasks list */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    Задачи ({viewPlan.tasks.length})
                  </h4>
                  {viewPlan.tasks.length > 0 ? (
                    <div className="space-y-2">
                      {viewPlan.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-md bg-muted/40">
                          <span className="text-xs font-mono text-muted-foreground whitespace-nowrap w-24">
                            {formatDate(task.scheduledDate)}
                          </span>
                          <TaskStatusBadge status={task.status} />
                          <span className="text-sm flex-1 truncate">{task.description}</span>
                          {task.brigade?.name && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {task.brigade.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Нет задач по данному плану</p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
