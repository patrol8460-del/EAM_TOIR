'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Search,
  AlertTriangle,
  CircleDot,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  User,
  Users,
  Package,
  CalendarClock,
  Clock,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface RequestItem {
  id: string
  number: string
  title: string
  description: string
  priority: string
  status: string
  createdAt: string
  updatedAt?: string
  equipment: { name: string; code: string } | null
  author: { name: string; email: string }
  assignee: { name: string; email: string } | null
  brigade: { name: string; code: string } | null
}

interface RequestDetail extends RequestItem {
  updatedAt: string
}

interface EquipmentOption {
  id: string
  name: string
  code: string
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    new: { label: 'Новая', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    assigned: { label: 'Назначена', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    in_progress: { label: 'В работе', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    completed: { label: 'Завершена', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Отменена', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function PriorityBadge({ priority }: { priority: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    critical: { label: 'Критичный', className: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'Высокий', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'Средний', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Низкий', className: 'bg-green-100 text-green-700 border-green-200' },
  }
  const v = variants[priority] || { label: priority, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

const emptyForm = {
  title: '',
  description: '',
  priority: 'medium',
  equipmentId: '',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusOptions = [
  { value: 'new', label: 'Новая' },
  { value: 'assigned', label: 'Назначена' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершена' },
  { value: 'cancelled', label: 'Отменена' },
]

export default function RequestsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [equipment, setEquipment] = useState<EquipmentOption[]>([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // View detail dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewData, setViewData] = useState<RequestDetail | null>(null)

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editItemId, setEditItemId] = useState<string | null>(null)

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<RequestItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Status change
  const [statusChanging, setStatusChanging] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/requests?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  const fetchLookups = useCallback(async () => {
    try {
      const [eqRes, statsRes] = await Promise.all([
        fetch('/api/equipment?limit=200'),
        fetch('/api/requests?limit=1'),
      ])
      if (eqRes.ok) {
        const eqData = await eqRes.json()
        setEquipment((eqData.items || []).map((e: EquipmentOption) => ({ id: e.id, name: e.name, code: e.code })))
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        // Fetch all statuses for counts
        const allRes = await fetch('/api/dashboard')
        if (allRes.ok) {
          const allData = await allRes.json()
          setStatusCounts(allData.stats?.requestsByStatus || {})
        }
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  useEffect(() => {
    const timer = setTimeout(() => { fetchItems() }, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, fetchItems])

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      toast.error('Укажите название и описание заявки')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Заявка успешно создана')
        setDialogOpen(false)
        setForm(emptyForm)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при создании')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // ─── View Detail ───
  const handleViewOpen = async (item: RequestItem) => {
    setViewDialogOpen(true)
    setViewLoading(true)
    setViewData(null)
    try {
      const res = await fetch(`/api/requests/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        setViewData(data)
      } else {
        toast.error('Не удалось загрузить данные заявки')
        setViewDialogOpen(false)
      }
    } catch {
      toast.error('Ошибка сети')
      setViewDialogOpen(false)
    } finally {
      setViewLoading(false)
    }
  }

  // ─── Edit ───
  const handleEditOpen = (item: RequestItem) => {
    setEditItemId(item.id)
    setEditForm({
      title: item.title,
      description: item.description,
      priority: item.priority,
      equipmentId: item.equipment?.id || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editForm.title || !editForm.description || !editItemId) return
    setEditSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editItemId,
          title: editForm.title,
          description: editForm.description,
          priority: editForm.priority,
          equipmentId: editForm.equipmentId || null,
        }),
      })
      if (res.ok) {
        toast.success('Заявка успешно обновлена')
        setEditDialogOpen(false)
        setEditItemId(null)
        setEditForm(emptyForm)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при обновлении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setEditSubmitting(false)
    }
  }

  // ─── Delete ───
  const handleDeleteOpen = (item: RequestItem) => {
    setDeleteItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItem.id }),
      })
      if (res.ok) {
        toast.success('Заявка успешно удалена')
        setDeleteDialogOpen(false)
        setDeleteItem(null)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // ─── Status Quick-Change ───
  const handleStatusChange = async (itemId: string, newStatus: string) => {
    setStatusChanging(itemId)
    try {
      const res = await fetch('/api/requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: itemId, status: newStatus }),
      })
      if (res.ok) {
        const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus
        toast.success(`Статус изменён на «${statusLabel}»`)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при смене статуса')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setStatusChanging(null)
    }
  }

  const statusStats = [
    { title: 'Новые', value: statusCounts['new'] ?? 0, icon: CircleDot, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'В работе', value: (statusCounts['assigned'] ?? 0) + (statusCounts['in_progress'] ?? 0), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Завершены', value: statusCounts['completed'] ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Отменены', value: statusCounts['cancelled'] ?? 0, icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Неплановые заявки</h1>
        <p className="text-sm text-muted-foreground">
          Обращения на проведение незапланированных работ
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statusStats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex size-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`size-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
              <Plus className="size-4" />
              Создать заявку
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Создать неплановую заявку</DialogTitle>
              <DialogDescription>
                Заполните данные о проблеме для создания заявки на ремонт
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="req-title">Название заявки *</Label>
                <Input id="req-title" value={form.title} onChange={(e) => updateField('title', e.target.value)} placeholder="Утечка через сальник насоса Н-205" className="w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Оборудование</Label>
                  <Select value={form.equipmentId} onValueChange={(v) => updateField('equipmentId', v)}>
                    <SelectTrigger><SelectValue placeholder="Не указано" /></SelectTrigger>
                    <SelectContent>
                      {equipment.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.code} — {e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select value={form.priority} onValueChange={(v) => updateField('priority', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критичный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="req-desc">Описание *</Label>
                <Textarea id="req-desc" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Подробное описание проблемы..." rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm) }}>Отмена</Button>
              <Button onClick={handleSubmit} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по номеру, описанию..."
              className="pl-9 w-full sm:w-[260px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="size-4 mr-1" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="new">Новая</SelectItem>
              <SelectItem value="assigned">Назначена</SelectItem>
              <SelectItem value="in_progress">В работе</SelectItem>
              <SelectItem value="completed">Завершена</SelectItem>
              <SelectItem value="cancelled">Отменена</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Номер</TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Оборудование</TableHead>
                <TableHead>Описание</TableHead>
                <TableHead>Приоритет</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead className="pr-6 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? 'pl-6' : j === 7 ? 'pr-6 text-right' : ''}>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="size-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm max-w-md">
                        {search || statusFilter !== 'all'
                          ? 'Заявки по заданным фильтрам не найдены.'
                          : 'Неплановые заявки пока не созданы. Нажмите кнопку «Создать заявку» для добавления.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="pl-6 font-mono text-sm font-medium">{item.number}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {item.equipment ? (
                        <span title={`${item.equipment.code} — ${item.equipment.name}`}>
                          {item.equipment.code}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate" title={item.description}>
                      {item.title}
                    </TableCell>
                    <TableCell><PriorityBadge priority={item.priority} /></TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-sm">{item.assignee?.name || '—'}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          {/* Action items */}
                          <DropdownMenuItem className="gap-2" onClick={() => handleViewOpen(item)}>
                            <Eye className="size-4" /> Просмотр
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2" onClick={() => handleEditOpen(item)}>
                            <Pencil className="size-4" /> Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteOpen(item)}>
                            <Trash2 className="size-4" /> Удалить
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {/* Status quick-change */}
                          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                            Изменить статус
                          </DropdownMenuLabel>
                          {statusOptions.map((s) => (
                            <DropdownMenuItem
                              key={s.value}
                              className="gap-2"
                              disabled={item.status === s.value || statusChanging === item.id}
                              onClick={() => handleStatusChange(item.id, s.value)}
                            >
                              {statusChanging === item.id && s.value !== item.status ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <CircleDot className={`size-3.5 ${item.status === s.value ? 'opacity-100' : 'opacity-40'}`} />
                              )}
                              <span className={item.status === s.value ? 'font-medium' : ''}>
                                {s.label}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ═══════════ View Detail Dialog ═══════════ */}
      <Dialog open={viewDialogOpen} onOpenChange={(open) => { setViewDialogOpen(open); if (!open) setViewData(null) }}>
        <DialogContent className="sm:max-w-[620px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            {viewLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            ) : viewData ? (
              <>
                <div className="flex items-center gap-3 flex-wrap">
                  <DialogTitle className="text-base">
                    <span className="font-mono text-orange-600">{viewData.number}</span>
                    {' — '}
                    {viewData.title}
                  </DialogTitle>
                </div>
                <DialogDescription className="flex items-center gap-2 pt-1">
                  <StatusBadge status={viewData.status} />
                  <PriorityBadge priority={viewData.priority} />
                </DialogDescription>
              </>
            ) : null}
          </DialogHeader>

          {viewLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-48" />
                </div>
              ))}
            </div>
          ) : viewData ? (
            <div className="space-y-5 py-2">
              {/* Equipment */}
              <div className="flex items-start gap-3">
                <Package className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Оборудование</p>
                  {viewData.equipment ? (
                    <p className="text-sm font-medium">{viewData.equipment.code} — {viewData.equipment.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не указано</p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <FileText className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">Описание</p>
                  <p className="text-sm whitespace-pre-wrap break-words">{viewData.description}</p>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-start gap-3">
                <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Автор</p>
                  <p className="text-sm font-medium">{viewData.author?.name || '—'}</p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-start gap-3">
                <User className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Ответственный</p>
                  {viewData.assignee ? (
                    <p className="text-sm font-medium">{viewData.assignee.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не назначен</p>
                  )}
                </div>
              </div>

              {/* Brigade */}
              <div className="flex items-start gap-3">
                <Users className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Бригада</p>
                  {viewData.brigade ? (
                    <p className="text-sm font-medium">{viewData.brigade.name}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Не назначена</p>
                  )}
                </div>
              </div>

              {/* Dates */}
              <div className="flex items-start gap-3">
                <CalendarClock className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <div>
                    <p className="text-xs text-muted-foreground">Создана</p>
                    <p className="text-sm">{formatDate(viewData.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Обновлена</p>
                    <p className="text-sm">{formatDate(viewData.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═══════════ Edit Dialog ═══════════ */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setEditItemId(null); setEditForm(emptyForm) } }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Редактировать заявку</DialogTitle>
            <DialogDescription>
              Измените данные неплановой заявки
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Название заявки *</Label>
              <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Оборудование</Label>
                <Select value={editForm.equipmentId} onValueChange={(v) => setEditForm((p) => ({ ...p, equipmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Не указано" /></SelectTrigger>
                  <SelectContent>
                    {equipment.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.code} — {e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={editForm.priority} onValueChange={(v) => setEditForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критичный</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Описание *</Label>
              <Textarea id="edit-desc" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !editForm.title || !editForm.description} className="bg-orange-600 hover:bg-orange-700">
              {editSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ Delete Confirmation ═══════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { setDeleteDialogOpen(open); if (!open) setDeleteItem(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
            <AlertDialogDescription>
              Заявка <span className="font-mono font-semibold text-foreground">{deleteItem?.number}</span> «{deleteItem?.title}» будет удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
