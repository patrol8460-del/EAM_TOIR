import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const section = searchParams.get('section') || 'all'

    const [departments, brigades, shiftTasks, workPermits, totalPersonnel] = await Promise.all([
      db.department.findMany({
        include: {
          users: {
            where: { isActive: true },
            select: { id: true, name: true, role: true, email: true },
          },
          brigades: {
            include: {
              members: {
                where: { isActive: true },
                select: { id: true, name: true, role: true },
              },
              foreman: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.brigade.findMany({
        include: {
          department: { select: { name: true, code: true } },
          foreman: { select: { id: true, name: true } },
          members: {
            where: { isActive: true },
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
      db.shiftTask.findMany({
        include: {
          brigade: { select: { name: true, code: true } },
          assigner: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
        take: 100,
      }),
      db.workPermit.findMany({
        include: {
          brigade: { select: { name: true, code: true } },
          equipment: { select: { name: true, code: true } },
          issuer: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.user.count({ where: { isActive: true } }),
    ])

    return NextResponse.json({
      departments,
      brigades,
      shiftTasks,
      workPermits,
      totalPersonnel,
    })
  } catch (error) {
    console.error('Personnel list error:', error)
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
    const { name, code, departmentId, description, foremanId } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название бригады обязательно' }, { status: 400 })
    }
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Код бригады обязателен' }, { status: 400 })
    }
    if (!departmentId) {
      return NextResponse.json({ error: 'Подразделение обязательно' }, { status: 400 })
    }

    // Check unique code
    const existing = await db.brigade.findUnique({ where: { code: code.trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Бригада с таким кодом уже существует' }, { status: 409 })
    }

    // Check department exists
    const dept = await db.department.findUnique({ where: { id: departmentId } })
    if (!dept) {
      return NextResponse.json({ error: 'Подразделение не найдено' }, { status: 404 })
    }

    const brigade = await db.brigade.create({
      data: {
        name: name.trim(),
        code: code.trim(),
        departmentId,
        description: description?.trim() || null,
        foremanId: foremanId || null,
      },
      include: {
        department: { select: { name: true, code: true } },
        foreman: { select: { id: true, name: true } },
        members: {
          where: { isActive: true },
          select: { id: true, name: true, role: true },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'Brigade',
        entityId: brigade.id,
        details: JSON.stringify({ name: brigade.name, code: brigade.code, departmentId }),
      },
    })

    return NextResponse.json(brigade, { status: 201 })
  } catch (error) {
    console.error('Brigade create error:', error)
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
    const { id, name, code, departmentId, description, foremanId } = body

    if (!id) {
      return NextResponse.json({ error: 'ID бригады обязателен' }, { status: 400 })
    }
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название бригады обязательно' }, { status: 400 })
    }
    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Код бригады обязателен' }, { status: 400 })
    }
    if (!departmentId) {
      return NextResponse.json({ error: 'Подразделение обязательно' }, { status: 400 })
    }

    // Check brigade exists
    const existing = await db.brigade.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Бригада не найдена' }, { status: 404 })
    }

    // Check unique code (exclude self)
    const duplicateCode = await db.brigade.findUnique({ where: { code: code.trim() } })
    if (duplicateCode && duplicateCode.id !== id) {
      return NextResponse.json({ error: 'Бригада с таким кодом уже существует' }, { status: 409 })
    }

    const brigade = await db.brigade.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.trim(),
        departmentId,
        description: description?.trim() || null,
        foremanId: foremanId || null,
      },
      include: {
        department: { select: { name: true, code: true } },
        foreman: { select: { id: true, name: true } },
        members: {
          where: { isActive: true },
          select: { id: true, name: true, role: true },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        entity: 'Brigade',
        entityId: brigade.id,
        details: JSON.stringify({ name: brigade.name, code: brigade.code, departmentId }),
      },
    })

    return NextResponse.json(brigade, { status: 200 })
  } catch (error) {
    console.error('Brigade update error:', error)
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
      return NextResponse.json({ error: 'ID бригады обязателен' }, { status: 400 })
    }

    // Check brigade exists
    const existing = await db.brigade.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Бригада не найдена' }, { status: 404 })
    }

    await db.brigade.delete({ where: { id } })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'Brigade',
        entityId: id,
        details: JSON.stringify({ name: existing.name, code: existing.code }),
      },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Brigade delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
