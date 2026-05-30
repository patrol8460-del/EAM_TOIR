'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Server, MapPin, Users, Wrench, Shield, ClipboardCheck,
  Eye, Pencil, Loader2, Save, X, Ban, ArrowLeft, Trash2, Gauge,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import MeasuredParametersTab from './measured-parameters-tab'

// ===================== TYPES =====================

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

interface EquipmentDetail {
  id: string; name: string; code: string; status: string; criticality: string
  location?: string; manufacturer?: string; model?: string; serialNumber?: string
  commissionDate?: string; description?: string; specifications?: string
  inventoryNumber?: string; quantity?: number; unit?: string; drawing?: string
  equipmentClass?: string; topazNumber?: string; sapNumber?: number
  abcdCode?: string; costCenter?: string; manufactureDate?: string
  decommissionDate?: string; processImportance?: string
  isKey: boolean; isTest: boolean; hasReserve: boolean; parentEquipmentSap?: number
  locationData?: string; responsibilityData?: string; maintenanceData?: string
  verificationData?: string; safetyData?: string; supervisionData?: string
  department?: { id: string; name: string; code: string } | null
  equipmentType?: { id: string; name: string; code: string } | null
  parent?: { id: string; name: string; code: string } | null
  children?: { id: string; name: string; code: string; status: string }[]
  departmentId?: string | null
  equipmentTypeId?: string | null
}

interface LookupItem { id: string; name: string; code: string }

// ===================== HELPERS =====================

function parseJSON<T>(str?: string | null): T | null {
  if (!str) return null
  try { return JSON.parse(str) } catch { return null }
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return dateStr }
}

function toInputDate(dateStr?: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    return d.toISOString().slice(0, 10)
  } catch { return '' }
}

function fmt(val: unknown): string {
  if (val === null || val === undefined || val === '') return '\u2014'
  return String(val)
}

// ===================== VIEW-ONLY FIELD WITH ROUNDED BORDERS =====================

function VField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </span>
      <div className="rounded-md border border-border/80 bg-background px-3 py-1.5 text-sm font-medium min-h-[28px] flex items-center">
        {children}
      </div>
    </div>
  )
}

function VGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">{children}</div>
}

function BoolBadge({ value }: { value: boolean | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground text-sm">\u2014</span>
  if (value) return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">Да</Badge>
  return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-200">Нет</Badge>
}

// ===================== EDIT HELPER COMPONENTS =====================

function EField({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </span>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 text-sm rounded-md border-border/80"
      />
    </div>
  )
}

function EDate({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </span>
      <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 text-sm rounded-md border-border/80" />
    </div>
  )
}

const NONE_SENTINEL = '__none__'

function ESelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string
}) {
  const safeOptions = options.map((o) => ({
    ...o,
    value: o.value === '' ? NONE_SENTINEL : o.value,
  }))
  const safeValue = value === '' ? NONE_SENTINEL : value

  const handleChange = (v: string) => {
    onChange(v === NONE_SENTINEL ? '' : v)
  }

  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </span>
      <Select value={safeValue} onValueChange={handleChange}>
        <SelectTrigger className="h-9 text-sm rounded-md border-border/80"><SelectValue placeholder={placeholder || 'Выберите'} /></SelectTrigger>
        <SelectContent>
          {safeOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  )
}

function EBool({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
        {label}
      </span>
      <div className="rounded-md border border-border/80 bg-background px-3 py-1.5 min-h-[28px] flex items-center">
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    </div>
  )
}

function EGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0">{children}</div>
}

// ── Compact narrow number field (3-digit) for maintenance rows ──
function ESNum({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-[56px] shrink-0">
      <span className="text-[9px] font-semibold uppercase leading-tight text-muted-foreground">{label}</span>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-full text-xs text-center rounded-md border-border/80 px-1"
      />
    </div>
  )
}
function VSNum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5 w-[56px] shrink-0">
      <span className="text-[9px] font-semibold uppercase leading-tight text-muted-foreground">{label}</span>
      <div className="h-7 w-full flex items-center justify-center rounded-md border border-border/80 bg-background text-xs font-medium">
        {children}
      </div>
    </div>
  )
}
// ── Compact select (справочник) for contractors in maintenance rows ──
// В будущем будет подключаться из модуля «Ремонтный персонал»
function ESContr({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const safeValue = value ? value : NONE_SENTINEL
  return (
    <div className="flex flex-col gap-0.5 w-full min-w-0">
      <span className="text-[9px] font-semibold uppercase leading-tight text-muted-foreground">{label}</span>
      <Select value={safeValue} onValueChange={(v) => onChange(v === NONE_SENTINEL ? '' : v)}>
        <SelectTrigger className="h-7 text-xs rounded-md border-border/80 w-full px-1.5">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_SENTINEL}>{"—"}</SelectItem>
          {value && <SelectItem value={value}>{value}</SelectItem>}
        </SelectContent>
      </Select>
    </div>
  )
}
function VSContr({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 w-full min-w-0">
      <span className="text-[9px] font-semibold uppercase leading-tight text-muted-foreground">{label}</span>
      <div className="h-7 flex items-center rounded-md border border-border/80 bg-background px-2 text-xs font-medium truncate">
        {children}
      </div>
    </div>
  )
}

// ── Full maintenance discipline row ──
interface MaintRowData {
  label: string
  toI?: number | null; trI?: number | null; krI?: number | null
  toC?: string | null; trC?: string | null; krC?: string | null
  rs?: number | null
}
// Grid columns: label 140px | ТО 56px | ТР 56px | КР 56px | Исп.ТО 1fr | Исп.ТР 1fr | Исп.КР 1fr | Ремонт. 56px
const maintGridCols = '140px 56px 56px 56px 1fr 1fr 1fr 56px'

function MaintRow({ data, editing, onSetJson }: {
  data: MaintRowData
  editing: boolean
  onSetJson: (key: string, val: unknown) => void
}) {
  const s = (v: unknown) => v != null ? String(v) : ''
  return (
    <div className="grid gap-x-2 py-2 items-end" style={{ gridTemplateColumns: maintGridCols }}>
      <span className="pb-0.5 text-xs font-semibold text-foreground whitespace-nowrap truncate" title={data.label}>{data.label}</span>
        {editing ? (
          <>
            <ESNum label="ТО" value={s(data.toI)} onChange={(v) => onSetJson('toInterval', v ? parseInt(v) : null)} />
            <ESNum label="ТР" value={s(data.trI)} onChange={(v) => onSetJson('trInterval', v ? parseInt(v) : null)} />
            <ESNum label="КР" value={s(data.krI)} onChange={(v) => onSetJson('krInterval', v ? parseInt(v) : null)} />
            <ESContr label="Исп. ТО" value={data.toC || ''} onChange={(v) => onSetJson('toContractor', v)} />
            <ESContr label="Исп. ТР" value={data.trC || ''} onChange={(v) => onSetJson('trContractor', v)} />
            <ESContr label="Исп. КР" value={data.krC || ''} onChange={(v) => onSetJson('krContractor', v)} />
            <ESNum label="Ремонтосложность" value={s(data.rs)} onChange={(v) => onSetJson('repairComplexity', v ? parseFloat(v) : null)} />
          </>
        ) : (
          <>
            <VSNum label="ТО">{data.toI ?? '\u2014'}</VSNum>
            <VSNum label="ТР">{data.trI ?? '\u2014'}</VSNum>
            <VSNum label="КР">{data.krI ?? '\u2014'}</VSNum>
            <VSContr label="Исп. ТО">{data.toC || '\u2014'}</VSContr>
            <VSContr label="Исп. ТР">{data.trC || '\u2014'}</VSContr>
            <VSContr label="Исп. КР">{data.krC || '\u2014'}</VSContr>
            <VSNum label="Ремонтосложность">{data.rs ?? '\u2014'}</VSNum>
          </>
        )}
    </div>
  )
}

// ===================== TAB DEFINITIONS =====================

const tabDefs = [
  { value: 'main', label: 'Основная информация', color: '#00B050', icon: Server },
  { value: 'location', label: 'Местоположение', color: '#FFC000', icon: MapPin },
  { value: 'responsibility', label: 'Ответственные', color: '#6B7280', icon: Users },
  { value: 'maintenance', label: 'ТО и ремонты', color: '#6B7280', icon: Wrench },
  { value: 'verification', label: 'Поверка', color: '#00B0F0', icon: ClipboardCheck },
  { value: 'safety', label: 'Промбезопасность', color: '#EAB308', icon: Shield },
  { value: 'supervision', label: 'Надзор', color: '#00B050', icon: Eye },
  { value: 'measured-params', label: 'Замер. параметры', color: '#9333EA', icon: Gauge },
]

// ===================== EDIT FORM STATE =====================

interface EditForm {
  name: string; code: string; departmentId: string; equipmentTypeId: string
  location: string; manufacturer: string; model: string; serialNumber: string
  commissionDate: string; status: string; criticality: string; description: string
  inventoryNumber: string; quantity: string; unit: string; drawing: string
  equipmentClass: string; topazNumber: string; sapNumber: string
  abcdCode: string; costCenter: string; manufactureDate: string
  decommissionDate: string; processImportance: string
  isKey: boolean; isTest: boolean; hasReserve: boolean; parentEquipmentSap: string
  locationData: LocationData
  responsibilityData: ResponsibilityData
  maintenanceData: MaintenanceData
  verificationData: VerificationData
  safetyData: SafetyData
  supervisionData: SupervisionData
}

const emptyLocationData: LocationData = {}
const emptyResponsibilityData: ResponsibilityData = {}
const emptyMaintenanceData: MaintenanceData = {}
const emptyVerificationData: VerificationData = {}
const emptySafetyData: SafetyData = {}
const emptySupervisionData: SupervisionData = {}

const emptyEditForm: EditForm = {
  name: '', code: '', departmentId: '', equipmentTypeId: '',
  location: '', manufacturer: '', model: '', serialNumber: '',
  commissionDate: '', status: 'active', criticality: 'medium', description: '',
  inventoryNumber: '', quantity: '', unit: '', drawing: '',
  equipmentClass: '', topazNumber: '', sapNumber: '',
  abcdCode: '', costCenter: '', manufactureDate: '',
  decommissionDate: '', processImportance: '',
  isKey: false, isTest: false, hasReserve: false, parentEquipmentSap: '',
  locationData: emptyLocationData, responsibilityData: emptyResponsibilityData,
  maintenanceData: emptyMaintenanceData, verificationData: emptyVerificationData,
  safetyData: emptySafetyData, supervisionData: emptySupervisionData,
}

function dataToForm(d: EquipmentDetail): EditForm {
  return {
    name: d.name || '',
    code: d.code || '',
    departmentId: d.departmentId || d.department?.id || '',
    equipmentTypeId: d.equipmentTypeId || d.equipmentType?.id || '',
    location: d.location || '',
    manufacturer: d.manufacturer || '',
    model: d.model || '',
    serialNumber: d.serialNumber || '',
    commissionDate: toInputDate(d.commissionDate),
    status: d.status || 'active',
    criticality: d.criticality || 'medium',
    description: d.description || '',
    inventoryNumber: d.inventoryNumber || '',
    quantity: d.quantity != null ? String(d.quantity) : '',
    unit: d.unit || '',
    drawing: d.drawing || '',
    equipmentClass: d.equipmentClass || '',
    topazNumber: d.topazNumber || '',
    sapNumber: d.sapNumber != null ? String(d.sapNumber) : '',
    abcdCode: d.abcdCode || '',
    costCenter: d.costCenter || '',
    manufactureDate: toInputDate(d.manufactureDate),
    decommissionDate: toInputDate(d.decommissionDate),
    processImportance: d.processImportance || '',
    isKey: !!d.isKey,
    isTest: !!d.isTest,
    hasReserve: !!d.hasReserve,
    parentEquipmentSap: d.parentEquipmentSap != null ? String(d.parentEquipmentSap) : '',
    locationData: parseJSON<LocationData>(d.locationData) || emptyLocationData,
    responsibilityData: parseJSON<ResponsibilityData>(d.responsibilityData) || emptyResponsibilityData,
    maintenanceData: parseJSON<MaintenanceData>(d.maintenanceData) || emptyMaintenanceData,
    verificationData: parseJSON<VerificationData>(d.verificationData) || emptyVerificationData,
    safetyData: parseJSON<SafetyData>(d.safetyData) || emptySafetyData,
    supervisionData: parseJSON<SupervisionData>(d.supervisionData) || emptySupervisionData,
  }
}

// ===================== MAIN COMPONENT =====================

interface EquipmentCardPageProps {
  equipmentId: string
  onBack: () => void
  onDeleted?: () => void
}

export default function EquipmentCardPage({ equipmentId, onBack, onDeleted }: EquipmentCardPageProps) {
  const [data, setData] = useState<EquipmentDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const loadingRef = useRef(false)
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [form, setForm] = useState<EditForm>(emptyEditForm)
  const [saving, setSaving] = useState(false)
  const [departments, setDepartments] = useState<LookupItem[]>([])
  const [types, setTypes] = useState<LookupItem[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const fetchData = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/equipment/${id}`)
      if (res.ok) return await res.json()
    } catch { /* silent */ }
    return null
  }, [])

  const fetchLookups = useCallback(async () => {
    try {
      const deptRes = await fetch('/api/personnel')
      if (deptRes.ok) {
        const d = await deptRes.json()
        setDepartments((d.departments || []).map((x: { id: string; name: string; code: string }) => ({ id: x.id, name: x.name, code: x.code })))
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    fetchLookups()
  }, [fetchLookups])

  useEffect(() => {
    if (!equipmentId) {
      if (loadingRef.current) { loadingRef.current = false; setLoading(false) }
      return
    }
    let cancelled = false
    if (!loadingRef.current) { loadingRef.current = true; setLoading(true) }

    fetchData(equipmentId).then((json) => {
      if (!cancelled) {
        loadingRef.current = false
        setData(json)
        setForm(json ? dataToForm(json) : emptyEditForm)
        setMode('view')
        setLoading(false)
      }
    }).catch(() => {
      if (!cancelled) { loadingRef.current = false; setData(null); setLoading(false) }
    })

    return () => { cancelled = true }
  }, [equipmentId, fetchData])

  // ── Edit helpers ────────────────────────────────

  const setF = <K extends keyof EditForm>(key: K, val: EditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }

  const setJson = <T extends Record<string, unknown>>(
    group: 'locationData' | 'responsibilityData' | 'maintenanceData' | 'verificationData' | 'safetyData' | 'supervisionData',
    key: string, val: unknown
  ) => {
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: val } as EditForm[typeof group] }))
  }

  const handleSave = async () => {
    if (!data || !form.name || !form.code) {
      toast.error('Наименование и инв. номер обязательны')
      return
    }
    setSaving(true)
    try {
      const cleanJSON = (obj: Record<string, unknown>) => {
        const cleaned: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(obj)) {
          if (v !== '' && v !== null && v !== undefined) cleaned[k] = v
        }
        return Object.keys(cleaned).length > 0 ? JSON.stringify(cleaned) : null
      }

      const payload = {
        id: data.id,
        name: form.name,
        code: form.code,
        departmentId: form.departmentId || null,
        equipmentTypeId: form.equipmentTypeId || null,
        location: form.location || null,
        manufacturer: form.manufacturer || null,
        model: form.model || null,
        serialNumber: form.serialNumber || null,
        commissionDate: form.commissionDate || null,
        status: form.status,
        criticality: form.criticality,
        description: form.description || null,
        inventoryNumber: form.inventoryNumber || null,
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        unit: form.unit || null,
        drawing: form.drawing || null,
        equipmentClass: form.equipmentClass || null,
        topazNumber: form.topazNumber || null,
        sapNumber: form.sapNumber ? parseInt(form.sapNumber) : null,
        abcdCode: form.abcdCode || null,
        costCenter: form.costCenter || null,
        manufactureDate: form.manufactureDate || null,
        decommissionDate: form.decommissionDate || null,
        processImportance: form.processImportance || null,
        isKey: form.isKey,
        isTest: form.isTest,
        hasReserve: form.hasReserve,
        parentEquipmentSap: form.parentEquipmentSap ? parseInt(form.parentEquipmentSap) : null,
        locationData: cleanJSON(form.locationData as unknown as Record<string, unknown>),
        responsibilityData: cleanJSON(form.responsibilityData as unknown as Record<string, unknown>),
        maintenanceData: cleanJSON(form.maintenanceData as unknown as Record<string, unknown>),
        verificationData: cleanJSON(form.verificationData as unknown as Record<string, unknown>),
        safetyData: cleanJSON(form.safetyData as unknown as Record<string, unknown>),
        supervisionData: cleanJSON(form.supervisionData as unknown as Record<string, unknown>),
      }

      const res = await fetch('/api/equipment', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        toast.success('Оборудование успешно обновлено')
        const updated = await fetchData(data.id)
        if (updated) { setData(updated); setForm(dataToForm(updated)) }
        setMode('view')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при обновлении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    if (data) setForm(dataToForm(data))
    setMode('view')
  }

  // ── Delete ────────────────────────────────

  const handleDelete = async () => {
    if (!data) return
    setDeleteSubmitting(true)
    try {
      const res = await fetch('/api/equipment', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id }),
      })
      if (res.ok) {
        toast.success(`Оборудование «${data.name}» удалено`)
        setDeleteDialogOpen(false)
        onDeleted?.()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Ошибка при удалении')
      }
    } catch {
      toast.error('Ошибка сети')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // ── Parsed data for view mode ───────────────────

  const loc = parseJSON<LocationData>(data?.locationData)
  const resp = parseJSON<ResponsibilityData>(data?.responsibilityData)
  const maint = parseJSON<MaintenanceData>(data?.maintenanceData)
  const verif = parseJSON<VerificationData>(data?.verificationData)
  const safety = parseJSON<SafetyData>(data?.safetyData)
  const superv = parseJSON<SupervisionData>(data?.supervisionData)

  const statusMap: Record<string, { label: string; cls: string }> = {
    active: { label: 'Работает', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    under_repair: { label: 'В ремонте', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    decommissioned: { label: 'Списано', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  }
  const critMap: Record<string, { label: string; cls: string }> = {
    critical: { label: 'Критичное', cls: 'bg-red-100 text-red-700 border-red-200' },
    high: { label: 'Высокое', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
    medium: { label: 'Среднее', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    low: { label: 'Низкое', cls: 'bg-green-100 text-green-700 border-green-200' },
  }

  const st = statusMap[data?.status || ''] || { label: data?.status || '\u2014', cls: 'bg-secondary text-secondary-foreground' }
  const cr = critMap[data?.criticality || ''] || { label: data?.criticality || '\u2014', cls: 'bg-secondary text-secondary-foreground' }

  const isEditing = mode === 'edit'

  // ===================== RENDER =====================

  return (
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header bar — fixed, does not scroll */}
      <div className="shrink-0 border-b bg-background z-10">
        <div className="px-4 sm:px-6 pt-4 pb-3 min-w-0">
          {/* Back button + title */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0"
                onClick={onBack}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-base font-bold text-orange-600 shrink-0">
                  {loading ? '...' : data?.code || '—'}
                </span>
                <span className="text-base font-semibold truncate">
                  {loading ? 'Загрузка...' : data?.name || ''}
                </span>
              </div>
              {!loading && data && (
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={st.cls}>{st.label}</Badge>
                  <Badge variant="outline" className={cr.cls}>{cr.label}</Badge>
                </div>
              )}
            </div>

            {/* Mode toggle + actions */}
            {!loading && data && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant={mode === 'view' ? 'default' : 'outline'}
                  className={mode === 'view' ? 'bg-orange-600 hover:bg-orange-700 gap-1.5' : 'gap-1.5'}
                  onClick={() => setMode('view')}
                >
                  <Eye className="size-3.5" />
                  Просмотр
                </Button>
                <Button
                  size="sm"
                  variant={mode === 'edit' ? 'default' : 'outline'}
                  className={mode === 'edit' ? 'bg-orange-600 hover:bg-orange-700 gap-1.5' : 'gap-1.5'}
                  onClick={() => setMode('edit')}
                >
                  <Pencil className="size-3.5" />
                  Редактирование
                </Button>

                {isEditing && (
                  <>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button size="sm" variant="ghost" className="gap-1.5" onClick={handleCancelEdit}>
                      <X className="size-3.5" />
                      Отмена
                    </Button>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 gap-1.5" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                      Сохранить
                    </Button>
                  </>
                )}

                {!isEditing && (
                  <>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="size-3.5" />
                      Удалить
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Subtitle info */}
          {!loading && data && (data?.department || data?.equipmentType) && (
            <div className="flex items-center gap-3 mt-2 ml-11 text-sm text-muted-foreground">
              {data.department && <span>{data.department.name}</span>}
              {data.department && data.equipmentType && <span className="text-muted-foreground/40">|</span>}
              {data.equipmentType && <span>{data.equipmentType.name}</span>}
              {isEditing && (
                <>
                  <span className="text-muted-foreground/40">|</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200 gap-1 text-[10px]">
                    <Pencil className="size-3" />
                    Режим редактирования
                  </Badge>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content — scrollable area fills remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground h-64">
            <Loader2 className="size-5 animate-spin" />
            <span>Загрузка данных...</span>
          </div>
        )}

        {/* Error / no data */}
        {!loading && !data && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Оборудование не найдено</p>
          </div>
        )}

        {/* Tabs */}
        {!loading && data && (
          <Tabs defaultValue="main" className="flex flex-col h-full">
            {/* Tab bar — fixed, does not scroll vertically */}
            <div className="shrink-0 border-b px-4 sm:px-6 overflow-x-auto">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                {tabDefs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs font-medium data-[state=active]:border-b-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none shrink-0 gap-1.5 transition-colors hover:text-foreground data-[state=active]:text-foreground"
                      style={{ '--tab-color': tab.color } as React.CSSProperties}
                      data-tab-color={tab.color}
                    >
                      <Icon className="size-3.5" />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </div>

            <style>{`
              [data-tab-color][data-state="active"] { border-bottom-color: var(--tab-color) !important; color: var(--tab-color) !important; }
              [data-tab-color][data-state="active"] svg { color: var(--tab-color) !important; }
            `}</style>

            {/* Tab content — scrollable, bounded by parent */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="p-4 sm:p-6 max-w-7xl">
                {/* ════════ TAB 1: MAIN INFO ════════ */}
                <TabsContent value="main">
                  <div className="space-y-5">
                    {isEditing ? (
                      <EGrid>
                        <EField label="Наименование *" value={form.name} onChange={(v) => setF('name', v)} />
                        <EField label="Инвентарный номер *" value={form.code} onChange={(v) => setF('code', v)} />
                        <EField label="Тип / модель" value={form.model} onChange={(v) => setF('model', v)} />
                        <EField label="Изготовитель" value={form.manufacturer} onChange={(v) => setF('manufacturer', v)} />
                        <EField label="Серийный номер" value={form.serialNumber} onChange={(v) => setF('serialNumber', v)} />
                        <EField label="Инвентарный номер ОС" value={form.inventoryNumber} onChange={(v) => setF('inventoryNumber', v)} />
                        <EField label="Номер SAP TORO" value={form.sapNumber} onChange={(v) => setF('sapNumber', v)} type="number" />
                        <EField label="Номер ТОПАЗ" value={form.topazNumber} onChange={(v) => setF('topazNumber', v)} />
                        <EField label="Количество" value={form.quantity} onChange={(v) => setF('quantity', v)} type="number" />
                        <EField label="ЕИ" value={form.unit} onChange={(v) => setF('unit', v)} placeholder="шт." />
                        <EField label="Чертёж" value={form.drawing} onChange={(v) => setF('drawing', v)} />
                        <EField label="Класс" value={form.equipmentClass} onChange={(v) => setF('equipmentClass', v)} />
                        <ESelect label="Код ABCD" value={form.abcdCode} onChange={(v) => setF('abcdCode', v)}
                          options={[{ value: '', label: '\u2014' }, { value: 'A', label: 'A' }, { value: 'B', label: 'B' }, { value: 'C', label: 'C' }, { value: 'D', label: 'D' }]} />
                        <EField label="МВЗ (ЦМО)" value={form.costCenter} onChange={(v) => setF('costCenter', v)} />
                        <EDate label="Дата выпуска" value={form.manufactureDate} onChange={(v) => setF('manufactureDate', v)} />
                        <EDate label="Дата ввода в эксплуатацию" value={form.commissionDate} onChange={(v) => setF('commissionDate', v)} />
                        <EDate label="Дата списания" value={form.decommissionDate} onChange={(v) => setF('decommissionDate', v)} />
                        <EField label="Важность для ТП" value={form.processImportance} onChange={(v) => setF('processImportance', v)} />
                        <EBool label="Ключевое" value={form.isKey} onChange={(v) => setF('isKey', v)} />
                        <EBool label="Испытательное" value={form.isTest} onChange={(v) => setF('isTest', v)} />
                        <EBool label="Наличие резерва" value={form.hasReserve} onChange={(v) => setF('hasReserve', v)} />
                        <EField label="Вышестоящая ЕО (SAP)" value={form.parentEquipmentSap} onChange={(v) => setF('parentEquipmentSap', v)} type="number" />
                      </EGrid>
                    ) : (
                      <VGrid>
                        <VField label="Наименование">{data.name}</VField>
                        <VField label="Инвентарный номер">{data.code}</VField>
                        <VField label="Тип / модель">{fmt(data.model)}</VField>
                        <VField label="Изготовитель">{fmt(data.manufacturer)}</VField>
                        <VField label="Серийный номер">{fmt(data.serialNumber)}</VField>
                        <VField label="Инвентарный номер ОС">{fmt(data.inventoryNumber)}</VField>
                        <VField label="Номер SAP TORO">{data.sapNumber ?? '\u2014'}</VField>
                        <VField label="Номер ТОПАЗ">{fmt(data.topazNumber)}</VField>
                        <VField label="Количество">{data.quantity != null ? `${data.quantity} ${data.unit || ''}` : '\u2014'}</VField>
                        <VField label="ЕИ">{fmt(data.unit)}</VField>
                        <VField label="Чертёж">{fmt(data.drawing)}</VField>
                        <VField label="Класс">{fmt(data.equipmentClass)}</VField>
                        <VField label="Код ABCD">{data.abcdCode ? (
                          <Badge variant="outline" className={
                            data.abcdCode === 'A' ? 'bg-red-100 text-red-700 border-red-200' :
                            data.abcdCode === 'B' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            data.abcdCode === 'C' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                            'bg-green-100 text-green-700 border-green-200'
                          }>{data.abcdCode}</Badge>
                        ) : '\u2014'}</VField>
                        <VField label="МВЗ">{fmt(data.costCenter)}</VField>
                        <VField label="Дата выпуска">{formatDate(data.manufactureDate)}</VField>
                        <VField label="Дата ввода в эксплуатацию">{formatDate(data.commissionDate)}</VField>
                        <VField label="Дата списания">{formatDate(data.decommissionDate)}</VField>
                        <VField label="Важность для ТП">{fmt(data.processImportance)}</VField>
                        <VField label="Ключевое"><BoolBadge value={data.isKey} /></VField>
                        <VField label="Испытательное"><BoolBadge value={data.isTest} /></VField>
                        <VField label="Наличие резерва"><BoolBadge value={data.hasReserve} /></VField>
                        <VField label="Вышестоящая ЕО (SAP)">{data.parentEquipmentSap ?? '\u2014'}</VField>
                      </VGrid>
                    )}

                    {/* Description / status / department - same for both modes */}
                    {isEditing ? (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                            Описание
                          </span>
                          <Textarea value={form.description} onChange={(e) => setF('description', e.target.value)} rows={3} className="text-sm rounded-md border-border/80" placeholder="Дополнительные сведения..." />
                        </div>
                        <Separator />
                        <EGrid>
                          <ESelect label="Статус" value={form.status} onChange={(v) => setF('status', v)}
                            options={[
                              { value: 'active', label: 'В работе' },
                              { value: 'under_repair', label: 'В ремонте' },
                              { value: 'decommissioned', label: 'Списано' },
                            ]} />
                          <ESelect label="Критичность" value={form.criticality} onChange={(v) => setF('criticality', v)}
                            options={[
                              { value: 'low', label: 'Низкое' },
                              { value: 'medium', label: 'Среднее' },
                              { value: 'high', label: 'Высокое' },
                              { value: 'critical', label: 'Критичное' },
                            ]} />
                          <ESelect label="Подразделение" value={form.departmentId} onChange={(v) => setF('departmentId', v)}
                            options={[{ value: '', label: '— Не указано —' }, ...departments.map((d) => ({ value: d.id, label: d.name }))]} />
                          <EField label="Расположение" value={form.location} onChange={(v) => setF('location', v)} />
                        </EGrid>
                      </>
                    ) : (
                      <>
                        {data.description && (
                          <>
                            <Separator />
                            <VField label="Описание"><p className="text-sm text-foreground/80 whitespace-pre-wrap">{data.description}</p></VField>
                          </>
                        )}
                        {data.parent && (
                          <>
                            <Separator />
                            <VField label="Вышестоящее оборудование">
                              <span className="text-sm font-mono">{data.parent.code} — {data.parent.name}</span>
                            </VField>
                          </>
                        )}
                        {data.children && data.children.length > 0 && (
                          <>
                            <Separator />
                            <div className="space-y-1">
                              <span className="inline-flex self-start items-center rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
                                Подчинённое оборудование ({data.children.length})
                              </span>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {data.children.map((c) => (
                                  <Badge key={c.id} variant="outline" className="font-mono text-xs">{c.code} — {c.name}</Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>

                {/* ════════ TAB 2: LOCATION ════════ */}
                <TabsContent value="location">
                  {isEditing ? (
                    <EGrid>
                      <EField label="Цех" value={form.locationData.workshop || ''} onChange={(v) => setJson('locationData', 'workshop', v)} />
                      <EField label="Корпус" value={form.locationData.building || ''} onChange={(v) => setJson('locationData', 'building', v)} />
                      <EField label="Производственный участок" value={form.locationData.productionArea || ''} onChange={(v) => setJson('locationData', 'productionArea', v)} />
                      <EField label="Технологический участок" value={form.locationData.techArea || ''} onChange={(v) => setJson('locationData', 'techArea', v)} />
                      <EField label="№ помещения" value={form.locationData.roomNumber || ''} onChange={(v) => setJson('locationData', 'roomNumber', v)} />
                      <EField label="Наименование помещения" value={form.locationData.roomName || ''} onChange={(v) => setJson('locationData', 'roomName', v)} />
                      <EField label="Линия / установка / комплекс" value={form.locationData.lineInstallation || ''} onChange={(v) => setJson('locationData', 'lineInstallation', v)} />
                      <EField label="Высотная отметка ось Z" value={form.locationData.elevationMark != null ? String(form.locationData.elevationMark) : ''} onChange={(v) => setJson('locationData', 'elevationMark', v ? parseFloat(v) : null)} type="number" />
                      <EField label="Ось 1 по X" value={form.locationData.axisX1 || ''} onChange={(v) => setJson('locationData', 'axisX1', v)} />
                      <EField label="Ось 2 по X" value={form.locationData.axisX2 || ''} onChange={(v) => setJson('locationData', 'axisX2', v)} />
                      <EField label="Ось 1 по Y" value={form.locationData.axisY1 || ''} onChange={(v) => setJson('locationData', 'axisY1', v)} />
                      <EField label="Ось 2 по Y" value={form.locationData.axisY2 || ''} onChange={(v) => setJson('locationData', 'axisY2', v)} />
                      <EField label="№ проекта" value={form.locationData.projectNumber || ''} onChange={(v) => setJson('locationData', 'projectNumber', v)} />
                      <EField label="Позиция по проекту" value={form.locationData.projectPosition || ''} onChange={(v) => setJson('locationData', 'projectPosition', v)} />
                      <EField label="Пролёт" value={form.locationData.span || ''} onChange={(v) => setJson('locationData', 'span', v)} />
                      <EField label="Этаж" value={form.locationData.floor || ''} onChange={(v) => setJson('locationData', 'floor', v)} />
                    </EGrid>
                  ) : (
                    <VGrid>
                      <VField label="Цех">{fmt(loc?.workshop)}</VField>
                      <VField label="Корпус">{fmt(loc?.building)}</VField>
                      <VField label="Производственный участок">{fmt(loc?.productionArea)}</VField>
                      <VField label="Технологический участок">{fmt(loc?.techArea)}</VField>
                      <VField label="№ помещения">{fmt(loc?.roomNumber)}</VField>
                      <VField label="Наименование помещения">{fmt(loc?.roomName)}</VField>
                      <VField label="Линия / установка / комплекс">{fmt(loc?.lineInstallation)}</VField>
                      <VField label="Высотная отметка ось Z">{loc?.elevationMark != null ? String(loc.elevationMark) : '\u2014'}</VField>
                      <VField label="Ось 1 по X">{fmt(loc?.axisX1)}</VField>
                      <VField label="Ось 2 по X">{fmt(loc?.axisX2)}</VField>
                      <VField label="Ось 1 по Y">{fmt(loc?.axisY1)}</VField>
                      <VField label="Ось 2 по Y">{fmt(loc?.axisY2)}</VField>
                      <VField label="№ проекта">{fmt(loc?.projectNumber)}</VField>
                      <VField label="Позиция по проекту">{fmt(loc?.projectPosition)}</VField>
                      <VField label="Пролёт">{fmt(loc?.span)}</VField>
                      <VField label="Этаж">{fmt(loc?.floor)}</VField>
                    </VGrid>
                  )}
                </TabsContent>

                {/* ════════ TAB 3: RESPONSIBILITY ════════ */}
                <TabsContent value="responsibility">
                  {isEditing ? (
                    <EGrid>
                      <EField label="Цех, ответственный за исправное состояние" value={form.responsibilityData.responsibleWorkshop || ''} onChange={(v) => setJson('responsibilityData', 'responsibleWorkshop', v)} />
                      <EField label="Служба главного специалиста" value={form.responsibilityData.responsibleSpecialistService || ''} onChange={(v) => setJson('responsibilityData', 'responsibleSpecialistService', v)} />
                      <EField label="Лицо, ответственное за исправное состояние" value={form.responsibilityData.responsiblePerson || ''} onChange={(v) => setJson('responsibilityData', 'responsiblePerson', v)} />
                      <EField label="Лицо, ответственное за безопасную эксплуатацию" value={form.responsibilityData.safetyResponsiblePerson || ''} onChange={(v) => setJson('responsibilityData', 'safetyResponsiblePerson', v)} />
                      <EField label="Материально ответственное лицо" value={form.responsibilityData.materiallyResponsiblePerson || ''} onChange={(v) => setJson('responsibilityData', 'materiallyResponsiblePerson', v)} />
                    </EGrid>
                  ) : (
                    <VGrid>
                      <VField label="Цех, ответственный за исправное состояние">{fmt(resp?.responsibleWorkshop)}</VField>
                      <VField label="Служба главного специалиста">{fmt(resp?.responsibleSpecialistService)}</VField>
                      <VField label="Лицо, ответственное за исправное состояние">{fmt(resp?.responsiblePerson)}</VField>
                      <VField label="Лицо, ответственное за безопасную эксплуатацию">{fmt(resp?.safetyResponsiblePerson)}</VField>
                      <VField label="Материально ответственное лицо">{fmt(resp?.materiallyResponsiblePerson)}</VField>
                    </VGrid>
                  )}
                </TabsContent>

                {/* ════════ TAB 4: MAINTENANCE ════════ */}
                <TabsContent value="maintenance">
                  <div className="space-y-4 overflow-x-auto">
                    {/* ── Column headers ── */}
                    <div className="grid gap-x-2 pt-1 pb-1 items-end min-w-[680px]" style={{ gridTemplateColumns: maintGridCols }}>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground whitespace-nowrap truncate">Вид обслуживания</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground text-center">ТО, мес.</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground text-center">ТР, мес.</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground text-center">КР, мес.</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground truncate">Исполнитель ТО</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground truncate">Исполнитель ТР</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground truncate">Исполнитель КР</span>
                      <span className="text-[9px] font-semibold uppercase text-muted-foreground text-center">Ремонтосложность</span>
                    </div>
                    <Separator />

                    {/* ── Discipline rows ── */}
                    {/* Use form data when editing, server data when viewing */}
                    {(() => { const ms = isEditing ? form.maintenanceData : (maint || {}); return (
                    <>
                    <MaintRow editing={isEditing} data={{
                      label: 'Механическая часть',
                      toI: ms.toMechInterval, trI: ms.trMechInterval, krI: ms.krMechInterval,
                      toC: ms.toMechContractor, trC: ms.trMechContractor, krC: ms.krMechContractor,
                      rs: ms.repairComplexityMech,
                    }} onSetJson={(key, val) => {
                      const map: Record<string, string> = { toInterval: 'toMechInterval', trInterval: 'trMechInterval', krInterval: 'krMechInterval', toContractor: 'toMechContractor', trContractor: 'trMechContractor', krContractor: 'krMechContractor', repairComplexity: 'repairComplexityMech' }
                      setJson('maintenanceData', map[key] || key, val)
                    }} />
                    <Separator />
                    <MaintRow editing={isEditing} data={{
                      label: 'Энергетическая часть',
                      toI: ms.toElecInterval, trI: ms.trElecInterval, krI: ms.krElecInterval,
                      toC: ms.toElecContractor, trC: ms.trElecContractor, krC: ms.krElecContractor,
                      rs: ms.repairComplexityElec,
                    }} onSetJson={(key, val) => {
                      const map: Record<string, string> = { toInterval: 'toElecInterval', trInterval: 'trElecInterval', krInterval: 'krElecInterval', toContractor: 'toElecContractor', trContractor: 'trElecContractor', krContractor: 'krElecContractor', repairComplexity: 'repairComplexityElec' }
                      setJson('maintenanceData', map[key] || key, val)
                    }} />
                    <Separator />
                    <MaintRow editing={isEditing} data={{
                      label: 'КИПиА',
                      toI: ms.toKipInterval, trI: ms.trKipInterval, krI: ms.krKipInterval,
                      toC: ms.toKipContractor, trC: ms.trKipContractor, krC: ms.krKipContractor,
                      rs: ms.repairComplexityKip,
                    }} onSetJson={(key, val) => {
                      const map: Record<string, string> = { toInterval: 'toKipInterval', trInterval: 'trKipInterval', krInterval: 'krKipInterval', toContractor: 'toKipContractor', trContractor: 'trKipContractor', krContractor: 'krKipContractor', repairComplexity: 'repairComplexityKip' }
                      setJson('maintenanceData', map[key] || key, val)
                    }} />
                    <Separator />
                    <MaintRow editing={isEditing} data={{
                      label: 'АСУ ТП',
                      toI: ms.toAsuInterval, trI: ms.trAsuInterval, krI: ms.krAsuInterval,
                      toC: ms.toAsuContractor, trC: null, krC: null,
                      rs: ms.repairComplexityAsu,
                    }} onSetJson={(key, val) => {
                      const map: Record<string, string> = { toInterval: 'toAsuInterval', trInterval: 'trAsuInterval', krInterval: 'krAsuInterval', toContractor: 'toAsuContractor', trContractor: 'trAsuContractor', krContractor: 'krAsuContractor', repairComplexity: 'repairComplexityAsu' }
                      setJson('maintenanceData', map[key] || key, val)
                    }} />
                    <Separator />
                    <MaintRow editing={isEditing} data={{
                      label: 'Сварочная часть',
                      toI: ms.toWeldInterval, trI: ms.trWeldInterval, krI: ms.krWeldInterval,
                      toC: ms.toWeldContractor, trC: ms.trWeldContractor, krC: ms.krWeldContractor,
                      rs: ms.repairComplexityWeld,
                    }} onSetJson={(key, val) => {
                      const map: Record<string, string> = { toInterval: 'toWeldInterval', trInterval: 'trWeldInterval', krInterval: 'krWeldInterval', toContractor: 'toWeldContractor', trContractor: 'trWeldContractor', krContractor: 'krWeldContractor', repairComplexity: 'repairComplexityWeld' }
                      setJson('maintenanceData', map[key] || key, val)
                    }} />
                    </>
                    ) })()}

                    <Separator />
                    {/* ── Bottom parameters ── */}
                    <div className="pt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Общие параметры</h4>
                      {isEditing ? (
                        <EGrid>
                          <EDate label="Начало ремонтного цикла" value={form.maintenanceData.repairCycleStartDate || ''} onChange={(v) => setJson('maintenanceData', 'repairCycleStartDate', v)} />
                          <ESelect label="Режим сменности" value={form.maintenanceData.shiftMode || ''} onChange={(v) => setJson('maintenanceData', 'shiftMode', v)}
                            options={[{ value: '', label: '\u2014' }, { value: '1', label: '1 смена' }, { value: '2', label: '2 смены' }, { value: '3', label: '3 смены' }]} />
                          <EField label="Коэффициент условий труда" value={form.maintenanceData.laborConditionsFactor != null ? String(form.maintenanceData.laborConditionsFactor) : ''} onChange={(v) => setJson('maintenanceData', 'laborConditionsFactor', v ? parseFloat(v) : null)} type="number" />
                          <EField label="Дополнительный ремонтный коэффициент" value={form.maintenanceData.additionalRepairCoefficient != null ? String(form.maintenanceData.additionalRepairCoefficient) : ''} onChange={(v) => setJson('maintenanceData', 'additionalRepairCoefficient', v ? parseFloat(v) : null)} type="number" />
                        </EGrid>
                      ) : (
                        <VGrid>
                          <VField label="Начало ремонтного цикла">{formatDate(maint?.repairCycleStartDate)}</VField>
                          <VField label="Режим сменности">{fmt(maint?.shiftMode)}</VField>
                          <VField label="Коэффициент условий труда">{maint?.laborConditionsFactor ?? '\u2014'}</VField>
                          <VField label="Дополнительный ремонтный коэффициент">{maint?.additionalRepairCoefficient ?? '\u2014'}</VField>
                        </VGrid>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* ════════ TAB 5: VERIFICATION ════════ */}
                <TabsContent value="verification">
                  {isEditing ? (
                    <EGrid>
                      <EDate label="Дата последней поверки" value={form.verificationData.lastVerificationDate || ''} onChange={(v) => setJson('verificationData', 'lastVerificationDate', v)} />
                      <EDate label="Действительно до" value={form.verificationData.validUntilDate || ''} onChange={(v) => setJson('verificationData', 'validUntilDate', v)} />
                    </EGrid>
                  ) : (
                    <VGrid>
                      <VField label="Дата последней поверки">{formatDate(verif?.lastVerificationDate)}</VField>
                      <VField label="Действительно до">{formatDate(verif?.validUntilDate)}</VField>
                    </VGrid>
                  )}
                </TabsContent>

                {/* ════════ TAB 6: SAFETY ════════ */}
                <TabsContent value="safety">
                  {isEditing ? (
                    <EGrid>
                      <EBool label="Опасный производственный объект" value={!!form.safetyData.isHazardousFacility} onChange={(v) => setJson('safetyData', 'isHazardousFacility', v)} />
                      <EBool label="Химически опасный объект" value={!!form.safetyData.isChemicalHazardous} onChange={(v) => setJson('safetyData', 'isChemicalHazardous', v)} />
                      <EBool label="Влияние на безопасность" value={!!form.safetyData.isSafetyCritical} onChange={(v) => setJson('safetyData', 'isSafetyCritical', v)} />
                      <EBool label="Ядерная установка" value={!!form.safetyData.isNuclearInstallation} onChange={(v) => setJson('safetyData', 'isNuclearInstallation', v)} />
                      <EBool label="Влияние на окружающую среду" value={!!form.safetyData.isEnvironmentalImpact} onChange={(v) => setJson('safetyData', 'isEnvironmentalImpact', v)} />
                      <EBool label="Объект пожарной охраны" value={!!form.safetyData.isFireProtection} onChange={(v) => setJson('safetyData', 'isFireProtection', v)} />
                      <EField label="Нормативный документ по ПБ" value={form.safetyData.safetyNormativeDoc || ''} onChange={(v) => setJson('safetyData', 'safetyNormativeDoc', v)} />
                      <EField label="Класс опасности" value={form.safetyData.safetyClass != null ? String(form.safetyData.safetyClass) : ''} onChange={(v) => setJson('safetyData', 'safetyClass', v ? parseInt(v) : null)} type="number" />
                      <EField label="Код классификации" value={form.safetyData.classificationCode || ''} onChange={(v) => setJson('safetyData', 'classificationCode', v)} />
                      <EField label="Орган внешнего надзора" value={form.safetyData.externalSupervisionAuthority || ''} onChange={(v) => setJson('safetyData', 'externalSupervisionAuthority', v)} />
                      <EField label="Орган внутреннего надзора" value={form.safetyData.internalSupervisionAuthority || ''} onChange={(v) => setJson('safetyData', 'internalSupervisionAuthority', v)} />
                      <EField label="Рег. номер" value={form.safetyData.registrationNumber || ''} onChange={(v) => setJson('safetyData', 'registrationNumber', v)} />
                      <EField label="Срок службы (лет)" value={form.safetyData.serviceLifeYears != null ? String(form.safetyData.serviceLifeYears) : ''} onChange={(v) => setJson('safetyData', 'serviceLifeYears', v ? parseInt(v) : null)} type="number" />
                      <EDate label="Окончание срока службы" value={form.safetyData.serviceLifeExpiryDate || ''} onChange={(v) => setJson('safetyData', 'serviceLifeExpiryDate', v)} />
                    </EGrid>
                  ) : (
                    <VGrid>
                      <VField label="Опасный производственный объект"><BoolBadge value={safety?.isHazardousFacility} /></VField>
                      <VField label="Химически опасный объект"><BoolBadge value={safety?.isChemicalHazardous} /></VField>
                      <VField label="Влияние на безопасность"><BoolBadge value={safety?.isSafetyCritical} /></VField>
                      <VField label="Ядерная установка"><BoolBadge value={safety?.isNuclearInstallation} /></VField>
                      <VField label="Влияние на окружающую среду"><BoolBadge value={safety?.isEnvironmentalImpact} /></VField>
                      <VField label="Объект пожарной охраны"><BoolBadge value={safety?.isFireProtection} /></VField>
                      <VField label="Нормативный документ по ПБ">{fmt(safety?.safetyNormativeDoc)}</VField>
                      <VField label="Класс опасности">{safety?.safetyClass ?? '\u2014'}</VField>
                      <VField label="Код классификации">{fmt(safety?.classificationCode)}</VField>
                      <VField label="Орган внешнего надзора">{fmt(safety?.externalSupervisionAuthority)}</VField>
                      <VField label="Орган внутреннего надзора">{fmt(safety?.internalSupervisionAuthority)}</VField>
                      <VField label="Рег. номер">{fmt(safety?.registrationNumber)}</VField>
                      <VField label="Срок службы (лет)">{safety?.serviceLifeYears ?? '\u2014'}</VField>
                      <VField label="Окончание срока службы">{formatDate(safety?.serviceLifeExpiryDate)}</VField>
                    </VGrid>
                  )}
                </TabsContent>

                {/* ════════ TAB 7: SUPERVISION ════════ */}
                <TabsContent value="supervision">
                  {isEditing ? (
                    <EGrid>
                      <EField label="Вид надзора" value={form.supervisionData.supervisionType || ''} onChange={(v) => setJson('supervisionData', 'supervisionType', v)} />
                      <EDate label="Следующий надзор" value={form.supervisionData.nextSupervisionDate || ''} onChange={(v) => setJson('supervisionData', 'nextSupervisionDate', v)} />
                      <EDate label="Следующее обследование" value={form.supervisionData.nextInspectionDate || ''} onChange={(v) => setJson('supervisionData', 'nextInspectionDate', v)} />
                      <EDate label="Следующая диагностика" value={form.supervisionData.nextDiagnosticsDate || ''} onChange={(v) => setJson('supervisionData', 'nextDiagnosticsDate', v)} />
                      <EField label="Тип документа на продление" value={form.supervisionData.serviceLifeExtensionDocType || ''} onChange={(v) => setJson('supervisionData', 'serviceLifeExtensionDocType', v)} />
                      <EField label="Номер документа на продление" value={form.supervisionData.serviceLifeExtensionDocNumber || ''} onChange={(v) => setJson('supervisionData', 'serviceLifeExtensionDocNumber', v)} />
                      <EDate label="Дата допуска к эксплуатации" value={form.supervisionData.permittedOperationDate || ''} onChange={(v) => setJson('supervisionData', 'permittedOperationDate', v)} />
                    </EGrid>
                  ) : (
                    <VGrid>
                      <VField label="Вид надзора">{fmt(superv?.supervisionType)}</VField>
                      <VField label="Следующий надзор">{formatDate(superv?.nextSupervisionDate)}</VField>
                      <VField label="Следующее обследование">{formatDate(superv?.nextInspectionDate)}</VField>
                      <VField label="Следующая диагностика">{formatDate(superv?.nextDiagnosticsDate)}</VField>
                      <VField label="Тип документа на продление">{fmt(superv?.serviceLifeExtensionDocType)}</VField>
                      <VField label="Номер документа на продление">{fmt(superv?.serviceLifeExtensionDocNumber)}</VField>
                      <VField label="Дата допуска к эксплуатации">{formatDate(superv?.permittedOperationDate)}</VField>
                    </VGrid>
                  )}
                </TabsContent>

                {/* ════════ TAB 8: MEASURED PARAMETERS ════════ */}
                <TabsContent value="measured-params" className="mt-0">
                  <MeasuredParametersTab equipmentId={data.id} />
                </TabsContent>
              </div>
            </div>{/* end scrollable tab content wrapper */}
          </Tabs>
        )}
      </div>

      {/* ── Delete Confirmation Dialog ────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить оборудование?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить оборудование{' '}
              <span className="font-semibold text-foreground">«{data?.name}»</span>
              {data?.code && (
                <> (инв. номер: <span className="font-mono font-semibold text-foreground">{data.code}</span>)</>
              )}
              ? Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSubmitting}>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete() }}
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
