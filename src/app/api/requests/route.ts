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
    const priority = searchParams.get('priority') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }
    if (status && status !== 'all') {
      where.status = status
    }
    if (priority && priority !== 'all') {
      where.priority = priority
    }

    const [items, total] = await Promise.all([
      db.unplannedRequest.findMany({
        where,
        include: {
          equipment: { select: { name: true, code: true } },
          author: { select: { name: true, email: true } },
          assignee: { select: { name: true, email: true } },
          brigade: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.unplannedRequest.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (error) {
    console.error('Requests list error:', error)
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
    const { equipmentId, title, description, priority } = body

    if (!title || !description) {
      return NextResponse.json({ error: 'Название и описание обязательны' }, { status: 400 })
    }

    // Generate request number
    const count = await db.unplannedRequest.count()
    const number = `З-${String(count + 1).padStart(3, '0')}`

    const unplannedRequest = await db.unplannedRequest.create({
      data: {
        number,
        title,
        description,
        priority: priority || 'medium',
        status: 'new',
        requestedBy: user.id,
        equipmentId: equipmentId || null,
      },
      include: {
        equipment: { select: { name: true, code: true } },
        author: { select: { name: true, email: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'UnplannedRequest',
        entityId: unplannedRequest.id,
        details: JSON.stringify({ number: unplannedRequest.number, title: unplannedRequest.title }),
      },
    })

    return NextResponse.json(unplannedRequest, { status: 201 })
  } catch (error) {
    console.error('Request create error:', error)
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
    const { id, title, description, priority, equipmentId, status, assigneeId, brigadeId } = body

    if (!id) {
      return NextResponse.json({ error: 'ID заявки обязателен' }, { status: 400 })
    }

    // Check request exists
    const existing = await db.unplannedRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (priority !== undefined) updateData.priority = priority
    if (equipmentId !== undefined) updateData.equipmentId = equipmentId || null
    if (status !== undefined) updateData.status = status
    if (assigneeId !== undefined) updateData.assignedTo = assigneeId || null
    if (brigadeId !== undefined) updateData.brigadeId = brigadeId || null

    const unplannedRequest = await db.unplannedRequest.update({
      where: { id },
      data: updateData,
      include: {
        equipment: { select: { name: true, code: true } },
        author: { select: { name: true, email: true } },
        assignee: { select: { name: true, email: true } },
        brigade: { select: { name: true, code: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'UnplannedRequest',
        entityId: unplannedRequest.id,
        details: JSON.stringify({ number: unplannedRequest.number, title: unplannedRequest.title, changes: updateData }),
      },
    })

    return NextResponse.json(unplannedRequest, { status: 200 })
  } catch (error) {
    console.error('Request update error:', error)
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
      return NextResponse.json({ error: 'ID заявки обязателен' }, { status: 400 })
    }

    // Check request exists
    const existing = await db.unplannedRequest.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 })
    }

    await db.unplannedRequest.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'UnplannedRequest',
        entityId: id,
        details: JSON.stringify({ number: existing.number, title: existing.title }),
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Request delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
