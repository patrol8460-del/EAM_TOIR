import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

async function getSessionUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null
  return db.user.findUnique({
    where: { id: sessionToken },
    select: { id: true, role: true, isActive: true },
  })
}

// Column name mapping: various Russian/English names → database field keys
const COLUMN_MAP: Record<string, string> = {
  // Required fields
  'наименование': 'name',
  'наименованиеоборудования': 'name',
  'name': 'name',
  'название': 'name',
  'equipmentname': 'name',
  'объект': 'name',
  'инв. номер': 'code',
  'инв номер': 'code',
  'инв.номер': 'code',
  'инвентарный номер': 'code',
  'инвентарныйномер': 'code',
  'invnumber': 'code',
  'code': 'code',
  'код': 'code',
  'шифр': 'code',

  // Optional fields
  'тип/модель': 'model',
  'тип модель': 'model',
  'тип': 'model',
  'модель': 'model',
  'тип/модельоборудования': 'model',
  'model': 'model',
  'equipmenttype': 'model',
  'марка': 'model',

  'изготовитель': 'manufacturer',
  'производитель': 'manufacturer',
  'manufacturer': 'manufacturer',
  'завод-изготовитель': 'manufacturer',

  'серийный номер': 'serialNumber',
  'заводской номер': 'serialNumber',
  'серийныйномер': 'serialNumber',
  'заводскойномер': 'serialNumber',
  'serialnumber': 'serialNumber',
  'serial': 'serialNumber',
  's/n': 'serialNumber',
  'sn': 'serialNumber',

  'подразделение': 'department',
  'department': 'department',
  'цех': 'department',
  'участок': 'department',

  'статус': 'status',
  'status': 'status',
  'состояние': 'status',

  'критичность': 'criticality',
  'criticality': 'criticality',
  'уровень критичности': 'criticality',

  'расположение': 'location',
  'location': 'location',
  'место установки': 'location',

  'описание': 'description',
  'description': 'description',
  'примечание': 'description',
  'комментарий': 'description',

  // Extended fields
  'инвентарный номер ос': 'inventoryNumber',
  'инвентарный номер ос (11 знаков)': 'inventoryNumber',
  'инвномерос': 'inventoryNumber',
  'inventorynumber': 'inventoryNumber',
  'бухг. номер': 'inventoryNumber',
  'номер ос': 'inventoryNumber',

  'количество': 'quantity',
  'quantity': 'quantity',
  'кол-во': 'quantity',

  'еи': 'unit',
  'ед. изм.': 'unit',
  'единица измерения': 'unit',
  'unit': 'unit',

  'чертёж': 'drawing',
  'чертеж': 'drawing',
  'drawing': 'drawing',
  'номер чертежа': 'drawing',

  'класс': 'equipmentClass',
  'класс оборудования': 'equipmentClass',
  'class': 'equipmentClass',
  'equipmentclass': 'equipmentClass',

  'номер топаз': 'topazNumber',
  'topaz': 'topazNumber',
  'topaznumber': 'topazNumber',
  'топаз': 'topazNumber',

  'номер sap': 'sapNumber',
  'sap номер': 'sapNumber',
  'sapnumber': 'sapNumber',
  'sap': 'sapNumber',
  'номер sap toro': 'sapNumber',

  'код abcd': 'abcdCode',
  'abcd код': 'abcdCode',
  'abcd': 'abcdCode',
  'abcdcode': 'abcdCode',
  'код abсd': 'abcdCode',

  'мвз': 'costCenter',
  'цмо': 'costCenter',
  'место затрат': 'costCenter',
  'costcenter': 'costCenter',
  'cost center': 'costCenter',

  'дата выпуска': 'manufactureDate',
  'датавыпуска': 'manufactureDate',
  'дата изготовления': 'manufactureDate',
  'manufacturedate': 'manufactureDate',
  'год выпуска': 'manufactureDate',

  'дата ввода в эксплуатацию': 'commissionDate',
  'дата ввода': 'commissionDate',
  'датавводавэксплуатацию': 'commissionDate',
  'commissiondate': 'commissionDate',
  'ввод в эксплуатацию': 'commissionDate',

  'важность для тп': 'processImportance',
  'важность для технологического процесса': 'processImportance',
  'техн. значимость': 'processImportance',
  'технологическая значимость': 'processImportance',
  'processimportance': 'processImportance',
  'process importance': 'processImportance',
}

// Status mapping
const STATUS_MAP: Record<string, string> = {
  'в работе': 'active',
  'работает': 'active',
  'active': 'active',
  'эксплуатируется': 'active',
  'в ремонте': 'under_repair',
  'ремонт': 'under_repair',
  'under_repair': 'under_repair',
  'списано': 'decommissioned',
  'списан': 'decommissioned',
  'decommissioned': 'decommissioned',
  'выведено': 'decommissioned',
}

// Criticality mapping
const CRITICALITY_MAP: Record<string, string> = {
  'критичное': 'critical',
  'критическое': 'critical',
  'critical': 'critical',
  'высокое': 'high',
  'high': 'high',
  'среднее': 'medium',
  'medium': 'medium',
  'низкое': 'low',
  'low': 'low',
}

function normalizeColumnKey(col: string): string {
  const cleaned = String(col).trim().toLowerCase().replace(/[_\s\-./()]+/g, '')
  // Try direct match first
  if (COLUMN_MAP[cleaned]) return COLUMN_MAP[cleaned]
  // Try with spaces preserved (lowered, collapsed)
  const spaced = String(col).trim().toLowerCase().replace(/\s+/g, ' ')
  if (COLUMN_MAP[spaced]) return COLUMN_MAP[spaced]
  // Try original
  if (COLUMN_MAP[String(col).trim()]) return COLUMN_MAP[String(col).trim()]
  return ''
}

function parseDate(val: unknown): string | null {
  if (!val || val === '') return null
  const str = String(val).trim()
  if (!str) return null

  // Try YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`
  }

  // Try DD.MM.YYYY or DD/MM/YYYY
  const ruMatch = str.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  if (ruMatch) {
    return `${ruMatch[3]}-${ruMatch[2].padStart(2, '0')}-${ruMatch[1].padStart(2, '0')}`
  }

  // Try Excel serial date number
  const num = Number(val)
  if (!isNaN(num) && num > 30000 && num < 60000) {
    // Excel epoch: Jan 1, 1900 (with the 1900 leap year bug)
    const epoch = new Date(1899, 11, 30)
    const date = new Date(epoch.getTime() + num * 86400000)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Fallback: try native Date parse
  const parsed = new Date(str)
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
    const y = parsed.getFullYear()
    const m = String(parsed.getMonth() + 1).padStart(2, '0')
    const d = String(parsed.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return null
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

function parseBoolean(val: unknown): boolean | undefined {
  if (val === null || val === undefined || val === '') return undefined
  const str = String(val).trim().toLowerCase()
  if (['да', 'yes', 'true', '1', '+', 'истина'].includes(str)) return true
  if (['нет', 'no', 'false', '0', '-', 'ложь'].includes(str)) return false
  return undefined
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 })
    }

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'csv') {
      return NextResponse.json({ error: 'Поддерживаются только файлы .xlsx и .csv' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Файл слишком большой (максимум 5 МБ)' }, { status: 400 })
    }

    // Save file to temp location
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const tmpPath = join('/tmp', `import_${randomUUID()}.${ext}`)
    await writeFile(tmpPath, buffer)

    let imported = 0
    let skipped = 0
    let errors = 0
    const errorDetails: string[] = []

    try {
      // Parse the file
      const workbook = XLSX.readFile(tmpPath)
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        return NextResponse.json({ error: 'Файл не содержит листов' }, { status: 400 })
      }
      const sheet = workbook.Sheets[sheetName]
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

      if (rows.length === 0) {
        return NextResponse.json({ error: 'Файл не содержит данных' }, { status: 400 })
      }

      // Build column mapping from header row
      const rawHeaders = Object.keys(rows[0])
      const columnMapping: Record<string, string> = {}
      for (const header of rawHeaders) {
        const mapped = normalizeColumnKey(header)
        if (mapped) {
          columnMapping[header] = mapped
        }
      }

      // Pre-load existing codes for duplicate check
      const existingEquipment = await db.equipment.findMany({
        select: { code: true },
      })
      const existingCodes = new Set(existingEquipment.map((e) => e.code.toLowerCase()))

      // Pre-load departments for name matching
      const allDepartments = await db.department.findMany({
        select: { id: true, name: true, code: true },
      })

      // Pre-load equipment types for name matching
      const allTypes = await db.equipmentType.findMany({
        select: { id: true, name: true, code: true },
      })

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const rowNum = i + 2 // Excel rows start at 1, but we have header at 1
        const row = rows[i]

        // Map columns to field names
        const mapped: Record<string, unknown> = {}
        for (const [header, dbField] of Object.entries(columnMapping)) {
          mapped[dbField] = row[header]
        }

        // Validate required fields
        const name = String(mapped['name'] || '').trim()
        const code = String(mapped['code'] || '').trim()

        if (!name && !code) {
          // Skip completely empty rows silently
          continue
        }

        if (!name) {
          errors++
          errorDetails.push(`Строка ${rowNum}: отсутствует наименование`)
          continue
        }

        if (!code) {
          errors++
          errorDetails.push(`Строка ${rowNum}: отсутствует инв. номер`)
          continue
        }

        // Check for duplicate code
        if (existingCodes.has(code.toLowerCase())) {
          skipped++
          continue
        }

        // Map status
        let status: string = 'active'
        if (mapped['status']) {
          const normalized = String(mapped['status']).trim().toLowerCase()
          status = STATUS_MAP[normalized] || 'active'
        }

        // Map criticality
        let criticality: string = 'medium'
        if (mapped['criticality']) {
          const normalized = String(mapped['criticality']).trim().toLowerCase()
          criticality = CRITICALITY_MAP[normalized] || 'medium'
        }

        // Resolve department
        let departmentId: string | null = null
        if (mapped['department']) {
          const deptName = String(mapped['department']).trim().toLowerCase()
          const found = allDepartments.find(
            (d) =>
              d.name.toLowerCase() === deptName ||
              d.code.toLowerCase() === deptName ||
              d.name.toLowerCase().includes(deptName) ||
              deptName.includes(d.name.toLowerCase())
          )
          if (found) departmentId = found.id
        }

        // Resolve equipment type
        let equipmentTypeId: string | null = null
        if (mapped['model']) {
          const typeName = String(mapped['model']).trim().toLowerCase()
          const found = allTypes.find(
            (t) =>
              t.name.toLowerCase() === typeName ||
              t.code.toLowerCase() === typeName ||
              t.name.toLowerCase().includes(typeName)
          )
          if (found) equipmentTypeId = found.id
        }

        // Parse date fields
        const manufactureDate = parseDate(mapped['manufactureDate'])
        const commissionDate = parseDate(mapped['commissionDate'])

        // Parse numeric fields
        const quantity = parseNumber(mapped['quantity'])
        const sapNumber = parseNumber(mapped['sapNumber'])

        // Parse boolean fields
        const isKey = parseBoolean(mapped['isKey'])
        const isTest = parseBoolean(mapped['isTest'])
        const hasReserve = parseBoolean(mapped['hasReserve'])

        try {
          const equipment = await db.equipment.create({
            data: {
              name,
              code,
              model: mapped['model'] ? String(mapped['model']).trim() || null : null,
              manufacturer: mapped['manufacturer'] ? String(mapped['manufacturer']).trim() || null : null,
              serialNumber: mapped['serialNumber'] ? String(mapped['serialNumber']).trim() || null : null,
              departmentId,
              equipmentTypeId,
              status,
              criticality,
              location: mapped['location'] ? String(mapped['location']).trim() || null : null,
              description: mapped['description'] ? String(mapped['description']).trim() || null : null,
              inventoryNumber: mapped['inventoryNumber'] ? String(mapped['inventoryNumber']).trim() || null : null,
              quantity: quantity ?? undefined,
              unit: mapped['unit'] ? String(mapped['unit']).trim() || null : null,
              drawing: mapped['drawing'] ? String(mapped['drawing']).trim() || null : null,
              equipmentClass: mapped['equipmentClass'] ? String(mapped['equipmentClass']).trim() || null : null,
              topazNumber: mapped['topazNumber'] ? String(mapped['topazNumber']).trim() || null : null,
              sapNumber: sapNumber ?? undefined,
              abcdCode: mapped['abcdCode'] ? String(mapped['abcdCode']).trim().toUpperCase() || null : null,
              costCenter: mapped['costCenter'] ? String(mapped['costCenter']).trim() || null : null,
              manufactureDate,
              commissionDate,
              processImportance: mapped['processImportance'] ? String(mapped['processImportance']).trim() || null : null,
              isKey: isKey ?? false,
              isTest: isTest ?? false,
              hasReserve: hasReserve ?? false,
            },
          })

          // Track newly created code to avoid duplicates within same import
          existingCodes.add(code.toLowerCase())

          // Audit log
          await db.auditLog.create({
            data: {
              userId: user.id,
              action: 'CREATE',
              entity: 'Equipment',
              entityId: equipment.id,
              details: JSON.stringify({ name: equipment.name, code: equipment.code, source: 'import' }),
            },
          })

          imported++
        } catch (createErr) {
          errors++
          const errMsg = createErr instanceof Error ? createErr.message : 'Неизвестная ошибка'
          errorDetails.push(`Строка ${rowNum}: ${errMsg}`)
        }
      }
    } finally {
      // Clean up temp file
      try {
        await unlink(tmpPath)
      } catch {
        // ignore cleanup errors
      }
    }

    return NextResponse.json({
      imported,
      skipped,
      errors,
      errorDetails: errorDetails.slice(0, 20), // Limit to 20 error details
    })
  } catch (error) {
    console.error('Equipment import error:', error)
    return NextResponse.json({ error: 'Ошибка сервера при импорте' }, { status: 500 })
  }
}
