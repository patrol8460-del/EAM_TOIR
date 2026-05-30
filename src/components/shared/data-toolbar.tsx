'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  FileSpreadsheet,
  Save,
  FolderOpen,
  Trash2,
  Star,
  Download,
  ChevronDown,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

// ─── Types ──────────────────────────────────────────────

export interface ColumnDef {
  key: string
  label: string
  group?: string
}

interface DataToolbarProps {
  /** Module identifier: equipment, spare-parts, requests, personnel, planning */
  module: string
  /** User ID for preset ownership */
  userId: string
  /** All available column definitions */
  allColumns: ColumnDef[]
  /** Currently visible column keys (in order) */
  visibleColumns: string[]
  /** Callback when columns change (from preset load or reset) */
  onColumnsChange: (columns: string[]) => void
  /** Callback to get data for export: returns { headers: string[], rows: string[][] } */
  getExportData: () => { headers: string[]; rows: string[][] }
  /** Optional: file name for export */
  exportFileName?: string
  /** Optional: sheet name in Excel */
  sheetName?: string
}

// ─── Excel Export Helper ────────────────────────────────

export async function exportToExcel(
  headers: string[],
  rows: string[][],
  fileName: string,
  sheetName?: string,
) {
  try {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ headers, rows, sheetName: sheetName || 'Данные' }),
    })
    if (!res.ok) throw new Error('Export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const now = new Date()
    const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
    a.download = `${fileName}_${ts}.xlsx`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Экспортировано ${rows.length} записей`)
  } catch {
    toast.error('Ошибка при экспорте в Excel')
  }
}

// ─── Component ──────────────────────────────────────────

export function DataToolbar({
  module,
  userId,
  allColumns,
  visibleColumns,
  onColumnsChange,
  getExportData,
  exportFileName = 'export',
  sheetName,
}: DataToolbarProps) {
  const [exporting, setExporting] = useState(false)

  // Save Preset Dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveType, setSaveType] = useState<'view' | 'export'>('view')
  const [saving, setSaving] = useState(false)
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  // Presets state
  const [presets, setPresets] = useState<{ id: string; name: string; type: string; columns: string; isDefault: boolean }[]>([])
  const [presetsLoading, setPresetsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const fetchPresets = useCallback(async () => {
    if (!userId) return
    setPresetsLoading(true)
    try {
      const res = await fetch(`/api/column-presets?module=${module}`)
      if (res.ok) {
        const data = await res.json()
        setPresets((data.presets || []).filter((p: { userId: string }) => p.userId === userId))
      }
    } catch { /* silent */ }
    finally { setPresetsLoading(false) }
  }, [module, userId])

  useEffect(() => {
    if (userId && !hasFetched) {
      fetchPresets()
      setHasFetched(true)
    }
  }, [userId, hasFetched, fetchPresets])

  // Re-fetch when module changes
  useEffect(() => {
    setHasFetched(false)
  }, [module])

  // ─── Save Handler ───
  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error('Введите название пресета')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/column-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, module, name: saveName.trim(), type: saveType,
          columns: visibleColumns, isDefault: saveAsDefault,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка')
      }
      toast.success(saveAsDefault ? `«${saveName}» — по умолчанию` : `Пресет «${saveName}» сохранён`)
      setSaveDialogOpen(false)
      setSaveName('')
      setSaveAsDefault(false)
      fetchPresets()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───
  const handleDeletePreset = async (id: string) => {
    try {
      await fetch('/api/column-presets', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      toast.success('Пресет удалён')
      fetchPresets()
    } catch {
      toast.error('Ошибка удаления')
    }
  }

  // ─── Set Default ───
  const handleSetDefault = async (preset: { id: string; name: string; type: string; columns: string }) => {
    const cols = JSON.parse(preset.columns)
    try {
      await fetch('/api/column-presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, module, name: preset.name, type: preset.type, columns: cols, isDefault: true }),
      })
      toast.success(`«${preset.name}» — по умолчанию`)
      fetchPresets()
    } catch {
      toast.error('Ошибка')
    }
  }

  // ─── Load Preset ───
  const handleLoadPreset = (preset: { columns: string }) => {
    try {
      const cols = JSON.parse(preset.columns) as string[]
      onColumnsChange(cols)
      toast.success('Пресет применён')
    } catch {
      toast.error('Ошибка загрузки пресета')
    }
  }

  // ─── Export Current View ───
  const handleExportCurrent = async () => {
    setExporting(true)
    try {
      const { headers, rows } = getExportData()
      if (rows.length === 0) { toast.error('Нет данных для экспорта'); return }
      await exportToExcel(headers, rows, exportFileName, sheetName)
    } finally { setExporting(false) }
  }

  // ─── Export from Preset ───
  const handleExportPreset = async (preset: { columns: string; name: string }) => {
    setExporting(true)
    try {
      const cols = JSON.parse(preset.columns) as string[]
      const colMap = new Map(allColumns.map((c) => [c.key, c.label]))
      const headers = cols.map((key) => colMap.get(key) || key)
      const { rows: allRows } = getExportData()
      const allColKeys = allColumns.map((c) => c.key)
      const colIndexMap = new Map(allColKeys.map((k, i) => [k, i]))
      const presetRows = allRows.map((row) =>
        cols.map((key) => {
          const idx = colIndexMap.get(key)
          return idx !== undefined ? (row[idx] ?? '') : ''
        })
      )
      await exportToExcel(headers, presetRows, preset.name, sheetName)
    } catch { toast.error('Ошибка экспорта') }
    finally { setExporting(false) }
  }

  const viewPresets = presets.filter((p) => p.type === 'view')
  const exportPresets = presets.filter((p) => p.type === 'export')

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Save */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
              <Save className="size-3.5" />
              Сохранить
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem className="gap-2" onClick={() => { setSaveType('view'); setSaveDialogOpen(true) }}>
              <Star className="size-3.5" /> Пресет отображения
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2" onClick={() => { setSaveType('export'); setSaveDialogOpen(true) }}>
              <FileSpreadsheet className="size-3.5" /> Формат выгрузки
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Load Presets */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" disabled={presetsLoading}>
              <FolderOpen className="size-3.5" />
              Формат данных
              {presets.length > 0 && (
                <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[10px]">{presets.length}</Badge>
              )}
              <ChevronDown className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-80 overflow-y-auto">
            {viewPresets.length === 0 && exportPresets.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">Нет сохранённых пресетов</div>
            ) : (
              <>
                {viewPresets.length > 0 && (
                  <>
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Отображение</DropdownMenuLabel>
                    {viewPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center group">
                        <DropdownMenuItem className="flex-1 gap-2 min-w-0" onClick={() => handleLoadPreset(preset)}>
                          <Star className={`size-3 shrink-0 ${preset.isDefault ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                          <span className="truncate text-xs">{preset.name}</span>
                          {preset.isDefault && <Badge variant="outline" className="ml-auto text-[9px] shrink-0 px-1 py-0">По умолч.</Badge>}
                        </DropdownMenuItem>
                        <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-amber-500 shrink-0" onClick={() => handleSetDefault(preset)} title="По умолчанию">
                          <Star className="size-3" />
                        </button>
                        <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDeletePreset(preset.id)} title="Удалить">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
                {exportPresets.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="text-xs text-muted-foreground">Форматы выгрузки Excel</DropdownMenuLabel>
                    {exportPresets.map((preset) => (
                      <div key={preset.id} className="flex items-center group">
                        <DropdownMenuItem className="flex-1 gap-2 min-w-0" onClick={() => handleExportPreset(preset)} disabled={exporting}>
                          <FileSpreadsheet className="size-3 shrink-0 text-emerald-600" />
                          <span className="truncate text-xs">{preset.name}</span>
                        </DropdownMenuItem>
                        <button className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 shrink-0" onClick={() => handleDeletePreset(preset.id)} title="Удалить">
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Export */}
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={handleExportCurrent} disabled={exporting}>
          {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />}
          Excel
        </Button>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={(open) => { if (!open) { setSaveDialogOpen(false); setSaveName(''); setSaveAsDefault(false) } }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{saveType === 'view' ? 'Сохранить пресет отображения' : 'Сохранить формат выгрузки'}</DialogTitle>
            <DialogDescription>
              {saveType === 'view'
                ? `Текущие столбцы (${visibleColumns.length} шт.) будут сохранены для модуля.`
                : `Выбранные столбцы (${visibleColumns.length} шт.) и их порядок будут использоваться при выгрузке.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Название</label>
              <Input placeholder="Например: Основные столбцы" value={saveName} onChange={(e) => setSaveName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }} autoFocus />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={saveAsDefault} onChange={(e) => setSaveAsDefault(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm">Установить по умолчанию</span>
            </label>
            <div className="rounded-md border p-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Столбцы ({visibleColumns.length})</p>
              <div className="flex flex-wrap gap-1">
                {visibleColumns.map((key) => {
                  const col = allColumns.find((c) => c.key === key)
                  return <Badge key={key} variant="secondary" className="text-[10px] font-normal">{col?.label || key}</Badge>
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSave} disabled={saving || !saveName.trim()} className="gap-1.5 bg-orange-600 hover:bg-orange-700">
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
