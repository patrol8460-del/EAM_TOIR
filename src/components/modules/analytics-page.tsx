'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Activity,
  Package,
  Download,
  Calendar,
  Server,
  AlertTriangle,
  CheckCircle2,
  Users,
  Wrench,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'

interface KPIData {
  pprCompletionPercent: number
  requestsAvgResolutionHours: number
  equipmentWorkingPercent: number
  lowStockParts: number
}

interface StatsData {
  totalEquipment: number
  activeEquipment: number
  underRepairEquipment: number
  totalRequests: number
  completedRequestsThisMonth: number
  totalMaintenancePlans: number
  completedTasksThisMonth: number
  totalSpareParts: number
  departments: number
  brigades: number
}

interface MonthlyRequest {
  month: string
  total: number
  completed: number
}

export default function AnalyticsPage() {
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [monthlyRequests, setMonthlyRequests] = useState<MonthlyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        setKpi(data.kpi)
        setStats(data.stats)
        setMonthlyRequests(data.requestsByMonth || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Set default date range
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    setDateFrom(monthStart.toISOString().split('T')[0])
    setDateTo(now.toISOString().split('T')[0])
  }, [fetchData])

  const kpiCards = [
    {
      title: 'Выполнение ППР',
      value: kpi?.pprCompletionPercent ?? null,
      suffix: '%',
      subtitle: 'за текущий месяц',
      icon: TrendingUp,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      isGood: (v: number) => v >= 70,
    },
    {
      title: 'Среднее время реакции',
      value: kpi?.requestsAvgResolutionHours ?? null,
      suffix: ' ч',
      subtitle: 'на заявку',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      isGood: (v: number) => v <= 24,
    },
    {
      title: 'Оборудование в работе',
      value: kpi?.equipmentWorkingPercent ?? null,
      suffix: '%',
      subtitle: 'от общего количества',
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      isGood: (v: number) => v >= 90,
    },
    {
      title: 'Требуется заказ',
      value: kpi?.lowStockParts ?? null,
      suffix: '',
      subtitle: 'наименований ниже мин. остатка',
      icon: Package,
      color: 'text-red-600',
      bg: 'bg-red-50',
      isGood: (v: number) => v === 0,
    },
  ]

  const maxMonthlyRequests = Math.max(...monthlyRequests.map((m) => m.total), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Аналитика</h1>
          <p className="text-sm text-muted-foreground">
            Ключевые показатели эффективности ремонтной службы
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Download className="size-4" />
          Экспорт отчёта
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((kpiCard) => {
          const Icon = kpiCard.icon
          const value = kpiCard.value
          const displayValue = value !== null ? `${value}${kpiCard.suffix}` : null
          const trendIcon = value !== null ? (kpiCard.isGood(value) ? TrendingUp : TrendingDown) : null
          const trendColor = value !== null ? (kpiCard.isGood(value) ? 'text-emerald-500' : 'text-red-500') : ''

          return (
            <Card key={kpiCard.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex size-12 items-center justify-center rounded-lg ${kpiCard.bg}`}>
                  <Icon className={`size-6 ${kpiCard.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{kpiCard.title}</p>
                  {displayValue === null ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{displayValue}</p>
                      {trendIcon && <trendIcon className={`size-4 ${trendColor}`} />}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">{kpiCard.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary Stats */}
      {!loading && stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {[
            { label: 'Оборудование', value: stats.totalEquipment, icon: Server },
            { label: 'В работе', value: stats.activeEquipment, icon: CheckCircle2 },
            { label: 'В ремонте', value: stats.underRepairEquipment, icon: Wrench },
            { label: 'Заявки всего', value: stats.totalRequests, icon: AlertTriangle },
            { label: 'Подразделения', value: stats.departments, icon: Users },
            { label: 'Бригады', value: stats.brigades, icon: Users },
          ].map((s) => {
            const Icon = s.icon
            return (
              <Card key={s.label} className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="size-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-xl font-bold">{s.value}</p>
              </Card>
            )
          })}
        </div>
      )}

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            Период отчёта
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="date-from" className="text-sm">Начало периода</Label>
              <Input id="date-from" type="date" className="max-w-[200px]" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <Label htmlFor="date-to" className="text-sm">Конец периода</Label>
              <Input id="date-to" type="date" className="max-w-[200px]" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <Button variant="outline" className="gap-2" onClick={fetchData}>
              <BarChart3 className="size-4" />
              Применить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Requests Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="size-4 text-amber-500" />
              Динамика заявок
            </CardTitle>
            <CardDescription>
              Количество заявок по месяцам
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : monthlyRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="size-12 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Нет данных за выбранный период</p>
              </div>
            ) : (
              <div className="space-y-3">
                {monthlyRequests.map((mr) => (
                  <div key={mr.month} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize w-16">{mr.month}</span>
                      <span className="text-muted-foreground">{mr.total} заявок · {mr.completed} выполнено</span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div className="bg-muted rounded-sm h-full" style={{ width: '100%', position: 'relative' }}>
                        <div
                          className="absolute inset-y-0 left-0 bg-amber-400 rounded-sm"
                          style={{ width: `${(mr.total / maxMonthlyRequests) * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 bg-emerald-500 rounded-sm"
                          style={{ width: `${(mr.completed / maxMonthlyRequests) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-3 bg-amber-400 rounded-sm" /> Всего</span>
                  <span className="flex items-center gap-1"><span className="size-3 bg-emerald-500 rounded-sm" /> Выполнено</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="size-4 text-blue-500" />
              Статус оборудования
            </CardTitle>
            <CardDescription>
              Распределение по текущему состоянию
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-48 w-full" />
            ) : stats ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      В работе
                    </span>
                    <span className="font-bold">{stats.activeEquipment} / {stats.totalEquipment}</span>
                  </div>
                  <Progress value={(stats.activeEquipment / stats.totalEquipment) * 100} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Wrench className="size-4 text-amber-500" />
                      В ремонте
                    </span>
                    <span className="font-bold">{stats.underRepairEquipment}</span>
                  </div>
                  <Progress value={(stats.underRepairEquipment / stats.totalEquipment) * 100} className="h-3" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Server className="size-4 text-gray-400" />
                      Списано
                    </span>
                    <span className="font-bold">{stats.totalEquipment - stats.activeEquipment - stats.underRepairEquipment}</span>
                  </div>
                  <Progress value={((stats.totalEquipment - stats.activeEquipment - stats.underRepairEquipment) / stats.totalEquipment) * 100} className="h-3" />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Нет данных</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
