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

    const unplannedRequest = await db.unplannedRequest.findUnique({
      where: { id },
      include: {
        equipment: { select: { id: true, name: true, code: true } },
        author: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        brigade: { select: { id: true, name: true, code: true } },
      },
    })

    if (!unplannedRequest) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    return NextResponse.json(unplannedRequest)
  } catch (error) {
    console.error('Request detail error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
