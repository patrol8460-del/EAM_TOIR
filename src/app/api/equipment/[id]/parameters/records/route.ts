import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


// POST /api/equipment/[id]/parameters/records — add measurement record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id: equipmentId } = await params
    const body = await request.json()
    const { parameterId, measuredValue, measuredDate, operatorName, notes } = body

    if (!parameterId || measuredValue == null || !measuredDate || !operatorName) {
      return NextResponse.json(
        { error: 'parameterId, measuredValue, measuredDate и operatorName обязательны' },
        { status: 400 },
      )
    }

    // Verify parameter belongs to this equipment
    const parameter = await db.measuredParameter.findUnique({
      where: { id: parameterId },
      select: { id: true, equipmentId: true, name: true },
    })
    if (!parameter) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }
    if (parameter.equipmentId !== equipmentId) {
      return NextResponse.json({ error: 'Параметр не принадлежит данному оборудованию' }, { status: 403 })
    }

    const record = await db.measurementRecord.create({
      data: {
        parameterId,
        measuredValue: parseFloat(String(measuredValue)),
        measuredDate,
        operatorName,
        notes: notes || null,
      },
    })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'MeasurementRecord',
        entityId: record.id,
        details: JSON.stringify({
          parameterId,
          parameterName: parameter.name,
          equipmentId,
          measuredValue: record.measuredValue,
          measuredDate,
        }),
      },
    })

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Measurement record create error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/equipment/[id]/parameters/records — delete a record
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id: equipmentId } = await params
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID записи обязателен' }, { status: 400 })
    }

    // Verify record's parameter belongs to this equipment
    const record = await db.measurementRecord.findUnique({
      where: { id },
      select: {
        id: true,
        parameterId: true,
        parameter: {
          select: { equipmentId: true, name: true },
        },
      },
    })
    if (!record) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }
    if (record.parameter.equipmentId !== equipmentId) {
      return NextResponse.json({ error: 'Запись не принадлежит данному оборудованию' }, { status: 403 })
    }

    await db.measurementRecord.delete({ where: { id } })

    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'MeasurementRecord',
        entityId: id,
        details: JSON.stringify({
          parameterId: record.parameterId,
          parameterName: record.parameter.name,
          equipmentId,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Measurement record delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
