'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Search,
  Upload,
  Package,
  AlertCircle,
  FileSpreadsheet,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  CircleDot,
  Circle,
  FileText,
  Paperclip,
  Download,
  X,
  ArrowRight,
  Settings,
  ChevronRight,
  Route,
  Ban,
  UserCircle,
  GripVertical,
  Send,
  ClipboardCheck,
  BoxesIcon,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface SparePartItem {
  id: string
  name: string
  code: string
  unit: string
  minStock: number
  currentStock: number
  price: number | null
  description: string | null
  category: { id: string; name: string; code: string } | null
}

interface SparePartCategory {
  id: string
  name: string
  code: string
}

interface EquipmentItem {
  id: string
  name: string
  code: string
  location: string
}

type ZipRequestType = 'purchase_no_equip' | 'purchase_with_equip' | 'manufacturing'
type ZipRequestStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'ordered'
  | 'completed'
  | 'cancelled'
type PriorityType = 'low' | 'medium' | 'high' | 'critical'

interface ZipRequestItem {
  id?: string
  articleNumber: string
  name: string
  quantity: number
  unit: string
  unitPrice?: number
  sparePartId?: string
  drawingNumber?: string
  material?: string
  specifications?: string
  notes?: string
}

interface ZipRequestFile {
  id: string
  fileName: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  uploadedById: string
}

interface ApprovalAction {
  id: string
  stepId: string
  stepOrder: number
  role: string
  position: string
  action: 'approved' | 'rejected' | 'skipped' | 'pending'
  userId?: string
  userName?: string
  comment?: string
  actedAt?: string
}

interface ApprovalStep {
  id?: string
  stepOrder: number
  role: string
  position: string
  description: string
  isOptional: boolean
}

interface ApprovalRoute {
  id: string
  name: string
  type: string
  description: string
  isActive: boolean
  steps: ApprovalStep[]
}

interface ZipRequest {
  id: string
  requestNumber: string
  type: ZipRequestType
  title: string
  description: string
  status: ZipRequestStatus
  priority: PriorityType
  neededBy: string | null
  equipmentId: string | null
  equipmentName: string | null
  authorId: string
  authorName: string
  createdAt: string
  updatedAt: string
  items: ZipRequestItem[]
  files: ZipRequestFile[]
  approvalActions: ApprovalAction[]
}

interface ZipRequestsResponse {
  items: ZipRequest[]
  total: number
  page: number
  limit: number
  statusCounts: Record<string, number>
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function formatPrice(price: number | undefined | null): string {
  if (price == null) return '—'
  return `${Number(price).toLocaleString('ru-RU')} ₽`
}

const STATUS_LABELS: Record<ZipRequestStatus, string> = {
  draft: 'Черновик',
  pending_approval: 'На согласовании',
  approved: 'Согласовано',
  rejected: 'Отклонено',
  ordered: 'Заказано',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

const STATUS_COLORS: Record<ZipRequestStatus, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  pending_approval: 'bg-amber-100 text-amber-700 border-amber-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  ordered: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200 line-through',
}

const PRIORITY_LABELS: Record<PriorityType, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}

const PRIORITY_COLORS: Record<PriorityType, string> = {
  low: 'bg-slate-100 text-slate-600 border-slate-200',
  medium: 'bg-gray-100 text-gray-700 border-gray-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
}

const TYPE_LABELS: Record<ZipRequestType, string> = {
  purchase_no_equip: 'Закупка (без привязки)',
  purchase_with_equip: 'Закупка (с привязкой)',
  manufacturing: 'Изготовление',
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  engineer: 'Инженер',
  worker: 'Работник',
}

// ═══════════════════════════════════════════════════════════════
// CATALOG TAB (existing spare parts CRUD — preserved)
// ═══════════════════════════════════════════════════════════════

const emptySparePartForm = {
  name: '',
  code: '',
  categoryId: '',
  unit: 'шт',
  minStock: '0',
  currentStock: '0',
  price: '',
  description: '',
}

function CatalogTab() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<SparePartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptySparePartForm)
  const [categories, setCategories] = useState<SparePartCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState(emptySparePartForm)
  const [editItemId, setEditItemId] = useState<string | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<SparePartItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/spare-parts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTotalCount(data.total || 0)
        setLowStockCount(data.lowStockCount || 0)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [search])

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/spare-parts?limit=200')
      if (res.ok) {
        const data = await res.json()
        const cats: Record<string, SparePartCategory> = {}
        ;(data.items || []).forEach((item: SparePartItem) => {
          if (item.category && !cats[item.category.id]) {
            cats[item.category.id] = item.category
          }
        })
        setCategories(Object.values(cats))
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems()
    }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchItems])

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error('Укажите наименование и артикул')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        minStock: parseInt(form.minStock) || 0,
        currentStock: parseInt(form.currentStock) || 0,
        price: form.price ? parseFloat(form.price) : null,
        categoryId: form.categoryId || null,
      }
      const res = await fetch('/api/spare-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success('Запчасть успешно добавлена')
        setDialogOpen(false)
        setForm(emptySparePartForm)
        fetchItems()
        fetchCategories()
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

  const handleEditOpen = (item: SparePartItem) => {
    setEditItemId(item.id)
    setEditForm({
      name: item.name,
      code: item.code,
      categoryId: item.category?.id || '',
      unit: item.unit,
      minStock: String(item.minStock),
      currentStock: String(item.currentStock),
      price: item.price ? String(item.price) : '',
      description: item.description || '',
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editForm.name || !editForm.code || !editItemId) {
      toast.error('Укажите наименование и артикул')
      return
    }
    setEditSubmitting(true)
    try {
      const payload = {
        id: editItemId,
        name: editForm.name,
        code: editForm.code,
        categoryId: editForm.categoryId || null,
        unit: editForm.unit || 'шт',
        minStock: parseInt(editForm.minStock) || 0,
        currentStock: parseInt(editForm.currentStock) || 0,
        price: editForm.price ? parseFloat(editForm.price) : null,
        description: editForm.description || null,
      }
      const res = await fetch('/api/spare-parts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success('Запчасть успешно обновлена')
        setEditDialogOpen(false)
        setEditItemId(null)
        setEditForm(emptySparePartForm)
        fetchItems()
        fetchCategories()
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

  const handleDeleteOpen = (item: SparePartItem) => {
    setDeleteItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch('/api/spare-parts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItem.id }),
      })
      if (res.ok) {
        toast.success('Запчасть успешно удалена')
        setDeleteDialogOpen(false)
        setDeleteItem(null)
        fetchItems()
        fetchCategories()
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

  const totalStock = items.reduce((sum, item) => sum + item.currentStock, 0)

  const statsCards = [
    {
      title: 'Всего наименований',
      value: loading ? null : totalCount,
      icon: Package,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'На складе',
      value: loading ? null : totalStock,
      subtitle: `${items.length} позиций`,
      icon: Package,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Требуется заказ',
      value: loading ? null : lowStockCount,
      subtitle: 'ниже мин. остатка',
      icon: AlertCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
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
                  {stat.subtitle && (
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="size-4" />
                Добавить
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Добавить запчасть</DialogTitle>
                <DialogDescription>Введите данные о новой запасной части</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sp-name">Наименование *</Label>
                    <Input
                      id="sp-name"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Подшипник 6308-2RS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-code">Артикул *</Label>
                    <Input
                      id="sp-code"
                      value={form.code}
                      onChange={(e) => updateField('code', e.target.value)}
                      placeholder="6308-2RS"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-unit">Ед. измерения</Label>
                    <Input
                      id="sp-unit"
                      value={form.unit}
                      onChange={(e) => updateField('unit', e.target.value)}
                      placeholder="шт"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sp-min">Мин. остаток</Label>
                    <Input
                      id="sp-min"
                      type="number"
                      value={form.minStock}
                      onChange={(e) => updateField('minStock', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-stock">Текущий остаток</Label>
                    <Input
                      id="sp-stock"
                      type="number"
                      value={form.currentStock}
                      onChange={(e) => updateField('currentStock', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-price">Цена (₽)</Label>
                    <Input
                      id="sp-price"
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => updateField('price', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-desc">Описание</Label>
                  <Textarea
                    id="sp-desc"
                    value={form.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Дополнительные сведения..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setForm(emptySparePartForm)
                  }}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                  Добавить
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="secondary" className="gap-2">
            <Upload className="size-4" />
            Импорт
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по артикулу, наименованию..."
            className="w-full pl-9 sm:w-[280px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6">Артикул</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead className="text-right">Остаток</TableHead>
                <TableHead className="text-right">Мин. остаток</TableHead>
                <TableHead>Ед. изм.</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="pr-6 text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell
                        key={j}
                        className={j === 0 ? 'pl-6' : j === 7 ? 'pr-6 text-right' : ''}
                      >
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileSpreadsheet className="size-12 text-muted-foreground/40" />
                      <p className="max-w-md text-sm text-muted-foreground">
                        {search
                          ? 'Запчасти по запросу не найдены.'
                          : 'Запасные части пока не добавлены. Нажмите кнопку «Добавить» или «Импорт» для начала работы.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => {
                  const isLow = item.currentStock <= item.minStock
                  return (
                    <TableRow key={item.id} className={isLow ? 'bg-red-50/50' : ''}>
                      <TableCell className="pl-6 font-mono text-sm font-medium">
                        {item.code}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.name}</span>
                          {isLow && <AlertTriangle className="size-3.5 shrink-0 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.category?.name || '—'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isLow ? 'text-red-600' : ''}`}>
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{item.minStock}</TableCell>
                      <TableCell className="text-sm">{item.unit}</TableCell>
                      <TableCell className="text-right text-sm">
                        {item.price ? `${item.price.toLocaleString('ru-RU')} ₽` : '—'}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem className="gap-2" onClick={() => handleEditOpen(item)}>
                              <Pencil className="size-4" /> Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 text-destructive"
                              onClick={() => handleDeleteOpen(item)}
                            >
                              <Trash2 className="size-4" /> Удалить
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

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setEditItemId(null)
            setEditForm(emptySparePartForm)
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать запчасть</DialogTitle>
            <DialogDescription>Измените данные запасной части</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sp-name">Наименование *</Label>
                <Input
                  id="edit-sp-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-code">Артикул *</Label>
                <Input
                  id="edit-sp-code"
                  value={editForm.code}
                  onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select
                  value={editForm.categoryId}
                  onValueChange={(v) => setEditForm((p) => ({ ...p, categoryId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-unit">Ед. измерения</Label>
                <Input
                  id="edit-sp-unit"
                  value={editForm.unit}
                  onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sp-min">Мин. остаток</Label>
                <Input
                  id="edit-sp-min"
                  type="number"
                  value={editForm.minStock}
                  onChange={(e) => setEditForm((p) => ({ ...p, minStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-stock">Текущий остаток</Label>
                <Input
                  id="edit-sp-stock"
                  type="number"
                  value={editForm.currentStock}
                  onChange={(e) => setEditForm((p) => ({ ...p, currentStock: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-price">Цена (₽)</Label>
                <Input
                  id="edit-sp-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sp-desc">Описание</Label>
              <Textarea
                id="edit-sp-desc"
                value={editForm.description}
                onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSubmitting || !editForm.name || !editForm.code}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {editSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) setDeleteItem(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить запчасть?</AlertDialogTitle>
            <AlertDialogDescription>
              Запчасть{' '}
              <span className="font-mono font-semibold text-foreground">{deleteItem?.code}</span>{' '}
              «{deleteItem?.name}» будет удалена без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL TIMELINE
// ═══════════════════════════════════════════════════════════════

function ApprovalTimeline({
  actions,
  onApprove,
  onReject,
  canAct,
  userRole,
  loading,
}: {
  actions: ApprovalAction[]
  onApprove: (comment: string) => void
  onReject: (comment: string) => void
  canAct: boolean
  userRole: string
  loading: boolean
}) {
  const [comment, setComment] = useState('')
  const pendingAction = actions.find((a) => a.action === 'pending')

  const handleApprove = () => {
    onApprove(comment)
    setComment('')
  }

  const handleReject = () => {
    onReject(comment)
    setComment('')
  }

  return (
    <div className="space-y-0">
      {actions.map((action, idx) => {
        const isPending = action.action === 'pending'
        const isCurrentStep = pendingAction?.stepId === action.stepId
        const canUserAct = canAct && isCurrentStep && userRole === action.role

        return (
          <div key={action.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
            {/* Line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 ${
                  action.action === 'approved'
                    ? 'border-emerald-500 bg-emerald-50'
                    : action.action === 'rejected'
                      ? 'border-red-500 bg-red-50'
                      : action.action === 'skipped'
                        ? 'border-dashed border-gray-400 bg-gray-50'
                        : 'border-gray-300 bg-white'
                }`}
              >
                {action.action === 'approved' ? (
                  <CheckCircle2 className="size-4 text-emerald-600" />
                ) : action.action === 'rejected' ? (
                  <XCircle className="size-4 text-red-600" />
                ) : action.action === 'skipped' ? (
                  <Ban className="size-3.5 text-gray-400" />
                ) : (
                  <Clock className="size-4 text-gray-400" />
                )}
              </div>
              {idx < actions.length - 1 && (
                <div
                  className={`w-0.5 flex-1 min-h-[2rem] ${
                    action.action !== 'pending' ? 'bg-emerald-200' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className="-mt-0.5 flex-1 pb-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">
                    Шаг {action.stepOrder}: {ROLE_LABELS[action.role] || action.role}
                    {action.position && ` — ${action.position}`}
                    {action.isOptional && (
                      <Badge variant="outline" className="ml-2 text-xs text-muted-foreground">
                        Опциональный
                      </Badge>
                    )}
                  </p>
                  {isPending && isCurrentStep && (
                    <p className="text-xs text-orange-600 font-medium mt-0.5">Ожидает решения</p>
                  )}
                  {action.action === 'skipped' && (
                    <p className="text-xs text-muted-foreground mt-0.5">Пропущен</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {action.actedAt ? formatDate(action.actedAt) : ''}
                </span>
              </div>

              {action.userName && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {action.action === 'approved'
                    ? `Согласовал(а): ${action.userName}`
                    : action.action === 'rejected'
                      ? `Отклонил(а): ${action.userName}`
                      : ''}
                </p>
              )}
              {action.comment && (
                <p className="mt-1 rounded-md bg-muted px-3 py-2 text-sm italic">
                  «{action.comment}»
                </p>
              )}

              {/* Action buttons for current user */}
              {canUserAct && (
                <div className="mt-3 space-y-3 rounded-lg border border-orange-200 bg-orange-50/50 p-4">
                  <p className="text-sm font-medium text-orange-800">
                    Вам нужно согласовать этот шаг
                  </p>
                  <Textarea
                    placeholder="Комментарий (необязательно)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleApprove}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="size-4" />
                      )}
                      Согласовать
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                      onClick={handleReject}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <XCircle className="size-4" />
                      )}
                      Отклонить
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZIP REQUEST DETAIL DIALOG
// ═══════════════════════════════════════════════════════════════

function ZipRequestDetailDialog({
  requestId,
  open,
  onClose,
}: {
  requestId: string | null
  open: boolean
  onClose: () => void
}) {
  const { user } = useAuthStore()
  const [request, setRequest] = useState<ZipRequest | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [fileList, setFileList] = useState<ZipRequestFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchRequest = useCallback(async () => {
    if (!requestId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/zip-requests/${requestId}`)
      if (res.ok) {
        const data = await res.json()
        setRequest(data)
      }
    } catch {
      toast.error('Ошибка загрузки заявки')
    } finally {
      setLoading(false)
    }
  }, [requestId])

  const fetchFiles = useCallback(async () => {
    if (!requestId) return
    try {
      const res = await fetch(`/api/zip-requests/${requestId}/files`)
      if (res.ok) {
        const data = await res.json()
        setFileList(Array.isArray(data) ? data : data.items || [])
      }
    } catch {
      // silent
    }
  }, [requestId])

  useEffect(() => {
    if (open && requestId) {
      fetchRequest()
      fetchFiles()
    }
    if (!open) {
      setRequest(null)
      setFileList([])
    }
  }, [open, requestId, fetchRequest, fetchFiles])

  const handleApprovalAction = async (action: 'approve' | 'reject', comment: string) => {
    if (!requestId) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/zip-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment }),
      })
      if (res.ok) {
        toast.success(action === 'approve' ? 'Заявка согласована' : 'Заявка отклонена')
        fetchRequest()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при согласовании')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setActionLoading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const fd = new FormData()
        fd.append('file', files[i])
        const res = await fetch(`/api/zip-requests/${requestId}/files`, {
          method: 'POST',
          body: fd,
        })
        if (!res.ok) {
          const data = await res.json()
          toast.error(data.error || `Ошибка загрузки файла: ${files[i].name}`)
        }
      }
      toast.success('Файлы загружены')
      fetchFiles()
    } catch {
      toast.error('Ошибка загрузки файлов')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!requestId) return
    try {
      const res = await fetch(`/api/zip-requests/${requestId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId }),
      })
      if (res.ok) {
        toast.success('Файл удалён')
        fetchFiles()
      } else {
        toast.error('Ошибка удаления файла')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  const pendingAction = request?.approvalActions?.find((a) => a.action === 'pending')
  const canApprove =
    !!user &&
    !!pendingAction &&
    user.role === pendingAction.role &&
    request?.status === 'pending_approval'

  const totalCost = request?.items?.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  )

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[700px]">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="size-8 animate-spin text-orange-600" />
          </div>
        ) : !request ? (
          <div className="p-12 text-center text-muted-foreground">Заявка не найдена</div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg">Заявка #{request.requestNumber}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <Badge className={STATUS_COLORS[request.status]}>{STATUS_LABELS[request.status]}</Badge>
                <Badge className={PRIORITY_COLORS[request.priority]}>
                  {PRIORITY_LABELS[request.priority]}
                </Badge>
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 space-y-6 px-4 pb-4">
              {/* Basic Info */}
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Тип:</span>{' '}
                    <span className="font-medium">{TYPE_LABELS[request.type]}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Автор:</span>{' '}
                    <span className="font-medium">{request.authorName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата создания:</span>{' '}
                    <span className="font-medium">{formatDate(request.createdAt)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Дата обновления:</span>{' '}
                    <span className="font-medium">{formatDate(request.updatedAt)}</span>
                  </div>
                  {request.neededBy && (
                    <div>
                      <span className="text-muted-foreground">Требуется до:</span>{' '}
                      <span className="font-medium">{formatDate(request.neededBy)}</span>
                    </div>
                  )}
                  {request.equipmentName && (
                    <div>
                      <span className="text-muted-foreground">Оборудование:</span>{' '}
                      <span className="font-medium">{request.equipmentName}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-sm text-muted-foreground">Название</p>
                  <p className="mt-1 font-medium">{request.title}</p>
                </div>
                {request.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Описание</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{request.description}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h3 className="mb-3 text-sm font-semibold">Позиции ({request.items?.length || 0})</h3>
                {request.items && request.items.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent text-xs">
                          <TableHead>Артикул</TableHead>
                          <TableHead>Наименование</TableHead>
                          <TableHead className="text-right">Кол-во</TableHead>
                          <TableHead>Ед.изм.</TableHead>
                          <TableHead className="text-right">Цена</TableHead>
                          <TableHead className="text-right">Сумма</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {request.items.map((item, idx) => (
                          <TableRow key={item.id || idx}>
                            <TableCell className="font-mono text-xs">
                              {item.articleNumber || '—'}
                            </TableCell>
                            <TableCell className="text-sm">{item.name}</TableCell>
                            <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                            <TableCell className="text-sm">{item.unit || 'шт'}</TableCell>
                            <TableCell className="text-right text-sm">
                              {formatPrice(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {formatPrice((item.quantity || 0) * (item.unitPrice || 0))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет позиций</p>
                )}
                {totalCost != null && totalCost > 0 && (
                  <div className="mt-2 flex justify-end">
                    <p className="text-sm font-semibold">
                      Итого: {totalCost.toLocaleString('ru-RU')} ₽
                    </p>
                  </div>
                )}
                {/* Manufacturing fields */}
                {request.type === 'manufacturing' && request.items?.some((i) => i.drawingNumber || i.material) && (
                  <div className="mt-3 space-y-2">
                    {request.items
                      .filter((i) => i.drawingNumber || i.material || i.specifications)
                      .map((item, idx) => (
                        <div key={idx} className="rounded-md bg-muted p-3 text-xs space-y-1">
                          <p className="font-medium">{item.name}</p>
                          {item.drawingNumber && (
                            <p>
                              <span className="text-muted-foreground">Чертёж:</span> {item.drawingNumber}
                            </p>
                          )}
                          {item.material && (
                            <p>
                              <span className="text-muted-foreground">Материал:</span> {item.material}
                            </p>
                          )}
                          {item.specifications && (
                            <p>
                              <span className="text-muted-foreground">Спецификация:</span>{' '}
                              {item.specifications}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Files */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Файлы ({fileList.length})
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || request.status !== 'draft'}
                  >
                    {uploading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="size-3.5" />
                    )}
                    Прикрепить
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
                {fileList.length > 0 ? (
                  <div className="space-y-2">
                    {fileList.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{file.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)} · {formatDate(file.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button variant="ghost" size="icon" className="size-7">
                            <Download className="size-3.5" />
                          </Button>
                          {(request.status === 'draft' || user?.role === 'admin') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteFile(file.id)}
                            >
                              <X className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Нет прикреплённых файлов</p>
                )}
              </div>

              {/* Approval Workflow */}
              {request.approvalActions && request.approvalActions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-4 text-sm font-semibold">Маршрут согласования</h3>
                    <ApprovalTimeline
                      actions={request.approvalActions}
                      onApprove={(comment) => handleApprovalAction('approve', comment)}
                      onReject={(comment) => handleApprovalAction('reject', comment)}
                      canAct={canApprove}
                      userRole={user?.role || ''}
                      loading={actionLoading}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// CREATE ZIP REQUEST DIALOG (Sheet)
// ═══════════════════════════════════════════════════════════════

interface TempFile {
  file: File
  id: string
}

const emptyRequestItem: ZipRequestItem = {
  articleNumber: '',
  name: '',
  quantity: 1,
  unit: 'шт',
  unitPrice: undefined,
}

function CreateZipRequestDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [type, setType] = useState<ZipRequestType>('purchase_no_equip')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<PriorityType>('medium')
  const [neededBy, setNeededBy] = useState('')
  const [equipmentId, setEquipmentId] = useState('')
  const [equipmentName, setEquipmentName] = useState('')
  const [items, setItems] = useState<ZipRequestItem[]>([{ ...emptyRequestItem }])
  const [files, setFiles] = useState<TempFile[]>([])
  const [equipSearch, setEquipSearch] = useState('')
  const [equipResults, setEquipResults] = useState<EquipmentItem[]>([])
  const [equipLoading, setEquipLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showEquipment = type === 'purchase_with_equip' || type === 'manufacturing'
  const isManufacturing = type === 'manufacturing'

  // Equipment search
  useEffect(() => {
    if (!equipSearch || equipSearch.length < 2) {
      setEquipResults([])
      return
    }
    const timer = setTimeout(async () => {
      setEquipLoading(true)
      try {
        const res = await fetch(`/api/equipment?search=${encodeURIComponent(equipSearch)}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setEquipResults(data.items || [])
        }
      } catch {
        // silent
      } finally {
        setEquipLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [equipSearch])

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyRequestItem }])
  }

  const removeItem = (idx: number) => {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const updateItem = (idx: number, field: keyof ZipRequestItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files
    if (!selected) return
    const newFiles = Array.from(selected).map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    }))
    setFiles((prev) => [...prev, ...newFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const resetForm = () => {
    setStep(1)
    setType('purchase_no_equip')
    setTitle('')
    setDescription('')
    setPriority('medium')
    setNeededBy('')
    setEquipmentId('')
    setEquipmentName('')
    setItems([{ ...emptyRequestItem }])
    setFiles([])
    setEquipSearch('')
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  const validateStep = (): boolean => {
    if (step === 1) return true
    if (step === 2) {
      if (!title.trim()) {
        toast.error('Укажите название заявки')
        return false
      }
      if (showEquipment && !equipmentId) {
        toast.error('Выберите оборудование')
        return false
      }
      return true
    }
    if (step === 3) {
      const validItems = items.filter((i) => i.name.trim())
      if (validItems.length === 0) {
        toast.error('Добавьте хотя бы одну позицию')
        return false
      }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (!validateStep()) return
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    const validItems = items
      .filter((i) => i.name.trim())
      .map((i) => ({
        articleNumber: i.articleNumber,
        name: i.name,
        quantity: i.quantity || 1,
        unit: i.unit || 'шт',
        unitPrice: i.unitPrice || undefined,
        drawingNumber: i.drawingNumber || undefined,
        material: i.material || undefined,
        specifications: i.specifications || undefined,
      }))

    if (validItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию')
      return
    }

    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        neededBy: neededBy || undefined,
        items: validItems,
      }
      if (showEquipment && equipmentId) {
        payload.equipmentId = equipmentId
      }

      const res = await fetch('/api/zip-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при создании заявки')
        setSubmitting(false)
        return
      }

      const created = await res.json()

      // Upload files
      if (files.length > 0 && created.id) {
        for (const f of files) {
          const fd = new FormData()
          fd.append('file', f.file)
          try {
            await fetch(`/api/zip-requests/${created.id}/files`, {
              method: 'POST',
              body: fd,
            })
          } catch {
            // Continue uploading other files
          }
        }
      }

      toast.success('Заявка успешно создана')
      handleClose()
      onSuccess()
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  const totalCost = items.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0,
  )

  const stepLabels = ['Тип заявки', 'Основная информация', 'Позиции', 'Файлы']

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[700px]">
        <SheetHeader>
          <SheetTitle className="text-lg">Создать потребность в ЗИП</SheetTitle>
          <SheetDescription>
            Шаг {step} из 4 — {stepLabels[step - 1]}
          </SheetDescription>
        </SheetHeader>

        {/* Step indicator */}
        <div className="mx-4 mt-2 flex items-center gap-1">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  s < step
                    ? 'bg-emerald-600 text-white'
                    : s === step
                      ? 'bg-orange-600 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {s < step ? <CheckCircle2 className="size-4" /> : s}
              </div>
              {s < 4 && (
                <div
                  className={`h-0.5 w-6 ${
                    s < step ? 'bg-emerald-300' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex-1 px-4 pb-4">
          {/* Step 1: Type */}
          {step === 1 && (
            <div className="space-y-4">
              <RadioGroup value={type} onValueChange={(v) => setType(v as ZipRequestType)}>
                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                    type === 'purchase_no_equip'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-muted hover:border-orange-300'
                  }`}
                >
                  <RadioGroupItem value="purchase_no_equip" className="mt-0.5" />
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-orange-100">
                      <ShoppingCart className="size-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Закупка по артикулу</p>
                      <p className="text-xs text-muted-foreground">
                        Без привязки к оборудованию
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                    type === 'purchase_with_equip'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-muted hover:border-orange-300'
                  }`}
                >
                  <RadioGroupItem value="purchase_with_equip" className="mt-0.5" />
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                      <BoxesIcon className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Закупка по артикулу</p>
                      <p className="text-xs text-muted-foreground">
                        С привязкой к оборудованию
                      </p>
                    </div>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-4 rounded-lg border p-4 transition-colors ${
                    type === 'manufacturing'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-muted hover:border-orange-300'
                  }`}
                >
                  <RadioGroupItem value="manufacturing" className="mt-0.5" />
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-100">
                      <Wrench className="size-5 text-sky-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Изготовление запчасти</p>
                      <p className="text-xs text-muted-foreground">
                        С привязкой к оборудованию, с чертежами и спецификацией
                      </p>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>
          )}

          {/* Step 2: Basic Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zip-title">Название *</Label>
                <Input
                  id="zip-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Закупка подшипников для насоса"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip-desc">Описание</Label>
                <Textarea
                  id="zip-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Дополнительные сведения о потребности..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Приоритет</Label>
                  <Select value={priority} onValueChange={(v) => setPriority(v as PriorityType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip-needed">Требуется до</Label>
                  <Input
                    id="zip-needed"
                    type="date"
                    value={neededBy}
                    onChange={(e) => setNeededBy(e.target.value)}
                  />
                </div>
              </div>

              {/* Equipment selector */}
              {showEquipment && (
                <div className="space-y-2">
                  <Label>Оборудование *</Label>
                  {equipmentName ? (
                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                      <span className="flex-1 text-sm">{equipmentName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => {
                          setEquipmentId('')
                          setEquipmentName('')
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Поиск оборудования по названию или коду..."
                        value={equipSearch}
                        onChange={(e) => setEquipSearch(e.target.value)}
                        className="pl-9"
                      />
                      {equipLoading && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                      )}
                      {equipResults.length > 0 && !equipLoading && (
                        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-background shadow-lg">
                          {equipResults.map((eq) => (
                            <button
                              key={eq.id}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                              onClick={() => {
                                setEquipmentId(eq.id)
                                setEquipmentName(`${eq.code} — ${eq.name}`)
                                setEquipResults([])
                                setEquipSearch('')
                              }}
                            >
                              <span className="font-mono text-xs text-muted-foreground">{eq.code}</span>
                              <span>{eq.name}</span>
                              {eq.location && (
                                <span className="ml-auto text-xs text-muted-foreground">{eq.location}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Items */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent text-xs">
                      <TableHead className="min-w-[100px]">Артикул</TableHead>
                      <TableHead className="min-w-[150px]">Наименование *</TableHead>
                      <TableHead className="w-[70px] text-right">Кол-во</TableHead>
                      <TableHead className="w-[70px]">Ед.изм.</TableHead>
                      <TableHead className="w-[100px] text-right">Цена</TableHead>
                      {isManufacturing && (
                        <TableHead className="min-w-[100px]">Чертёж</TableHead>
                      )}
                      {isManufacturing && (
                        <TableHead className="min-w-[80px]">Материал</TableHead>
                      )}
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={item.articleNumber}
                            onChange={(e) => updateItem(idx, 'articleNumber', e.target.value)}
                            placeholder="Арт."
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(idx, 'name', e.target.value)}
                            placeholder="Наименование"
                            className="h-8 text-xs"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              updateItem(idx, 'quantity', parseInt(e.target.value) || 0)
                            }
                            className="h-8 text-xs text-right"
                            min={1}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                            className="h-8 text-xs"
                            placeholder="шт"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.unitPrice || ''}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                'unitPrice',
                                parseFloat(e.target.value) || undefined,
                              )
                            }
                            className="h-8 text-xs text-right"
                            placeholder="0"
                          />
                        </TableCell>
                        {isManufacturing && (
                          <TableCell>
                            <Input
                              value={item.drawingNumber || ''}
                              onChange={(e) => updateItem(idx, 'drawingNumber', e.target.value)}
                              className="h-8 text-xs"
                              placeholder="№ чертежа"
                            />
                          </TableCell>
                        )}
                        {isManufacturing && (
                          <TableCell>
                            <Input
                              value={item.material || ''}
                              onChange={(e) => updateItem(idx, 'material', e.target.value)}
                              className="h-8 text-xs"
                              placeholder="Материал"
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          {items.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => removeItem(idx)}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                <Plus className="size-3.5" />
                Добавить позицию
              </Button>

              {/* Manufacturing: specifications per item */}
              {isManufacturing && (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Спецификации</Label>
                  {items
                    .filter((i) => i.name.trim())
                    .map((item, idx) => (
                      <div key={idx} className="rounded-md border p-3">
                        <p className="mb-1.5 text-xs font-medium">{item.name}</p>
                        <Textarea
                          value={item.specifications || ''}
                          onChange={(e) => updateItem(idx, 'specifications', e.target.value)}
                          placeholder="Спецификация (необязательно)..."
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    ))}
                </div>
              )}

              {/* Manufacturing: notes per item */}
              {isManufacturing && (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">Примечания</Label>
                  {items
                    .filter((i) => i.name.trim())
                    .map((item, idx) => (
                      <div key={idx} className="rounded-md border p-3">
                        <p className="mb-1.5 text-xs font-medium">{item.name}</p>
                        <Textarea
                          value={item.notes || ''}
                          onChange={(e) => updateItem(idx, 'notes', e.target.value)}
                          placeholder="Примечание (необязательно)..."
                          rows={2}
                          className="text-xs"
                        />
                      </div>
                    ))}
                </div>
              )}

              {totalCost > 0 && (
                <div className="flex justify-end rounded-lg bg-muted px-4 py-2">
                  <p className="text-sm font-semibold">
                    Итого: {totalCost.toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Files */}
          {step === 4 && (
            <div className="space-y-4">
              <div
                className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-orange-400 hover:bg-orange-50/30"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-8 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Нажмите для выбора файлов</p>
                  <p className="text-xs text-muted-foreground">
                    или перетащите файлы в эту область
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Любой формат</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Прикреплённые файлы ({files.length})
                  </p>
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{f.file.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          ({formatFileSize(f.file.size)})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive shrink-0"
                        onClick={() => removeFile(f.id)}
                      >
                        <X className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Вы также сможете прикрепить файлы после создания заявки.
              </p>
            </div>
          )}

          {/* Navigation */}
          <SheetFooter className="mt-6 gap-2 border-t pt-4 sm:flex-col">
            <div className="flex w-full gap-2">
              {step > 1 && (
                <Button variant="outline" onClick={prevStep} className="flex-1">
                  Назад
                </Button>
              )}
              {step < 4 ? (
                <Button
                  onClick={nextStep}
                  className="flex-1 gap-1.5 bg-orange-600 hover:bg-orange-700"
                >
                  Далее
                  <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 gap-1.5 bg-orange-600 hover:bg-orange-700"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" />
                      Создать заявку
                    </>
                  )}
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={handleClose} className="w-full">
              Отмена
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// ═══════════════════════════════════════════════════════════════
// ZIP REQUESTS TAB
// ═══════════════════════════════════════════════════════════════

function ZipRequestsTab() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ZipRequest[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [myRequests, setMyRequests] = useState(false)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  const [createOpen, setCreateOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const { user } = useAuthStore()

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (myRequests) params.set('myRequests', 'true')

      const res = await fetch(`/api/zip-requests?${params}`)
      if (res.ok) {
        const data: ZipRequestsResponse = await res.json()
        setRequests(data.items || [])
        setTotal(data.total || 0)
        setStatusCounts(data.statusCounts || {})
      }
    } catch {
      toast.error('Ошибка загрузки заявок')
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, myRequests, page, limit])

  useEffect(() => {
    const timer = setTimeout(() => fetchRequests(), 300)
    return () => clearTimeout(timer)
  }, [search, typeFilter, statusFilter, myRequests, page, fetchRequests])

  const openDetail = (id: string) => {
    setDetailId(id)
    setDetailOpen(true)
  }

  const totalPages = Math.ceil(total / limit)

  const statsCards = [
    {
      title: 'Всего заявок',
      value: loading ? null : total,
      icon: FileSpreadsheet,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      title: 'На согласовании',
      value: loading ? null : (statusCounts['pending_approval'] || 0),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Согласовано',
      value: loading ? null : (statusCounts['approved'] || 0),
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Отклонено',
      value: loading ? null : (statusCounts['rejected'] || 0),
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`size-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                  {stat.value === null ? (
                    <Skeleton className="h-6 w-8" />
                  ) : (
                    <p className="text-xl font-bold">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск..."
              className="w-full pl-9 sm:w-[200px]"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Все типы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              <SelectItem value="purchase_no_equip">Закупка (без привязки)</SelectItem>
              <SelectItem value="purchase_with_equip">Закупка (с привязкой)</SelectItem>
              <SelectItem value="manufacturing">Изготовление</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v === 'all' ? '' : v)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="draft">Черновик</SelectItem>
              <SelectItem value="pending_approval">На согласовании</SelectItem>
              <SelectItem value="approved">Согласовано</SelectItem>
              <SelectItem value="rejected">Отклонено</SelectItem>
              <SelectItem value="ordered">Заказано</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
              <SelectItem value="cancelled">Отменено</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={myRequests}
              onChange={(e) => {
                setMyRequests(e.target.checked)
                setPage(1)
              }}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            Мои заявки
          </label>
        </div>
        <Button
          className="gap-2 bg-orange-600 hover:bg-orange-700 shrink-0"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-4" />
          Создать потребность
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Номер</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="hidden lg:table-cell">Оборудование</TableHead>
                  <TableHead>Приоритет</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="hidden md:table-cell">Дата</TableHead>
                  <TableHead className="hidden sm:table-cell">Автор</TableHead>
                  <TableHead className="pr-6 text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell
                          key={j}
                          className={j === 0 ? 'pl-6' : j === 8 ? 'pr-6 text-right' : ''}
                        >
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileSpreadsheet className="size-12 text-muted-foreground/40" />
                        <p className="max-w-md text-sm text-muted-foreground">
                          {search || typeFilter || statusFilter
                            ? 'Заявки по заданным фильтрам не найдены.'
                            : 'Заявки пока не созданы. Нажмите «Создать потребность» для начала работы.'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((req) => (
                    <TableRow
                      key={req.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetail(req.id)}
                    >
                      <TableCell className="pl-6 font-mono text-xs font-medium">
                        #{req.requestNumber}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {TYPE_LABELS[req.type]}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium line-clamp-1">{req.title}</span>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell max-w-[150px] truncate">
                        {req.equipmentName || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-xs ${PRIORITY_COLORS[req.priority]}`}
                        >
                          {PRIORITY_LABELS[req.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[req.status]}`}>
                          {STATUS_LABELS[req.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {formatDate(req.createdAt)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground sm:table-cell max-w-[120px] truncate">
                        {req.authorName}
                      </TableCell>
                      <TableCell className="pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => openDetail(req.id)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
              </p>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Назад
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далее
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <CreateZipRequestDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={fetchRequests}
      />

      {/* Detail dialog */}
      <ZipRequestDetailDialog
        requestId={detailId}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setDetailId(null)
          fetchRequests()
        }}
      />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL ROUTE DIALOG (create/edit)
// ═══════════════════════════════════════════════════════════════

function ApprovalRouteDialog({
  open,
  onClose,
  onSuccess,
  editRoute,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  editRoute: ApprovalRoute | null
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<string>('purchase_no_equip')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [steps, setSteps] = useState<ApprovalStep[]>([
    { stepOrder: 1, role: 'manager', position: '', description: '', isOptional: false },
  ])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editRoute) {
      setName(editRoute.name)
      setType(editRoute.type)
      setDescription(editRoute.description || '')
      setIsActive(editRoute.isActive)
      setSteps(
        editRoute.steps?.length > 0
          ? editRoute.steps.map((s) => ({
              stepOrder: s.stepOrder,
              role: s.role,
              position: s.position,
              description: s.description || '',
              isOptional: s.isOptional,
            }))
          : [{ stepOrder: 1, role: 'manager', position: '', description: '', isOptional: false }],
      )
    } else {
      setName('')
      setType('purchase_no_equip')
      setDescription('')
      setIsActive(true)
      setSteps([{ stepOrder: 1, role: 'manager', position: '', description: '', isOptional: false }])
    }
  }, [editRoute, open])

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        stepOrder: prev.length + 1,
        role: 'engineer',
        position: '',
        description: '',
        isOptional: false,
      },
    ])
  }

  const removeStep = (idx: number) => {
    if (steps.length <= 1) return
    setSteps((prev) => {
      const updated = prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepOrder: i + 1 }))
      return updated
    })
  }

  const updateStep = (idx: number, field: keyof ApprovalStep, value: string | number | boolean) => {
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)))
  }

  const moveStep = (idx: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= steps.length) return
    setSteps((prev) => {
      const arr = [...prev]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return arr.map((s, i) => ({ ...s, stepOrder: i + 1 }))
    })
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Укажите название маршрута')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        isActive,
        steps: steps.map((s) => ({
          stepOrder: s.stepOrder,
          role: s.role,
          position: s.position.trim(),
          description: s.description.trim() || undefined,
          isOptional: s.isOptional,
        })),
      }

      let res: Response
      if (editRoute) {
        res = await fetch(`/api/approval-routes/${editRoute.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/approval-routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (res.ok) {
        toast.success(editRoute ? 'Маршрут обновлён' : 'Маршрут создан')
        onClose()
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при сохранении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editRoute ? 'Редактировать маршрут' : 'Создать маршрут согласования'}</DialogTitle>
          <DialogDescription>
            Настройте шаги маршрута согласования для заявок на ЗИП
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="route-name">Название *</Label>
              <Input
                id="route-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Основной маршрут"
              />
            </div>
            <div className="space-y-2">
              <Label>Тип заявки</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="purchase_no_equip">Закупка (без привязки)</SelectItem>
                  <SelectItem value="purchase_with_equip">Закупка (с привязкой)</SelectItem>
                  <SelectItem value="manufacturing">Изготовление</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="route-desc">Описание</Label>
            <Textarea
              id="route-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание маршрута..."
              rows={2}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={setIsActive} />
            <Label className="cursor-pointer">Активный маршрут</Label>
          </div>

          <Separator />

          {/* Steps */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Шаги согласования ({steps.length})
              </Label>
              <Button variant="outline" size="sm" onClick={addStep} className="gap-1.5">
                <Plus className="size-3.5" />
                Добавить шаг
              </Button>
            </div>

            {steps.map((step, idx) => (
              <div key={idx} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Шаг {step.stepOrder}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={idx === 0}
                      onClick={() => moveStep(idx, 'up')}
                    >
                      <ChevronRight className="size-3.5 -rotate-90" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      disabled={idx === steps.length - 1}
                      onClick={() => moveStep(idx, 'down')}
                    >
                      <ChevronRight className="size-3.5 rotate-90" />
                    </Button>
                    {steps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => removeStep(idx)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Роль</Label>
                    <Select
                      value={step.role}
                      onValueChange={(v) => updateStep(idx, 'role', v)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Администратор</SelectItem>
                        <SelectItem value="manager">Менеджер</SelectItem>
                        <SelectItem value="engineer">Инженер</SelectItem>
                        <SelectItem value="worker">Работник</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Должность</Label>
                    <Input
                      value={step.position}
                      onChange={(e) => updateStep(idx, 'position', e.target.value)}
                      placeholder="Начальник цеха"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Описание шага</Label>
                  <Input
                    value={step.description}
                    onChange={(e) => updateStep(idx, 'description', e.target.value)}
                    placeholder="Описание действия на этом шаге..."
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={step.isOptional}
                    onCheckedChange={(v) => updateStep(idx, 'isOptional', v)}
                  />
                  <Label className="text-xs text-muted-foreground cursor-pointer">
                    Опциональный шаг (может быть пропущен)
                  </Label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !name.trim()}
            className="gap-1.5 bg-orange-600 hover:bg-orange-700"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {editRoute ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ═══════════════════════════════════════════════════════════════
// APPROVAL ROUTES TAB (admin only)
// ═══════════════════════════════════════════════════════════════

function ApprovalRoutesTab() {
  const [routes, setRoutes] = useState<ApprovalRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editRoute, setEditRoute] = useState<ApprovalRoute | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRoute, setDeleteRoute] = useState<ApprovalRoute | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const fetchRoutes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/approval-routes')
      if (res.ok) {
        const data = await res.json()
        setRoutes(data.items || [])
      }
    } catch {
      toast.error('Ошибка загрузки маршрутов')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRoutes()
  }, [fetchRoutes])

  const handleCreate = () => {
    setEditRoute(null)
    setDialogOpen(true)
  }

  const handleEdit = (route: ApprovalRoute) => {
    setEditRoute(route)
    setDialogOpen(true)
  }

  const handleDelete = (route: ApprovalRoute) => {
    setDeleteRoute(route)
    setDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteRoute) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/approval-routes/${deleteRoute.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        toast.success('Маршрут удалён')
        setDeleteOpen(false)
        setDeleteRoute(null)
        fetchRoutes()
      } else {
        toast.error('Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Маршруты согласования</h2>
          <p className="text-sm text-muted-foreground">
            Управление маршрутами согласования для заявок на ЗИП
          </p>
        </div>
        <Button
          className="gap-2 bg-orange-600 hover:bg-orange-700"
          onClick={handleCreate}
        >
          <Plus className="size-4" />
          Создать маршрут
        </Button>
      </div>

      {/* Routes list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Route className="size-12 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Маршруты согласования не созданы. Создайте первый маршрут.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <Card key={route.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold line-clamp-1">{route.name}</CardTitle>
                  <Badge variant={route.isActive ? 'default' : 'outline'} className="shrink-0">
                    {route.isActive ? 'Активен' : 'Неактивен'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ClipboardCheck className="size-3.5" />
                  <span>Тип: {TYPE_LABELS[route.type as ZipRequestType] || route.type}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Settings className="size-3.5" />
                  <span>Шагов: {route.steps?.length || 0}</span>
                </div>
                {route.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{route.description}</p>
                )}

                {/* Steps preview */}
                {route.steps && route.steps.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {route.steps.map((step, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs font-normal">
                        {idx + 1}. {ROLE_LABELS[step.role] || step.role}
                        {step.isOptional && ' (опц.)'}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => handleEdit(route)}
                  >
                    <Pencil className="size-3.5" />
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(route)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <ApprovalRouteDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditRoute(null)
        }}
        onSuccess={fetchRoutes}
        editRoute={editRoute}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(v) => {
          setDeleteOpen(v)
          if (!v) setDeleteRoute(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить маршрут?</AlertDialogTitle>
            <AlertDialogDescription>
              Маршрут «{deleteRoute?.name}» будет удалён без возможности восстановления.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSubmitting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SparePartsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold">Запасные части и ЗИП</h1>
        <p className="text-sm text-muted-foreground">
          Каталог, потребности и маршруты согласования
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="catalog">
        <TabsList>
          <TabsTrigger value="catalog" className="gap-1.5">
            <Package className="size-4" />
            <span className="hidden sm:inline">Каталог</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            <FileSpreadsheet className="size-4" />
            <span className="hidden sm:inline">Потребности</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="routes" className="gap-1.5">
              <Route className="size-4" />
              <span className="hidden sm:inline">Маршруты</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="catalog">
          <CatalogTab />
        </TabsContent>

        <TabsContent value="requests">
          <ZipRequestsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="routes">
            <ApprovalRoutesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
