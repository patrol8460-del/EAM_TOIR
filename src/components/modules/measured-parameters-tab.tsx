'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus, Trash2, ChevronDown, ChevronUp, TrendingUp,
  CheckCircle2, XCircle, Loader2, Search, X, BarChart3,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import {
  OKEI_UNITS, OKEI_COMMON_ENGINEERING, type OkeiUnit,
} from '@/lib/okei-units'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'

// Dynamically import recharts to prevent SSR issues
const RechartsChart = dynamic(
  () => import('./recharts-chart'),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-[350px] text-muted-foreground"><span>Загрузка графика…</span></div> },
)

// ===================== TYPES =====================

interface MeasurementRecord {
  id: string
  parameterId: string
  measuredValue: number
  measuredDate: string
  operatorName: string
  notes?: string | null
  createdAt: string
  deviation?: number
  isInTolerance?: boolean
}

interface MeasuredParameter {
  id: string
  equipmentId: string
  name: string
  unitOkei?: string | null
  unitSymbol?: string | null
  refValue?: number | null
  toleranceMin?: number | null
  toleranceMax?: number | null
  description?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  records: MeasurementRecord[]
}

interface MeasuredParametersTabProps {
  equipmentId: string
}

interface NewRecordForm {
  parameterId: string
  measuredValue: string
  measuredDate: string
  operatorName: string
  notes: string
}

interface NewParamForm {
  name: string
  unitOkei: string
  unitSymbol: string
  refValue: string
  toleranceMin: string
  toleranceMax: string
  description: string
}

// ===================== HELPERS =====================

function computeDeviation(measured: number, ref: number): number {
  if (ref === 0) return 0
  return ((measured - ref) / ref) * 100
}

function computeIsInTolerance(deviation: number, tolMin: number | null | undefined, tolMax: number | null | undefined): boolean {
  const min = tolMin ?? -Infinity
  const max = tolMax ?? Infinity
  return deviation >= min && deviation <= max
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      return `${parts[2]}.${parts[1]}.${parts[0]}`
    }
    return dateStr
  } catch { return dateStr }
}

function todayStr(): string {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function enrichRecords(records: MeasurementRecord[], p: MeasuredParameter): MeasurementRecord[] {
  if (p.refValue == null) return records
  return records.map((r) => ({
    ...r,
    deviation: computeDeviation(r.measuredValue, p.refValue!),
    isInTolerance: computeIsInTolerance(
      computeDeviation(r.measuredValue, p.refValue!),
      p.toleranceMin,
      p.toleranceMax,
    ),
  }))
}

// Safe Math.min/max for arrays
function safeMin(arr: number[]): number {
  if (arr.length === 0) return 0
  return Math.min(...arr)
}
function safeMax(arr: number[]): number {
  if (arr.length === 0) return 1
  return Math.max(...arr)
}

// ===================== OKEI COMBOBOX =====================

function OkeiCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (unit: OkeiUnit | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const allFiltered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return OKEI_COMMON_ENGINEERING
    return OKEI_UNITS.filter(
      (u) =>
        u.nationalSymbol.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.code.includes(q),
    ).slice(0, 50)
  }, [search])

  const selectedUnit = useMemo(() => {
    if (!value) return null
    return OKEI_UNITS.find((u) => u.nationalSymbol === value || u.code === value) ?? null
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start text-sm font-normal"
        >
          {selectedUnit ? (
            <span>{selectedUnit.nationalSymbol} — {selectedUnit.name} ({selectedUnit.code})</span>
          ) : (
            <span className="text-muted-foreground">Выберите единицу измерения…</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Поиск (мм, кг, Па…)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-sm"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {allFiltered.map((unit) => (
            <button
              key={unit.code}
              type="button"
              className="w-full text-left px-2 py-1.5 rounded-sm text-sm hover:bg-accent transition-colors flex items-center gap-2"
              onClick={() => {
                onChange(unit)
                setOpen(false)
                setSearch('')
              }}
            >
              <span className="font-medium shrink-0">{unit.nationalSymbol}</span>
              <span className="text-muted-foreground truncate">— {unit.name}</span>
              <span className="ml-auto text-xs text-muted-foreground shrink-0">({unit.code})</span>
            </button>
          ))}
          {allFiltered.length === 0 && (
            <p className="text-sm text-muted-foreground px-2 py-3 text-center">Ничего не найдено</p>
          )}
        </div>
        {!search && (
          <div className="p-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Показаны распространённые единицы. Введите запрос для поиска среди 595 единиц ОКЕИ.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ===================== MINI SPARKLINE (SVG-based, no recharts) =====================

function MiniSparkline({
  records,
  isOk,
  onClick,
}: {
  records: MeasurementRecord[]
  isOk: boolean
  onClick: () => void
}) {
  const sorted = useMemo(
    () => [...records].sort((a, b) => a.measuredDate.localeCompare(b.measuredDate)),
    [records],
  )

  if (sorted.length < 2) return null

  const values = sorted.map((r) => r.measuredValue)
  const min = safeMin(values)
  const max = safeMax(values)
  const range = max - min || 1
  const w = 160
  const h = 40
  const pad = 2

  const points = sorted.map((r, i) => {
    const x = pad + (i / (sorted.length - 1)) * (w - 2 * pad)
    const y = pad + (1 - (r.measuredValue - min) / range) * (h - 2 * pad)
    return `${x},${y}`
  }).join(' ')

  const color = isOk ? '#10B981' : '#EF4444'
  const fillColor = isOk ? '#d1fae5' : '#fee2e2'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border p-2 transition-colors cursor-pointer hover:ring-2 hover:ring-ring/30 ${
        isOk ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'
      }`}
    >
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none" style={{ height: 48 }}>
        <polygon
          points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
          fill={fillColor}
          opacity={0.6}
        />
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        {sorted.length} замер{sorted.length === 1 ? '' : sorted.length < 5 ? 'а' : 'ов'}
      </p>
    </button>
  )
}

// ===================== FULL CHART DIALOG =====================

function FullChartDialog({
  parameter,
  open,
  onOpenChange,
}: {
  parameter: MeasuredParameter | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const sorted = useMemo(
    () => parameter && open
      ? enrichRecords(
          [...parameter.records].sort((a, b) => a.measuredDate.localeCompare(b.measuredDate)),
          parameter,
        )
      : [],
    [parameter, open],
  )

  const refValue = parameter?.refValue ?? null
  const toleranceMin = parameter?.toleranceMin ?? null
  const toleranceMax = parameter?.toleranceMax ?? null
  const unitSymbol = parameter?.unitSymbol ?? null
  const paramName = parameter?.name ?? ''

  if (!parameter || !open || sorted.length === 0) return null

  // Calculate Y axis bounds
  const allValues = sorted.map((r) => r.measuredValue)
  let yMin = safeMin(allValues)
  let yMax = safeMax(allValues)

  const lowerLimit = refValue != null && toleranceMin != null ? refValue * (1 + toleranceMin / 100) : null
  const upperLimit = refValue != null && toleranceMax != null ? refValue * (1 + toleranceMax / 100) : null

  if (refValue != null) {
    yMin = Math.min(yMin, refValue)
    yMax = Math.max(yMax, refValue)
  }
  if (lowerLimit != null) yMin = Math.min(yMin, lowerLimit)
  if (upperLimit != null) yMax = Math.max(yMax, upperLimit)

  const yPadding = (yMax - yMin) * 0.15 || 1
  yMin -= yPadding
  yMax += yPadding

  const chartProps = {
    data: sorted,
    yMin,
    yMax,
    lowerLimit,
    upperLimit,
    refValue,
    unitSymbol,
    paramName,
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {paramName}
            {unitSymbol && <span className="text-muted-foreground ml-2">({unitSymbol})</span>}
          </DialogTitle>
          <DialogDescription>
            График замеров по времени. Зелёная область — допуск.
          </DialogDescription>
        </DialogHeader>
        <div className="w-full h-[350px] mt-2">
          <RechartsChart {...chartProps} />
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-emerald-500 rounded" />
            <span>Замеры</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 bg-slate-400 rounded" style={{ borderTop: '2px dashed #64748B' }} />
            <span>Номинал</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 bg-emerald-100 rounded-sm border border-emerald-200" />
            <span>Допуск</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>В допуске</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Вне допуска</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===================== PARAMETER CARD =====================

function ParameterCard({
  parameter,
  onAddRecord,
  onDeleteParam,
  onDeleteRecord,
  onOpenChart,
}: {
  parameter: MeasuredParameter
  onAddRecord: (parameterId: string) => void
  onDeleteParam: (id: string) => void
  onDeleteRecord: (id: string) => void
  onOpenChart: (param: MeasuredParameter) => void
}) {
  const [expanded, setExpanded] = useState(false)

  const enrichedRecords = useMemo(
    () => enrichRecords([...parameter.records].sort((a, b) => b.measuredDate.localeCompare(a.measuredDate)), parameter),
    [parameter],
  )

  const lastRecord = enrichedRecords[0]
  const lastIsOk = lastRecord?.isInTolerance !== false

  const tolStr = useMemo(() => {
    const parts: string[] = []
    if (parameter.toleranceMin != null) parts.push(`${parameter.toleranceMin > 0 ? '+' : ''}${parameter.toleranceMin}%`)
    if (parameter.toleranceMax != null) parts.push(`${parameter.toleranceMax > 0 ? '+' : ''}${parameter.toleranceMax}%`)
    return parts.join(' … ')
  }, [parameter.toleranceMin, parameter.toleranceMax])

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header */}
      <div className="px-3 py-2.5 flex items-center gap-3 bg-muted/30">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{parameter.name}</span>
            {parameter.unitSymbol && (
              <Badge variant="outline" className="text-[10px] shrink-0">
                {parameter.unitSymbol}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            {parameter.refValue != null && (
              <span>
                [{tolStr}] {parameter.refValue} {parameter.unitSymbol || ''}
              </span>
            )}
            {lastRecord && (
              <span className={`font-medium ${lastIsOk ? 'text-emerald-600' : 'text-red-600'}`}>
                Последний: {lastRecord.measuredValue} {parameter.unitSymbol || ''}
                {lastRecord.deviation != null && (
                  <span className="ml-1">
                    ({lastRecord.deviation > 0 ? '+' : ''}{lastRecord.deviation.toFixed(1)}%)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lastRecord && (
            lastIsOk
              ? <CheckCircle2 className="size-4 text-emerald-500" />
              : <XCircle className="size-4 text-red-500" />
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs"
            onClick={() => onAddRecord(parameter.id)}
          >
            <Plus className="size-3" />
            Замер
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
            onClick={() => onDeleteParam(parameter.id)}
          >
            <Trash2 className="size-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-purple-500 hover:text-purple-600 hover:bg-purple-50"
            onClick={() => onOpenChart(parameter)}
            title="Показать график"
          >
            <BarChart3 className="size-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>
        </div>
      </div>

      {/* Expanded: history table */}
      {expanded && (
        <div className="border-t">
          {enrichedRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Нет замеров</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Дата</th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Значение</th>
                    <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Отклонение</th>
                    <th className="px-3 py-1.5 text-center font-medium text-muted-foreground">Статус</th>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Оператор</th>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Примечания</th>
                    <th className="px-3 py-1.5 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedRecords.map((r) => {
                    const ok = r.isInTolerance !== false
                    return (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-3 py-1.5 whitespace-nowrap">{fmtDate(r.measuredDate)}</td>
                        <td className="px-3 py-1.5 text-right font-mono">
                          {r.measuredValue}
                          {parameter.unitSymbol ? ` ${parameter.unitSymbol}` : ''}
                        </td>
                        <td className={`px-3 py-1.5 text-right font-mono ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
                          {r.deviation != null ? `${r.deviation > 0 ? '+' : ''}${r.deviation.toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              ok
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-red-100 text-red-700 border-red-200'
                            }`}
                          >
                            {ok ? 'Норма' : 'Вне допуска'}
                          </Badge>
                        </td>
                        <td className="px-3 py-1.5">{r.operatorName}</td>
                        <td className="px-3 py-1.5 text-muted-foreground max-w-[200px] truncate" title={r.notes || ''}>
                          {r.notes || '—'}
                        </td>
                        <td className="px-3 py-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => onDeleteRecord(r.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ===================== MAIN COMPONENT =====================

export default function MeasuredParametersTab({ equipmentId }: MeasuredParametersTabProps) {
  const currentUser = useAuthStore((s) => s.user)
  const [parameters, setParameters] = useState<MeasuredParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddParam, setShowAddParam] = useState(false)
  const [addingRecordForId, setAddingRecordForId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [chartParam, setChartParam] = useState<MeasuredParameter | null>(null)
  const [chartOpen, setChartOpen] = useState(false)

  // Form state for new parameter
  const emptyParamForm: NewParamForm = {
    name: '', unitOkei: '', unitSymbol: '', refValue: '',
    toleranceMin: '', toleranceMax: '', description: '',
  }
  const [paramForm, setParamForm] = useState<NewParamForm>(emptyParamForm)

  // Form state for new record
  const emptyRecordForm: NewRecordForm = {
    parameterId: '', measuredValue: '', measuredDate: todayStr(),
    operatorName: currentUser?.name || '', notes: '',
  }
  const [recordForm, setRecordForm] = useState<NewRecordForm>(emptyRecordForm)

  // Fetch parameters
  const fetchParameters = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/equipment/${equipmentId}/parameters`)
      if (res.ok) {
        const data = await res.json()
        setParameters(data.parameters || [])
      }
    } catch {
      toast.error('Ошибка загрузки параметров')
    } finally {
      setLoading(false)
    }
  }, [equipmentId])

  useEffect(() => {
    fetchParameters()
  }, [fetchParameters])

  // ── Create parameter ──
  const handleCreateParam = async () => {
    if (!paramForm.name.trim()) {
      toast.error('Укажите наименование параметра')
      return
    }
    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        equipmentId,
        name: paramForm.name.trim(),
        sortOrder: parameters.length,
      }
      if (paramForm.unitOkei) body.unitOkei = paramForm.unitOkei
      if (paramForm.unitSymbol) body.unitSymbol = paramForm.unitSymbol
      if (paramForm.refValue) body.refValue = parseFloat(paramForm.refValue)
      if (paramForm.toleranceMin) body.toleranceMin = parseFloat(paramForm.toleranceMin)
      if (paramForm.toleranceMax) body.toleranceMax = parseFloat(paramForm.toleranceMax)
      if (paramForm.description) body.description = paramForm.description.trim()

      const res = await fetch(`/api/equipment/${equipmentId}/parameters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        toast.success('Параметр добавлен')
        setShowAddParam(false)
        setParamForm(emptyParamForm)
        fetchParameters()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при создании')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete parameter ──
  const handleDeleteParam = async (id: string) => {
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/parameters`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success('Параметр удалён')
        fetchParameters()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  // ── Add measurement record ──
  const handleAddRecord = async () => {
    if (!recordForm.measuredValue) {
      toast.error('Укажите значение замера')
      return
    }
    if (!recordForm.operatorName.trim()) {
      toast.error('Укажите ФИО')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/parameters/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameterId: recordForm.parameterId,
          measuredValue: parseFloat(recordForm.measuredValue),
          measuredDate: recordForm.measuredDate,
          operatorName: recordForm.operatorName.trim(),
          notes: recordForm.notes.trim() || undefined,
        }),
      })
      if (res.ok) {
        toast.success('Замер добавлен')
        setAddingRecordForId(null)
        setRecordForm(emptyRecordForm)
        fetchParameters()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при добавлении замера')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  // ── Delete record ──
  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/parameters/records`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success('Запись удалена')
        fetchParameters()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    }
  }

  // ── Open chart dialog ──
  const handleOpenChart = (param: MeasuredParameter) => {
    setChartParam(param)
    setChartOpen(true)
  }

  const sortedParams = useMemo(
    () => [...parameters].sort((a, b) => a.sortOrder - b.sortOrder),
    [parameters],
  )

  // Params with records for right panel
  const paramsWithRecords = useMemo(
    () => sortedParams.filter((p) => p.records.length >= 2),
    [sortedParams],
  )

  // Find parameter being recorded
  const addingParam = useMemo(
    () => parameters.find((p) => p.id === addingRecordForId),
    [parameters, addingRecordForId],
  )

  return (
    <div className="space-y-4">
      {/* Full chart dialog */}
      <FullChartDialog
        parameter={chartParam}
        open={chartOpen}
        onOpenChange={setChartOpen}
      />

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
          <Loader2 className="size-5 animate-spin" />
          <span>Загрузка параметров…</span>
        </div>
      )}

      {!loading && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Замеряемые параметры
            </h3>
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAddParam(!showAddParam)}
            >
              <Plus className="size-3.5" />
              Добавить параметр
            </Button>
          </div>

          {/* New parameter form */}
          {showAddParam && (
            <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
              <h4 className="text-sm font-semibold">Новый параметр</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Наименование *</Label>
                  <Input
                    value={paramForm.name}
                    onChange={(e) => setParamForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Вибрация подшипника"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Единица измерения (ОКЕИ)</Label>
                  <OkeiCombobox
                    value={paramForm.unitSymbol}
                    onChange={(unit) =>
                      setParamForm((f) => ({
                        ...f,
                        unitOkei: unit?.code || '',
                        unitSymbol: unit?.nationalSymbol || '',
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Допуск MIN, %</Label>
                  <Input
                    type="number"
                    value={paramForm.toleranceMin}
                    onChange={(e) => setParamForm((f) => ({ ...f, toleranceMin: e.target.value }))}
                    placeholder="-3"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Референсное значение</Label>
                  <Input
                    type="number"
                    value={paramForm.refValue}
                    onChange={(e) => setParamForm((f) => ({ ...f, refValue: e.target.value }))}
                    placeholder="4.5"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Допуск MAX, %</Label>
                  <Input
                    type="number"
                    value={paramForm.toleranceMax}
                    onChange={(e) => setParamForm((f) => ({ ...f, toleranceMax: e.target.value }))}
                    placeholder="+2"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Описание</Label>
                <Textarea
                  value={paramForm.description}
                  onChange={(e) => setParamForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Необязательное описание параметра"
                  className="text-sm min-h-[60px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleCreateParam}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Создать
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowAddParam(false)
                    setParamForm(emptyParamForm)
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Inline add record form */}
          {addingParam && (
            <div className="border border-dashed rounded-lg p-4 bg-emerald-50/30 space-y-3">
              <h4 className="text-sm font-semibold text-emerald-700">
                Новый замер: {addingParam.name}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Значение *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={recordForm.measuredValue}
                    onChange={(e) => setRecordForm((f) => ({ ...f, measuredValue: e.target.value }))}
                    placeholder="4.5"
                    className="h-9 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Дата *</Label>
                  <Input
                    type="date"
                    value={recordForm.measuredDate}
                    onChange={(e) => setRecordForm((f) => ({ ...f, measuredDate: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">ФИО</Label>
                  <Input
                    value={recordForm.operatorName}
                    onChange={(e) => setRecordForm((f) => ({ ...f, operatorName: e.target.value }))}
                    placeholder="Иванов И.И."
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Примечания</Label>
                  <Input
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Необязательно"
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleAddRecord}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Добавить замер
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingRecordForId(null)
                    setRecordForm(emptyRecordForm)
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Split layout: left 60% parameters, right 40% charts */}
          {sortedParams.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Left side: Parameter cards */}
              <div className="lg:col-span-3 space-y-3">
                {sortedParams.map((p) => (
                  <ParameterCard
                    key={p.id}
                    parameter={p}
                    onAddRecord={(id) => {
                      setAddingRecordForId(id)
                      setRecordForm({
                        ...emptyRecordForm,
                        parameterId: id,
                      })
                    }}
                    onDeleteParam={handleDeleteParam}
                    onDeleteRecord={handleDeleteRecord}
                    onOpenChart={handleOpenChart}
                  />
                ))}
              </div>

              {/* Right side: Mini charts */}
              <div className="lg:col-span-2">
                <div className="sticky top-4 space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Мини-графики
                  </h4>
                  {paramsWithRecords.length > 0 ? (
                    <div className="space-y-2">
                      {paramsWithRecords.map((p) => {
                        const enriched = enrichRecords(
                          [...p.records].sort((a, b) => b.measuredDate.localeCompare(a.measuredDate)),
                          p,
                        )
                        const lastRecord = enriched[0]
                        const lastIsOk = lastRecord?.isInTolerance !== false
                        return (
                          <div key={p.id}>
                            <p className="text-xs font-medium mb-1 truncate">{p.name}</p>
                            <MiniSparkline
                              records={enriched}
                              isOk={lastIsOk}
                              onClick={() => handleOpenChart(p)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8 border rounded-lg bg-muted/20">
                      Добавьте минимум 2 замера для отображения графика
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            !showAddParam && (
              <div className="text-center py-16">
                <TrendingUp className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Нет замеряемых параметров
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Нажмите «Добавить параметр» для начала отслеживания
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
