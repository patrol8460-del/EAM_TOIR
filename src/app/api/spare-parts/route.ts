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
    const categoryId = searchParams.get('categoryId') || ''
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: Record<string, unknown> = {}
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
      ]
    }
    if (categoryId) {
      where.categoryId = categoryId
    }
    if (lowStock) {
      where.currentStock = { lte: db.sparePart.fields.minStock }
    }

    const [items, total, lowStockCount] = await Promise.all([
      db.sparePart.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.sparePart.count({ where }),
      db.sparePart.count({
        where: { currentStock: { lte: db.sparePart.fields.minStock } },
      }),
    ])

    return NextResponse.json({ items, total, page, limit, lowStockCount })
  } catch (error) {
    console.error('Spare parts list error:', error)
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
    const { name, code, categoryId, unit, minStock, currentStock, price, description } = body

    if (!name || !code) {
      return NextResponse.json({ error: 'Наименование и артикул обязательны' }, { status: 400 })
    }

    // Check unique code
    const existing = await db.sparePart.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: 'Запчасть с таким артикулом уже существует' }, { status: 409 })
    }

    const sparePart = await db.sparePart.create({
      data: {
        name,
        code,
        categoryId: categoryId || null,
        unit: unit || 'шт',
        minStock: minStock ?? 0,
        currentStock: currentStock ?? 0,
        price: price ?? null,
        description: description || null,
      },
      include: {
        category: { select: { name: true, code: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'SparePart',
        entityId: sparePart.id,
        details: JSON.stringify({ name: sparePart.name, code: sparePart.code }),
      },
    })

    return NextResponse.json(sparePart, { status: 201 })
  } catch (error) {
    console.error('Spare part create error:', error)
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
    const { id, name, code, categoryId, unit, minStock, currentStock, price, description } = body

    if (!id) {
      return NextResponse.json({ error: 'ID запчасти обязателен' }, { status: 400 })
    }
    if (!name || !code) {
      return NextResponse.json({ error: 'Наименование и артикул обязательны' }, { status: 400 })
    }

    // Check spare part exists
    const existing = await db.sparePart.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запчасть не найдена' }, { status: 404 })
    }

    // Check unique code (exclude self)
    const duplicateCode = await db.sparePart.findUnique({ where: { code } })
    if (duplicateCode && duplicateCode.id !== id) {
      return NextResponse.json({ error: 'Запчасть с таким артикулом уже существует' }, { status: 409 })
    }

    const sparePart = await db.sparePart.update({
      where: { id },
      data: {
        name,
        code,
        categoryId: categoryId || null,
        unit: unit || 'шт',
        minStock: minStock ?? 0,
        currentStock: currentStock ?? 0,
        price: price ?? null,
        description: description || null,
      },
      include: {
        category: { select: { name: true, code: true } },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'SparePart',
        entityId: sparePart.id,
        details: JSON.stringify({ name: sparePart.name, code: sparePart.code }),
      },
    })

    return NextResponse.json(sparePart, { status: 200 })
  } catch (error) {
    console.error('Spare part update error:', error)
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
      return NextResponse.json({ error: 'ID запчасти обязателен' }, { status: 400 })
    }

    // Check spare part exists
    const existing = await db.sparePart.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Запчасть не найдена' }, { status: 404 })
    }

    await db.sparePart.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'SparePart',
        entityId: id,
        details: JSON.stringify({ name: existing.name, code: existing.code }),
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Spare part delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
