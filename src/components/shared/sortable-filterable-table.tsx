
'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  CheckCircle2,
  GripVertical,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

// ─── Types ──────────────────────────────────────────────

export interface ColDef<T = Record<string, unknown>> {
  key: string
  label: string
  group?: string
  render: (item: T) => React.ReactNode
}

export interface SortableFilterableTableProps<T> {
  /** All column definitions */
  columns: ColDef<T>[]
  /** Default visible column keys (in order) */
  defaultVisibleColumns: string[]
  /** Data items to display */
  items: T[]
  /** Loading state */
  loading?: boolean
  /** Unique key on each item */
  itemKey: keyof T & string
  /** Extract plain text for a column key (used for sort & filter) */
  cellText: (item: T, colKey: string) => string
  /** localStorage key for persisting column order */
  storageKey: string
  /** Empty state message */
  emptyMessage?: string
  /** Filtered empty message */
  filteredEmptyMessage?: string
  /** Whether any filters are active (for empty message) */
  hasActiveFilters?: boolean
  /** Optional: render a leading column (e.g. checkbox) */
  leadingColumn?: (item: T) => React.ReactNode
  /** Leading column header content */
  leadingColumnHeader?: React.ReactNode
  /** Optional: row click handler */
  onRowClick?: (item: T) => void
  /** Optional: row className builder */
  rowClassName?: (item: T) => string
  /** Optional: action column at the end */
  trailingColumn?: (item: T) => React.ReactNode
  /** Trailing column header */
  trailingColumnHeader?: React.ReactNode
  /** Col span for empty state override */
  emptyColSpan?: number
}

// ─── Sortable Column Header ─────────────────────────────

function SortableColumnHeader<T>({
  col,
  sortKey,
  sortDir,
  colFilters,
  openColMenu,
  setOpenColMenu,
  setSortDirection,
  clearFilter,
  toggleFilterValue,
  columnUniqueValues,
  items,
  cellText,
  colMenuRef,
}: {
  col: ColDef<T>
  sortKey: string | null
  sortDir: 'asc' | 'desc' | null
  colFilters: Record<string, Set<string>>
  openColMenu: string | null
  setOpenColMenu: (key: string | null) => void
  setSortDirection: (key: string, dir: 'asc' | 'desc') => void
  clearFilter: (key: string) => void
  toggleFilterValue: (key: string, val: string) => void
  columnUniqueValues: Record<string, string[]>
  items: T[]
  cellText: (item: T, colKey: string) => string
  colMenuRef: React.RefObject<HTMLDivElement | null>
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.key })

  const isSorted = sortKey === col.key
  const hasFilter = colFilters[col.key] && colFilters[col.key].size > 0
  const isOpen = openColMenu === col.key

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: isDragging ? 'relative' : undefined,
  }

  return (
    <th
      ref={setNodeRef}
      data-col-key={col.key}
      className={`text-foreground h-10 px-2 text-left align-middle font-medium text-xs whitespace-nowrap relative select-none ${isDragging ? 'bg-orange-50 shadow-md' : ''}`}
      style={style}
    >
      <div ref={isOpen ? colMenuRef : undefined} className="flex items-center">
        <div
          className="cursor-grab active:cursor-grabbing px-0.5 -ml-0.5 shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-none"
          {...attributes}
          {...listeners}
          title="Перетащить для изменения порядка"
        >
          <GripVertical className="size-3.5" />
        </div>
        <button
          className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer group"
          onClick={(e) => { e.stopPropagation(); setOpenColMenu(isOpen ? null : col.key) }}
        >
          <span className={isSorted ? 'font-semibold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}>{col.label}</span>
          {isSorted && sortDir === 'asc' && <ChevronDown className="size-3 text-orange-600" />}
          {isSorted && sortDir === 'desc' && <ChevronUp className="size-3 text-orange-600" />}
          {!isSorted && <ChevronsUpDown className="size-3 text-muted-foreground/40 group-hover:text-muted-foreground/60" />}
          {hasFilter && <span className="size-1.5 rounded-full bg-orange-500 shrink-0" />}
        </button>
        {isOpen && (
          <div
            className="absolute top-full left-0 z-50 mt-1 w-52 bg-popover text-popover-foreground rounded-md border shadow-lg flex flex-col overflow-hidden"
            style={{ maxHeight: 'min(420px, calc(100vh - 100px))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-2 pt-1.5 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Сортировка</div>
            <button
              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:bg-muted/80 transition-colors shrink-0 ${isSorted && sortDir === 'asc' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30' : ''}`}
              onClick={() => setSortDirection(col.key, 'asc')}
            >
              <ChevronDown className="size-3" />
              По возрастанию (А→Я)
              {isSorted && sortDir === 'asc' && <CheckCircle2 className="size-3 ml-auto text-orange-600" />}
            </button>
            <button
              className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-xs hover:bg-muted/80 transition-colors shrink-0 ${isSorted && sortDir === 'desc' ? 'bg-orange-50 text-orange-700 dark:bg-orange-950/30' : ''}`}
              onClick={() => setSortDirection(col.key, 'desc')}
            >
              <ChevronUp className="size-3" />
              По убыванию (Я→А)
              {isSorted && sortDir === 'desc' && <CheckCircle2 className="size-3 ml-auto text-orange-600" />}
            </button>
            {(() => {
              const uvals = columnUniqueValues[col.key] || []
              if (uvals.length === 0) return null
              return (
                <>
                  <div className="border-t shrink-0" />
                  <div className="flex items-center justify-between px-2 pt-1 pb-0.5 shrink-0">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Фильтр</span>
                    {hasFilter && (
                      <button className="text-[10px] text-orange-600 hover:text-orange-700 font-medium" onClick={() => clearFilter(col.key)}>
                        Сбросить
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 overflow-y-auto custom-scrollbar px-1 pb-1">
                    {uvals.map((val) => {
                      const checked = colFilters[col.key]?.has(val) || false
                      return (
                        <label key={val} className="flex items-center gap-1.5 px-1.5 py-[3px] rounded text-[11px] hover:bg-muted/60 cursor-pointer transition-colors">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleFilterValue(col.key, val)}
                            className="size-3 shrink-0 rounded border-muted-foreground/30 accent-orange-600"
                          />
                          <span className="truncate flex-1 min-w-0">{val}</span>
                          <span className="text-[10px] text-muted-foreground/40 tabular-nums shrink-0">
                            {(() => { try { return items.filter((i) => cellText(i, col.key) === val).length } catch { return 0 } })()}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </th>
  )
}

// ─── Main Component ─────────────────────────────────────

export function SortableFilterableTable<T extends Record<string, unknown>>({
  columns,
  defaultVisibleColumns,
  items,
  loading = false,
  itemKey,
  cellText,
  storageKey,
  emptyMessage = 'Данные отсутствуют',
  filteredEmptyMessage = 'Данные по заданным фильтрам не найдены.',
  hasActiveFilters = false,
  leadingColumn,
  leadingColumnHeader,
  onRowClick,
  rowClassName,
  trailingColumn,
  trailingColumnHeader,
  emptyColSpan,
}: SortableFilterableTableProps<T>) {
  // ── Column visibility state (persisted in localStorage) ──
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved) as string[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setVisibleColumns(parsed)
        }
      }
    } catch { /* ignore */ }
  }, [storageKey])

  // Active columns in order
  const activeColumns = useMemo(() => {
    return visibleColumns
      .map((key) => columns.find((c) => c.key === key))
      .filter(Boolean) as ColDef<T>[]
  }, [visibleColumns, columns])

  // ── Column sort & filter state ──
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [colFilters, setColFilters] = useState<Record<string, Set<string>>>({})
  const [openColMenu, setOpenColMenu] = useState<string | null>(null)
  const colMenuRef = useRef<HTMLDivElement>(null)

  // ── Column drag-and-drop reorder via @dnd-kit ──
  const columnSensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  const handleColumnDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setOpenColMenu(null)
    if (!over || active.id === over.id) return

    setVisibleColumns((prev) => {
      const oldIdx = prev.indexOf(active.id as string)
      const newIdx = prev.indexOf(over.id as string)
      if (oldIdx === -1 || newIdx === -1) return prev
      const arr = arrayMove(prev, oldIdx, newIdx)
      try { localStorage.setItem(storageKey, JSON.stringify(arr)) } catch { /* ignore */ }
      return arr
    })
    toast.success('Столбец перемещён')
  }, [storageKey])

  const setSortDirection = useCallback((key: string, dir: 'asc' | 'desc') => {
    setSortKey(key)
    setSortDir(dir)
  }, [])

  const clearSort = useCallback(() => {
    setSortKey(null)
    setSortDir(null)
  }, [])

  const toggleFilterValue = useCallback((colKey: string, value: string) => {
    setColFilters((prev) => {
      const existing = prev[colKey]
      if (!existing) {
        const s = new Set([value])
        return { ...prev, [colKey]: s }
      }
      const next = new Set(existing)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      if (next.size === 0) {
        const { [colKey]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [colKey]: next }
    })
  }, [])

  const clearFilter = useCallback((colKey: string) => {
    setColFilters((prev) => {
      const { [colKey]: _, ...rest } = prev
      return rest
    })
  }, [])

  const clearAllFilters = useCallback(() => {
    setColFilters({})
    clearSort()
  }, [clearSort])

  // Close column menu on outside click
  useEffect(() => {
    if (!openColMenu) return
    const handler = (e: MouseEvent) => {
      if (colMenuRef.current && !colMenuRef.current.contains(e.target as Node)) {
        setOpenColMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openColMenu])

  // Compute unique values per column from current items
  const columnUniqueValues = useMemo(() => {
    try {
      const map: Record<string, string[]> = {}
      activeColumns.forEach((col) => {
        const vals = new Set<string>()
        items.forEach((item) => {
          const t = cellText(item, col.key)
          if (t) vals.add(t)
        })
        map[col.key] = Array.from(vals).sort((a, b) => a.localeCompare(b, 'ru'))
      })
      return map
    } catch {
      return {}
    }
  }, [items, activeColumns, cellText])

  // Apply sort + filter to items
  const displayItems = useMemo(() => {
    try {
      let result = [...items]
      const filterKeys = Object.keys(colFilters)
      if (filterKeys.length > 0) {
        result = result.filter((item) =>
          filterKeys.every((fk) => {
            const allowed = colFilters[fk]
            if (!allowed || allowed.size === 0) return true
            const t = cellText(item, fk)
            if (!t) return allowed.has('')
            return allowed.has(t)
          })
        )
      }
      if (sortKey && sortDir) {
        result.sort((a, b) => {
          const va = cellText(a, sortKey)
          const vb = cellText(b, sortKey)
          const cmp = va.localeCompare(vb, 'ru', { numeric: true, sensitivity: 'base' })
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
      return result
    } catch {
      return [...items]
    }
  }, [items, sortKey, sortDir, colFilters, cellText])

  const totalCols = (leadingColumn ? 1 : 0) + activeColumns.length + (trailingColumn ? 1 : 0)
  const colSpan = emptyColSpan ?? totalCols

  // Expose displayItems and filter state for parent
  // We use a ref-based approach so parent can access
  const filterInfo = {
    colFilters,
    sortKey,
    sortDir,
    displayItems,
    clearAllFilters,
    clearFilter,
    totalItems: items.length,
  }

  return (
    <>
      {/* Active filters bar */}
      {Object.keys(colFilters).length > 0 && (
        <div className="flex items-center flex-wrap gap-1.5 px-4 py-1.5 bg-muted/30 border-b">
          {Object.entries(colFilters).map(([fk, vals]) => {
            const col = columns.find((c) => c.key === fk)
            return Array.from(vals).map((v) => (
              <span
                key={`${fk}-${v}`}
                className="inline-flex items-center gap-1 rounded-md border bg-background px-2 py-0.5 text-[11px] font-medium shadow-sm"
              >
                <span className="text-muted-foreground">{col?.label || fk}:</span> {v}
                <button className="ml-0.5 hover:text-destructive" onClick={() => toggleFilterValue(fk, v)}>
                  <X className="size-2.5" />
                </button>
              </span>
            ))
          })}
          <span className="text-muted-foreground ml-1">
            Показано {displayItems.length} из {items.length}
          </span>
          <button className="text-orange-600 hover:text-orange-700 font-medium ml-auto" onClick={clearAllFilters}>
            Сбросить всё
          </button>
        </div>
      )}

      {/* Table */}
      <DndContext
        sensors={columnSensors}
        collisionDetection={closestCenter}
        onDragEnd={handleColumnDragEnd}
      >
        <Table>
          <SortableContext items={activeColumns.map((c) => c.key)} strategy={horizontalListSortingStrategy}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {leadingColumnHeader && (
                  <TableHead className="pl-6">{leadingColumnHeader}</TableHead>
                )}
                {activeColumns.map((col) => (
                  <SortableColumnHeader
                    key={col.key}
                    col={col}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    colFilters={colFilters}
                    openColMenu={openColMenu}
                    setOpenColMenu={setOpenColMenu}
                    setSortDirection={setSortDirection}
                    clearFilter={clearFilter}
                    toggleFilterValue={toggleFilterValue}
                    columnUniqueValues={columnUniqueValues}
                    items={items}
                    cellText={cellText}
                    colMenuRef={colMenuRef}
                  />
                ))}
                {trailingColumnHeader && (
                  <TableHead className="pr-6 text-right">{trailingColumnHeader}</TableHead>
                )}
              </TableRow>
            </TableHeader>
          </SortableContext>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {leadingColumn && <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>}
                  {activeColumns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-5 w-20" />
                    </TableCell>
                  ))}
                  {trailingColumn && <TableCell className="pr-6"><Skeleton className="h-5 w-8" /></TableCell>}
                </TableRow>
              ))
            ) : displayItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <span className="text-muted-foreground text-sm">
                      {hasActiveFilters || Object.keys(colFilters).length > 0
                        ? filteredEmptyMessage
                        : emptyMessage}
                    </span>
                    {Object.keys(colFilters).length > 0 && (
                      <Button size="sm" variant="outline" className="gap-1" onClick={clearAllFilters}>
                        <X className="size-3" />
                        Сбросить фильтры
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayItems.map((item) => (
                <TableRow
                  key={String(item[itemKey])}
                  className={`${onRowClick ? 'cursor-pointer' : ''} ${rowClassName ? rowClassName(item) : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {leadingColumn && <TableCell className="pl-6">{leadingColumn(item)}</TableCell>}
                  {activeColumns.map((col) => (
                    <TableCell key={col.key}>{col.render(item)}</TableCell>
                  ))}
                  {trailingColumn && <TableCell className="pr-6 text-right">{trailingColumn(item)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DndContext>
    </>
  )
}

// Export filterInfo type for parent components
export type { SortableFilterableTableProps, ColDef }

