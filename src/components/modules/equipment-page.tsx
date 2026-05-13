'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  Plus,
  Search,
  Upload,
  FileSpreadsheet,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Activity,
  Wrench,
  PowerOff,
  FileUp,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowLeft,
  Download,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  PencilLine,
  Trash,
  Columns3,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  GripVertical,
  BookmarkPlus,
  Bookmark,
  BookmarkCheck,
  Copy,
  PencilRuler,
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
import EquipmentCardPage from '@/components/modules/equipment-card'
import EquipmentSearch from '@/components/modules/equipment-search'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth-store'
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

interface EquipmentItem {
  id: string
  name: string
  code: string
  status: string
  criticality: string
  location: string | null
  manufacturer: string | null
  model: string | null
  department: { name: string; code: string } | null
  equipmentType: { name: string; code: string } | null
  // Extended scalar fields (returned by API)
  serialNumber: string | null
  inventoryNumber: string | null
  quantity: number | null
  unit: string | null
  drawing: string | null
  equipmentClass: string | null
  topazNumber: string | null
  sapNumber: number | null
  abcdCode: string | null
  costCenter: string | null
  manufactureDate: string | null
  decommissionDate: string | null
  commissionDate: string | null
  processImportance: string | null
  isKey: boolean
  isTest: boolean
  hasReserve: boolean
  parentEquipmentSap: number | null
  description: string | null
  // Parsed JSON fields
  locationData: LocationData | null
  responsibilityData: ResponsibilityData | null
  maintenanceData: MaintenanceData | null
  verificationData: VerificationData | null
  safetyData: SafetyData | null
  supervisionData: SupervisionData | null
}

interface Department {
  id: string
  name: string
  code: string
}

// ── JSON field type definitions (stored as JSON strings in DB) ──
interface LocationData {
  workshop?: string; building?: string; productionArea?: string; techArea?: string
  roomNumber?: string; roomName?: string; lineInstallation?: string
  elevationMark?: number; axisX1?: string; axisX2?: string; axisY1?: string; axisY2?: string
  projectNumber?: string; projectPosition?: string; span?: string; floor?: string
}
interface ResponsibilityData {
  responsibleWorkshop?: string; responsibleSpecialistService?: string
  responsiblePerson?: string; safetyResponsiblePerson?: string; materiallyResponsiblePerson?: string
}
interface MaintenanceData {
  toMechInterval?: number; trMechInterval?: number; krMechInterval?: number
  toElecInterval?: number; trElecInterval?: number; krElecInterval?: number
  toKipInterval?: number; trKipInterval?: number; krKipInterval?: number
  toAsuInterval?: number; trAsuInterval?: number; krAsuInterval?: number
  toWeldInterval?: number; trWeldInterval?: number; krWeldInterval?: number
  toMechContractor?: string; trMechContractor?: string; krMechContractor?: string
  toElecContractor?: string; trElecContractor?: string; krElecContractor?: string
  toKipContractor?: string; trKipContractor?: string; toAsuContractor?: string
  repairComplexityMech?: number; repairComplexityElec?: number
  repairComplexityKip?: number; repairComplexityAsu?: number; repairComplexityWeld?: number
  repairCycleStartDate?: string; shiftMode?: string
  laborConditionsFactor?: number; additionalRepairCoefficient?: number
}
interface VerificationData { lastVerificationDate?: string; validUntilDate?: string }
interface SafetyData {
  isHazardousFacility?: boolean; isChemicalHazardous?: boolean
  isSafetyCritical?: boolean; isNuclearInstallation?: boolean
  safetyNormativeDoc?: string; safetyClass?: number; classificationCode?: string
  isEnvironmentalImpact?: boolean; isFireProtection?: boolean
  externalSupervisionAuthority?: string; internalSupervisionAuthority?: string
  registrationNumber?: string; serviceLifeYears?: number; serviceLifeExpiryDate?: string
}
interface SupervisionData {
  supervisionType?: string; nextSupervisionDate?: string
  nextInspectionDate?: string; nextDiagnosticsDate?: string
  serviceLifeExtensionDocType?: string; serviceLifeExtensionDocNumber?: string
  permittedOperationDate?: string
}

function parseJSON<T>(str?: string | null): T | null {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    active: { label: 'Работает', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    under_repair: { label: 'В ремонте', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    decommissioned: { label: 'Списано', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const v = variants[status] || { label: status, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

function CriticalityBadge({ level }: { level: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    critical: { label: 'Критичное', className: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'Высокое', className: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'Среднее', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Низкое', className: 'bg-green-100 text-green-700 border-green-200' },
  }
  const v = variants[level] || { label: level, className: 'bg-secondary text-secondary-foreground' }
  return <Badge variant="outline" className={v.className}>{v.label}</Badge>
}

const emptyForm = {
  name: '',
  code: '',
  departmentId: '',
  equipmentTypeId: '',
  location: '',
  manufacturer: '',
  model: '',
  serialNumber: '',
  criticality: 'medium',
  description: '',
}

// ── Bulk Edit: field definitions ──────────────────────────
const BULK_EDITABLE_FIELDS = [
  // Основная информация
  { key: 'status', label: 'Статус', group: 'Основное', type: 'select', options: [{ value: 'active', label: 'В работе' }, { value: 'under_repair', label: 'В ремонте' }, { value: 'decommissioned', label: 'Списано' }] },
  { key: 'criticality', label: 'Критичность', group: 'Основное', type: 'select', options: [{ value: 'low', label: 'Низкое' }, { value: 'medium', label: 'Среднее' }, { value: 'high', label: 'Высокое' }, { value: 'critical', label: 'Критичное' }] },
  { key: 'departmentId', label: 'Подразделение', group: 'Основное', type: 'select-department', placeholder: 'Выберите подразделение...' },
  { key: 'location', label: 'Расположение', group: 'Основное', type: 'text', placeholder: 'Цех №1, пом. А' },
  { key: 'manufacturer', label: 'Производитель', group: 'Основное', type: 'text', placeholder: 'Название производителя' },
  { key: 'model', label: 'Модель', group: 'Основное', type: 'text', placeholder: 'Модель оборудования' },
  { key: 'description', label: 'Описание', group: 'Основное', type: 'text', placeholder: 'Описание...' },
  // Идентификация
  { key: 'serialNumber', label: 'Заводской номер', group: 'Идентификация', type: 'text', placeholder: 'SN-...' },
  { key: 'inventoryNumber', label: 'Инвентарный номер (бухг.)', group: 'Идентификация', type: 'text', placeholder: 'Инв. номер...' },
  { key: 'quantity', label: 'Количество', group: 'Идентификация', type: 'number', placeholder: '1' },
  { key: 'unit', label: 'Единица измерения', group: 'Идентификация', type: 'text', placeholder: 'шт' },
  { key: 'drawing', label: 'Чертёж', group: 'Идентификация', type: 'text', placeholder: 'Номер чертежа' },
  { key: 'equipmentClass', label: 'Класс оборудования', group: 'Идентификация', type: 'text', placeholder: 'А, Б, В...' },
  { key: 'abcdCode', label: 'ABCD код', group: 'Идентификация', type: 'select', options: [{ value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'D', label: 'D' }] },
  { key: 'costCenter', label: 'Центр затрат', group: 'Идентификация', type: 'text', placeholder: 'ЦЗ-...' },
  { key: 'topazNumber', label: 'Номер ТОПАЗ', group: 'Идентификация', type: 'text', placeholder: 'Номер ТОПАЗ' },
  // Флаги
  { key: 'isKey', label: 'Ключевое оборудование', group: 'Флаги', type: 'checkbox' },
  { key: 'isTest', label: 'Опытный образец', group: 'Флаги', type: 'checkbox' },
  { key: 'hasReserve', label: 'Имеется резерв', group: 'Флаги', type: 'checkbox' },
  // Даты
  { key: 'manufactureDate', label: 'Дата изготовления', group: 'Даты', type: 'date' },
  { key: 'decommissionDate', label: 'Дата списания', group: 'Даты', type: 'date' },
  { key: 'processImportance', label: 'Важность для процесса', group: 'Даты', type: 'text', placeholder: 'Важное / Среднее' },
] as const

const statusOptions = [
  { value: 'active', label: 'В работе', icon: Activity, className: 'text-emerald-600' },
  { value: 'under_repair', label: 'В ремонте', icon: Wrench, className: 'text-amber-600' },
  { value: 'decommissioned', label: 'Списано', icon: PowerOff, className: 'text-gray-500' },
]

// ── Table Column Definitions ──────────────────────────
// All columns are user-configurable: visible/hidden, reordered via drag or dialog.

type ColDef = {
  key: string
  label: string
  group: string
  /** Render function for the cell value. Returns ReactNode */
  render: (item: EquipmentItem) => React.ReactNode
}

function boolBadge(val: boolean | null | undefined) {
  if (val === true) return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Да</Badge>
  return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-xs">Нет</Badge>
}

function abcdBadge(val: string | null | undefined) {
  if (!val) return <span className="text-muted-foreground">—</span>
  const colors: Record<string, string> = { A: 'bg-red-50 text-red-700 border-red-200', B: 'bg-orange-50 text-orange-700 border-orange-200', C: 'bg-yellow-50 text-yellow-700 border-yellow-200', D: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  return <Badge variant="outline" className={`text-xs font-mono ${colors[val] || 'bg-secondary text-secondary-foreground'}`}>{val}</Badge>
}

function textOrDash(val: string | null | undefined) {
  return val ? <span className="text-sm truncate max-w-[180px] block" title={val}>{val}</span> : <span className="text-muted-foreground">—</span>
}

function numOrDash(val: number | null | undefined) {
  return val != null ? <span className="text-sm font-mono">{val}</span> : <span className="text-muted-foreground">—</span>
}

// ── JSON field accessors for table columns ──
function jTxt<K extends keyof EquipmentItem>(group: K, field: string) {
  return (item: EquipmentItem) => {
    const obj = item[group] as Record<string, unknown> | null
    return textOrDash(obj?.[field] as string | null | undefined)
  }
}
function jNum<K extends keyof EquipmentItem>(group: K, field: string) {
  return (item: EquipmentItem) => {
    const obj = item[group] as Record<string, unknown> | null
    return numOrDash(obj?.[field] as number | null | undefined)
  }
}
function jBool<K extends keyof EquipmentItem>(group: K, field: string) {
  return (item: EquipmentItem) => {
    const obj = item[group] as Record<string, unknown> | null
    return boolBadge(obj?.[field] as boolean | null | undefined)
  }
}

const ALL_COLUMNS: ColDef[] = [
  // Основное
  { key: 'code', label: 'Инв. номер', group: 'Основное', render: (item) => <span className="font-mono text-sm font-medium whitespace-nowrap">{item.code}</span> },
  { key: 'name', label: 'Наименование', group: 'Основное', render: (item) => <span className="font-medium">{item.name}</span> },
  { key: 'status', label: 'Статус', group: 'Основное', render: (item) => <StatusBadge status={item.status} /> },
  { key: 'criticality', label: 'Критичность', group: 'Основное', render: (item) => <CriticalityBadge level={item.criticality} /> },
  { key: 'department', label: 'Подразделение', group: 'Основное', render: (item) => <span className="text-sm">{item.department?.name || '—'}</span> },
  { key: 'equipmentType', label: 'Тип', group: 'Основное', render: (item) => <span className="text-muted-foreground text-sm">{item.equipmentType?.name || '—'}</span> },
  { key: 'location', label: 'Расположение', group: 'Основное', render: (item) => textOrDash(item.location) },
  { key: 'manufacturer', label: 'Производитель', group: 'Основное', render: (item) => textOrDash(item.manufacturer) },
  { key: 'model', label: 'Модель', group: 'Основное', render: (item) => textOrDash(item.model) },
  { key: 'description', label: 'Описание', group: 'Основное', render: (item) => textOrDash(item.description) },
  // Идентификация
  { key: 'serialNumber', label: 'Заводской номер', group: 'Идентификация', render: (item) => textOrDash(item.serialNumber) },
  { key: 'inventoryNumber', label: 'Инв. номер (бухг.)', group: 'Идентификация', render: (item) => textOrDash(item.inventoryNumber) },
  { key: 'abcdCode', label: 'ABCD код', group: 'Идентификация', render: (item) => abcdBadge(item.abcdCode) },
  { key: 'quantity', label: 'Количество', group: 'Идентификация', render: (item) => numOrDash(item.quantity) },
  { key: 'unit', label: 'ЕИ', group: 'Идентификация', render: (item) => textOrDash(item.unit) },
  { key: 'drawing', label: 'Чертёж', group: 'Идентификация', render: (item) => textOrDash(item.drawing) },
  { key: 'equipmentClass', label: 'Класс', group: 'Идентификация', render: (item) => textOrDash(item.equipmentClass) },
  { key: 'topazNumber', label: 'Номер ТОПАЗ', group: 'Идентификация', render: (item) => textOrDash(item.topazNumber) },
  { key: 'sapNumber', label: 'Номер SAP', group: 'Идентификация', render: (item) => numOrDash(item.sapNumber) },
  { key: 'costCenter', label: 'МВЗ', group: 'Идентификация', render: (item) => textOrDash(item.costCenter) },
  { key: 'parentEquipmentSap', label: 'Вышест. ЕО (SAP)', group: 'Идентификация', render: (item) => numOrDash(item.parentEquipmentSap) },
  // Флаги
  { key: 'isKey', label: 'Ключевое', group: 'Флаги', render: (item) => boolBadge(item.isKey) },
  { key: 'isTest', label: 'Опытный образец', group: 'Флаги', render: (item) => boolBadge(item.isTest) },
  { key: 'hasReserve', label: 'Наличие резерва', group: 'Флаги', render: (item) => boolBadge(item.hasReserve) },
  // Даты
  { key: 'commissionDate', label: 'Дата ввода в экспл.', group: 'Даты', render: (item) => textOrDash(item.commissionDate) },
  { key: 'manufactureDate', label: 'Дата изготовления', group: 'Даты', render: (item) => textOrDash(item.manufactureDate) },
  { key: 'decommissionDate', label: 'Дата списания', group: 'Даты', render: (item) => textOrDash(item.decommissionDate) },
  { key: 'processImportance', label: 'Важность для ТП', group: 'Прочее', render: (item) => textOrDash(item.processImportance) },
  // ── Местоположение (locationData) ──
  { key: 'loc_workshop', label: 'Цех', group: 'Местоположение', render: jTxt('locationData', 'workshop') },
  { key: 'loc_building', label: 'Здание', group: 'Местоположение', render: jTxt('locationData', 'building') },
  { key: 'loc_productionArea', label: 'Производственная зона', group: 'Местоположение', render: jTxt('locationData', 'productionArea') },
  { key: 'loc_techArea', label: 'Технологическая зона', group: 'Местоположение', render: jTxt('locationData', 'techArea') },
  { key: 'loc_roomNumber', label: 'Номер помещения', group: 'Местоположение', render: jTxt('locationData', 'roomNumber') },
  { key: 'loc_roomName', label: 'Наименование помещения', group: 'Местоположение', render: jTxt('locationData', 'roomName') },
  { key: 'loc_lineInstallation', label: 'Линия / установка', group: 'Местоположение', render: jTxt('locationData', 'lineInstallation') },
  { key: 'loc_elevationMark', label: 'Отметка', group: 'Местоположение', render: jNum('locationData', 'elevationMark') },
  { key: 'loc_axisX1', label: 'Ось X1', group: 'Местоположение', render: jTxt('locationData', 'axisX1') },
  { key: 'loc_axisX2', label: 'Ось X2', group: 'Местоположение', render: jTxt('locationData', 'axisX2') },
  { key: 'loc_axisY1', label: 'Ось Y1', group: 'Местоположение', render: jTxt('locationData', 'axisY1') },
  { key: 'loc_axisY2', label: 'Ось Y2', group: 'Местоположение', render: jTxt('locationData', 'axisY2') },
  { key: 'loc_projectNumber', label: 'Номер проекта', group: 'Местоположение', render: jTxt('locationData', 'projectNumber') },
  { key: 'loc_projectPosition', label: 'Позиция в проекте', group: 'Местоположение', render: jTxt('locationData', 'projectPosition') },
  { key: 'loc_span', label: 'Пролёт', group: 'Местоположение', render: jTxt('locationData', 'span') },
  { key: 'loc_floor', label: 'Этаж', group: 'Местоположение', render: jTxt('locationData', 'floor') },
  // ── Ответственность (responsibilityData) ──
  { key: 'resp_workshop', label: 'Ответственный цех', group: 'Ответственность', render: jTxt('responsibilityData', 'responsibleWorkshop') },
  { key: 'resp_specialistService', label: 'Ответственная спецслужба', group: 'Ответственность', render: jTxt('responsibilityData', 'responsibleSpecialistService') },
  { key: 'resp_person', label: 'Ответственное лицо', group: 'Ответственность', render: jTxt('responsibilityData', 'responsiblePerson') },
  { key: 'resp_safetyPerson', label: 'Ответств. по промбезопасности', group: 'Ответственность', render: jTxt('responsibilityData', 'safetyResponsiblePerson') },
  { key: 'resp_materialPerson', label: 'Материально ответств. лицо', group: 'Ответственность', render: jTxt('responsibilityData', 'materiallyResponsiblePerson') },
  // ── ТО и ремонты (maintenanceData) — Интервалы ──
  { key: 'maint_toMech', label: 'ТО механика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'toMechInterval') },
  { key: 'maint_trMech', label: 'ТР механика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'trMechInterval') },
  { key: 'maint_krMech', label: 'КР механика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'krMechInterval') },
  { key: 'maint_toElec', label: 'ТО электрика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'toElecInterval') },
  { key: 'maint_trElec', label: 'ТР электрика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'trElecInterval') },
  { key: 'maint_krElec', label: 'КР электрика (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'krElecInterval') },
  { key: 'maint_toKip', label: 'ТО КИП (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'toKipInterval') },
  { key: 'maint_trKip', label: 'ТР КИП (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'trKipInterval') },
  { key: 'maint_krKip', label: 'КР КИП (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'krKipInterval') },
  { key: 'maint_toAsu', label: 'ТО АСУ (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'toAsuInterval') },
  { key: 'maint_trAsu', label: 'ТР АСУ (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'trAsuInterval') },
  { key: 'maint_krAsu', label: 'КР АСУ (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'krAsuInterval') },
  { key: 'maint_toWeld', label: 'ТО сварка (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'toWeldInterval') },
  { key: 'maint_trWeld', label: 'ТР сварка (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'trWeldInterval') },
  { key: 'maint_krWeld', label: 'КР сварка (мес.)', group: 'ТО и ремонты', render: jNum('maintenanceData', 'krWeldInterval') },
  // ── ТО и ремонты — Подрядчики ──
  { key: 'maint_toMechC', label: 'Исп. ТО мех.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'toMechContractor') },
  { key: 'maint_trMechC', label: 'Исп. ТР мех.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'trMechContractor') },
  { key: 'maint_krMechC', label: 'Исп. КР мех.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'krMechContractor') },
  { key: 'maint_toElecC', label: 'Исп. ТО электр.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'toElecContractor') },
  { key: 'maint_trElecC', label: 'Исп. ТР электр.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'trElecContractor') },
  { key: 'maint_krElecC', label: 'Исп. КР электр.', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'krElecContractor') },
  { key: 'maint_toKipC', label: 'Исп. ТО КИП', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'toKipContractor') },
  { key: 'maint_trKipC', label: 'Исп. ТР КИП', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'trKipContractor') },
  { key: 'maint_toAsuC', label: 'Исп. ТО АСУ', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'toAsuContractor') },
  // ── ТО и ремонты — Ремонтосложность ──
  { key: 'maint_rcMech', label: 'Ремонтосложн. мех.', group: 'ТО и ремонты', render: jNum('maintenanceData', 'repairComplexityMech') },
  { key: 'maint_rcElec', label: 'Ремонтосложн. электр.', group: 'ТО и ремонты', render: jNum('maintenanceData', 'repairComplexityElec') },
  { key: 'maint_rcKip', label: 'Ремонтосложн. КИП', group: 'ТО и ремонты', render: jNum('maintenanceData', 'repairComplexityKip') },
  { key: 'maint_rcAsu', label: 'Ремонтосложн. АСУ', group: 'ТО и ремонты', render: jNum('maintenanceData', 'repairComplexityAsu') },
  { key: 'maint_rcWeld', label: 'Ремонтосложн. сварки', group: 'ТО и ремонты', render: jNum('maintenanceData', 'repairComplexityWeld') },
  // ── ТО и ремонты — Прочее ──
  { key: 'maint_cycleStart', label: 'Начало ремонтного цикла', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'repairCycleStartDate') },
  { key: 'maint_shiftMode', label: 'Режим сменности', group: 'ТО и ремонты', render: jTxt('maintenanceData', 'shiftMode') },
  { key: 'maint_laborFactor', label: 'Коэфф. условий труда', group: 'ТО и ремонты', render: jNum('maintenanceData', 'laborConditionsFactor') },
  { key: 'maint_addRepairCoeff', label: 'Доп. коэфф. ремонта', group: 'ТО и ремонты', render: jNum('maintenanceData', 'additionalRepairCoefficient') },
  // ── Поверка (verificationData) ──
  { key: 'ver_lastDate', label: 'Дата последней поверки', group: 'Поверка', render: jTxt('verificationData', 'lastVerificationDate') },
  { key: 'ver_validUntil', label: 'Действительно до', group: 'Поверка', render: jTxt('verificationData', 'validUntilDate') },
  // ── Промбезопасность (safetyData) ──
  { key: 'safe_hazardous', label: 'Опасный произв. объект', group: 'Промбезопасность', render: jBool('safetyData', 'isHazardousFacility') },
  { key: 'safe_chemical', label: 'Химически опасный', group: 'Промбезопасность', render: jBool('safetyData', 'isChemicalHazardous') },
  { key: 'safe_safetyCritical', label: 'Критичен для безопасности', group: 'Промбезопасность', render: jBool('safetyData', 'isSafetyCritical') },
  { key: 'safe_nuclear', label: 'Ядерная установка', group: 'Промбезопасность', render: jBool('safetyData', 'isNuclearInstallation') },
  { key: 'safe_normDoc', label: 'Нормативный документ', group: 'Промбезопасность', render: jTxt('safetyData', 'safetyNormativeDoc') },
  { key: 'safe_class', label: 'Класс безопасности', group: 'Промбезопасность', render: jNum('safetyData', 'safetyClass') },
  { key: 'safe_classCode', label: 'Код классификации', group: 'Промбезопасность', render: jTxt('safetyData', 'classificationCode') },
  { key: 'safe_envImpact', label: 'Воздействие на ОС', group: 'Промбезопасность', render: jBool('safetyData', 'isEnvironmentalImpact') },
  { key: 'safe_fireProtection', label: 'Противопожарная защита', group: 'Промбезопасность', render: jBool('safetyData', 'isFireProtection') },
  { key: 'safe_extAuthority', label: 'Внешний надзорный орган', group: 'Промбезопасность', render: jTxt('safetyData', 'externalSupervisionAuthority') },
  { key: 'safe_intAuthority', label: 'Внутренний надзорный орган', group: 'Промбезопасность', render: jTxt('safetyData', 'internalSupervisionAuthority') },
  { key: 'safe_regNumber', label: 'Рег. номер', group: 'Промбезопасность', render: jTxt('safetyData', 'registrationNumber') },
  { key: 'safe_serviceLifeYears', label: 'Срок службы (лет)', group: 'Промбезопасность', render: jNum('safetyData', 'serviceLifeYears') },
  { key: 'safe_serviceLifeExpiry', label: 'Окончание срока службы', group: 'Промбезопасность', render: jTxt('safetyData', 'serviceLifeExpiryDate') },
  // ── Надзор (supervisionData) ──
  { key: 'sup_type', label: 'Тип надзора', group: 'Надзор', render: jTxt('supervisionData', 'supervisionType') },
  { key: 'sup_nextSupervision', label: 'Следующий надзор', group: 'Надзор', render: jTxt('supervisionData', 'nextSupervisionDate') },
  { key: 'sup_nextInspection', label: 'Следующий осмотр', group: 'Надзор', render: jTxt('supervisionData', 'nextInspectionDate') },
  { key: 'sup_nextDiagnostics', label: 'Следующая диагностика', group: 'Надзор', render: jTxt('supervisionData', 'nextDiagnosticsDate') },
  { key: 'sup_extDocType', label: 'Тип документа продления', group: 'Надзор', render: jTxt('supervisionData', 'serviceLifeExtensionDocType') },
  { key: 'sup_extDocNumber', label: 'Номер документа продления', group: 'Надзор', render: jTxt('supervisionData', 'serviceLifeExtensionDocNumber') },
  { key: 'sup_permittedDate', label: 'Дата допуска к эксплуатации', group: 'Надзор', render: jTxt('supervisionData', 'permittedOperationDate') },
]

const COLUMN_GROUPS = ['Основное', 'Идентификация', 'Флаги', 'Даты', 'Прочее', 'Местоположение', 'Ответственность', 'ТО и ремонты', 'Поверка', 'Промбезопасность', 'Надзор']

const DEFAULT_VISIBLE_COLUMNS = ['code', 'name', 'status', 'criticality', 'department', 'equipmentType']

const STORAGE_KEY = 'eam-equipment-columns'
const PRESETS_STORAGE_KEY_PREFIX = 'eam-equipment-presets-'

// ── Column/Filter Presets ──────────────────────────
interface ViewPreset {
  id: string
  name: string
  columns: string[]
 search: string
  statusFilter: string
  sortKey: string | null
  sortDir: 'asc' | 'desc' | null
  colFilters: Record<string, string[]> // serialized Set
  advancedConditions: { field: string; operator: string; value: string }[]
  createdAt: number
  updatedAt: number
}

function loadPresets(userId: string): ViewPreset[] {
  try { return JSON.parse(localStorage.getItem(PRESETS_STORAGE_KEY_PREFIX + userId) || '[]') } catch { return [] }
}
function savePresetsToStorage(presets: ViewPreset[], userId: string) {
  try { localStorage.setItem(PRESETS_STORAGE_KEY_PREFIX + userId, JSON.stringify(presets)) } catch { /* ignore */ }
}

// ── Sortable Column Header (uses @dnd-kit) ──
function SortableColumnHeader({
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
  col: ColDef
  sortKey: string | null
  sortDir: 'asc' | 'desc' | null
  colFilters: Record<string, Set<string>>
  openColMenu: string | null
  setOpenColMenu: (key: string | null) => void
  setSortDirection: (key: string, dir: 'asc' | 'desc') => void
  clearFilter: (key: string) => void
  toggleFilterValue: (key: string, val: string) => void
  columnUniqueValues: Record<string, string[]>
  items: EquipmentItem[]
  cellText: (item: EquipmentItem, colKey: string) => string
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
        {/* Drag handle — dnd-kit listeners attached here */}
        <div
          className="cursor-grab active:cursor-grabbing px-0.5 -ml-0.5 shrink-0 text-muted-foreground/60 hover:text-muted-foreground transition-colors touch-none"
          {...attributes}
          {...listeners}
          title="Перетащить для изменения порядка"
        >
          <GripVertical className="size-3.5" />
        </div>
        {/* Clickable header content — sort, filter menu */}
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
            {/* Sort section */}
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
            {/* Filter section */}
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

export default function EquipmentPage() {
  const currentUser = useAuthStore((s) => s.user)
  const userId = currentUser?.id || '__anonymous__'
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [advancedSearching, setAdvancedSearching] = useState(false)
  const [hasAdvancedResults, setHasAdvancedResults] = useState(false)
  const [advancedResultCount, setAdvancedResultCount] = useState(0)
  // useRef for conditions — always current, no stale closure issues in async handlers
  const lastAdvancedConditionsRef = useRef<{ field: string; operator: string; value: string }[]>([])
  const hasAdvancedResultsRef = useRef(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<EquipmentItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Bulk edit dialog state
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [bulkEditFields, setBulkEditFields] = useState<{ field: string; value: string }[]>([])
  const [bulkEditSubmitting, setBulkEditSubmitting] = useState(false)

  // Bulk delete confirmation
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteSubmitting, setBulkDeleteSubmitting] = useState(false)

  // Import dialog state
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: number; errorDetails: string[] } | null>(null)
  const [importDragOver, setImportDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Column visibility state (persisted in localStorage, ORDER MATTERS) ──
  const [visibleOptionalCols, setVisibleOptionalCols] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_VISIBLE_COLUMNS
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Migration: if saved columns don't include 'code' or 'name', prepend them
          const hasCode = parsed.includes('code')
          const hasName = parsed.includes('name')
          if (!hasCode || !hasName) {
            const migrated = [...(hasName ? [] : ['name']), ...(hasCode ? [] : ['code']), ...parsed]
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
            return migrated
          }
          return parsed
        }
      }
    } catch { /* ignore */ }
    return DEFAULT_VISIBLE_COLUMNS
  })

  // activeColumns preserves the user-defined order from visibleOptionalCols
  const activeColumns = visibleOptionalCols
    .map((key) => ALL_COLUMNS.find((c) => c.key === key))
    .filter(Boolean) as typeof ALL_COLUMNS

  const saveColumns = useCallback((cols: string[]) => {
    setVisibleOptionalCols(cols)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cols)) } catch { /* ignore */ }
  }, [])

  const resetColumns = useCallback(() => {
    saveColumns(DEFAULT_VISIBLE_COLUMNS)
  }, [saveColumns])

  // ── Column selector dialog state ──
  const [columnDialogOpen, setColumnDialogOpen] = useState(false)
  // Edit-time copy: order on the left (selected), order on the right (available)
  const [colEditLeft, setColEditLeft] = useState<string[]>([])
  const [colEditRight, setColEditRight] = useState<string[]>([])
  const [colDragIdx, setColDragIdx] = useState<number | null>(null)

  const openColumnDialog = useCallback(() => {
    const selected = visibleOptionalCols.filter((k) => ALL_COLUMNS.some((c) => c.key === k))
    const available = COLUMN_GROUPS
      .flatMap((g) => ALL_COLUMNS.filter((c) => c.group === g).map((c) => c.key))
      .filter((k) => !selected.includes(k))
    setColEditLeft(selected)
    setColEditRight(available)
    setColumnDialogOpen(true)
  }, [visibleOptionalCols])

  const applyColumnDialog = useCallback(() => {
    saveColumns(colEditLeft)
    setColumnDialogOpen(false)
  }, [colEditLeft, saveColumns])

  // Move one item from right→left (add) or left→right (remove)
  const moveColToLeft = useCallback((key: string) => {
    setColEditLeft((l) => [...l, key])
    setColEditRight((r) => r.filter((k) => k !== key))
  }, [])

  const moveColToRight = useCallback((key: string) => {
    setColEditRight((r) => [...r, key])
    setColEditLeft((l) => l.filter((k) => k !== key))
  }, [])

  // Drag handlers for left list reordering (use ref to avoid stale closure)
  const colDragIdxRef = useRef<number | null>(null)
  const colDragStart = useCallback((idx: number) => {
    colDragIdxRef.current = idx
    setColDragIdx(idx)
  }, [])
  const colDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault()
    const fromIdx = colDragIdxRef.current
    if (fromIdx === null || fromIdx === idx) return
    setColEditLeft((prev) => {
      const arr = [...prev]
      const [moved] = arr.splice(fromIdx, 1)
      arr.splice(idx, 0, moved)
      return arr
    })
    colDragIdxRef.current = idx
    setColDragIdx(idx)
  }, [])
  const colDragEnd = useCallback(() => {
    colDragIdxRef.current = null
    setColDragIdx(null)
  }, [])

  // Move selected column up/down in left list
  const moveColUp = useCallback((idx: number) => {
    if (idx <= 0) return
    setColEditLeft((prev) => {
      const arr = [...prev]
      ;[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]]
      return arr
    })
  }, [])

  const moveColDown = useCallback((idx: number) => {
    setColEditLeft((prev) => {
      if (idx >= prev.length - 1) return prev
      const arr = [...prev]
      ;[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]]
      return arr
    })
  }, [])

  const visibleOptionalCount = visibleOptionalCols.length
  const [exporting, setExporting] = useState(false)

  // ── View Presets state ──
  const [presets, setPresets] = useState<ViewPreset[]>(() => loadPresets(userId))
  const [activePresetId, setActivePresetId] = useState<string | null>(null)

  // Reload presets when user changes (different user = different preset set)
  useEffect(() => {
    setPresets(loadPresets(userId))
    setActivePresetId(null)
  }, [userId])
  const [presetMenuOpen, setPresetMenuOpen] = useState(false)
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false)
  const [newPresetName, setNewPresetName] = useState('')
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)

  const persistPresets = useCallback((next: ViewPreset[]) => {
    setPresets(next)
    savePresetsToStorage(next, userId)
  }, [userId])

  // Build a snapshot of the current view state (plain fn to avoid TDZ with later-declared sortKey/sortDir/colFilters)
  const captureCurrentView = (): Omit<ViewPreset, 'id' | 'name' | 'createdAt' | 'updatedAt'> => {
    return {
      columns: [...visibleOptionalCols],
      search,
      statusFilter,
      sortKey,
      sortDir,
      colFilters: Object.fromEntries(Object.entries(colFilters).map(([k, v]) => [k, [...v]])),
      advancedConditions: [...lastAdvancedConditionsRef.current],
    }
  }

  // Plain fn to avoid TDZ with later-declared handleAdvancedSearch / setSortKey / setSortDir / setColFilters
  const applyPreset = (preset: ViewPreset) => {
    // Columns
    saveColumns(preset.columns)
    // Search
    setSearch(preset.search)
    setStatusFilter(preset.statusFilter)
    // Sort
    setSortKey(preset.sortKey)
    setSortDir(preset.sortDir)
    // Column filters
    const restoredFilters: Record<string, Set<string>> = {}
    Object.entries(preset.colFilters).forEach(([k, vals]) => {
      if (vals.length > 0) restoredFilters[k] = new Set(vals)
    })
    setColFilters(restoredFilters)
    // Advanced conditions — re-run search
    if (preset.advancedConditions.length > 0) {
      lastAdvancedConditionsRef.current = preset.advancedConditions
      handleAdvancedSearch(preset.advancedConditions)
    }
    setActivePresetId(preset.id)
    setPresetMenuOpen(false)
    toast.success(`Пресет «${preset.name}» применён`)
  }

  const saveNewPreset = useCallback(() => {
    const name = newPresetName.trim()
    if (!name) return
    const view = captureCurrentView()
    const now = Date.now()
    const preset: ViewPreset = {
      id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      ...view,
      createdAt: now,
      updatedAt: now,
    }
    const next = [...presets, preset]
    persistPresets(next)
    setActivePresetId(preset.id)
    setNewPresetName('')
    setSavePresetDialogOpen(false)
    setPresetMenuOpen(false)
    toast.success(`Пресет «${name}» сохранён`)
  }, [newPresetName, presets, persistPresets])

  const updateCurrentPreset = useCallback(() => {
    if (!activePresetId) return
    const preset = presets.find((p) => p.id === activePresetId)
    if (!preset) return
    const view = captureCurrentView()
    const next = presets.map((p) => p.id === activePresetId ? { ...p, ...view, updatedAt: Date.now() } : p)
    persistPresets(next)
    setPresetMenuOpen(false)
    toast.success(`Пресет «${preset.name}» обновлён`)
  }, [activePresetId, presets, persistPresets])

  const deletePreset = useCallback((id: string) => {
    const preset = presets.find((p) => p.id === id)
    const next = presets.filter((p) => p.id !== id)
    persistPresets(next)
    if (activePresetId === id) setActivePresetId(null)
    setPresetMenuOpen(false)
    if (preset) toast.success(`Пресет «${preset.name}» удалён`)
  }, [presets, activePresetId, persistPresets])

  const openSaveDialog = useCallback((editId?: string) => {
    if (editId) {
      const p = presets.find((pr) => pr.id === editId)
      setNewPresetName(p?.name || '')
      setEditingPresetId(editId)
    } else {
      setNewPresetName('')
      setEditingPresetId(null)
    }
    setSavePresetDialogOpen(true)
  }, [presets])

  const renamePreset = useCallback(() => {
    if (!editingPresetId || !newPresetName.trim()) return
    const next = presets.map((p) => p.id === editingPresetId ? { ...p, name: newPresetName.trim(), updatedAt: Date.now() } : p)
    persistPresets(next)
    setNewPresetName('')
    setEditingPresetId(null)
    setSavePresetDialogOpen(false)
    setPresetMenuOpen(false)
    toast.success('Пресет переименован')
  }, [editingPresetId, newPresetName, presets, persistPresets])

  const duplicatePreset = useCallback((id: string) => {
    const preset = presets.find((p) => p.id === id)
    if (!preset) return
    const now = Date.now()
    const copy: ViewPreset = {
      ...preset,
      id: `p_${now}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${preset.name} (копия)`,
      createdAt: now,
      updatedAt: now,
    }
    persistPresets([...presets, copy])
    setPresetMenuOpen(false)
    toast.success(`Пресет «${copy.name}» создан`)
  }, [presets, persistPresets])

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

    setVisibleOptionalCols((prev) => {
      const oldIdx = prev.indexOf(active.id as string)
      const newIdx = prev.indexOf(over.id as string)
      if (oldIdx === -1 || newIdx === -1) return prev
      const arr = arrayMove(prev, oldIdx, newIdx)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(arr)) } catch { /* ignore */ }
      return arr
    })
    toast.success('Столбец перемещён')
  }, [])

  // Build a mapping from colKey to its JSON group.field for extracting raw values
  const colKeyToJsonPath = useMemo(() => {
    const map: Record<string, { group: keyof EquipmentItem; field: string }> = {}
    ALL_COLUMNS.forEach((c) => {
      // Parse the render function's actual JSON field path from jTxt/jNum/jBool calls
      // The render functions are closures created by jTxt, jNum, jBool, which store group and field
      // We'll extract from the column key naming convention instead
      const m = c.key.match(/^(loc|resp|maint|ver|safe|sup)_(.+)$/)
      if (m) {
        const prefixMap: Record<string, keyof EquipmentItem> = { loc: 'locationData', resp: 'responsibilityData', maint: 'maintenanceData', ver: 'verificationData', safe: 'safetyData', sup: 'supervisionData' }
        map[c.key] = { group: prefixMap[m[1]], field: m[2] }
      }
    })
    // Fix: override specific keys where the key name doesn't match the JSON field name
    const overrides: Record<string, { group: keyof EquipmentItem; field: string }> = {
      // Responsibility
      'resp_workshop': { group: 'responsibilityData', field: 'responsibleWorkshop' },
      'resp_specialistService': { group: 'responsibilityData', field: 'responsibleSpecialistService' },
      'resp_person': { group: 'responsibilityData', field: 'responsiblePerson' },
      'resp_safetyPerson': { group: 'responsibilityData', field: 'safetyResponsiblePerson' },
      'resp_materialPerson': { group: 'responsibilityData', field: 'materiallyResponsiblePerson' },
      // Maintenance intervals
      'maint_toMech': { group: 'maintenanceData', field: 'toMechInterval' },
      'maint_trMech': { group: 'maintenanceData', field: 'trMechInterval' },
      'maint_krMech': { group: 'maintenanceData', field: 'krMechInterval' },
      'maint_toElec': { group: 'maintenanceData', field: 'toElecInterval' },
      'maint_trElec': { group: 'maintenanceData', field: 'trElecInterval' },
      'maint_krElec': { group: 'maintenanceData', field: 'krElecInterval' },
      'maint_toKip': { group: 'maintenanceData', field: 'toKipInterval' },
      'maint_trKip': { group: 'maintenanceData', field: 'trKipInterval' },
      'maint_krKip': { group: 'maintenanceData', field: 'krKipInterval' },
      'maint_toAsu': { group: 'maintenanceData', field: 'toAsuInterval' },
      'maint_trAsu': { group: 'maintenanceData', field: 'trAsuInterval' },
      'maint_krAsu': { group: 'maintenanceData', field: 'krAsuInterval' },
      'maint_toWeld': { group: 'maintenanceData', field: 'toWeldInterval' },
      'maint_trWeld': { group: 'maintenanceData', field: 'trWeldInterval' },
      'maint_krWeld': { group: 'maintenanceData', field: 'krWeldInterval' },
      // Maintenance contractors
      'maint_toMechC': { group: 'maintenanceData', field: 'toMechContractor' },
      'maint_trMechC': { group: 'maintenanceData', field: 'trMechContractor' },
      'maint_krMechC': { group: 'maintenanceData', field: 'krMechContractor' },
      'maint_toElecC': { group: 'maintenanceData', field: 'toElecContractor' },
      'maint_trElecC': { group: 'maintenanceData', field: 'trElecContractor' },
      'maint_krElecC': { group: 'maintenanceData', field: 'krElecContractor' },
      'maint_toKipC': { group: 'maintenanceData', field: 'toKipContractor' },
      'maint_trKipC': { group: 'maintenanceData', field: 'trKipContractor' },
      'maint_toAsuC': { group: 'maintenanceData', field: 'toAsuContractor' },
      // Maintenance complexity
      'maint_rcMech': { group: 'maintenanceData', field: 'repairComplexityMech' },
      'maint_rcElec': { group: 'maintenanceData', field: 'repairComplexityElec' },
      'maint_rcKip': { group: 'maintenanceData', field: 'repairComplexityKip' },
      'maint_rcAsu': { group: 'maintenanceData', field: 'repairComplexityAsu' },
      'maint_rcWeld': { group: 'maintenanceData', field: 'repairComplexityWeld' },
      // Maintenance other
      'maint_cycleStart': { group: 'maintenanceData', field: 'repairCycleStartDate' },
      'maint_shiftMode': { group: 'maintenanceData', field: 'shiftMode' },
      'maint_laborFactor': { group: 'maintenanceData', field: 'laborConditionsFactor' },
      'maint_addRepairCoeff': { group: 'maintenanceData', field: 'additionalRepairCoefficient' },
      // Verification
      'ver_lastDate': { group: 'verificationData', field: 'lastVerificationDate' },
      'ver_validUntil': { group: 'verificationData', field: 'validUntilDate' },
      // Safety
      'safe_hazardous': { group: 'safetyData', field: 'isHazardousFacility' },
      'safe_chemical': { group: 'safetyData', field: 'isChemicalHazardous' },
      'safe_safetyCritical': { group: 'safetyData', field: 'isSafetyCritical' },
      'safe_nuclear': { group: 'safetyData', field: 'isNuclearInstallation' },
      'safe_normDoc': { group: 'safetyData', field: 'safetyNormativeDoc' },
      'safe_class': { group: 'safetyData', field: 'safetyClass' },
      'safe_classCode': { group: 'safetyData', field: 'classificationCode' },
      'safe_envImpact': { group: 'safetyData', field: 'isEnvironmentalImpact' },
      'safe_fireProtection': { group: 'safetyData', field: 'isFireProtection' },
      'safe_extAuthority': { group: 'safetyData', field: 'externalSupervisionAuthority' },
      'safe_intAuthority': { group: 'safetyData', field: 'internalSupervisionAuthority' },
      'safe_regNumber': { group: 'safetyData', field: 'registrationNumber' },
      'safe_serviceLifeYears': { group: 'safetyData', field: 'serviceLifeYears' },
      'safe_serviceLifeExpiry': { group: 'safetyData', field: 'serviceLifeExpiryDate' },
      // Supervision
      'sup_type': { group: 'supervisionData', field: 'supervisionType' },
      'sup_nextSupervision': { group: 'supervisionData', field: 'nextSupervisionDate' },
      'sup_nextInspection': { group: 'supervisionData', field: 'nextInspectionDate' },
      'sup_nextDiagnostics': { group: 'supervisionData', field: 'nextDiagnosticsDate' },
      'sup_extDocType': { group: 'supervisionData', field: 'serviceLifeExtensionDocType' },
      'sup_extDocNumber': { group: 'supervisionData', field: 'serviceLifeExtensionDocNumber' },
      'sup_permittedDate': { group: 'supervisionData', field: 'permittedOperationDate' },
    }
    Object.assign(map, overrides)
    return map
  }, [])

  // Extract plain text from an item for a given column key (used for sort & filter)
  const cellText = useCallback((item: EquipmentItem, colKey: string): string => {
    try {
      if (colKey === 'status') {
        const map: Record<string, string> = { active: 'Работает', under_repair: 'В ремонте', decommissioned: 'Списано' }
        return map[item.status] || item.status || ''
      }
      if (colKey === 'criticality') {
        const map: Record<string, string> = { critical: 'Критичное', high: 'Высокое', medium: 'Среднее', low: 'Низкое' }
        return map[item.criticality] || item.criticality || ''
      }
      if (colKey === 'department') return (item.department && item.department.name) || ''
      if (colKey === 'equipmentType') return (item.equipmentType && item.equipmentType.name) || ''
      if (colKey === 'code') return item.code || ''
      if (colKey === 'name') return item.name || ''
      const boolKeys = ['isKey', 'isTest', 'hasReserve']
      if (boolKeys.includes(colKey)) {
        const val = (item as Record<string, unknown>)[colKey]
        return val ? 'Да' : 'Нет'
      }
      // JSON field extraction
      const jp = colKeyToJsonPath[colKey]
      if (jp) {
        const obj = item[jp.group] as Record<string, unknown> | null | undefined
        if (obj && typeof obj === 'object' && jp.field in obj) {
          const raw = obj[jp.field]
          if (raw == null) return ''
          if (typeof raw === 'boolean') return raw ? 'Да' : 'Нет'
          return String(raw)
        }
        return ''
      }
      // Scalar field fallback
      const v = (item as Record<string, unknown>)[colKey]
      if (v == null) return ''
      if (typeof v === 'boolean') return v ? 'Да' : 'Нет'
      if (typeof v === 'object') return ''
      return String(v)
    } catch {
      return ''
    }
  }, [colKeyToJsonPath])

  const toggleSort = useCallback((key: string) => {
    if (sortKey === key) {
      // Cycle: asc → desc → null
      if (sortDir === 'asc') setSortDir('desc')
      else if (sortDir === 'desc') { setSortKey(null); setSortDir(null) }
      else setSortDir('asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey, sortDir])

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
      const allCols = activeColumns
      allCols.forEach((col) => {
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
      // Apply column filters
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
      // Apply sort
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

  // Keep a ref that always mirrors the latest selectedIds (avoids stale closures in async callbacks)
  const selectedIdsRef = useRef<Set<string>>(new Set())
  selectedIdsRef.current = selectedIds

  // ── Excel Export (server-side via API — no xlsx on client) ──
  // If checkboxes are selected → export only checked rows; otherwise → export all
  const handleExportExcel = useCallback(async () => {
    if (displayItems.length === 0) {
      toast.error('Нет данных для экспорта')
      return
    }
    const currentSelection = selectedIdsRef.current
    const exportItems = currentSelection.size > 0
      ? displayItems.filter((item) => currentSelection.has(item.id))
      : displayItems
    if (exportItems.length === 0) {
      toast.error('Нет выбранных записей для экспорта')
      return
    }
    setExporting(true)
    try {
      const cols = activeColumns
      const headers = cols.map((c) => c.label)
      const rows = exportItems.map((item) =>
        cols.map((c) => cellText(item, c.key))
      )
      const res = await fetch('/api/equipment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headers, rows }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const now = new Date()
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`
      a.download = `equipment_${ts}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      const total = displayItems.length
      toast.success(currentSelection.size > 0
        ? `Экспортировано ${exportItems.length} из ${total} записей`
        : `Экспортировано ${total} записей`)
    } catch (err) {
      console.error('Export error:', err)
      toast.error('Ошибка при экспорте')
    } finally {
      setExporting(false)
    }
  }, [displayItems, activeColumns, cellText])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectAll(false)
  }, [])

  const toggleSelectItem = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        setSelectAll(false)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    if (selectAll || selectedIds.size === items.length) {
      setSelectedIds(new Set())
      setSelectAll(false)
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)))
      setSelectAll(true)
    }
  }, [selectAll, selectedIds.size, items])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setHasAdvancedResults(false)
    clearSelection()
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/equipment?${params}`)
      if (res.ok) {
        const data = await res.json()
        // Parse JSON string fields into objects for table column rendering
        const parsed = (data.items || []).map((item: Record<string, unknown>) => ({
          ...item,
          locationData: parseJSON<LocationData>(item.locationData as string | null),
          responsibilityData: parseJSON<ResponsibilityData>(item.responsibilityData as string | null),
          maintenanceData: parseJSON<MaintenanceData>(item.maintenanceData as string | null),
          verificationData: parseJSON<VerificationData>(item.verificationData as string | null),
          safetyData: parseJSON<SafetyData>(item.safetyData as string | null),
          supervisionData: parseJSON<SupervisionData>(item.supervisionData as string | null),
        }))
        setItems(parsed as EquipmentItem[])
      } else if (res.status === 401) {
        // Session expired — will be handled by page.tsx session verification
        console.warn('Equipment fetch: 401 unauthorized')
      } else {
        console.error('Equipment fetch failed:', res.status)
      }
    } catch (err) {
      console.error('Equipment fetch error:', err)
      toast.error('Ошибка загрузки оборудования')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  const handleAdvancedSearch = useCallback(async (conditions: { field: string; operator: string; value: string }[]) => {
    if (conditions.length === 0) {
      setHasAdvancedResults(false)
      setAdvancedResultCount(0)
      lastAdvancedConditionsRef.current = []
      hasAdvancedResultsRef.current = false
 // Reset to full list by fetching without text search
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
        const res = await fetch(`/api/equipment?${params}`)
        if (res.ok) {
          const data = await res.json()
          const parsed = (data.items || []).map((item: Record<string, unknown>) => ({
            ...item,
            locationData: parseJSON<LocationData>(item.locationData as string | null),
            responsibilityData: parseJSON<ResponsibilityData>(item.responsibilityData as string | null),
            maintenanceData: parseJSON<MaintenanceData>(item.maintenanceData as string | null),
            verificationData: parseJSON<VerificationData>(item.verificationData as string | null),
            safetyData: parseJSON<SafetyData>(item.safetyData as string | null),
            supervisionData: parseJSON<SupervisionData>(item.supervisionData as string | null),
          }))
          setItems(parsed as EquipmentItem[])
        }
      } catch { /* silent */ } finally {
        setLoading(false)
      }
      return
    }
    setAdvancedSearching(true)
    clearSelection()
    try {
      const res = await fetch('/api/equipment/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditions }),
      })
      if (res.ok) {
        const data = await res.json()
        const parsed = (data.items || []).map((item: Record<string, unknown>) => ({
          ...item,
          locationData: parseJSON<LocationData>(item.locationData as string | null),
          responsibilityData: parseJSON<ResponsibilityData>(item.responsibilityData as string | null),
          maintenanceData: parseJSON<MaintenanceData>(item.maintenanceData as string | null),
          verificationData: parseJSON<VerificationData>(item.verificationData as string | null),
          safetyData: parseJSON<SafetyData>(item.safetyData as string | null),
          supervisionData: parseJSON<SupervisionData>(item.supervisionData as string | null),
        }))
        setItems(parsed as EquipmentItem[])
        setHasAdvancedResults(true)
        setAdvancedResultCount(data.total || 0)
        lastAdvancedConditionsRef.current = conditions
        hasAdvancedResultsRef.current = true
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка поиска')
      }
    } catch {
      toast.error('Ошибка сети при поиске')
    } finally {
      setAdvancedSearching(false)
    }
  }, [statusFilter])

  const fetchLookups = useCallback(async () => {
    try {
      const res = await fetch('/api/personnel')
      if (res.ok) {
        const data = await res.json()
        setDepartments((data.departments || []).map((d: { id: string; name: string; code: string }) => ({ id: d.id, name: d.name, code: d.code })))
      }
    } catch {
      // silent
    }
  }, [])

  // Initial load (runs once)
  useEffect(() => {
    fetchItems()
    fetchLookups()
  }, [])

  // Re-fetch when simple search or status changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems()
    })
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error('Укажите наименование и инвентарный номер')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success('Оборудование успешно добавлено')
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

  // ── Row click → open detail page ──────────────────────

  const openEquipmentDetail = (id: string) => {
    setSelectedEquipmentId(id)
  }

  const closeEquipmentDetail = () => {
    setSelectedEquipmentId(null)
  }

  // ── Delete handlers ────────────────────────────────────────

  const handleDelete = (item: EquipmentItem) => {
    setDeleteItem(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch('/api/equipment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItem.id }),
      })
      if (res.ok) {
        toast.success(`Оборудование «${deleteItem.name}» удалено`)
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

  // ── Import handlers ──────────────────────────────────────

  const handleImportOpen = () => {
    setImportFile(null)
    setImportResult(null)
    setImportSubmitting(false)
    setImportDialogOpen(true)
  }

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'csv') {
      toast.error('Поддерживаются только файлы .xlsx и .csv')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Файл слишком большой (максимум 5 МБ)')
      return
    }
    setImportFile(file)
    setImportResult(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImportDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImportDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setImportDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleImportSubmit = async () => {
    if (!importFile) {
      toast.error('Выберите файл для импорта')
      return
    }
    setImportSubmitting(true)
    setImportResult(null)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const res = await fetch('/api/equipment/import', {
        method: 'POST',
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setImportResult(data)
        toast.success(`Импортировано: ${data.imported}, пропущено: ${data.skipped}, ошибок: ${data.errors}`)
        fetchItems()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Ошибка при импорте')
      }
    } catch {
      toast.error('Ошибка сети при импорте')
    } finally {
      setImportSubmitting(false)
    }
  }

  // ── Bulk Edit handler ──────────────────────────────

  const handleBulkEditSubmit = async () => {
    if (bulkEditFields.length === 0 || selectedIds.size === 0) return
    const updates: Record<string, unknown> = {}
    for (const bf of bulkEditFields) {
      if (bf.value === '' || bf.value === undefined) continue
      // Boolean fields
      if (bf.field === 'isKey' || bf.field === 'isTest' || bf.field === 'hasReserve') {
        updates[bf.field] = bf.value === 'true'
      } else if (bf.field === 'quantity') {
        updates[bf.field] = parseInt(bf.value) || null
      } else {
        updates[bf.field] = bf.value
      }
    }
    if (Object.keys(updates).length === 0) {
      toast.error('Заполните хотя бы одно поле')
      return
    }

    setBulkEditSubmitting(true)
    try {
      const res = await fetch('/api/equipment/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), updates }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Обновлено ${data.updated} объектов`)
        setBulkEditDialogOpen(false)
        clearSelection()
        // Re-trigger current search to preserve filtered results
        if (hasAdvancedResultsRef.current && lastAdvancedConditionsRef.current.length > 0) {
          setAdvancedSearching(true)
          try {
            const searchRes = await fetch('/api/equipment/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ conditions: lastAdvancedConditionsRef.current }),
            })
            if (searchRes.ok) {
              const refreshData = await searchRes.json()
              const reparsed = (refreshData.items || []).map((item: Record<string, unknown>) => ({
                ...item,
                locationData: parseJSON<LocationData>(item.locationData as string | null),
                responsibilityData: parseJSON<ResponsibilityData>(item.responsibilityData as string | null),
                maintenanceData: parseJSON<MaintenanceData>(item.maintenanceData as string | null),
                verificationData: parseJSON<VerificationData>(item.verificationData as string | null),
                safetyData: parseJSON<SafetyData>(item.safetyData as string | null),
                supervisionData: parseJSON<SupervisionData>(item.supervisionData as string | null),
              }))
              setItems(reparsed as EquipmentItem[])
              setAdvancedResultCount(refreshData.total || 0)
            }
          } catch { /* silent */ } finally {
            setAdvancedSearching(false)
          }
        } else {
          fetchItems()
        }
      } else {
        const errData = await res.json()
        toast.error(errData.error || 'Ошибка массового обновления')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setBulkEditSubmitting(false)
    }
  }

  // ── Bulk Delete handler ──────────────────────────────

  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleteSubmitting(true)
    try {
      let deleted = 0
      for (const id of Array.from(selectedIds)) {
        const res = await fetch('/api/equipment', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        if (res.ok) deleted++
      }
      toast.success(`Удалено ${deleted} объектов`)
      setBulkDeleteDialogOpen(false)
      clearSelection()
      // Re-trigger current search to preserve filtered results
      if (hasAdvancedResultsRef.current && lastAdvancedConditionsRef.current.length > 0) {
        setAdvancedSearching(true)
        try {
          const searchRes = await fetch('/api/equipment/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conditions: lastAdvancedConditionsRef.current }),
          })
          if (searchRes.ok) {
            const refreshData = await searchRes.json()
            const reparsed = (refreshData.items || []).map((item: Record<string, unknown>) => ({
              ...item,
              locationData: parseJSON<LocationData>(item.locationData as string | null),
              responsibilityData: parseJSON<ResponsibilityData>(item.responsibilityData as string | null),
              maintenanceData: parseJSON<MaintenanceData>(item.maintenanceData as string | null),
              verificationData: parseJSON<VerificationData>(item.verificationData as string | null),
              safetyData: parseJSON<SafetyData>(item.safetyData as string | null),
              supervisionData: parseJSON<SupervisionData>(item.supervisionData as string | null),
            }))
            setItems(reparsed as EquipmentItem[])
            setAdvancedResultCount(refreshData.total || 0)
          }
        } catch { /* silent */ } finally {
          setAdvancedSearching(false)
        }
      } else {
        fetchItems()
      }
    } catch {
      toast.error('Ошибка при удалении')
    } finally {
      setBulkDeleteSubmitting(false)
    }
  }

  // ── Import handlers ──────────────────────────────────────

  const handleImportClose = () => {
    setImportDialogOpen(false)
    setImportFile(null)
    setImportResult(null)
    setImportSubmitting(false)
  }

  // ── If viewing a specific equipment, show its detail page ──

  if (selectedEquipmentId) {
    return (
      <EquipmentCardPage
        equipmentId={selectedEquipmentId}
        onBack={closeEquipmentDetail}
        onDeleted={() => {
          closeEquipmentDetail()
          fetchItems()
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl font-semibold">Оборудование</h1>
        <p className="text-sm text-muted-foreground">
          Классификатор объектов предприятия
        </p>
      </div>

      {/* Advanced Search */}
      <div className="shrink-0">
        <EquipmentSearch onSearch={handleAdvancedSearch} isSearching={advancedSearching} />
      </div>

      {/* Search result badge + bulk action bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0 shrink-0">
        <div className="flex items-center gap-2">
          {hasAdvancedResults && (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 gap-1">
              <Search className="size-3" />
              Расширенный поиск: найдено {advancedResultCount}
            </Badge>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 gap-1 font-medium">
              <CheckSquare className="size-3" />
              Выбрано: {selectedIds.size}
            </Badge>
            <Button
              size="sm"
              className="gap-1.5 bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setBulkEditFields([])
                setBulkEditDialogOpen(true)
              }}
            >
              <PencilLine className="size-3.5" />
              Массовое редактирование
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5"
              onClick={() => setBulkDeleteDialogOpen(true)}
            >
              <Trash className="size-3.5" />
              Удалить ({selectedIds.size})
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0 shrink-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center min-w-0">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-orange-600 hover:bg-orange-700">
                <Plus className="size-4" />
                Добавить оборудование
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
              <DialogHeader>
                <DialogTitle>Добавить оборудование</DialogTitle>
                <DialogDescription>
                  Заполните данные о новом оборудовании
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eq-name">Наименование *</Label>
                    <Input id="eq-name" value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="Насос центробежный" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eq-code">Инв. номер *</Label>
                    <Input id="eq-code" value={form.code} onChange={(e) => updateField('code', e.target.value)} placeholder="Н-201" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Подразделение</Label>
                    <Select value={form.departmentId} onValueChange={(v) => updateField('departmentId', v)}>
                      <SelectTrigger><SelectValue placeholder="Выберите" /></SelectTrigger>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Критичность</Label>
                    <Select value={form.criticality} onValueChange={(v) => updateField('criticality', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкое</SelectItem>
                        <SelectItem value="medium">Среднее</SelectItem>
                        <SelectItem value="high">Высокое</SelectItem>
                        <SelectItem value="critical">Критичное</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eq-manufacturer">Производитель</Label>
                    <Input id="eq-manufacturer" value={form.manufacturer} onChange={(e) => updateField('manufacturer', e.target.value)} placeholder="ГМС Насосы" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eq-model">Модель</Label>
                    <Input id="eq-model" value={form.model} onChange={(e) => updateField('model', e.target.value)} placeholder="ЦН-200/300" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eq-location">Расположение</Label>
                    <Input id="eq-location" value={form.location} onChange={(e) => updateField('location', e.target.value)} placeholder="Цех №1, пом. А" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eq-serial">Заводской номер</Label>
                    <Input id="eq-serial" value={form.serialNumber} onChange={(e) => updateField('serialNumber', e.target.value)} placeholder="SN-2019-00451" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eq-desc">Описание</Label>
                  <Textarea id="eq-desc" value={form.description} onChange={(e) => updateField('description', e.target.value)} placeholder="Дополнительные сведения..." rows={3} />
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
          <Button variant="secondary" className="gap-2" onClick={handleImportOpen}>
            <Upload className="size-4" />
            Импорт из Excel
          </Button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по инв. номеру, наименованию..."
              className="pl-9 w-full sm:w-[280px]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="size-4 mr-1" />
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="active">Работает</SelectItem>
              <SelectItem value="under_repair">В ремонте</SelectItem>
              <SelectItem value="decommissioned">Списано</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table — fills remaining space, scrolls independently */}
      <Card className="overflow-hidden flex-1 min-h-0 flex flex-col">
        <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Column config button — top-right of the card */}
          <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {items.length > 0 && `${items.length} ${items.length === 1 ? 'запись' : items.length < 5 ? 'записи' : 'записей'}`}
                {displayItems.length !== items.length && (
                  <span className="ml-1 text-orange-600">→ {displayItems.length} показано</span>
                )}
                {selectedIds.size > 0 && <span className="ml-2 text-orange-600 font-medium">| Выбрано: {selectedIds.size}</span>}
              </span>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs font-medium h-7 px-2 border-border/60 bg-background hover:bg-accent"
                  onClick={handleExportExcel}
                  disabled={exporting}
                >
                  {exporting ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                  Экспорт в Excel
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-medium h-7 px-2.5 border-border/60 bg-background hover:bg-accent"
              onClick={openColumnDialog}
            >
              <Columns3 className="size-3.5" />
              Изменить список атрибутов
              <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full">{visibleOptionalCount}</Badge>
            </Button>
            {/* View Presets dropdown */}
            <DropdownMenu open={presetMenuOpen} onOpenChange={setPresetMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`gap-1.5 text-xs font-medium h-7 px-2.5 border-border/60 bg-background hover:bg-accent ${activePresetId ? 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100' : ''}`}
                >
                  {activePresetId ? <BookmarkCheck className="size-3.5 text-orange-600" /> : <Bookmark className="size-3.5" />}
                  Пресеты
                  {presets.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 h-4 min-w-4 px-1 text-[10px] rounded-full">{presets.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-[420px] overflow-y-auto">
                {/* Save current view as new preset */}
                <DropdownMenuItem onClick={() => openSaveDialog()} className="gap-2 text-orange-600 focus:text-orange-600">
                  <BookmarkPlus className="size-4" />
                  <span className="font-medium">Сохранить текущий вид</span>
                </DropdownMenuItem>
                {/* Update active preset */}
                {activePresetId && (() => {
                  const ap = presets.find((p) => p.id === activePresetId)
                  return ap ? (
                    <DropdownMenuItem onClick={updateCurrentPreset} className="gap-2">
                      <Copy className="size-4" />
                      <span>Обновить «{ap.name}»</span>
                    </DropdownMenuItem>
                  ) : null
                })()}
                {presets.length > 0 && <DropdownMenuSeparator />}
                {/* Preset list */}
                {presets.length === 0 ? (
                  <div className="px-2 py-3 text-xs text-muted-foreground text-center">Нет сохранённых пресетов</div>
                ) : (
                  presets.map((preset) => {
                    const isActive = preset.id === activePresetId
                    return (
                      <DropdownMenuSub key={preset.id}>
                        <DropdownMenuSubTrigger className={`gap-2 ${isActive ? 'bg-orange-50 text-orange-700' : ''}`}>
                          {isActive ? <BookmarkCheck className="size-3.5 text-orange-600 shrink-0" /> : <Bookmark className="size-3.5 text-muted-foreground shrink-0" />}
                          <span className="truncate flex-1 min-w-0 font-medium">{preset.name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto shrink-0">{preset.columns.length} стб.</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuItem onClick={() => applyPreset(preset)} className="gap-2">
                            <Eye className="size-3.5" />
                            Применить
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSaveDialog(preset.id)} className="gap-2">
                            <PencilRuler className="size-3.5" />
                            Переименовать
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicatePreset(preset.id)} className="gap-2">
                            <Copy className="size-3.5" />
                            Дублировать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => deletePreset(preset.id)} className="gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="size-3.5" />
                            Удалить
                          </DropdownMenuItem>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {/* Active sort & filter indicators */}
          {(sortKey || Object.keys(colFilters).length > 0) && (
            <div className="flex items-center gap-2 px-4 py-2 border-t bg-muted/20 text-xs flex-wrap shrink-0">
              {sortKey && (() => {
                const col = ALL_COLUMNS.find((c) => c.key === sortKey)
                return (
                  <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] font-normal">
                    {sortDir === 'asc' ? <ChevronDown className="size-3" /> : <ChevronUp className="size-3" />}
                    {col?.label || sortKey}
                    <button className="ml-0.5 hover:text-destructive" onClick={clearSort}><X className="size-2.5" /></button>
                  </Badge>
                )
              })()}
              {Object.entries(colFilters).map(([fk, vals]) => {
                const col = ALL_COLUMNS.find((c) => c.key === fk)
                return (
                  <Badge key={fk} variant="secondary" className="gap-1 px-2 py-0.5 text-[11px] font-normal">
                    <Filter className="size-3" />
                    {col?.label || fk}: {vals.size}
                    <button className="ml-0.5 hover:text-destructive" onClick={() => clearFilter(fk)}><X className="size-2.5" /></button>
                  </Badge>
                )
              })}
              <span className="text-muted-foreground ml-1">
                Показано {displayItems.length} из {items.length}
              </span>
              <button className="text-orange-600 hover:text-orange-700 font-medium ml-auto" onClick={clearAllFilters}>
                Сбросить всё
              </button>
            </div>
          )}

          {/* Table — scrolls independently, fills all remaining space */}
          <div className="flex-1 min-h-0 overflow-auto">
          <DndContext
            sensors={columnSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleColumnDragEnd}
          >
          <Table>
            <SortableContext items={activeColumns.map(c => c.key)} strategy={horizontalListSortingStrategy}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 w-10">
                  <button className="flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toggleSelectAll() }} title={selectAll || selectedIds.size === items.length ? 'Снять выделение' : 'Выделить все'}>
                    {selectAll || selectedIds.size === items.length ? (
                      <CheckSquare className="size-4 text-orange-600" />
                    ) : (
                      <Square className="size-4 text-muted-foreground/50" />
                    )}
                  </button>
                </TableHead>
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
              </TableRow>
            </TableHeader>
            </SortableContext>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6 w-10"><Skeleton className="h-4 w-4" /></TableCell>
                    {activeColumns.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : displayItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={activeColumns.length} className="h-64 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <FileSpreadsheet className="size-12 text-muted-foreground/40" />
                      <p className="text-muted-foreground text-sm max-w-md">
                        {(search || statusFilter !== 'all' || hasAdvancedResults || Object.keys(colFilters).length > 0)
                          ? 'Оборудование по заданным фильтрам не найдено.'
                          : 'Оборудование пока не добавлено. Нажмите кнопку выше или импортируйте из Excel.'}
                      </p>
                      {!search && statusFilter === 'all' && !hasAdvancedResults && Object.keys(colFilters).length === 0 && (
                        <div className="flex gap-3 mt-2">
                          <Button size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={() => setDialogOpen(true)}>
                            <Plus className="size-4" />
                            Добавить
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-2" onClick={handleImportOpen}>
                            <Upload className="size-4" />
                            Импорт
                          </Button>
                        </div>
                      )}
                      {Object.keys(colFilters).length > 0 && (
                        <Button size="sm" variant="outline" className="mt-2 gap-1" onClick={clearAllFilters}>
                          <X className="size-3" />
                          Сбросить сортировку и фильтры
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                displayItems.map((item) => {
                  const isSelected = selectedIds.has(item.id)
                  return (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? 'bg-orange-50/60 dark:bg-orange-950/20' : ''}`}
                    onClick={() => openEquipmentDetail(item.id)}
                  >
                    <TableCell className="pl-6 w-10" onClick={(e) => toggleSelectItem(item.id, e)}>
                      <button className="flex items-center justify-center" title={isSelected ? 'Снять выделение' : 'Выделить'}>
                        {isSelected ? (
                          <CheckSquare className="size-4 text-orange-600" />
                        ) : (
                          <Square className="size-4 text-muted-foreground/40 hover:text-muted-foreground/70" />
                        )}
                      </button>
                    </TableCell>
                    {activeColumns.map((col) => (
                      <TableCell key={col.key}>{col.render(item)}</TableCell>
                    ))}
                  </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          </DndContext>
          </div>
        </CardContent>
      </Card>

      {/* ── Save/Rename Preset Dialog ──────────────────────────── */}
      <Dialog open={savePresetDialogOpen} onOpenChange={(open) => { if (!open) { setSavePresetDialogOpen(false); setNewPresetName(''); setEditingPresetId(null) } }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookmarkPlus className="size-5 text-orange-600" />
              {editingPresetId ? 'Переименовать пресет' : 'Сохранить пресет'}
            </DialogTitle>
            <DialogDescription>
              {editingPresetId
                ? 'Введите новое имя для пресета.'
                : `Сохранить текущие настройки отображения: ${visibleOptionalCount} столбцов${sortKey ? ', сортировка' : ''}${Object.keys(colFilters).length > 0 ? ', фильтры' : ''}${search ? ', поиск' : ''}.`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="preset-name" className="text-sm font-medium">Название пресета</Label>
            <Input
              id="preset-name"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Например: ТО электриков — полный обзор"
              className="mt-1.5"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editingPresetId ? renamePreset() : saveNewPreset() } }}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => { setSavePresetDialogOpen(false); setNewPresetName(''); setEditingPresetId(null) }}>
              Отмена
            </Button>
            <Button
              onClick={editingPresetId ? renamePreset : saveNewPreset}
              disabled={!newPresetName.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {editingPresetId ? 'Переименовать' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import from Excel Dialog ──────────────────────────── */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { if (!open) handleImportClose(); else setImportDialogOpen(true) }}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="size-5" />
              Импорт оборудования из Excel
            </DialogTitle>
            <DialogDescription>
              Загрузите файл .xlsx или .csv с данными об оборудовании.
              Обязательные столбцы: «Наименование» и «Инв. номер».
            </DialogDescription>

            {/* Template download link — always visible */}
            <a
              href='/api/equipment/import/template'
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:hover:bg-orange-950/50"
            >
              <Download className="size-3.5" />
              Скачать шаблон Excel
            </a>
          </DialogHeader>

          {!importResult ? (
            <>
              {/* Drop zone */}
              <div
                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                  importDragOver
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : importFile
                      ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/10'
                      : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) handleFileSelect(e.target.files[0])
                    e.target.value = ''
                  }}
                />
                {importFile ? (
                  <>
                    <FileSpreadsheet className="size-10 text-emerald-500 mb-3" />
                    <p className="text-sm font-medium text-foreground">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(importFile.size / 1024).toFixed(1)} КБ
                    </p>
                    <button
                      className="absolute top-2 right-2 rounded-full p-1 hover:bg-muted"
                      onClick={(e) => { e.stopPropagation(); setImportFile(null) }}
                    >
                      <X className="size-4 text-muted-foreground" />
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className={`size-10 mb-3 ${importDragOver ? 'text-orange-500' : 'text-muted-foreground/50'}`} />
                    <p className="text-sm font-medium">Перетащите файл сюда или нажмите для выбора</p>
                    <p className="text-xs text-muted-foreground mt-1">.xlsx, .csv — до 5 МБ</p>
                  </>
                )}
              </div>

              <DialogFooter className="gap-2">
                <a
                  href='/api/equipment/import/template'
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors text-muted-foreground hover:bg-muted"
                >
                  <Download className="size-3.5" />
                  Шаблон
                </a>
                <div className="flex-1" />
                <Button variant="outline" onClick={handleImportClose}>Отмена</Button>
                <Button
                  onClick={handleImportSubmit}
                  disabled={!importFile || importSubmitting}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {importSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
                  Импортировать
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {/* Import results */}
              <div className="space-y-3 py-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center rounded-lg border p-3 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="size-5 text-emerald-600 mb-1" />
                    <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{importResult.imported}</span>
                    <span className="text-xs text-muted-foreground">Импортировано</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
                    <AlertTriangle className="size-5 text-amber-600 mb-1" />
                    <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{importResult.skipped}</span>
                    <span className="text-xs text-muted-foreground">Пропущено</span>
                  </div>
                  <div className="flex flex-col items-center rounded-lg border p-3 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                    <Info className="size-5 text-red-600 mb-1" />
                    <span className="text-lg font-bold text-red-700 dark:text-red-400">{importResult.errors}</span>
                    <span className="text-xs text-muted-foreground">Ошибок</span>
                  </div>
                </div>

                {importResult.errorDetails.length > 0 && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Подробности ошибок:</p>
                    <div className="max-h-[120px] overflow-y-auto space-y-1">
                      {importResult.errorDetails.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <a
                  href='/api/equipment/import/template'
                  download
                  className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors text-muted-foreground hover:bg-muted"
                >
                  <Download className="size-3.5" />
                  Шаблон
                </a>
                <div className="flex-1" />
                <Button variant="outline" onClick={handleImportClose}>Закрыть</Button>
                <Button onClick={handleImportOpen} className="gap-2 bg-orange-600 hover:bg-orange-700">
                  <Upload className="size-4" />
                  Импортировать ещё
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Column Selector Modal (custom, no Radix Dialog) ────────── */}
      {columnDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={() => setColumnDialogOpen(false)}>
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Modal body — fixed height, no overflow escape */}
          <div
            className="relative z-10 bg-background rounded-lg border shadow-lg flex flex-col overflow-hidden"
            style={{ width: 'min(580px, calc(100vw - 2rem))', height: '70vh', maxHeight: '70vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-2 border-b bg-muted/30 shrink-0">
              <div className="flex items-center gap-2 text-base font-semibold">
                <Columns3 className="size-4" />
                Настройка атрибутов таблицы
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Двойной клик — переместить атрибут. Перетаскивайте в левой панели для сортировки.
              </p>
            </div>

            {/* Two panels */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* Left panel: Selected columns */}
              <div className="w-1/2 flex flex-col border-r min-h-0">
                <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-b shrink-0">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    Отображаемые
                    <Badge variant="secondary" className="ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full">{colEditLeft.length}</Badge>
                  </span>
                  {colEditLeft.length !== DEFAULT_VISIBLE_COLUMNS.length && (
                    <button className="text-[10px] text-orange-600 hover:text-orange-700 font-medium cursor-pointer" onClick={resetColumns}>Сбросить</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                  {colEditLeft.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/60 gap-2 py-8">
                      <Columns3 className="size-7" />
                      <p className="text-[11px] text-center px-3">Дважды кликните на атрибут справа</p>
                    </div>
                  )}
                  {colEditLeft.map((key, idx) => {
                    const col = ALL_COLUMNS.find((c) => c.key === key)
                    if (!col) return null
                    return (
                      <div
                        key={key}
                        draggable
                        onDragStart={() => colDragStart(idx)}
                        onDragOver={(e) => colDragOver(e, idx)}
                        onDragEnd={colDragEnd}
                        onDoubleClick={() => moveColToRight(key)}
                        className={`flex items-center gap-1 px-1.5 py-1 rounded-md border border-transparent cursor-grab active:cursor-grabbing transition-colors group
                          ${colDragIdx === idx ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-800' : 'hover:bg-muted/60 border-border/40'}`}
                        title="Двойной клик — убрать. Перетаскивайте для изменения порядка."
                      >
                        <span className="text-muted-foreground/40 group-hover:text-muted-foreground/70 shrink-0 cursor-grab">
                          <svg className="size-3" viewBox="0 0 20 20" fill="currentColor"><path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/></svg>
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground/50 w-3.5 text-center shrink-0">{idx + 1}</span>
                        <span className="text-[10px] text-muted-foreground/60 shrink-0 max-w-[60px] truncate">{col.group}</span>
                        <span className="text-[11px] text-foreground flex-1 truncate">{col.label}</span>
                        <div className="flex items-center gap-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-0.5 rounded hover:bg-muted disabled:opacity-30" disabled={idx === 0} onClick={(e) => { e.stopPropagation(); moveColUp(idx) }} title="Вверх">
                            <svg className="size-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd"/></svg>
                          </button>
                          <button className="p-0.5 rounded hover:bg-muted disabled:opacity-30" disabled={idx === colEditLeft.length - 1} onClick={(e) => { e.stopPropagation(); moveColDown(idx) }} title="Вниз">
                            <svg className="size-2.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Right panel: Available columns */}
              <div className="w-1/2 flex flex-col min-h-0">
                <div className="px-3 py-1.5 bg-muted/40 border-b shrink-0">
                  <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
                    Доступные
                    <Badge variant="secondary" className="ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full">{colEditRight.length}</Badge>
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                  {colEditRight.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 py-8">
                      <CheckCircle2 className="size-7" />
                      <p className="text-[11px] text-center px-3 mt-2">Все атрибуты добавлены</p>
                    </div>
                  )}
                  {COLUMN_GROUPS.map((group) => {
                    const groupKeys = colEditRight.filter((key) => {
                      const col = ALL_COLUMNS.find((c) => c.key === key)
                      return col?.group === group
                    })
                    if (groupKeys.length === 0) return null
                    return (
                      <div key={group}>
                        <p className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-1.5 pt-1.5 pb-0.5 sticky top-0 bg-background z-10">{group}</p>
                        {groupKeys.map((key) => {
                          const col = ALL_COLUMNS.find((c) => c.key === key)
                          if (!col) return null
                          return (
                            <div
                              key={key}
                              onDoubleClick={() => moveColToLeft(key)}
                              className="flex items-center gap-1.5 px-1.5 py-1 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                              title="Двойной клик — добавить в таблицу"
                            >
                              <svg className="size-3 text-muted-foreground/30 shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
                              <span className="text-[11px] text-muted-foreground truncate">{col.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 border-t bg-muted/30 flex justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setColumnDialogOpen(false)}>Отмена</Button>
              <Button size="sm" onClick={applyColumnDialog} className="bg-orange-600 hover:bg-orange-700 gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Применить ({colEditLeft.length})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Edit Dialog ────────────────────────────────── */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={(open) => { if (!open) setBulkEditDialogOpen(false) }}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="size-5" />
              Массовое редактирование
            </DialogTitle>
            <DialogDescription>
              Изменение {selectedIds.size} {selectedIds.size === 1 ? 'объекта' : selectedIds.size < 5 ? 'объектов' : 'объектов'}. Заполните только те поля, которые нужно изменить.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Field selector */}
            <Select onValueChange={(val) => {
              if (!bulkEditFields.some((f) => f.field === val)) {
                setBulkEditFields([...bulkEditFields, { field: val, value: '' }])
              }
            }}>
              <SelectTrigger>
                <SelectValue placeholder="+ Добавить поле для изменения..." />
              </SelectTrigger>
              <SelectContent>
                {BULK_EDITABLE_FIELDS
                  .filter((f) => !bulkEditFields.some((bf) => bf.field === f.key))
                  .map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.group && <span className="text-muted-foreground mr-1">[{f.group}]</span>}
                      {f.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {/* Added fields */}
            {bulkEditFields.length > 0 && (
              <div className="space-y-3">
                {bulkEditFields.map((bf, idx) => {
                  const fieldDef = BULK_EDITABLE_FIELDS.find((f) => f.key === bf.field)
                  if (!fieldDef) return null
                  return (
                    <div key={bf.field} className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">
                          {fieldDef.group && <span className="mr-1">[{fieldDef.group}]</span>}
                          {fieldDef.label}
                        </Label>
                        {fieldDef.type === 'select' ? (
                          <Select value={bf.value} onValueChange={(val) => {
                            const next = [...bulkEditFields]; next[idx] = { ...next[idx], value: val }; setBulkEditFields(next)
                          }}>
                            <SelectTrigger><SelectValue placeholder="Не изменять" /></SelectTrigger>
                            <SelectContent>
                              {fieldDef.options?.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fieldDef.type === 'select-department' ? (
                          <Select value={bf.value} onValueChange={(val) => {
                            const next = [...bulkEditFields]; next[idx] = { ...next[idx], value: val }; setBulkEditFields(next)
                          }}>
                            <SelectTrigger><SelectValue placeholder={fieldDef.placeholder || 'Не изменять'} /></SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : fieldDef.type === 'checkbox' ? (
                          <div className="flex items-center gap-4 mt-1">
                            {['true', 'false'].map((opt) => (
                              <label key={opt} className={`flex items-center gap-1.5 cursor-pointer text-sm px-3 py-1.5 rounded-md border transition-colors ${bf.value === opt ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800' : 'border-muted hover:border-muted-foreground/50'}`}>
                                <input type="radio" name={`bulk-${bf.field}`} checked={bf.value === opt} onChange={() => {
                                  const next = [...bulkEditFields]; next[idx] = { ...next[idx], value: opt }; setBulkEditFields(next)
                                }} className="sr-only" />
                                {opt === 'true' ? 'Да' : 'Нет'}
                              </label>
                            ))}
                          </div>
                        ) : (
                          <Input
                            type={fieldDef.type === 'number' ? 'number' : fieldDef.type === 'date' ? 'date' : 'text'}
                            value={bf.value}
                            onChange={(e) => {
                              const next = [...bulkEditFields]; next[idx] = { ...next[idx], value: e.target.value }; setBulkEditFields(next)
                            }}
                            placeholder={fieldDef.placeholder || 'Новое значение...'}
                          />
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="size-8 shrink-0 mt-5" onClick={() => setBulkEditFields(bulkEditFields.filter((_, i) => i !== idx))}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {bulkEditFields.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Выберите поля выше, которые нужно изменить.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleBulkEditSubmit} disabled={bulkEditSubmitting || bulkEditFields.length === 0} className="bg-orange-600 hover:bg-orange-700">
              {bulkEditSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Применить ({selectedIds.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation Dialog ────────────────── */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={(open) => { if (!open) setBulkDeleteDialogOpen(false) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить {selectedIds.size} {selectedIds.size === 1 ? 'объект' : 'объектов'}?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить {selectedIds.size} выбранных объектов? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleBulkDeleteConfirm() }} disabled={bulkDeleteSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
              {bulkDeleteSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        if (!open) setDeleteItem(null)
        setDeleteDialogOpen(open)
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить оборудование?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить оборудование{' '}
              <span className="font-semibold text-foreground">«{deleteItem?.name}»</span>
              {deleteItem?.code && (
                <> (инв. номер: <span className="font-mono font-semibold text-foreground">{deleteItem.code}</span>)</>
              )}
              ? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteConfirm() }}
              disabled={deleteSubmitting}
              className="bg-destructive text-white hover:bg-destructive/90"
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
