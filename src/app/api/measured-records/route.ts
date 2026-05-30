import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


// POST /api/measured-records — добавить запись замера
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { parameterId, measuredValue, measurementDate, performerName, notes } = body

    if (!parameterId || !measuredValue || !measurementDate) {
      return NextResponse.json(
        { error: 'Параметр, значение и дата замера обязательны' },
        { status: 400 },
      )
    }

    // Проверяем существование параметра
    const paramExists = await db.measuredParameter.findUnique({
      where: { id: parameterId },
    })
    if (!paramExists) {
      return NextResponse.json({ error: 'Параметр не найден' }, { status: 404 })
    }

    const record = await db.measurementRecord.create({
      data: {
        parameterId,
        measuredValue: measuredValue.trim(),
        measurementDate,
        performerName: performerName?.trim() || null,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Measured record POST error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// DELETE /api/measured-records — удалить запись замера
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'ID записи обязателен' }, { status: 400 })
    }

    const existing = await db.measurementRecord.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запись не найдена' }, { status: 404 })
    }

    await db.measurementRecord.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Measured record DELETE error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
