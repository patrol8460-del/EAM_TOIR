'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShoppingCart,
  Package,
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ChevronDown,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  Clock,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Send,
  ClipboardPaste,
  Layers,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourceItem {
  zipRequestId: string
  zipRequestNumber: string
  zipRequestTitle: string
  zipRequestStatus: string
  zipRequestPriority: string
  zipRequestNeededBy: string
  zipRequestType: string
  zipRequestCreatedAt: string
  applicantName: string
  departmentName: string
  departmentId: string
  authorName: string
  itemId: string
  quantity: number
  unitPrice: number
  name: string
  unit: string
}

interface ConsolidatedItem {
  articleNumber: string
  name: string
  unit: string
  totalQuantity: number
  requestCount: number
  unitPrice: number
  totalPrice: number
  sparePartId: string | null
  sparePartCode: string | null
  sparePartName: string | null
  currentStock: number
  catalogPrice: number | null
  sources: SourceItem[]
}

interface ConsolidatedStats {
  totalItems: number
  totalQuantity: number
  totalValue: number
  linkedToCatalog: number
  notLinkedToCatalog: number
}

interface ConsolidatedResponse {
  consolidated: ConsolidatedItem[]
  stats: ConsolidatedStats
}

interface LotItem {
  id?: string
  procurementLotId?: string
  articleNumber: string
  name: string
  unit: string
  quantity: number
  unitPrice: number | null
  notes: string | null
  sources: SourceItem[]
  sourceData?: string | null
}

interface ProcurementLot {
  id: string
  number: string
  title: string
  description: string | null
  status: 'draft' | 'submitted' | 'ordered' | 'completed' | 'cancelled'
  createdBy: string
  createdAt: string
  updatedAt: string
  creator: { id: string; name: string; role: string } | null
  items: LotItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(price) + ' ₽'
}

// ─── Status config ───────────────────────────────────────────────────────────

const LOT_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  submitted: 'bg-amber-100 text-amber-700 border-amber-200',
  ordered: 'bg-sky-100 text-sky-700 border-sky-200',
  completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-100 text-slate-400 border-slate-200 line-through',
}

const LOT_STATUS_LABELS: Record<string, string> = {
  draft: 'Черновик',
  submitted: 'Отправлен',
  ordered: 'Заказан',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Критично',
  additional: 'Дополнительно',
  planned: 'Плановое',
  emergency: 'Аварийное',
}

function LotStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={LOT_STATUS_STYLES[status] || ''}>
      {LOT_STATUS_LABELS[status] || status}
    </Badge>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProcurementTab() {

  // ── Consolidated state ──
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedItem[]>([])
  const [consolidatedStats, setConsolidatedStats] = useState<ConsolidatedStats>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    linkedToCatalog: 0,
    notLinkedToCatalog: 0,
  })
  const [consolidatedLoading, setConsolidatedLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [catalogFilter, setCatalogFilter] = useState<'all' | 'linked' | 'not_linked'>('all')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // ── Lots state ──
  const [lots, setLots] = useState<ProcurementLot[]>([])
  const [lotsLoading, setLotsLoading] = useState(true)
  const [lotsStatusFilter, setLotsStatusFilter] = useState<string>('all')

  // ── Create lot dialog ──
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createSubmitting, setCreateSubmitting] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [createItems, setCreateItems] = useState<
    Array<{ articleNumber: string; name: string; unit: string; quantity: number; unitPrice: number | null; notes: string; sources: SourceItem[] }>
  >([])

  // ── Lot detail dialog ──
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [detailLot, setDetailLot] = useState<ProcurementLot | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailExpanded, setDetailExpanded] = useState<Set<string>>(new Set())

  // ── Edit lot dialog ──
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editLotId, setEditLotId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editItems, setEditItems] = useState<
    Array<{ articleNumber: string; name: string; unit: string; quantity: number; unitPrice: number | null; notes: string; sources: SourceItem[] }>
  >([])

  // ── Delete confirmation ──
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLot, setDeleteLot] = useState<ProcurementLot | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // ── Status change action ──
  const [statusChanging, setStatusChanging] = useState<string | null>(null)

  // ─── Unique departments ─────────────────────────────────────────────────────

  const departments = useMemo(() => {
    const deptMap = new Map<string, string>()
    for (const item of consolidatedData) {
      for (const src of item.sources) {
        if (src.departmentId && src.departmentName) {
          deptMap.set(src.departmentId, src.departmentName)
        }
      }
    }
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name))
  }, [consolidatedData])

  // ─── Filtered consolidated items ──────────────────────────────────────────

  const filteredConsolidated = useMemo(() => {
    return consolidatedData.filter((item) => {
      // Search filter
      if (search) {
        const q = search.toLowerCase()
        if (
          !item.articleNumber.toLowerCase().includes(q) &&
          !item.name.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      // Department filter
      if (departmentFilter !== 'all') {
        const hasDept = item.sources.some((s) => s.departmentId === departmentFilter)
        if (!hasDept) return false
      }
      // Catalog link filter
      if (catalogFilter === 'linked' && !item.sparePartId) return false
      if (catalogFilter === 'not_linked' && item.sparePartId) return false
      return true
    })
  }, [consolidatedData, search, departmentFilter, catalogFilter])

  // ─── Selection summary ─────────────────────────────────────────────────────

  const selectionSummary = useMemo(() => {
    let totalQty = 0
    let totalValue = 0
    for (const id of selectedRows) {
      const item = consolidatedData.find((c) => c.articleNumber === id)
      if (item) {
        totalQty += item.totalQuantity
        totalValue += item.totalPrice
      }
    }
    return { count: selectedRows.size, totalQty, totalValue }
  }, [selectedRows, consolidatedData])

  // ─── Fetch consolidated ────────────────────────────────────────────────────

  const fetchConsolidated = useCallback(async () => {
    setConsolidatedLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (departmentFilter !== 'all') params.set('departmentId', departmentFilter)
      const res = await fetch(`/api/zip-requests/consolidated?${params}`)
      if (res.ok) {
        const data: ConsolidatedResponse = await res.json()
        setConsolidatedData(data.consolidated || [])
        setConsolidatedStats(data.stats || { totalItems: 0, totalQuantity: 0, totalValue: 0, linkedToCatalog: 0, notLinkedToCatalog: 0 })
      } else {
        toast.error('Не удалось загрузить сводную таблицу')
      }
    } catch {
      toast.error('Ошибка сети при загрузке сводной таблицы')
    } finally {
      setConsolidatedLoading(false)
    }
  }, [search, departmentFilter])

  useEffect(() => {
    const timer = setTimeout(() => fetchConsolidated(), 300)
    return () => clearTimeout(timer)
  }, [fetchConsolidated])

  // ─── Fetch lots ────────────────────────────────────────────────────────────

  const fetchLots = useCallback(async () => {
    setLotsLoading(true)
    try {
      const params = new URLSearchParams()
      if (lotsStatusFilter !== 'all') params.set('status', lotsStatusFilter)
      const res = await fetch(`/api/procurement/lots?${params}`)
      if (res.ok) {
        const data = await res.json()
        setLots(
          (data.lots || []).map((lot: ProcurementLot) => ({
            ...lot,
            items: (lot.items || []).map((item: LotItem) => ({
              ...item,
              sources: item.sourceData ? JSON.parse(item.sourceData) : item.sources || [],
            })),
          })),
        )
      } else {
        toast.error('Не удалось загрузить закупочные лоты')
      }
    } catch {
      toast.error('Ошибка сети при загрузке лотов')
    } finally {
      setLotsLoading(false)
    }
  }, [lotsStatusFilter])

  useEffect(() => {
    fetchLots()
  }, [fetchLots])

  // ─── Row selection ──────────────────────────────────────────────────────────

  const toggleRow = (articleNumber: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(articleNumber)) next.delete(articleNumber)
      else next.add(articleNumber)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedRows.size === filteredConsolidated.length && filteredConsolidated.length > 0) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredConsolidated.map((c) => c.articleNumber)))
    }
  }

  const clearSelection = () => setSelectedRows(new Set())

  // ─── Expand row ─────────────────────────────────────────────────────────────

  const toggleExpand = (articleNumber: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(articleNumber)) next.delete(articleNumber)
      else next.add(articleNumber)
      return next
    })
  }

  // ─── Create lot ────────────────────────────────────────────────────────────

  const handleOpenCreateDialog = () => {
    const items = consolidatedData
      .filter((c) => selectedRows.has(c.articleNumber))
      .map((c) => ({
        articleNumber: c.articleNumber,
        name: c.name,
        unit: c.unit,
        quantity: c.totalQuantity,
        unitPrice: c.unitPrice || null,
        notes: '',
        sources: c.sources,
      }))
    if (items.length === 0) {
      toast.error('Выберите хотя бы одну позицию')
      return
    }
    setCreateItems(items)
    setCreateTitle('')
    setCreateDescription('')
    setCreateDialogOpen(true)
  }

  const handleCreateSubmit = async () => {
    if (!createTitle.trim()) {
      toast.error('Укажите название лота')
      return
    }
    if (createItems.length === 0) {
      toast.error('Добавьте хотя бы одну позицию')
      return
    }
    setCreateSubmitting(true)
    try {
      const res = await fetch('/api/procurement/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: createTitle.trim(),
          description: createDescription.trim() || undefined,
          items: createItems.map((item) => ({
            articleNumber: item.articleNumber,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || undefined,
            sources: item.sources,
          })),
        }),
      })
      if (res.ok) {
        toast.success('Лот успешно создан')
        setCreateDialogOpen(false)
        setCreateTitle('')
        setCreateDescription('')
        setCreateItems([])
        clearSelection()
        fetchLots()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при создании лота')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setCreateSubmitting(false)
    }
  }

  const updateCreateItemQty = (idx: number, qty: number) => {
    setCreateItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.max(1, qty) } : item)),
    )
  }

  const updateCreateItemNotes = (idx: number, notes: string) => {
    setCreateItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, notes } : item)),
    )
  }

  const removeCreateItem = (idx: number) => {
    setCreateItems((prev) => prev.filter((_, i) => i !== idx))
  }

  // ─── Lot detail ────────────────────────────────────────────────────────────

  const handleViewLot = async (lot: ProcurementLot) => {
    setDetailDialogOpen(true)
    setDetailLoading(true)
    setDetailLot(null)
    setDetailExpanded(new Set())
    try {
      const res = await fetch(`/api/procurement/lots/${lot.id}`)
      if (res.ok) {
        const data = await res.json()
        setDetailLot(data.lot)
      } else {
        toast.error('Не удалось загрузить детали лота')
        setDetailDialogOpen(false)
      }
    } catch {
      toast.error('Ошибка сети')
      setDetailDialogOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const toggleDetailExpand = (itemId: string) => {
    setDetailExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  // ─── Status change ──────────────────────────────────────────────────────────

  const handleStatusChange = async (lot: ProcurementLot, newStatus: string) => {
    setStatusChanging(lot.id)
    try {
      const res = await fetch(`/api/procurement/lots/${lot.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const statusLabel = LOT_STATUS_LABELS[newStatus] || newStatus
        toast.success(`Статус лота изменён на «${statusLabel}»`)
        fetchLots()
        // Refresh detail if open
        if (detailDialogOpen && detailLot?.id === lot.id) {
          const detailRes = await fetch(`/api/procurement/lots/${lot.id}`)
          if (detailRes.ok) {
            const data = await detailRes.json()
            setDetailLot(data.lot)
          }
        }
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

  // ─── Edit lot ──────────────────────────────────────────────────────────────

  const handleOpenEdit = (lot: ProcurementLot) => {
    setEditLotId(lot.id)
    setEditTitle(lot.title)
    setEditDescription(lot.description || '')
    setEditItems(
      (lot.items || []).map((item) => ({
        articleNumber: item.articleNumber,
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        notes: item.notes || '',
        sources: item.sources || [],
      })),
    )
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editTitle.trim() || !editLotId) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/procurement/lots/${editLotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          items: editItems.map((item) => ({
            articleNumber: item.articleNumber,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || undefined,
            sources: item.sources,
          })),
        }),
      })
      if (res.ok) {
        toast.success('Лот успешно обновлён')
        setEditDialogOpen(false)
        setEditLotId(null)
        fetchLots()
        if (detailDialogOpen && detailLot?.id === editLotId) {
          const detailRes = await fetch(`/api/procurement/lots/${editLotId}`)
          if (detailRes.ok) {
            const data = await detailRes.json()
            setDetailLot(data.lot)
          }
        }
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при обновлении лота')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setEditSubmitting(false)
    }
  }

  const updateEditItemQty = (idx: number, qty: number) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, quantity: Math.max(1, qty) } : item)),
    )
  }

  const updateEditItemNotes = (idx: number, notes: string) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, notes } : item)),
    )
  }

  const removeEditItem = (idx: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== idx))
  }

  // ─── Delete lot ────────────────────────────────────────────────────────────

  const handleDeleteOpen = (lot: ProcurementLot) => {
    setDeleteLot(lot)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteLot) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/procurement/lots/${deleteLot.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Лот удалён')
        setDeleteDialogOpen(false)
        setDeleteLot(null)
        if (detailDialogOpen && detailLot?.id === deleteLot.id) {
          setDetailDialogOpen(false)
          setDetailLot(null)
        }
        fetchLots()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при удалении лота')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // ─── Get next valid status transitions ─────────────────────────────────────

  function getNextTransitions(currentStatus: string): Array<{ value: string; label: string; icon: typeof ArrowRight }> {
    switch (currentStatus) {
      case 'draft':
        return [
          { value: 'submitted', label: 'Отправить', icon: Send },
          { value: 'cancelled', label: 'Отменить', icon: X },
        ]
      case 'submitted':
        return [
          { value: 'ordered', label: 'Отметить заказанным', icon: ShoppingCart },
          { value: 'cancelled', label: 'Отменить', icon: X },
        ]
      case 'ordered':
        return [
          { value: 'completed', label: 'Отметить завершённым', icon: CheckCircle2 },
        ]
      default:
        return []
    }
  }

  // ─── Stats cards ───────────────────────────────────────────────────────────

  const statsCards = [
    { title: 'Позиций', value: consolidatedStats.totalItems, icon: Package, color: 'text-orange-600', bg: 'bg-orange-50' },
    { title: 'Общее кол-во', value: consolidatedStats.totalQuantity, icon: Layers, color: 'text-sky-600', bg: 'bg-sky-50' },
    { title: 'Общая стоимость', value: consolidatedStats.totalValue, icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', format: true },
    { title: 'В каталоге', value: consolidatedStats.linkedToCatalog, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50', subValue: consolidatedStats.notLinkedToCatalog, subLabel: 'не привязано' },
  ]

  // ─── Lot status filter counts ───────────────────────────────────────────────

  const allLotsForCounts = useMemo(() => {
    // We use lots loaded for current filter; we could do a separate fetch for all but keep it simple
    return lots
  }, [lots])

  const lotStatusTabs = [
    { value: 'all', label: 'Все' },
    { value: 'draft', label: 'Черновики' },
    { value: 'submitted', label: 'Отправленные' },
    { value: 'ordered', label: 'Заказанные' },
    { value: 'completed', label: 'Завершённые' },
  ]

  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Закупки</h1>
        <p className="text-sm text-muted-foreground">
          Рабочее место закупщика: сводная потребность и формирование закупочных лотов
        </p>
      </div>

      <Tabs defaultValue="consolidated" className="space-y-6">
        <TabsList>
          <TabsTrigger value="consolidated" className="gap-1.5">
            <ClipboardPaste className="size-4" />
            Сводная таблица
          </TabsTrigger>
          <TabsTrigger value="lots" className="gap-1.5">
            <ShoppingCart className="size-4" />
            Закупочные лоты
          </TabsTrigger>
        </TabsList>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* TAB 1: Consolidated Demand Table */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <TabsContent value="consolidated" className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {statsCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`flex size-12 items-center justify-center rounded-lg ${stat.bg}`}>
                      <Icon className={`size-6 ${stat.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold truncate">
                        {stat.format ? formatPrice(stat.value) : stat.value}
                      </p>
                      {stat.subValue != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {stat.subValue} {stat.subLabel}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Filter bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по ОЗМ или наименованию..."
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="size-4 mr-1 shrink-0" />
                  <SelectValue placeholder="Подразделение" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все подразделения</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogFilter} onValueChange={(v) => setCatalogFilter(v as typeof catalogFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Каталог" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все позиции</SelectItem>
                  <SelectItem value="linked">Привязаны к каталогу</SelectItem>
                  <SelectItem value="not_linked">Без привязки</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 w-10">
                        <Checkbox
                          checked={filteredConsolidated.length > 0 && selectedRows.size === filteredConsolidated.length}
                          onCheckedChange={toggleAll}
                        />
                      </TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>ОЗМ</TableHead>
                      <TableHead>Наименование</TableHead>
                      <TableHead className="text-center">Ед.</TableHead>
                      <TableHead className="text-right">Кол-во</TableHead>
                      <TableHead className="text-center">Заявок</TableHead>
                      <TableHead className="text-right">Цена за ед.</TableHead>
                      <TableHead className="text-right">Сумма</TableHead>
                      <TableHead className="text-right pr-6">На складе</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consolidatedLoading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j} className={j === 7 ? 'pr-6 text-right' : ''}>
                              <Skeleton className="h-5 w-20" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredConsolidated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-64 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="size-12 text-muted-foreground/40" />
                            <p className="text-muted-foreground text-sm max-w-md">
                              {search || departmentFilter !== 'all' || catalogFilter !== 'all'
                                ? 'Позиции по заданным фильтрам не найдены.'
                                : 'Нет одобренных заявок для формирования закупочной потребности.'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredConsolidated.map((item) => {
                        const isExpanded = expandedRows.has(item.articleNumber)
                        const isSelected = selectedRows.has(item.articleNumber)
                        const isLowStock = item.currentStock != null && item.currentStock < item.totalQuantity

                        return (
                          <ConsolidatedRow
                            key={item.articleNumber}
                            item={item}
                            isExpanded={isExpanded}
                            isSelected={isSelected}
                            isLowStock={isLowStock}
                            onToggleExpand={() => toggleExpand(item.articleNumber)}
                            onToggleSelect={() => toggleRow(item.articleNumber)}
                          />
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Floating selection action bar */}
          {selectedRows.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between gap-4 px-6 py-3 max-w-screen-2xl mx-auto">
                <p className="text-sm font-medium">
                  Выбрано: <span className="text-orange-600 font-bold">{selectionSummary.count}</span> поз.,{' '}
                  <span className="font-bold">{selectionSummary.totalQty}</span> шт. на сумму{' '}
                  <span className="font-bold">{formatPrice(selectionSummary.totalValue)}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Снять выделение
                  </Button>
                  <Button
                    size="sm"
                    className="gap-1.5 bg-orange-600 hover:bg-orange-700"
                    onClick={handleOpenCreateDialog}
                  >
                    <Plus className="size-4" />
                    Создать лот
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ──────────────────────────────────────────────────────────────────── */}
        {/* TAB 2: Procurement Lots */}
        {/* ──────────────────────────────────────────────────────────────────── */}
        <TabsContent value="lots" className="space-y-6">
          {/* Status filter tabs */}
          <div className="flex flex-wrap gap-2">
            {lotStatusTabs.map((tab) => (
              <Button
                key={tab.value}
                variant={lotsStatusFilter === tab.value ? 'default' : 'outline'}
                size="sm"
                className={
                  lotsStatusFilter === tab.value
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : ''
                }
                onClick={() => setLotsStatusFilter(tab.value)}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Lots cards */}
          {lotsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-60" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-24" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : lots.length === 0 ? (
            <Card>
              <CardContent className="py-16">
                <div className="flex flex-col items-center gap-3">
                  <ShoppingCart className="size-12 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">
                    {lotsStatusFilter !== 'all'
                      ? `Лоты со статусом «${LOT_STATUS_LABELS[lotsStatusFilter] || lotsStatusFilter}» не найдены.`
                      : 'Закупочные лоты пока не созданы. Перейдите на вкладку «Сводная таблица», выберите позиции и создайте лот.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lots.map((lot) => {
                const totalQty = lot.items.reduce((sum, item) => sum + item.quantity, 0)
                const totalValue = lot.items.reduce(
                  (sum, item) => sum + (item.unitPrice != null ? item.unitPrice * item.quantity : 0),
                  0,
                )
                const canEdit = lot.status === 'draft'
                const canDelete = lot.status === 'draft' || lot.status === 'submitted'

                return (
                  <Card key={lot.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-sm font-semibold truncate">
                            <span className="font-mono text-orange-600">{lot.number}</span>
                          </CardTitle>
                          <p className="text-sm font-medium mt-1 truncate">{lot.title}</p>
                        </div>
                        <LotStatusBadge status={lot.status} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      {lot.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{lot.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatDate(lot.createdAt)}
                        </span>
                        {lot.creator && <span>{lot.creator.name}</span>}
                      </div>
                      <Separator />
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground text-xs">Позиций:</span>{' '}
                          <span className="font-semibold">{lot.items.length}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Кол-во:</span>{' '}
                          <span className="font-semibold">{totalQty}</span>{' '}
                          <span className="text-muted-foreground text-xs">шт.</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-xs">Сумма:</span>{' '}
                          <span className="font-semibold">{formatPrice(totalValue)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleViewLot(lot)}>
                          <Eye className="size-3.5" />
                          Просмотр
                        </Button>
                        {canEdit && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleOpenEdit(lot)}>
                            <Pencil className="size-3.5" />
                            Редактировать
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteOpen(lot)}
                          >
                            <Trash2 className="size-3.5" />
                            Удалить
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Create Lot Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDialogOpen(false)
            setCreateTitle('')
            setCreateDescription('')
            setCreateItems([])
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать закупочный лот</DialogTitle>
            <DialogDescription>
              Заполните название и проверьте список позиций для нового лота закупки
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="create-lot-title">Название лота *</Label>
              <Input
                id="create-lot-title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Например: Подшипники качения февраль 2026"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-lot-desc">Описание</Label>
              <Textarea
                id="create-lot-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Дополнительные сведения о лоте..."
                rows={2}
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">
                Позиции ({createItems.length})
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {createItems.map((item, idx) => (
                  <Card key={item.articleNumber + idx} className="p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          <span className="font-mono text-orange-600">{item.articleNumber}</span>
                          {' — '}
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sources.length} заяв(ок) ·{' '}
                          {formatPrice(item.unitPrice != null ? item.unitPrice * item.quantity : null)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Кол-во:</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateCreateItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeCreateItem(idx)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Примечание к позиции..."
                        value={item.notes}
                        onChange={(e) => updateCreateItemNotes(idx, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createSubmitting || !createTitle.trim() || createItems.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Создать лот
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Lot Detail Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={detailDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDetailDialogOpen(false)
            setDetailLot(null)
            setDetailExpanded(new Set())
          }
        }}
      >
        <DialogContent className="sm:max-w-[780px] max-h-[85vh] overflow-y-auto">
          {detailLoading ? (
            <>
              <DialogHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </DialogHeader>
              <div className="space-y-4 py-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </>
          ) : detailLot ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 flex-wrap">
                  <DialogTitle className="text-base">
                    <span className="font-mono text-orange-600">{detailLot.number}</span>
                    {' — '}
                    {detailLot.title}
                  </DialogTitle>
                  <LotStatusBadge status={detailLot.status} />
                </div>
                <DialogDescription className="flex items-center gap-3 flex-wrap pt-1 text-xs text-muted-foreground">
                  <span>{detailLot.creator?.name || '—'}</span>
                  <span>Создан: {formatDate(detailLot.createdAt)}</span>
                  {detailLot.updatedAt && <span>Обновлён: {formatDate(detailLot.updatedAt)}</span>}
                </DialogDescription>
              </DialogHeader>

              {detailLot.description && (
                <p className="text-sm text-muted-foreground">{detailLot.description}</p>
              )}

              <Separator />

              {/* Status transition buttons */}
              {detailLot.status !== 'cancelled' && detailLot.status !== 'completed' && (
                <div className="flex flex-wrap gap-2">
                  {getNextTransitions(detailLot.status).map((transition) => {
                    const Icon = transition.icon
                    const isChanging = statusChanging === detailLot.id
                    return (
                      <Button
                        key={transition.value}
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isChanging}
                        onClick={() => handleStatusChange(detailLot, transition.value)}
                      >
                        {isChanging ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                        {transition.label}
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Items table */}
              <div>
                <p className="text-sm font-medium mb-2">
                  Позиции ({detailLot.items.length})
                </p>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-8"></TableHead>
                        <TableHead>ОЗМ</TableHead>
                        <TableHead>Наименование</TableHead>
                        <TableHead className="text-center">Ед.</TableHead>
                        <TableHead className="text-right">Кол-во</TableHead>
                        <TableHead className="text-right">Цена</TableHead>
                        <TableHead className="text-right pr-6">Сумма</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailLot.items.map((item) => {
                        const itemId = item.id || item.articleNumber
                        const isExpanded = detailExpanded.has(itemId)
                        return (
                          <LotDetailRow
                            key={itemId}
                            item={item}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleDetailExpand(itemId)}
                          />
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Edit Lot Dialog */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditDialogOpen(false)
            setEditLotId(null)
            setEditTitle('')
            setEditDescription('')
            setEditItems([])
          }
        }}
      >
        <DialogContent className="sm:max-w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать лот</DialogTitle>
            <DialogDescription>
              Измените название, описание или состав позиций лота
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-lot-title">Название лота *</Label>
              <Input
                id="edit-lot-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lot-desc">Описание</Label>
              <Textarea
                id="edit-lot-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium mb-3">
                Позиции ({editItems.length})
              </p>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {editItems.map((item, idx) => (
                  <Card key={item.articleNumber + idx} className="p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">
                          <span className="font-mono text-orange-600">{item.articleNumber}</span>
                          {' — '}
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.sources.length} заяв(ок) ·{' '}
                          {formatPrice(item.unitPrice != null ? item.unitPrice * item.quantity : null)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Кол-во:</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateEditItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive shrink-0"
                          onClick={() => removeEditItem(idx)}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Примечание к позиции..."
                        value={item.notes}
                        onChange={(e) => updateEditItemNotes(idx, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={editSubmitting || !editTitle.trim() || editItems.length === 0}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {editSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Delete Confirmation */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialogOpen(false)
            setDeleteLot(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить закупочный лот?</AlertDialogTitle>
            <AlertDialogDescription>
              Лот <span className="font-mono font-semibold text-foreground">{deleteLot?.number}</span> «{deleteLot?.title}»
              будет удалён без возможности восстановления.
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

// ═══════════════════════════════════════════════════════════════════════════════
// Consolidated Row Sub-Component
// ═══════════════════════════════════════════════════════════════════════════════

function ConsolidatedRow({
  item,
  isExpanded,
  isSelected,
  isLowStock,
  onToggleExpand,
  onToggleSelect,
}: {
  item: ConsolidatedItem
  isExpanded: boolean
  isSelected: boolean
  isLowStock: boolean
  onToggleExpand: () => void
  onToggleSelect: () => void
}) {
  return (
    <>
      <TableRow
        className={isSelected ? 'bg-orange-50/50' : ''}
      >
        <TableCell className="pl-6">
          <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} />
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="icon" className="size-7" onClick={onToggleExpand}>
            {isExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">{item.articleNumber}</TableCell>
        <TableCell className="text-sm max-w-[200px] truncate" title={item.name}>
          {item.name}
        </TableCell>
        <TableCell className="text-sm text-center">{item.unit}</TableCell>
        <TableCell className="text-sm text-right font-bold">{item.totalQuantity}</TableCell>
        <TableCell className="text-center">
          <Badge variant="secondary" className="text-xs">
            {item.requestCount}
          </Badge>
        </TableCell>
        <TableCell className="text-sm text-right">{formatPrice(item.unitPrice || null)}</TableCell>
        <TableCell className="text-sm text-right font-medium">{formatPrice(item.totalPrice)}</TableCell>
        <TableCell className="text-sm text-right pr-6">
          {isLowStock ? (
            <span className="flex items-center justify-end gap-1 text-amber-600">
              <AlertTriangle className="size-3.5" />
              {item.currentStock}
            </span>
          ) : (
            <span className="text-muted-foreground">{item.currentStock ?? '—'}</span>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded sources */}
      {isExpanded &&
        item.sources.map((src) => (
          <TableRow key={src.zipRequestId + src.itemId} className="bg-muted/30">
            <TableCell />
            <TableCell />
            <TableCell colSpan={1} className="py-2">
              <span className="text-xs font-mono text-orange-600">{src.zipRequestNumber}</span>
            </TableCell>
            <TableCell colSpan={2} className="text-xs text-muted-foreground py-2">
              <span>{src.applicantName}</span>
              {src.departmentName && (
                <span className="ml-2">· {src.departmentName}</span>
              )}
            </TableCell>
            <TableCell className="text-xs text-right font-medium py-2">{src.quantity} {src.unit}</TableCell>
            <TableCell className="text-center py-2">
              <Badge
                variant="outline"
                className={
                  src.zipRequestPriority === 'critical'
                    ? 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                    : src.zipRequestPriority === 'emergency'
                      ? 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                      : src.zipRequestPriority === 'additional'
                        ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px]'
                        : 'bg-slate-100 text-slate-600 border-slate-200 text-[10px]'
                }
              >
                {PRIORITY_LABELS[src.zipRequestPriority] || src.zipRequestPriority}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground py-2">
              {formatPrice(src.unitPrice || null)}
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground py-2" colSpan={2}>
              {src.zipRequestNeededBy ? formatDate(src.zipRequestNeededBy) : '—'}
            </TableCell>
          </TableRow>
        ))}
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Lot Detail Row Sub-Component
// ═══════════════════════════════════════════════════════════════════════════════

function LotDetailRow({
  item,
  isExpanded,
  onToggleExpand,
}: {
  item: LotItem
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const itemId = item.id || item.articleNumber
  const lineTotal = item.unitPrice != null ? item.unitPrice * item.quantity : null

  return (
    <>
      <TableRow>
        <TableCell>
          {item.sources.length > 0 && (
            <Button variant="ghost" size="icon" className="size-7" onClick={onToggleExpand}>
              {isExpanded ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
            </Button>
          )}
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">{item.articleNumber}</TableCell>
        <TableCell className="text-sm">{item.name}</TableCell>
        <TableCell className="text-sm text-center">{item.unit}</TableCell>
        <TableCell className="text-sm text-right font-bold">{item.quantity}</TableCell>
        <TableCell className="text-sm text-right">{formatPrice(item.unitPrice)}</TableCell>
        <TableCell className="text-sm text-right font-medium pr-6">{formatPrice(lineTotal)}</TableCell>
      </TableRow>
      {isExpanded &&
        item.sources.map((src) => (
          <TableRow key={src.zipRequestId + src.itemId} className="bg-muted/30">
            <TableCell />
            <TableCell colSpan={1} className="py-2">
              <span className="text-xs font-mono text-orange-600">{src.zipRequestNumber}</span>
            </TableCell>
            <TableCell colSpan={2} className="text-xs text-muted-foreground py-2">
              <span>{src.applicantName}</span>
              {src.departmentName && <span className="ml-2">· {src.departmentName}</span>}
            </TableCell>
            <TableCell className="text-xs text-right font-medium py-2">{src.quantity} {src.unit}</TableCell>
            <TableCell className="text-center py-2">
              <Badge
                variant="outline"
                className={
                  src.zipRequestPriority === 'critical'
                    ? 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                    : src.zipRequestPriority === 'emergency'
                      ? 'bg-red-100 text-red-700 border-red-200 text-[10px]'
                      : src.zipRequestPriority === 'additional'
                        ? 'bg-amber-100 text-amber-700 border-amber-200 text-[10px]'
                        : 'bg-slate-100 text-slate-600 border-slate-200 text-[10px]'
                }
              >
                {PRIORITY_LABELS[src.zipRequestPriority] || src.zipRequestPriority}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground py-2" colSpan={2}>
              {src.zipRequestNeededBy ? formatDate(src.zipRequestNeededBy) : '—'}
            </TableCell>
          </TableRow>
        ))}
      {item.notes && (
        <TableRow className="bg-muted/20">
          <TableCell colSpan={7} className="text-xs text-muted-foreground italic pl-10 pr-6">
            📝 {item.notes}
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
