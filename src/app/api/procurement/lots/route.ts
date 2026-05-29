import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/procurement/lots — list procurement lots
 *   ?status=draft|submitted|ordered|completed|cancelled
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || ''

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const lots = await db.procurementLot.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ lots })
  } catch (error) {
    console.error('Procurement lots list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * POST /api/procurement/lots — create a procurement lot
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, items } = body

    if (!title || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Укажите название и хотя бы одну позицию' },
        { status: 400 },
      )
    }

    // Generate lot number ЗАК-YYYYMMDD-NNN
    const today = new Date()
    const dateStr = today.getFullYear().toString() +
      String(today.getMonth() + 1).padStart(2, '0') +
      String(today.getDate()).padStart(2, '0')
    const prefix = `ЗАК-${dateStr}-`

    const todayLots = await db.procurementLot.findMany({
      where: { number: { startsWith: prefix } },
      select: { number: true },
    })
    const nextNum = todayLots.length + 1
    const number = `${prefix}${String(nextNum).padStart(3, '0')}`

    // Validate items
    const validatedItems = items.map((item: Record<string, unknown>) => ({
      articleNumber: String(item.articleNumber || '').trim(),
      name: String(item.name || '').trim(),
      unit: String(item.unit || 'шт'),
      quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
      unitPrice: item.unitPrice != null ? parseFloat(String(item.unitPrice)) : null,
      notes: item.notes ? String(item.notes) : null,
      sourceData: item.sources ? JSON.stringify(item.sources) : null,
    }))

    const lot = await db.procurementLot.create({
      data: {
        number,
        title: String(title),
        description: description ? String(description) : null,
        status: 'draft',
        createdBy: user.id,
        items: {
          create: validatedItems,
        },
      },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    })

    return NextResponse.json({ lot }, { status: 201 })
  } catch (error) {
    console.error('Procurement lot create error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
