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

// GET /api/equipment/[id]/parameters — list all parameters with records
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    const equipment = await db.equipment.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!equipment) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    const parameters = await db.measuredParameter.findMany({
      where: { equipmentId: id },
      orderBy: { sortOrder: 'asc' },
      include: {
        records: {
          orderBy: { measuredDate: 'desc' },
        },
      },
    })

    // Compute deviation and tolerance status for each record
    const enriched = parameters.map((p) => {
      const recordsWithMeta = p.records.map((r) => {
        let deviation: number | null = null
        let isInTolerance: boolean | null = null
        if (p.refValue !== null && p.refValue !== 0) {
          deviation = ((r.measuredValue - p.refValue) / p.refValue) * 100
          const tolMin = p.toleranceMin ?? -Infinity
          const tolMax = p.toleranceMax ?? Infinity
          isInTolerance = deviation >= tolMin && deviation <= tolMax
        }
        return {
          ...r,
          deviation,
          isInTolerance,
        }
      })
      return {
        ...p,
        records: recordsWithMeta,
      }
    })

    return NextResponse.json({ parameters: enriched })
  } catch (error) {
    console.error('Measured parameters list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/equipment/[id]/parameters — create parameter
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const {
      equipmentId,
      name,
      unitOkei,
      unitSymbol,
      refValue,
      toleranceMin,
      toleranceMax,
      description,
      sortOrder,
    } = body

    if (!equipmentId || !name) {
      return NextResponse.json(
        { error: 'ID оборудования и наименование параметра обязательны' },
        { status: 400 },
      )
    }

    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true },
    })
    if (!equipment) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    const parameter = await db.measuredParameter.create({
      data: {
        equipmentId,
        name,
        unitOkei: unitOkei || null,
        unitSymbol: unitSymbol || null,
        refValue: refValue != null ? parseFloat(String(refValue)) : null,
        toleranceMin: toleranceMin != null ? parseFloat(String(toleranceMin)) : null,
        toleranceMax: toleranceMax != null ? parseFloat(String(toleranceMax)) : null,
        description: description || null,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder)) || 0,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'MeasuredParameter',
        entityId: parameter.id,
        details: JSON.stringify({ equipmentId, name }),
      },
    })

    return NextResponse.json(parameter, { status: 201 })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Measured parameter create error:', msg, error)
    return NextResponse.json({ error: 'Ошибка сервера', detail: msg }, { status: 500 })
  }
}

// PUT /api/equipment/[id]/parameters — update parameter
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...fields } = body

    if (!id) {
      return NextResponse.json({ error: 'ID параметра обязателен' }, { status: 400 })
    }

    const existing = await db.measuredParameter.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const numericFields = ['refValue', 'toleranceMin', 'toleranceMax']
    const allowedFields = ['name', 'unitOkei', 'unitSymbol', 'refValue', 'toleranceMin', 'toleranceMax', 'description', 'sortOrder']
    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        if (numericFields.includes(field)) {
          updateData[field] = fields[field] != null ? parseFloat(String(fields[field])) : null
        } else if (field === 'sortOrder') {
          updateData[field] = typeof fields[field] === 'number' ? fields[field] : parseInt(String(fields[field])) || 0
        } else {
          updateData[field] = fields[field] ?? null
        }
      }
    }

    const parameter = await db.measuredParameter.update({
      where: { id },
      data: updateData,
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'MeasuredParameter',
        entityId: parameter.id,
        details: JSON.stringify({ name: parameter.name, equipmentId: existing.equipmentId }),
      },
    })

    return NextResponse.json(parameter)
  } catch (error) {
    console.error('Measured parameter update error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/equipment/[id]/parameters — delete parameter (cascade deletes records)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID параметра обязателен' }, { status: 400 })
    }

    const existing = await db.measuredParameter.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }

    await db.measuredParameter.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'MeasuredParameter',
        entityId: id,
        details: JSON.stringify({ name: existing.name, equipmentId: existing.equipmentId }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Measured parameter delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
