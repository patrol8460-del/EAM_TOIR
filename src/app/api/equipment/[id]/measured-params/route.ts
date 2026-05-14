import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


// GET /api/equipment/[id]/measured-params — список параметров с записями
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

    const params_list = await db.measuredParameter.findMany({
      where: { equipmentId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        records: {
          orderBy: { measurementDate: 'desc' },
        },
      },
    })

    return NextResponse.json(params_list)
  } catch (error) {
    console.error('Measured params GET error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST /api/equipment/[id]/measured-params — создать новый параметр
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
    const { name, unit, referenceValue } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название параметра обязательно' }, { status: 400 })
    }

    // Получаем текущее максимальное sortOrder
    const maxSort = await db.measuredParameter.findFirst({
      where: { equipmentId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })

    const param = await db.measuredParameter.create({
      data: {
        equipmentId,
        name: name.trim(),
        unit: unit?.trim() || '',
        referenceValue: referenceValue?.trim() || null,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
      include: { records: { orderBy: { measurementDate: 'desc' } } },
    })

    return NextResponse.json(param)
  } catch (error) {
    console.error('Measured params POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// PUT /api/equipment/[id]/measured-params — обновить параметр
export async function PUT(
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
    const { id, name, unit, referenceValue } = body

    if (!id) {
      return NextResponse.json({ error: 'ID параметра обязателен' }, { status: 400 })
    }

    // Проверяем, что параметр принадлежит этому оборудованию
    const existing = await db.measuredParameter.findFirst({
      where: { id, equipmentId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }

    const param = await db.measuredParameter.update({
      where: { id },
      data: {
        name: name?.trim() || existing.name,
        unit: unit !== undefined ? (unit?.trim() || '') : existing.unit,
        referenceValue: referenceValue !== undefined ? (referenceValue?.trim() || null) : existing.referenceValue,
      },
      include: { records: { orderBy: { measurementDate: 'desc' } } },
    })

    return NextResponse.json(param)
  } catch (error) {
    console.error('Measured params PUT error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/equipment/[id]/measured-params — удалить параметр (каскадное удаление записей)
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
      return NextResponse.json({ error: 'ID параметра обязателен' }, { status: 400 })
    }

    // Проверяем принадлежность
    const existing = await db.measuredParameter.findFirst({
      where: { id, equipmentId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }

    await db.measuredParameter.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Measured params DELETE error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
