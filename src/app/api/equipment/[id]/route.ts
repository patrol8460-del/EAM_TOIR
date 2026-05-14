import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


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
      include: {
        department: { select: { id: true, name: true, code: true } },
        equipmentType: { select: { id: true, name: true, code: true } },
        maintenancePlan: {
          include: {
            tasks: {
              orderBy: { scheduledDate: 'desc' },
              take: 10,
            },
          },
        },
        parent: { select: { id: true, name: true, code: true } },
        children: { select: { id: true, name: true, code: true, status: true } },
      },
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    return NextResponse.json(equipment)
  } catch (error) {
    console.error('Equipment detail error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
