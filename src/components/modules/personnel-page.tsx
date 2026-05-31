'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Users,
  ClipboardList,
  ShieldAlert,
  FileText,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { SortableFilterableTable, type ColDef } from '@/components/shared/sortable-filterable-table'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BrigadeMember {
  id: string
  name: string
  role: string
}

interface Brigade {
  id: string
  name: string
  code: string
  description: string | null
  department: { name: string; code: string }
  departmentId?: string
  foreman: { id: string; name: string } | null
  foremanId?: string
  members: BrigadeMember[]
}

interface Department {
  id: string
  name: string
  code: string
  headName: string | null
  users: { id: string; name: string; role: string; email: string }[]
  brigades: Brigade[]
}

interface ShiftTask {
  id: string
  date: string
  shift: string
  description: string
  status: string
  brigade: { name: string; code: string }
  assigner: { name: string } | null
}

interface WorkPermit {
  id: string
  number: string
  workType: string
  riskLevel: string
  status: string
  startDate: string
  endDate: string
  responsibleName: string
  brigade: { name: string; code: string }
  equipment: { name: string; code: string } | null
}

interface BrigadeFormData {
  name: string
  code: string
  departmentId: string
  description: string
}

function ShiftStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    planned: { label: 'Запланировано', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    in_progress: { label: 'Выполняется', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    completed: { label: 'Завершено', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    cancelled: { label: 'Отменено', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function PermitStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-600 border-gray-200' },
    active: { label: 'Активен', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    completed: { label: 'Завершён', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    cancelled: { label: 'Отменён', className: 'bg-red-100 text-red-600 border-red-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function RiskBadge({ level }: { level: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    low: { label: 'Низкий', className: 'bg-green-100 text-green-700 border-green-200' },
    normal: { label: 'Нормальный', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    high: { label: 'Высокий', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    extreme: { label: 'Экстремальный', className: 'bg-red-100 text-red-700 border-red-200' },
  }
  const v = variants[level] || { label: level, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

const shiftLabels: Record<string, string> = { day: 'Дневная', night: 'Ночная' }
const workTypeLabels: Record<string, string> = {
  repair: 'Ремонт',
  maintenance: 'ТО',
  installation: 'Монтаж',
  other: 'Прочее',
}

function EmptyTablePlaceholder({ message }: { message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={6} className="h-48 text-center">
        <div className="flex flex-col items-center gap-3">
          <FileText className="size-12 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm max-w-md">{message}</p>
        </div>
      </TableCell>
    </TableRow>
  )
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j} className={j === 0 ? 'pl-6' : j === cols - 1 ? 'pr-6 text-right' : ''}>
              <Skeleton className="h-5 w-24" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

const emptyForm: BrigadeFormData = {
  name: '',
  code: '',
  departmentId: '',
  description: '',
}

// ─── Column Definitions for SortableFilterableTable ──

const BRIGADE_COLUMNS: ColDef<Brigade>[] = [
  { key: 'code', label: 'Код', group: 'Основное', render: (b) => <span className="font-mono text-sm">{b.code}</span> },
  { key: 'name', label: 'Название', group: 'Основное', render: (b) => <span className="font-medium">{b.name}</span> },
  { key: 'department', label: 'Подразделение', group: 'Основное', render: (b) => <span className="text-sm text-muted-foreground">{b.department?.name || '\u2014'}</span> },
  { key: 'foreman', label: 'Бригадир', group: 'Основное', render: (b) => <span className="text-sm">{b.foreman?.name || '\u2014'}</span> },
  { key: 'membersCount', label: 'Кол-во человек', group: 'Основное', render: (b) => <Badge variant="secondary">{b.members.length}</Badge> },
]
const BRIGADE_DEFAULT_COLUMNS = ['code', 'name', 'department', 'foreman', 'membersCount']

function brigadeCellText(b: Brigade, colKey: string): string {
  if (colKey === 'code') return b.code || ''
  if (colKey === 'name') return b.name || ''
  if (colKey === 'department') return b.department?.name || ''
  if (colKey === 'foreman') return b.foreman?.name || ''
  if (colKey === 'membersCount') return String(b.members.length)
  return ''
}

const SHIFT_COLUMNS: ColDef<ShiftTask>[] = [
  { key: 'date', label: 'Дата', group: 'Основное', render: (t) => <span className="text-sm whitespace-nowrap">{t.date}</span> },
  { key: 'shift', label: 'Смена', group: 'Основное', render: (t) => <Badge variant="outline">{shiftLabels[t.shift] || t.shift}</Badge> },
  { key: 'brigade', label: 'Бригада', group: 'Основное', render: (t) => <span className="text-sm">{t.brigade?.name || '\u2014'}</span> },
  { key: 'description', label: 'Описание', group: 'Основное', render: (t) => <span className="text-sm max-w-[250px] truncate" title={t.description}>{t.description}</span> },
  { key: 'status', label: 'Статус', group: 'Основное', render: (t) => <ShiftStatusBadge status={t.status} /> },
]
const SHIFT_DEFAULT_COLUMNS = ['date', 'shift', 'brigade', 'description', 'status']

function shiftCellText(t: ShiftTask, colKey: string): string {
  if (colKey === 'date') return t.date || ''
  if (colKey === 'shift') return shiftLabels[t.shift] || t.shift
  if (colKey === 'brigade') return t.brigade?.name || ''
  if (colKey === 'description') return t.description || ''
  if (colKey === 'status') { const m: Record<string,string> = { planned: 'Запланировано', in_progress: 'Выполняется', completed: 'Завершено', cancelled: 'Отменено' }; return m[t.status] || t.status }
  return ''
}

const PERMIT_COLUMNS: ColDef<WorkPermit>[] = [
  { key: 'number', label: 'Номер', group: 'Основное', render: (w) => <span className="font-mono text-sm font-medium">{w.number}</span> },
  { key: 'workType', label: 'Тип работы', group: 'Основное', render: (w) => <span className="text-sm">{workTypeLabels[w.workType] || w.workType}</span> },
  { key: 'equipment', label: 'Оборудование', group: 'Основное', render: (w) => <span className="text-sm max-w-[150px] truncate">{w.equipment ? w.equipment.code : '\u2014'}</span> },
  { key: 'riskLevel', label: 'Уровень риска', group: 'Основное', render: (w) => <RiskBadge level={w.riskLevel} /> },
  { key: 'status', label: 'Статус', group: 'Основное', render: (w) => <PermitStatusBadge status={w.status} /> },
]
const PERMIT_DEFAULT_COLUMNS = ['number', 'workType', 'equipment', 'riskLevel', 'status']

function permitCellText(w: WorkPermit, colKey: string): string {
  if (colKey === 'number') return w.number || ''
  if (colKey === 'workType') return workTypeLabels[w.workType] || w.workType
  if (colKey === 'equipment') return w.equipment?.code || ''
  if (colKey === 'riskLevel') { const m: Record<string,string> = { low: 'Низкий', normal: 'Нормальный', high: 'Высокий', extreme: 'Экстремальный' }; return m[w.riskLevel] || w.riskLevel }
  if (colKey === 'status') { const m: Record<string,string> = { draft: 'Черновик', active: 'Активен', completed: 'Завершён', cancelled: 'Отменён' }; return m[w.status] || w.status }
  return ''
}

export default function PersonnelPage() {
  const [activeTab, setActiveTab] = useState('brigades')
  const [loading, setLoading] = useState(true)
  const [departments, setDepartments] = useState<Department[]>([])
  const [brigades, setBrigades] = useState<Brigade[]>([])
  const [shiftTasks, setShiftTasks] = useState<ShiftTask[]>([])
  const [workPermits, setWorkPermits] = useState<WorkPermit[]>([])
  const [totalPersonnel, setTotalPersonnel] = useState(0)

  // Create/Edit dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBrigade, setEditingBrigade] = useState<Brigade | null>(null)
  const [form, setForm] = useState<BrigadeFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteBrigade, setDeleteBrigade] = useState<Brigade | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/personnel')
      if (res.ok) {
        const data = await res.json()
        setDepartments(data.departments || [])
        setBrigades(data.brigades || [])
        setShiftTasks(data.shiftTasks || [])
        setWorkPermits(data.workPermits || [])
        setTotalPersonnel(data.totalPersonnel || 0)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ---- Handlers ----

  function openCreateDialog() {
    setEditingBrigade(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(brigade: Brigade) {
    setEditingBrigade(brigade)
    setForm({
      name: brigade.name,
      code: brigade.code,
      departmentId: brigade.departmentId || '',
      description: brigade.description || '',
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(brigade: Brigade) {
    setDeleteBrigade(brigade)
    setDeleteDialogOpen(true)
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      toast.error('Введите название бригады')
      return
    }
    if (!form.code.trim()) {
      toast.error('Введите код бригады')
      return
    }
    if (!form.departmentId) {
      toast.error('Выберите подразделение')
      return
    }

    setSubmitting(true)
    try {
      const url = '/api/personnel'
      const method = editingBrigade ? 'PUT' : 'POST'
      const body: Record<string, string> = {
        name: form.name.trim(),
        code: form.code.trim(),
        departmentId: form.departmentId,
        description: form.description.trim(),
      }
      if (editingBrigade) {
        body.id = editingBrigade.id
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при сохранении')
        return
      }

      toast.success(editingBrigade ? 'Бригада обновлена' : 'Бригада создана')
      setDialogOpen(false)
      fetchData()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteBrigade) return

    setDeleting(true)
    try {
      const res = await fetch('/api/personnel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteBrigade.id }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при удалении')
        return
      }

      toast.success('Бригада удалена')
      setDeleteDialogOpen(false)
      setDeleteBrigade(null)
      fetchData()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Персонал</h1>
          <p className="text-sm text-muted-foreground">
            Управление ремонтными подразделениями · <span className="font-medium">{totalPersonnel}</span> сотрудников
          </p>
        </div>
        <Button className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={openCreateDialog}>
          <Plus className="size-4" />
          Создать бригаду
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="brigades" className="gap-2">
            <Users className="size-4" />
            Бригады
          </TabsTrigger>
          <TabsTrigger value="shifts" className="gap-2">
            <ClipboardList className="size-4" />
            Сменно-суточные задания
          </TabsTrigger>
          <TabsTrigger value="permits" className="gap-2">
            <ShieldAlert className="size-4" />
            Наряд-допуски
          </TabsTrigger>
        </TabsList>

        {/* Бригады */}
        <TabsContent value="brigades">
          <Card>
            <CardContent className="p-0">
              <SortableFilterableTable<Brigade>
                columns={BRIGADE_COLUMNS}
                defaultVisibleColumns={BRIGADE_DEFAULT_COLUMNS}
                items={brigades}
                loading={loading}
                itemKey="id"
                cellText={brigadeCellText}
                storageKey="personnel-brigades-columns"
                emptyMessage="Бригады ещё не созданы. Нажмите кнопку «Создать бригаду» для добавления."
                trailingColumnHeader="Действия"
                trailingColumn={(b) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2" onClick={() => openEditDialog(b)}>
                        <Pencil className="size-4" /> Редактировать
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600" onClick={() => openDeleteDialog(b)}>
                        <Trash2 className="size-4" /> Удалить
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            </CardContent>
          </Card>

          {/* Departments Summary */}
          {!loading && departments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Подразделения</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {departments.map((dept) => (
                  <Card key={dept.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">{dept.code} · {dept.users.length} чел. · {dept.brigades.length} бриг.</p>
                        </div>
                        {dept.headName && (
                          <Badge variant="outline" className="text-xs">{dept.headName}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Сменно-суточные задания */}
        <TabsContent value="shifts">
          <Card>
            <CardContent className="p-0">
              <SortableFilterableTable<ShiftTask>
                columns={SHIFT_COLUMNS}
                defaultVisibleColumns={SHIFT_DEFAULT_COLUMNS}
                items={shiftTasks}
                loading={loading}
                itemKey="id"
                cellText={shiftCellText}
                storageKey="personnel-shifts-columns"
                emptyMessage="Сменно-суточные задания ещё не созданы."
                trailingColumnHeader="Действия"
                trailingColumn={(task) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Eye className="size-4" /> Просмотр</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Наряд-допуски */}
        <TabsContent value="permits">
          <Card>
            <CardContent className="p-0">
              <SortableFilterableTable<WorkPermit>
                columns={PERMIT_COLUMNS}
                defaultVisibleColumns={PERMIT_DEFAULT_COLUMNS}
                items={workPermits}
                loading={loading}
                itemKey="id"
                cellText={permitCellText}
                storageKey="personnel-permits-columns"
                emptyMessage="Наряд-допуски ещё не оформлены."
                trailingColumnHeader="Действия"
                trailingColumn={(wp) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="gap-2"><Eye className="size-4" /> Просмотр</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ---- Create/Edit Brigade Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open && !submitting) setDialogOpen(false) }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingBrigade ? 'Редактировать бригаду' : 'Создать бригаду'}</DialogTitle>
            <DialogDescription>
              {editingBrigade
                ? `Измените данные бригады «${editingBrigade.name}»`
                : 'Заполните данные для новой ремонтной бригады'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="brigade-name">Название <span className="text-red-500">*</span></Label>
              <Input
                id="brigade-name"
                placeholder="Например: Бригада электриков №1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={submitting}
                className="w-full"
              />
            </div>

            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="brigade-code">Код <span className="text-red-500">*</span></Label>
              <Input
                id="brigade-code"
                placeholder="Например: БР-003"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                disabled={submitting}
                className="max-w-[200px]"
              />
            </div>

            {/* Department */}
            <div className="grid gap-2">
              <Label>Подразделение <span className="text-red-500">*</span></Label>
              <Select
                value={form.departmentId}
                onValueChange={(val) => setForm({ ...form, departmentId: val })}
                disabled={submitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите подразделение" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="brigade-desc">Описание</Label>
              <Textarea
                id="brigade-desc"
                placeholder="Необязательное описание бригады"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={submitting}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submitting}>
              Отмена
            </Button>
            <Button
              className="gap-2 bg-orange-600 hover:bg-orange-700"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingBrigade ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Brigade AlertDialog ---- */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => { if (!open && !deleting) setDeleteDialogOpen(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить бригаду?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить бригаду{' '}
              <span className="font-semibold">«{deleteBrigade?.name}»</span> ({deleteBrigade?.code})?
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="size-4 animate-spin mr-1" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
