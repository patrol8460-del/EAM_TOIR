import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ─── GET: List all approval routes (optionally filtered by type) ───
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || ''

    const where: Record<string, unknown> = {}
    if (type && type !== 'all') {
      where.type = type
    }

    const routes = await db.approvalRoute.findMany({
      where,
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            zipRequests: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(routes)
  } catch (error) {
    console.error('Approval routes list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── POST: Create a new approval route (admin only) ───
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Только администратор может создавать маршруты согласования' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { name, type, description, isActive, steps } = body

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Название и тип маршрута обязательны' },
        { status: 400 },
      )
    }

    const validTypes = [
      'purchase',
      'manufacturing',
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Неверный тип маршрута' },
        { status: 400 },
      )
    }

    // Validate steps
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'Маршрут должен содержать хотя бы один шаг' },
        { status: 400 },
      )
    }

    for (const step of steps) {
      if (!step.role) {
        return NextResponse.json(
          { error: 'Каждый шаг должен содержать роль (role)' },
          { status: 400 },
        )
      }

      const validRoles = ['admin', 'manager', 'engineer', 'worker']
      if (!validRoles.includes(step.role)) {
        return NextResponse.json(
          { error: `Неверная роль: ${step.role}. Допустимо: ${validRoles.join(', ')}` },
          { status: 400 },
        )
      }
    }

    // Check if there's already an active route with the same type
    if (isActive !== false) {
      const existingActive = await db.approvalRoute.findFirst({
        where: { type, isActive: true },
      })
      if (existingActive) {
        return NextResponse.json(
          {
            error: `Уже существует активный маршрут для типа "${type}" (${existingActive.name}). Деактивируйте его сначала.`,
          },
          { status: 409 },
        )
      }
    }

    // Create route and steps in a transaction
    const route = await db.$transaction(async (tx) => {
      const created = await tx.approvalRoute.create({
        data: {
          name,
          type,
          description: description || null,
          isActive: isActive !== false,
        },
      })

      // Create steps with sequential order
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i]
        await tx.approvalStep.create({
          data: {
            approvalRouteId: created.id,
            stepOrder: i + 1,
            role: step.role,
            position: step.position || null,
            description: step.description || null,
            isOptional: step.isOptional === true,
          },
        })
      }

      return created
    })

    // Fetch the full created route with steps
    const fullRoute = await db.approvalRoute.findUnique({
      where: { id: route.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: { zipRequests: true },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'ApprovalRoute',
        entityId: route.id,
        details: JSON.stringify({
          name: route.name,
          type: route.type,
          stepCount: steps.length,
        }),
      },
    })

    return NextResponse.json(fullRoute, { status: 201 })
  } catch (error) {
    console.error('Approval route create error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
