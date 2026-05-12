'use client'

import { useState, useEffect, useCallback } from 'react'
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
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

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

const emptyForm = {
  name: '',
  code: '',
  categoryId: '',
  unit: 'шт',
  minStock: '0',
  currentStock: '0',
  price: '',
  description: '',
}

export default function SparePartsPage() {
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<SparePartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [categories, setCategories] = useState<SparePartCategory[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState(emptyForm)
  const [editItemId, setEditItemId] = useState<string | null>(null)

  // Delete confirmation
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
      // Fetch categories from the spare parts seed - we'll get them from items
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
    const timer = setTimeout(() => { fetchItems() }, 300)
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
        setForm(emptyForm)
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

  // ─── Edit ───
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
        setEditForm(emptyForm)
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

  // ─── Delete ───
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
      color: 'text-blue-600',
      bg: 'bg-blue-50',
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
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Запасные части</h1>
        <p className="text-sm text-muted-foreground">
          Учёт, заказ и движение запасных частей
        </p>
      </div>

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
                <DialogDescription>
                  Введите данные о новой запасной части
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sp-name">Наименование *</Label>
                    <Input id="sp-name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Подшипник 6308-2RS" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-code">Артикул *</Label>
                    <Input id="sp-code" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="6308-2RS" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-unit">Ед. измерения</Label>
                    <Input id="sp-unit" value={form.unit} onChange={(e) => updateField('unit', e.target.value)} placeholder="шт" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sp-min">Мин. остаток</Label>
                    <Input id="sp-min" type="number" value={form.minStock} onChange={(e) => updateField('minStock', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-stock">Текущий остаток</Label>
                    <Input id="sp-stock" type="number" value={form.currentStock} onChange={(e) => updateField('currentStock', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sp-price">Цена (₽)</Label>
                    <Input id="sp-price" type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sp-desc">Описание</Label>
                  <Textarea id="sp-desc" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Дополнительные сведения..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); setForm(emptyForm) }}>Отмена</Button>
                <Button onClick={handleSubmit} disabled={submitting} className="bg-orange-600 hover:bg-orange-700">
                  {submitting && <Loader2 className="size-4 mr-2 animate-spin" />}
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
            className="pl-9 w-full sm:w-[280px]"
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
                      <TableCell key={j} className={j === 0 ? 'pl-6' : j === 7 ? 'pr-6 text-right' : ''}>
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
                      <p className="text-muted-foreground text-sm max-w-md">
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
                      <TableCell className="pl-6 font-mono text-sm font-medium">{item.code}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{item.name}</span>
                          {isLow && <AlertTriangle className="size-3.5 text-red-500 shrink-0" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.category?.name || '—'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${isLow ? 'text-red-600' : ''}`}>
                        {item.currentStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {item.minStock}
                      </TableCell>
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
                            <DropdownMenuItem className="gap-2 text-destructive" onClick={() => handleDeleteOpen(item)}>
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

      {/* ═══════════ Edit Dialog ═══════════ */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) { setEditItemId(null); setEditForm(emptyForm) } }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактировать запчасть</DialogTitle>
            <DialogDescription>
              Измените данные запасной части
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sp-name">Наименование *</Label>
                <Input id="edit-sp-name" value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-code">Артикул *</Label>
                <Input id="edit-sp-code" value={editForm.code} onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={editForm.categoryId} onValueChange={(v) => setEditForm((p) => ({ ...p, categoryId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-unit">Ед. измерения</Label>
                <Input id="edit-sp-unit" value={editForm.unit} onChange={(e) => setEditForm((p) => ({ ...p, unit: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-sp-min">Мин. остаток</Label>
                <Input id="edit-sp-min" type="number" value={editForm.minStock} onChange={(e) => setEditForm((p) => ({ ...p, minStock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-stock">Текущий остаток</Label>
                <Input id="edit-sp-stock" type="number" value={editForm.currentStock} onChange={(e) => setEditForm((p) => ({ ...p, currentStock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sp-price">Цена (₽)</Label>
                <Input id="edit-sp-price" type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm((p) => ({ ...p, price: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sp-desc">Описание</Label>
              <Textarea id="edit-sp-desc" value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleEditSubmit} disabled={editSubmitting || !editForm.name || !editForm.code} className="bg-orange-600 hover:bg-orange-700">
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
            <AlertDialogTitle>Удалить запчасть?</AlertDialogTitle>
            <AlertDialogDescription>
              Запчасть <span className="font-mono font-semibold text-foreground">{deleteItem?.code}</span> «{deleteItem?.name}» будет удалена без возможности восстановления.
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
