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

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const typeId = searchParams.get('typeId') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Build Prisma where for non-text filters (status, typeId)
    const where: Record<string, unknown> = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (typeId) {
      where.equipmentTypeId = typeId
    }

    const allItems = await db.equipment.findMany({
      where,
      include: {
        department: { select: { name: true, code: true } },
        equipmentType: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Case-insensitive in-memory text search (works for Cyrillic)
    let filtered = allItems
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = allItems.filter((item) => {
        const fields = [item.name, item.code, item.manufacturer, item.model, item.description]
        return fields.some((f) => f && f.toLowerCase().includes(lowerSearch))
      })
    }

    // Pagination (in-memory)
    const total = filtered.length
    const items = filtered.slice((page - 1) * limit, page * limit)

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Equipment list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { name, code, departmentId, equipmentTypeId, location, manufacturer, model, serialNumber, commissionDate, criticality, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Наименование и инвентарный номер обязательны' }, { status: 400 })
    }

    // Check unique code
    const existing = await db.equipment.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Оборудование с таким инвентарным номером уже существует' }, { status: 409 })
    }

    const equipment = await db.equipment.create({
      data: {
        name,
        code,
        departmentId: departmentId || null,
        equipmentTypeId: equipmentTypeId || null,
        location: location || null,
        manufacturer: manufacturer || null,
        model: model || null,
        serialNumber: serialNumber || null,
        commissionDate: commissionDate || null,
        criticality: criticality || 'medium',
        description: description || null,
      },
      include: {
        department: { select: { name: true, code: true } },
        equipmentType: { select: { name: true, code: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'Equipment',
        entityId: equipment.id,
        details: JSON.stringify({ name: equipment.name, code: equipment.code }),
      },
    })

    return NextResponse.json(equipment, { status: 201 })
  } catch (error) {
    console.error('Equipment create error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, code, departmentId, equipmentTypeId, location, manufacturer, model, serialNumber, commissionDate, criticality, description, status, inventoryNumber, quantity, unit, drawing, equipmentClass, topazNumber, sapNumber, abcdCode, costCenter, manufactureDate, decommissionDate, processImportance, isKey, isTest, hasReserve, parentEquipmentSap, locationData, responsibilityData, maintenanceData, verificationData, safetyData, supervisionData, specifications } = body

    if (!id) {
      return NextResponse.json({ error: 'ID оборудования обязателен' }, { status: 400 })
    }
    if (!name || !code) {
      return NextResponse.json({ error: 'Наименование и инвентарный номер обязательны' }, { status: 400 })
    }

    // Check equipment exists
    const existing = await db.equipment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    // Check unique code (exclude self)
    const duplicateCode = await db.equipment.findUnique({ where: { code } })
    if (duplicateCode && duplicateCode.id !== id) {
      return NextResponse.json({ error: 'Оборудование с таким инвентарным номером уже существует' }, { status: 409 })
    }

    const equipment = await db.equipment.update({
      where: { id },
      data: {
        name,
        code,
        departmentId: departmentId || null,
        equipmentTypeId: equipmentTypeId || null,
        location: location || null,
        manufacturer: manufacturer || null,
        model: model || null,
        serialNumber: serialNumber || null,
        commissionDate: commissionDate || null,
        criticality: criticality || 'medium',
        description: description || null,
        status: status || 'active',
        inventoryNumber: inventoryNumber || null,
        quantity: quantity ?? null,
        unit: unit || null,
        drawing: drawing || null,
        equipmentClass: equipmentClass || null,
        topazNumber: topazNumber || null,
        sapNumber: sapNumber ?? null,
        abcdCode: abcdCode || null,
        costCenter: costCenter || null,
        manufactureDate: manufactureDate || null,
        decommissionDate: decommissionDate || null,
        processImportance: processImportance || null,
        isKey: isKey ?? false,
        isTest: isTest ?? false,
        hasReserve: hasReserve ?? false,
        parentEquipmentSap: parentEquipmentSap ?? null,
        locationData: locationData || null,
        responsibilityData: responsibilityData || null,
        maintenanceData: maintenanceData || null,
        verificationData: verificationData || null,
        safetyData: safetyData || null,
        supervisionData: supervisionData || null,
        specifications: specifications || null,
      },
      include: {
        department: { select: { name: true, code: true } },
        equipmentType: { select: { name: true, code: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'Equipment',
        entityId: equipment.id,
        details: JSON.stringify({ name: equipment.name, code: equipment.code }),
      },
    })

    return NextResponse.json(equipment, { status: 200 })
  } catch (error) {
    console.error('Equipment update error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID оборудования обязателен' }, { status: 400 })
    }

    // Check equipment exists
    const existing = await db.equipment.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    await db.equipment.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'Equipment',
        entityId: id,
        details: JSON.stringify({ name: existing.name, code: existing.code }),
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Equipment delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
