import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getSessionUser(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value
  if (!sessionToken) return null
  return db.user.findUnique({
    where: { id: sessionToken },
    select: { id: true, role: true, isActive: true },
  })
}

// Allowed bulk-update scalar fields with their types
const ALLOWED_FIELDS = [
  // Basic
  'status', 'criticality', 'departmentId', 'location', 'manufacturer', 'model',
  'description', 'serialNumber', 'inventoryNumber', 'quantity', 'unit', 'drawing',
  'equipmentClass', 'topazNumber', 'abcdCode', 'costCenter', 'processImportance',
  'manufactureDate', 'decommissionDate', 'commissionDate',
  // Flags
  'isKey', 'isTest', 'hasReserve',
  // JSON
  'locationData', 'responsibilityData', 'maintenanceData', 'verificationData',
  'safetyData', 'supervisionData', 'specifications',
] as const

type AllowedField = (typeof ALLOWED_FIELDS)[number]

const BOOLEAN_FIELDS: AllowedField[] = ['isKey', 'isTest', 'hasReserve']
const JSON_FIELDS: AllowedField[] = [
  'locationData', 'responsibilityData', 'maintenanceData',
  'verificationData', 'safetyData', 'supervisionData', 'specifications',
]
const NUMBER_FIELDS: AllowedField[] = ['quantity']

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, updates } = body as {
      ids: string[]
      updates: Record<string, unknown>
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Укажите список ID оборудования' }, { status: 400 })
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: 'Максимум 500 объектов за один запрос' }, { status: 400 })
    }
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Укажите хотя бы одно поле для обновления' }, { status: 400 })
    }

    // Validate field names
    const invalidFields = Object.keys(updates).filter(
      (f) => !ALLOWED_FIELDS.includes(f as AllowedField)
    )
    if (invalidFields.length > 0) {
      return NextResponse.json(
        { error: `Недопустимые поля: ${invalidFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate JSON fields
    for (const field of JSON_FIELDS) {
      if (field in updates && updates[field] !== null && typeof updates[field] === 'string') {
        try {
          updates[field] = JSON.parse(updates[field] as string)
        } catch {
          return NextResponse.json(
            { error: `Поле «${field}» должно быть валидным JSON` },
            { status: 400 }
          )
        }
      }
    }

    // Validate boolean fields
    for (const field of BOOLEAN_FIELDS) {
      if (field in updates && typeof updates[field] !== 'boolean') {
        return NextResponse.json(
          { error: `Поле «${field}» должно быть логическим (true/false)` },
          { status: 400 }
        )
      }
    }

    // Validate number fields
    for (const field of NUMBER_FIELDS) {
      if (field in updates && updates[field] !== null) {
        updates[field] = Number(updates[field])
      }
    }

    // Check all IDs exist
    const existing = await db.equipment.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, code: true },
    })
    const foundIds = new Set(existing.map((e) => e.id))
    const missingIds = ids.filter((id) => !foundIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `${missingIds.length} объектов не найдено` },
        { status: 404 }
      )
    }

    // Build Prisma update data (only allowed fields)
    const updateData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(updates)) {
      if (ALLOWED_FIELDS.includes(key as AllowedField)) {
        updateData[key] = value === '' ? null : value
      }
    }

    // Update all equipment in a transaction
    const results = await db.$transaction(
      ids.map((id) =>
        db.equipment.update({
          where: { id },
          data: updateData,
          include: {
            department: { select: { name: true, code: true } },
            equipmentType: { select: { name: true, code: true } },
          },
        })
      )
    )

    // Audit log for each updated equipment
    const changedFields = Object.keys(updateData).join(', ')
    await db.auditLog.createMany({
      data: results.map((eq) => ({
        userId: user.id,
        action: 'UPDATE' as const,
        entity: 'Equipment' as const,
        entityId: eq.id,
        details: JSON.stringify({
          name: eq.name,
          code: eq.code,
          bulkUpdate: true,
          changedFields,
        }),
      })),
    })

    return NextResponse.json({
      success: true,
      updated: results.length,
      items: results,
    })
  } catch (error) {
    console.error('Bulk update error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
