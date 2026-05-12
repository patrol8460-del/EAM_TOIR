'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import dynamic from 'next/dynamic'
import {
  Plus, Trash2, Pencil, Loader2, ChevronRight,
  Thermometer, Search, Check, X, TrendingUp, BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// Dynamic import recharts — избегаем SSR/Turbopack крашей
const MiniSparkline = dynamic(
  () => import('./measured-params-charts').then(m => ({ default: m.MiniSparkline })),
  { ssr: false, loading: () => <div className="size-[60px_20px] bg-muted/20 animate-pulse rounded" /> }
)
const SparklineThumb = dynamic(
  () => import('./measured-params-charts').then(m => ({ default: m.SparklineThumb })),
  { ssr: false, loading: () => <div className="h-[64px] bg-muted/20 animate-pulse rounded-lg" /> }
)
const FullChart = dynamic(
  () => import('./measured-params-charts').then(m => ({ default: m.FullChart })),
  { ssr: false, loading: () => <div className="h-[300px] flex items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div> }
)

// ===================== TYPES =====================

interface MeasurementRecord {
  id: string
  parameterId: string
  measuredValue: string
  measurementDate: string
  performerName?: string | null
  notes?: string | null
  createdAt: string
}

interface MeasuredParameter {
  id: string
  equipmentId: string
  name: string
  unit: string
  referenceValue?: string | null
  sortOrder: number
  createdAt: string
  updatedAt: string
  records: MeasurementRecord[]
}

interface OkeiUnit {
  code: string
  name: string
  symbol: string
  symbol_intl: string
}

interface MeasuredParamsTabProps {
  equipmentId: string
}

// ===================== HELPERS =====================

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function fmt(val: unknown): string {
  if (val === null || val === undefined || val === '') return '\u2014'
  return String(val)
}

interface RefParsed {
  value: number
  tolMin: number | null
  tolMax: number | null
  raw: string
}

function parseReference(refStr?: string | null): RefParsed | null {
  if (!refStr) return null
  try {
    const obj = JSON.parse(refStr)
    if (obj && typeof obj.value === 'number' && obj.value !== 0) {
      return {
        value: obj.value,
        tolMin: obj.tolMin != null ? Number(obj.tolMin) : null,
        tolMax: obj.tolMax != null ? Number(obj.tolMax) : null,
        raw: refStr,
      }
    }
  } catch { /* not JSON, try as plain number */ }
  const num = parseFloat(refStr)
  if (!isNaN(num)) {
    return { value: num, tolMin: null, tolMax: null, raw: refStr }
  }
  return null
}

function checkTolerance(measuredStr: string, ref: RefParsed): 'ok' | 'warn' | 'out' {
  const measured = parseFloat(measuredStr)
  if (isNaN(measured)) return 'ok'
  if (ref.tolMin === null && ref.tolMax === null) {
    return measured === ref.value ? 'ok' : 'warn'
  }
  const tolLow = ref.tolMin != null ? ref.value * (1 + ref.tolMin / 100) : -Infinity
  const tolHigh = ref.tolMax != null ? ref.value * (1 + ref.tolMax / 100) : Infinity
  if (measured < tolLow || measured > tolHigh) return 'out'
  return 'ok'
}

function formatRefDisplay(ref: RefParsed): string {
  const v = String(ref.value)
  if (ref.tolMin !== null && ref.tolMax !== null) {
    const low = (ref.value * (1 + ref.tolMin / 100)).toFixed(2)
    const high = (ref.value * (1 + ref.tolMax / 100)).toFixed(2)
    return `[${low} \u2192 ${v} \u2192 ${high}]`
  }
  if (ref.tolMin !== null) {
    const low = (ref.value * (1 + ref.tolMin / 100)).toFixed(2)
    return `[${low} \u2192 ${v}]`
  }
  if (ref.tolMax !== null) {
    const high = (ref.value * (1 + ref.tolMax / 100)).toFixed(2)
    return `[${v} \u2192 ${high}]`
  }
  return v
}

// Chart data helpers (shared between tabs and chart component)
interface ChartDataPoint {
  date: string
  value: number
  fullDate: string
  performer: string
  notes: string
  status: 'ok' | 'warn' | 'out'
}

function prepareChartData(param: MeasuredParameter, refParsed: RefParsed | null): ChartDataPoint[] {
  if (!param.records.length) return []
  return param.records
    .slice()
    .sort((a, b) => (a.measurementDate || '').localeCompare(b.measurementDate || ''))
    .map(rec => {
      const val = parseFloat(rec.measuredValue)
      return {
        date: formatDate(rec.measurementDate),
        value: isNaN(val) ? 0 : val,
        fullDate: rec.measurementDate,
        performer: rec.performerName || '',
        notes: rec.notes || '',
        status: refParsed ? checkTolerance(rec.measuredValue, refParsed) : 'ok',
      }
    })
}

function overallStatus(points: ChartDataPoint[]): 'ok' | 'warn' | 'out' | 'none' {
  if (!points.length) return 'none'
  if (points.some(p => p.status === 'out')) return 'out'
  if (points.some(p => p.status === 'warn')) return 'warn'
  return 'ok'
}

function statusLineColor(status: 'ok' | 'warn' | 'out' | 'none'): string {
  switch (status) {
    case 'out': return '#dc2626'
    case 'warn': return '#d97706'
    default: return '#16a34a'
  }
}

// ===================== OKEI COMBOBOX =====================

function OkeiCombobox({
  value,
  onChange,
}: {
  value: string
  onChange: (symbol: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OkeiUnit[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      return
    }
    if (query.length < 1) {
      setResults([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/okei?q=${encodeURIComponent(query)}&limit=30`)
        if (res.ok) setResults(await res.json())
      } catch { /* silent */ }
      finally { setLoading(false) }
    }, 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, open])

  const selectUnit = (unit: OkeiUnit) => {
    onChange(unit.symbol)
    setQuery('')
    setOpen(false)
  }

  const clearValue = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Input
            ref={inputRef}
            value={value}
            readOnly
            placeholder="Выберите из справочника ОКЕИ..."
            className="h-9 text-sm pr-7 cursor-pointer"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {value && (
              <button
                onClick={clearValue}
                className="size-4 flex items-center justify-center rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" />
              </button>
            )}
            <Search className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0" align="start">
        <div className="border-b px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по коду, названию, символу..."
              className="h-8 text-xs pl-8"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="max-h-[240px]">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground text-xs">
              <Loader2 className="size-3.5 animate-spin" />
              Поиск...
            </div>
          )}
          {!loading && query.length >= 1 && results.length === 0 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Ничего не найдено
            </div>
          )}
          {!loading && results.length > 0 && (
            <div className="py-1">
              {results.map((unit) => (
                <button
                  key={unit.code}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/60 transition-colors rounded-sm"
                  onClick={() => selectUnit(unit)}
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{unit.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground font-mono">{unit.code}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {unit.symbol}{unit.symbol_intl && unit.symbol_intl !== '-' ? ` (${unit.symbol_intl})` : ''}
                      </span>
                    </div>
                  </div>
                  {value === unit.symbol && <Check className="size-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          )}
          {!loading && query.length < 1 && (
            <div className="py-6 text-center text-xs text-muted-foreground">
              Начните вводить название, код или обозначение
            </div>
          )}
        </ScrollArea>
        <div className="border-t px-3 py-1.5">
          <p className="text-[10px] text-muted-foreground/60">
            Справочник ОКЕИ \u2014 Общероссийский классификатор единиц измерения
          </p>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ===================== PARAMETER CARD =====================

function ParamCard({
  param,
  onEdit,
  onDelete,
  onAddRecord,
  onDeleteRecord,
  onChart,
}: {
  param: MeasuredParameter
  onEdit: (param: MeasuredParameter) => void
  onDelete: (param: MeasuredParameter) => void
  onAddRecord: (paramId: string) => void
  onDeleteRecord: (paramId: string, recordId: string) => void
  onChart: (param: MeasuredParameter) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const refParsed = parseReference(param.referenceValue)
  const chartData = useMemo(() => prepareChartData(param, refParsed), [param, refParsed])
  const hasChart = chartData.length >= 2

  return (
    <div className="rounded-lg border border-border bg-card">
      <div
        className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg"
        onClick={() => setExpanded(!expanded)}
      >
        <ChevronRight
          className={`size-4 text-muted-foreground transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{param.name}</span>
            {param.unit && (
              <Badge variant="outline" className="text-[10px] bg-muted/50 px-1.5 py-0">{param.unit}</Badge>
            )}
            {refParsed && (
              <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 px-1.5 py-0">{formatRefDisplay(refParsed)}</Badge>
            )}
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{param.records.length} записей</Badge>
          </div>
        </div>

        {/* Mini sparkline in card header */}
        {hasChart && (
          <div className="hidden sm:block shrink-0" onClick={(e) => e.stopPropagation()}>
            <button
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-muted/60 transition-colors group"
              onClick={() => onChart(param)}
              title="Показать график"
            >
              <MiniSparkline data={chartData} refParsed={refParsed} />
              <BarChart3 className="size-3 text-muted-foreground group-hover:text-orange-600 transition-colors" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {hasChart && (
            <Button
              variant="ghost"
              size="icon"
              className="size-7 sm:hidden text-muted-foreground hover:text-orange-600"
              onClick={() => onChart(param)}
              title="График"
            >
              <BarChart3 className="size-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(param)} title="Редактировать">
            <Pencil className="size-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(param)} title="Удалить">
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Records table */}
      {expanded && (
        <div className="border-t">
          {param.records.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">Записи замеров отсутствуют</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Дата замера</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Замеренное значение</th>
                    {param.unit && (
                      <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ЕИ</th>
                    )}
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Реф. (допуск)</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Статус</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ФИО</th>
                    <th className="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Примечание</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {param.records.map((rec) => {
                    const status = refParsed ? checkTolerance(rec.measuredValue, refParsed) : 'ok'
                    return (
                      <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 text-sm whitespace-nowrap">{formatDate(rec.measurementDate)}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          <span className={status === 'out' ? 'text-red-600' : status === 'warn' ? 'text-amber-600' : 'text-foreground'}>{rec.measuredValue}</span>
                        </td>
                        {param.unit && <td className="px-4 py-2 text-xs text-muted-foreground">{param.unit}</td>}
                        <td className="px-4 py-2 text-xs text-muted-foreground">{refParsed ? formatRefDisplay(refParsed) : '\u2014'}</td>
                        <td className="px-4 py-2">
                          {status === 'out' && <Badge variant="outline" className="text-[10px] bg-red-50 text-red-700 border-red-200 px-1.5 py-0">За допуском</Badge>}
                          {status === 'warn' && <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-1.5 py-0">Отклонение</Badge>}
                          {status === 'ok' && refParsed && <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0">В норме</Badge>}
                          {!refParsed && <span className="text-xs text-muted-foreground">\u2014</span>}
                        </td>
                        <td className="px-4 py-2 text-sm">{fmt(rec.performerName)}</td>
                        <td className="px-4 py-2 text-xs text-muted-foreground max-w-[200px] truncate">{fmt(rec.notes)}</td>
                        <td className="px-4 py-2">
                          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => onDeleteRecord(param.id, rec.id)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-4 py-2 border-t bg-muted/10">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground" onClick={() => onAddRecord(param.id)}>
              <Plus className="size-3.5" />
              Добавить запись замера
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===================== EDIT PARAMETER DIALOG =====================

function EditParamDialog({
  open,
  onOpenChange,
  param,
  onSave,
  title,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  param: { name: string; unit: string; referenceValue?: string | null } | null
  onSave: (data: { name: string; unit: string; referenceValue: string }) => void
  title: string
}) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState('')
  const [refValue, setRefValue] = useState('')
  const [tolMin, setTolMin] = useState('')
  const [tolMax, setTolMax] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && param) {
      setName(param.name)
      setUnit(param.unit || '')
      const ref = parseReference(param.referenceValue)
      if (ref) {
        setRefValue(String(ref.value))
        setTolMin(ref.tolMin !== null ? String(ref.tolMin) : '')
        setTolMax(ref.tolMax !== null ? String(ref.tolMax) : '')
      } else {
        setRefValue(''); setTolMin(''); setTolMax('')
      }
    } else if (open) {
      setName(''); setUnit(''); setRefValue(''); setTolMin(''); setTolMax('')
    }
  }, [param, open])

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Название параметра обязательно'); return }
    setSaving(true)
    try {
      let referenceValue = ''
      const numVal = parseFloat(refValue)
      if (!isNaN(numVal) && refValue.trim()) {
        const obj: { value: number; tolMin?: number; tolMax?: number } = { value: numVal }
        const minPct = tolMin.trim() !== '' ? parseFloat(tolMin) : null
        const maxPct = tolMax.trim() !== '' ? parseFloat(tolMax) : null
        if (minPct !== null && !isNaN(minPct)) obj.tolMin = minPct
        if (maxPct !== null && !isNaN(maxPct)) obj.tolMax = maxPct
        referenceValue = JSON.stringify(obj)
      }
      await onSave({ name: name.trim(), unit: unit.trim(), referenceValue })
      onOpenChange(false)
    } finally { setSaving(false) }
  }

  const previewRange = (() => {
    const v = parseFloat(refValue)
    if (isNaN(v) || !refValue.trim()) return null
    const minPct = tolMin.trim() !== '' ? parseFloat(tolMin) : null
    const maxPct = tolMax.trim() !== '' ? parseFloat(tolMax) : null
    if (minPct === null && maxPct === null) return null
    const low = minPct !== null && !isNaN(minPct) ? (v * (1 + minPct / 100)).toFixed(2) : null
    const high = maxPct !== null && !isNaN(maxPct) ? (v * (1 + maxPct / 100)).toFixed(2) : null
    return { low, high, value: v }
  })()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>Укажите параметры замера. Референсное значение с допусками используется для контроля.</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Название параметра *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Давление, Температура, Вибрация..." className="h-9 text-sm" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Единица измерения (справочник ОКЕИ)</Label>
            <OkeiCombobox value={unit} onChange={setUnit} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Референсное (номинальное) значение</Label>
            <Input type="number" value={refValue} onChange={(e) => setRefValue(e.target.value)} placeholder="Например: 0.6, 80, 1200..." className="h-9 text-sm" step="any" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Допуск отклонения (%) нижний</Label>
              <Input type="number" value={tolMin} onChange={(e) => setTolMin(e.target.value)} placeholder="Например: -3" className="h-9 text-sm" step="any" />
              <p className="text-[10px] text-muted-foreground/70">Отрицательное значение = минус %</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Допуск отклонения (%) верхний</Label>
              <Input type="number" value={tolMax} onChange={(e) => setTolMax(e.target.value)} placeholder="Например: 2" className="h-9 text-sm" step="any" />
              <p className="text-[10px] text-muted-foreground/70">Положительное значение = плюс %</p>
            </div>
          </div>
          {previewRange && (
            <div className="rounded-md border border-blue-200 bg-blue-50/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 mb-1">Допустимый диапазон</p>
              <p className="text-sm font-medium text-blue-800">
                {previewRange.low && previewRange.high && <>{previewRange.low} \u2192 {previewRange.value} \u2192 {previewRange.high}</>}
                {previewRange.low && !previewRange.high && <>{previewRange.low} \u2192 {previewRange.value} (и выше)</>}
                {!previewRange.low && previewRange.high && <>{previewRange.value} (и ниже) \u2192 {previewRange.high}</>}
              </p>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSave() }} disabled={saving || !name.trim()} className="bg-orange-600 hover:bg-orange-700 text-white">
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Сохранить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ===================== ADD RECORD DIALOG =====================

function AddRecordDialog({
  open,
  onOpenChange,
  parameterName,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  parameterName: string
  onSave: (data: { measuredValue: string; measurementDate: string; performerName: string; notes: string }) => void
}) {
  const [value, setValue] = useState('')
  const [date, setDate] = useState(todayISO())
  const [performer, setPerformer] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) { setValue(''); setDate(todayISO()); setPerformer(''); setNotes('') }
  }, [open])

  const handleSave = async () => {
    if (!value.trim() || !date) { toast.error('Значение и дата замера обязательны'); return }
    setSaving(true)
    try {
      await onSave({ measuredValue: value.trim(), measurementDate: date, performerName: performer.trim(), notes: notes.trim() })
      onOpenChange(false)
    } finally { setSaving(false) }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Новая запись замера</AlertDialogTitle>
          <AlertDialogDescription>Параметр: <span className="font-semibold text-foreground">{parameterName}</span></AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Дата замера *</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Замеренное значение *</Label>
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Значение" className="h-9 text-sm" autoFocus />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">ФИО (кто внёс запись)</Label>
            <Input value={performer} onChange={(e) => setPerformer(e.target.value)} placeholder="Иванов И.И." className="h-9 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Примечание</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Дополнительные сведения..." className="h-9 text-sm" />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Отмена</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); handleSave() }} disabled={saving || !value.trim() || !date} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Добавить
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ===================== MAIN TAB COMPONENT =====================

export default function MeasuredParamsTab({ equipmentId }: MeasuredParamsTabProps) {
  const [params, setParams] = useState<MeasuredParameter[]>([])
  const [loading, setLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingParam, setEditingParam] = useState<MeasuredParameter | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingParam, setDeletingParam] = useState<MeasuredParameter | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [addRecordDialogOpen, setAddRecordDialogOpen] = useState(false)
  const [addRecordParamId, setAddRecordParamId] = useState<string>('')
  const [addRecordParamName, setAddRecordParamName] = useState('')
  const [chartDialogOpen, setChartDialogOpen] = useState(false)
  const [chartParam, setChartParam] = useState<MeasuredParameter | null>(null)

  const fetchParams = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/measured-params`)
      if (res.ok) setParams(await res.json())
    } catch { toast.error('Ошибка загрузки параметров') }
    finally { setLoading(false) }
  }, [equipmentId])

  useEffect(() => { if (equipmentId) fetchParams() }, [equipmentId, fetchParams])

  const handleCreateParam = async (data: { name: string; unit: string; referenceValue: string }) => {
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/measured-params`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { toast.success('Параметр создан'); fetchParams() }
      else { const err = await res.json(); toast.error(err.error || 'Ошибка создания') }
    } catch { toast.error('Ошибка сети') }
  }

  const handleUpdateParam = async (data: { name: string; unit: string; referenceValue: string }) => {
    if (!editingParam) return
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/measured-params`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingParam.id, ...data }) })
      if (res.ok) { toast.success('Параметр обновлён'); fetchParams() }
      else { const err = await res.json(); toast.error(err.error || 'Ошибка обновления') }
    } catch { toast.error('Ошибка сети') }
  }

  const handleDeleteParam = async () => {
    if (!deletingParam) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch(`/api/equipment/${equipmentId}/measured-params`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: deletingParam.id }) })
      if (res.ok) { toast.success(`Параметр \u00AB${deletingParam.name}\u00BB удалён`); fetchParams(); setDeleteDialogOpen(false); setDeletingParam(null) }
      else { const err = await res.json(); toast.error(err.error || 'Ошибка удаления') }
    } catch { toast.error('Ошибка сети') }
    finally { setDeleteSubmitting(false) }
  }

  const handleAddRecord = async (data: { measuredValue: string; measurementDate: string; performerName: string; notes: string }) => {
    try {
      const res = await fetch('/api/measured-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ parameterId: addRecordParamId, ...data }) })
      if (res.ok) { toast.success('Запись замера добавлена'); fetchParams() }
      else { const err = await res.json(); toast.error(err.error || 'Ошибка добавления записи') }
    } catch { toast.error('Ошибка сети') }
  }

  const handleDeleteRecord = async (paramId: string, recordId: string) => {
    try {
      const res = await fetch('/api/measured-records', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: recordId }) })
      if (res.ok) { toast.success('Запись удалена'); fetchParams() }
      else { const err = await res.json(); toast.error(err.error || 'Ошибка удаления записи') }
    } catch { toast.error('Ошибка сети') }
  }

  const openCreateDialog = () => { setEditingParam(null); setEditDialogOpen(true) }
  const openEditDialog = (param: MeasuredParameter) => { setEditingParam(param); setEditDialogOpen(true) }
  const openDeleteDialog = (param: MeasuredParameter) => { setDeletingParam(param); setDeleteDialogOpen(true) }
  const openAddRecordDialog = (paramId: string) => { const p = params.find((x) => x.id === paramId); setAddRecordParamId(paramId); setAddRecordParamName(p?.name || ''); setAddRecordDialogOpen(true) }
  const openChartDialog = (param: MeasuredParameter) => { setChartParam(param); setChartDialogOpen(true) }
  const handleEditSave = editingParam ? handleUpdateParam : handleCreateParam

  // ===================== RENDER =====================

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Замеряемые параметры</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Создавайте параметры, указывайте единицы измерения по ОКЕИ и допустимые отклонения</p>
        </div>
        <Button size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-white" onClick={openCreateDialog}>
          <Plus className="size-3.5" />
          Новый параметр
        </Button>
      </div>

      <Separator />

      {loading && (
        <div className="flex items-center justify-center gap-2 text-muted-foreground h-40">
          <Loader2 className="size-5 animate-spin" />
          <span>Загрузка параметров...</span>
        </div>
      )}

      {!loading && params.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-center">
          <Thermometer className="size-10 text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">Замеряемые параметры не добавлены</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Нажмите «Новый параметр», чтобы добавить первый</p>
        </div>
      )}

      {!loading && params.length > 0 && (
        <div className="space-y-3">
          {params.map((param) => (
            <ParamCard
              key={param.id}
              param={param}
              onEdit={openEditDialog}
              onDelete={openDeleteDialog}
              onAddRecord={openAddRecordDialog}
              onDeleteRecord={handleDeleteRecord}
              onChart={openChartDialog}
            />
          ))}

          {/* Sparkline thumbnails row */}
          {params.some(p => p.records.length >= 2) && (
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="size-3.5 text-orange-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Мини-графики отклонений</span>
                <span className="text-[10px] text-muted-foreground ml-1">(нажмите для подробного просмотра)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                {params.filter(p => p.records.length >= 2).map((param) => {
                  const refParsed = parseReference(param.referenceValue)
                  const chartData = prepareChartData(param, refParsed)
                  const status = overallStatus(chartData)
                  return (
                    <SparklineThumb
                      key={param.id}
                      data={chartData}
                      status={status}
                      lineColor={statusLineColor(status)}
                      name={param.name}
                      count={chartData.length}
                      onClick={() => openChartDialog(param)}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && params.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <span>Параметров: <span className="font-semibold text-foreground">{params.length}</span></span>
          <span>Всего записей: <span className="font-semibold text-foreground">{params.reduce((acc, p) => acc + p.records.length, 0)}</span></span>
          <span>Графиков: <span className="font-semibold text-foreground">{params.filter(p => p.records.length >= 2).length}</span></span>
        </div>
      )}

      <EditParamDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} param={editingParam} onSave={handleEditSave} title={editingParam ? 'Редактировать параметр' : 'Новый параметр'} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить параметр?</AlertDialogTitle>
            <AlertDialogDescription>
              Параметр <span className="font-semibold text-foreground">«{deletingParam?.name}»</span>
              {deletingParam && deletingParam.records.length > 0 && (
                <> и все его записи (<span className="font-semibold text-foreground">{deletingParam.records.length}</span> шт.)</>
              )} будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleDeleteParam() }} disabled={deleteSubmitting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleteSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddRecordDialog open={addRecordDialogOpen} onOpenChange={setAddRecordDialogOpen} parameterName={addRecordParamName} onSave={handleAddRecord} />

      {/* Full Chart Dialog */}
      <Dialog open={chartDialogOpen} onOpenChange={setChartDialogOpen}>
        <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[85vh] flex flex-col overflow-hidden gap-0">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-orange-600" />
              {chartParam?.name}
              {chartParam?.unit && <Badge variant="outline" className="text-[10px] bg-muted/50 px-1.5 py-0 ml-1">{chartParam.unit}</Badge>}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-3 flex-wrap">
              {chartParam && parseReference(chartParam.referenceValue) ? (
                <>
                  <span className="text-sm">Референс: <span className="font-semibold text-foreground">{formatRefDisplay(parseReference(chartParam.referenceValue)!)}</span></span>
                  <span className="text-xs text-muted-foreground">|</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">Референсное значение не установлено</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] pr-1">
            {chartParam && (
              <FullChart
                data={prepareChartData(chartParam, parseReference(chartParam.referenceValue))}
                refParsed={parseReference(chartParam.referenceValue)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
