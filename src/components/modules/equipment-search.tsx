'use client'

import { useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Search,
  X,
  GripVertical,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

// ── Types ────────────────────────────────────────────────────────────────────

interface SearchTag {
  key: string
  label: string
  group: string
}

interface SearchCondition {
  id: string
  field: string
  label: string
  operator: 'includes' | 'excludes' | 'equals' | 'notEquals'
  value: string
}

interface TagGroup {
  key: string
  label: string
  color: string
  tags: SearchTag[]
}

interface EquipmentSearchProps {
  onSearch: (conditions: SearchCondition[]) => void
  isSearching: boolean
}

// ── Tag definitions ──────────────────────────────────────────────────────────

const tagGroups: TagGroup[] = [
  {
    key: 'main',
    label: 'Основная информация',
    color: '#00B050',
    tags: [
      { key: 'name', label: 'Наименование', group: 'main' },
      { key: 'code', label: 'Инвентарный номер', group: 'main' },
      { key: 'model', label: 'Тип / модель', group: 'main' },
      { key: 'manufacturer', label: 'Изготовитель', group: 'main' },
      { key: 'serialNumber', label: 'Серийный номер', group: 'main' },
      { key: 'inventoryNumber', label: 'Инв. номер ОС', group: 'main' },
      { key: 'sapNumber', label: 'Номер SAP TORO', group: 'main' },
      { key: 'topazNumber', label: 'Номер ТОПАЗ', group: 'main' },
      { key: 'abcdCode', label: 'Код ABCD', group: 'main' },
      { key: 'costCenter', label: 'МВЗ', group: 'main' },
      { key: 'unit', label: 'ЕИ', group: 'main' },
      { key: 'drawing', label: 'Чертёж', group: 'main' },
      { key: 'equipmentClass', label: 'Класс', group: 'main' },
      { key: 'processImportance', label: 'Важность для ТП', group: 'main' },
      { key: 'quantity', label: 'Количество', group: 'main' },
      { key: 'parentEquipmentSap', label: 'Вышест. ЕО (SAP)', group: 'main' },
      { key: 'status', label: 'Статус', group: 'main' },
      { key: 'criticality', label: 'Критичность', group: 'main' },
      { key: 'isKey', label: 'Ключевое', group: 'main' },
      { key: 'isTest', label: 'Испытательное', group: 'main' },
      { key: 'hasReserve', label: 'Наличие резерва', group: 'main' },
      { key: 'description', label: 'Описание', group: 'main' },
      { key: 'commissionDate', label: 'Дата ввода в экспл.', group: 'main' },
      { key: 'manufactureDate', label: 'Дата выпуска', group: 'main' },
      { key: 'decommissionDate', label: 'Дата списания', group: 'main' },
    ],
  },
  {
    key: 'location',
    label: 'Местоположение',
    color: '#FFC000',
    tags: [
      { key: 'location.workshop', label: 'Цех', group: 'location' },
      { key: 'location.building', label: 'Здание', group: 'location' },
      { key: 'location.productionArea', label: 'Произв. зона', group: 'location' },
      { key: 'location.techArea', label: 'Технол. зона', group: 'location' },
      { key: 'location.roomNumber', label: 'Номер помещения', group: 'location' },
      { key: 'location.roomName', label: 'Наим. помещения', group: 'location' },
      { key: 'location.lineInstallation', label: 'Линия / установка', group: 'location' },
      { key: 'location.floor', label: 'Этаж', group: 'location' },
      { key: 'location.span', label: 'Пролёт', group: 'location' },
      { key: 'location.projectNumber', label: 'Номер проекта', group: 'location' },
    ],
  },
  {
    key: 'responsibility',
    label: 'Ответственные',
    color: '#6B7280',
    tags: [
      { key: 'responsibility.responsibleWorkshop', label: 'Ответственный цех', group: 'responsibility' },
      { key: 'responsibility.responsibleSpecialistService', label: 'Спец. служба', group: 'responsibility' },
      { key: 'responsibility.responsiblePerson', label: 'Лицо, отв. за исправн. сост.', group: 'responsibility' },
      { key: 'responsibility.safetyResponsiblePerson', label: 'Лицо, отв. за безопасн. экспл.', group: 'responsibility' },
      { key: 'responsibility.materiallyResponsiblePerson', label: 'Мат. ответственное лицо', group: 'responsibility' },
    ],
  },
  {
    key: 'maintenance',
    label: 'ТО и ремонты',
    color: '#6B7280',
    tags: [
      { key: 'maintenance.shiftMode', label: 'Режим сменности', group: 'maintenance' },
      { key: 'maintenance.repairCycleStartDate', label: 'Начало ремонтного цикла', group: 'maintenance' },
      { key: 'maintenance.laborConditionsFactor', label: 'Коэфф. условий труда', group: 'maintenance' },
      { key: 'maintenance.additionalRepairCoefficient', label: 'Доп. ремонтный коэфф.', group: 'maintenance' },
      { key: 'maintenance.toMechContractor', label: 'Исп. ТО (Мех.)', group: 'maintenance' },
      { key: 'maintenance.trMechContractor', label: 'Исп. ТР (Мех.)', group: 'maintenance' },
      { key: 'maintenance.krMechContractor', label: 'Исп. КР (Мех.)', group: 'maintenance' },
      { key: 'maintenance.toElecContractor', label: 'Исп. ТО (Энерг.)', group: 'maintenance' },
      { key: 'maintenance.trElecContractor', label: 'Исп. ТР (Энерг.)', group: 'maintenance' },
      { key: 'maintenance.krElecContractor', label: 'Исп. КР (Энерг.)', group: 'maintenance' },
      { key: 'maintenance.toKipContractor', label: 'Исп. ТО (КИПиА)', group: 'maintenance' },
      { key: 'maintenance.trKipContractor', label: 'Исп. ТР (КИПиА)', group: 'maintenance' },
      { key: 'maintenance.toAsuContractor', label: 'Исп. ТО (АСУ ТП)', group: 'maintenance' },
      { key: 'maintenance.toWeldContractor', label: 'Исп. ТО (Сварка)', group: 'maintenance' },
      { key: 'maintenance.trWeldContractor', label: 'Исп. ТР (Сварка)', group: 'maintenance' },
      { key: 'maintenance.krWeldContractor', label: 'Исп. КР (Сварка)', group: 'maintenance' },
      { key: 'maintenance.repairComplexityMech', label: 'Ремонтосложн. (Мех.)', group: 'maintenance' },
      { key: 'maintenance.repairComplexityElec', label: 'Ремонтосложн. (Энерг.)', group: 'maintenance' },
      { key: 'maintenance.repairComplexityKip', label: 'Ремонтосложн. (КИПиА)', group: 'maintenance' },
      { key: 'maintenance.repairComplexityAsu', label: 'Ремонтосложн. (АСУ ТП)', group: 'maintenance' },
      { key: 'maintenance.repairComplexityWeld', label: 'Ремонтосложн. (Сварка)', group: 'maintenance' },
    ],
  },
  {
    key: 'verification',
    label: 'Поверка',
    color: '#00B0F0',
    tags: [
      { key: 'verification.lastVerificationDate', label: 'Дата последней поверки', group: 'verification' },
      { key: 'verification.validUntilDate', label: 'Действительно до', group: 'verification' },
    ],
  },
  {
    key: 'safety',
    label: 'Промбезопасность',
    color: '#EAB308',
    tags: [
      { key: 'safety.isHazardousFacility', label: 'ОПО', group: 'safety' },
      { key: 'safety.isChemicalHazardous', label: 'ХОПО', group: 'safety' },
      { key: 'safety.isSafetyCritical', label: 'Влияние на безоп.', group: 'safety' },
      { key: 'safety.isNuclearInstallation', label: 'Ядерная установка', group: 'safety' },
      { key: 'safety.isEnvironmentalImpact', label: 'Влияние на ОС', group: 'safety' },
      { key: 'safety.isFireProtection', label: 'Пожарная безопасность', group: 'safety' },
      { key: 'safety.safetyClass', label: 'Класс безопасности', group: 'safety' },
      { key: 'safety.classificationCode', label: 'Код классификации', group: 'safety' },
      { key: 'safety.registrationNumber', label: 'Рег. номер', group: 'safety' },
      { key: 'safety.externalSupervisionAuthority', label: 'Внешний надзорный орган', group: 'safety' },
      { key: 'safety.internalSupervisionAuthority', label: 'Внутренний надзор', group: 'safety' },
    ],
  },
  {
    key: 'supervision',
    label: 'Надзор',
    color: '#00B050',
    tags: [
      { key: 'supervision.supervisionType', label: 'Вид надзора', group: 'supervision' },
      { key: 'supervision.nextSupervisionDate', label: 'Следующее освидет.', group: 'supervision' },
      { key: 'supervision.nextInspectionDate', label: 'Следующая проверка', group: 'supervision' },
      { key: 'supervision.nextDiagnosticsDate', label: 'Следующая диагност.', group: 'supervision' },
      { key: 'supervision.permittedOperationDate', label: 'Дата допуска к экспл.', group: 'supervision' },
    ],
  },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function createId(): string {
  return Math.random().toString(36).substring(2, 11)
}

function findTag(key: string): SearchTag | undefined {
  for (const group of tagGroups) {
    const tag = group.tags.find((t) => t.key === key)
    if (tag) return tag
  }
  return undefined
}

function getGroupColor(tagKey: string): string {
  for (const group of tagGroups) {
    if (group.tags.some((t) => t.key === tagKey)) {
      return group.color
    }
  }
  return '#6B7280'
}

const operatorOptions: { value: SearchCondition['operator']; label: string }[] = [
  { value: 'includes', label: 'содержит' },
  { value: 'excludes', label: 'не содержит' },
  { value: 'equals', label: 'равно' },
  { value: 'notEquals', label: 'не равно' },
]

// ── Component ────────────────────────────────────────────────────────────────

export default function EquipmentSearch({ onSearch, isSearching }: EquipmentSearchProps) {
  const [expanded, setExpanded] = useState(false)
  const [conditions, setConditions] = useState<SearchCondition[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [activeTagCloudGroup, setActiveTagCloudGroup] = useState('main')

  // ── Condition management ────────────────────────────────────────────────

  const addCondition = useCallback((tagKey: string) => {
    const tag = findTag(tagKey)
    if (!tag) return

    setConditions((prev) => {
      // Prevent duplicates
      if (prev.some((c) => c.field === tagKey)) return prev
      return [
        ...prev,
        {
          id: createId(),
          field: tagKey,
          label: tag.label,
          operator: 'includes',
          value: '',
        },
      ]
    })
  }, [])

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => {
      const next = prev.filter((c) => c.id !== conditionId)
      // Auto re-search with remaining conditions, or reset if empty
      const active = next.filter((c) => c.value.trim() !== '')
      onSearch(active)
      return next
    })
  }, [onSearch])

  const updateConditionOperator = useCallback(
    (conditionId: string, operator: SearchCondition['operator']) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === conditionId ? { ...c, operator } : c)),
      )
    },
    [],
  )

  const updateConditionValue = useCallback((conditionId: string, value: string) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === conditionId ? { ...c, value } : c)),
    )
  }, [])

  // ── Search actions ─────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    // Only include conditions that have a non-empty value
    const activeConditions = conditions.filter((c) => c.value.trim() !== '')
    onSearch(activeConditions)
  }, [conditions, onSearch])

  const handleReset = useCallback(() => {
    setConditions([])
    onSearch([])
  }, [onSearch])

  // ── Drag & Drop handlers ───────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, tagKey: string) => {
    e.dataTransfer.setData('text/plain', tagKey)
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set false if leaving the drop zone itself (not a child)
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const tagKey = e.dataTransfer.getData('text/plain')
      if (tagKey) {
        addCondition(tagKey)
      }
    },
    [addCondition],
  )

  // ── Tag click (alternative to drag) ────────────────────────────────────

  const handleTagClick = useCallback(
    (tagKey: string) => {
      addCondition(tagKey)
    },
    [addCondition],
  )

  // ── Helpers ────────────────────────────────────────────────────────────

  const activeConditionKeys = new Set(conditions.map((c) => c.field))

  const activeTagCloudGroupData = tagGroups.find(
    (g) => g.key === activeTagCloudGroup,
  )

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <Button
        variant="outline"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full justify-between gap-2 px-4"
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Search className="size-4" />
          Расширенный поиск
          {conditions.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-1 h-5 min-w-5 px-1.5 text-xs rounded-full"
            >
              {conditions.length}
            </Badge>
          )}
        </span>
        {expanded ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </Button>

      {/* Expanded Panel */}
      {expanded && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* ── Left Column: Tag Cloud ─────────────────────────────── */}
              <div className="lg:col-span-2 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Поля для поиска
                </h3>

                {/* Group Tabs */}
                <div className="flex flex-wrap gap-1">
                  {tagGroups.map((group) => {
                    const tagsInGroup = group.tags.length
                    const activeInGroup = group.tags.filter((t) =>
                      activeConditionKeys.has(t.key),
                    ).length
                    return (
                      <button
                        key={group.key}
                        onClick={() => setActiveTagCloudGroup(group.key)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          activeTagCloudGroup === group.key
                            ? 'bg-foreground text-background shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        title={group.label}
                      >
                        <span
                          className="size-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="hidden sm:inline max-w-[100px] truncate">
                          {group.label}
                        </span>
                        {activeInGroup > 0 && (
                          <span className="text-[10px] opacity-70">
                            ({activeInGroup}/{tagsInGroup})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Tags */}
                <ScrollArea className="h-[280px]">
                  {activeTagCloudGroupData && (
                    <div className="space-y-3 pr-3 pb-2">
                      <div
                        className="flex items-center gap-2 pb-1"
                        style={{ borderBottomColor: activeTagCloudGroupData.color }}
                      >
                        <span
                          className="size-3 rounded-sm shrink-0"
                          style={{ backgroundColor: activeTagCloudGroupData.color }}
                        />
                        <span className="text-sm font-semibold">
                          {activeTagCloudGroupData.label}
                        </span>
                        <Separator className="flex-1" />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {activeTagCloudGroupData.tags.map((tag) => {
                          const isUsed = activeConditionKeys.has(tag.key)
                          const color = activeTagCloudGroupData.color
                          return (
                            <button
                              key={tag.key}
                              draggable={!isUsed}
                              onDragStart={(e) => handleDragStart(e, tag.key)}
                              onClick={() => !isUsed && handleTagClick(tag.key)}
                              disabled={isUsed}
                              className={`
                                inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs
                                border transition-all select-none
                                ${
                                  isUsed
                                    ? 'opacity-40 cursor-not-allowed bg-muted border-muted'
                                    : 'cursor-grab hover:shadow-sm active:cursor-grabbing'
                                }
                              `}
                              style={
                                !isUsed
                                  ? {
                                      borderColor: color + '66',
                                      backgroundColor: color + '12',
                                      color: '#374151',
                                    }
                                  : undefined
                              }
                              title={
                                isUsed
                                  ? `${tag.label} — уже добавлено`
                                  : `Нажмите или перетащите: ${tag.label}`
                              }
                            >
                              {!isUsed && (
                                <GripVertical
                                  className="size-3 shrink-0 opacity-40"
                                  style={{ color }}
                                />
                              )}
                              {tag.label}
                              {isUsed && (
                                <span className="size-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* ── Right Column: Drop Zone ────────────────────────────── */}
              <div className="lg:col-span-3 space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Условия поиска
                </h3>

                {/* Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    min-h-[280px] rounded-lg border-2 border-dashed transition-all duration-200
                    ${
                      dragOver
                        ? 'border-orange-400 bg-orange-50/60 dark:bg-orange-950/20 scale-[1.005]'
                        : conditions.length === 0
                          ? 'border-muted-foreground/25 bg-muted/30'
                          : 'border-muted-foreground/15 bg-background'
                    }
                  `}
                >
                  {conditions.length === 0 && !dragOver ? (
                    <div className="flex flex-col items-center justify-center h-[260px] text-center px-4">
                      <div className="size-12 rounded-full bg-muted/80 flex items-center justify-center mb-3">
                        <Search className="size-5 text-muted-foreground/60" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Перетащите теги сюда или нажмите на них
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1 max-w-[250px]">
                        Выберите поля из облака тегов слева, чтобы построить
                        условие поиска
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {conditions.map((condition) => {
                        const color = getGroupColor(condition.field)
                        return (
                          <div
                            key={condition.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border bg-card p-2.5 shadow-sm transition-shadow hover:shadow"
                          >
                            {/* Field badge */}
                            <Badge
                              variant="outline"
                              className="shrink-0 text-xs font-medium border bg-background min-w-[120px] justify-center"
                              style={{
                                borderColor: color + '88',
                                color: '#1f2937',
                              }}
                            >
                              {condition.label}
                            </Badge>

                            {/* Operator */}
                            <Select
                              value={condition.operator}
                              onValueChange={(v) =>
                                updateConditionOperator(
                                  condition.id,
                                  v as SearchCondition['operator'],
                                )
                              }
                            >
                              <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operatorOptions.map((opt) => (
                                  <SelectItem
                                    key={opt.value}
                                    value={opt.value}
                                    className="text-xs"
                                  >
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Value input */}
                            <Input
                              placeholder='Используйте * для частичного совпадения'
                              value={condition.value}
                              onChange={(e) =>
                                updateConditionValue(
                                  condition.id,
                                  e.target.value,
                                )
                              }
                              className="flex-1 h-8 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSearch()
                                }
                              }}
                            />

                            {/* Remove button */}
                            <button
                              onClick={() => removeCondition(condition.id)}
                              className="shrink-0 rounded-md p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              title="Удалить условие"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )
                      })}

                      {/* Empty state (when all conditions were just removed) */}
                      {conditions.length === 0 && (
                        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                          <Search className="size-4 mr-2 opacity-50" />
                          Условия не заданы
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    disabled={conditions.length === 0}
                    className="gap-1.5 text-xs"
                  >
                    <X className="size-3.5" />
                    Сбросить
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSearch}
                    disabled={isSearching || conditions.length === 0}
                    className="gap-1.5 bg-orange-600 hover:bg-orange-700 text-xs"
                  >
                    <Search className="size-3.5" />
                    Найти
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
