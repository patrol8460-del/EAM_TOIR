import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// ─── GET: Retrieve a single approval route with steps ───
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

    const route = await db.approvalRoute.findUnique({
      where: { id },
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
    })

    if (!route) {
      return NextResponse.json(
        { error: 'Маршрут согласования не найден' },
        { status: 404 },
      )
    }

    return NextResponse.json(route)
  } catch (error) {
    console.error('Approval route detail error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── PUT: Update an approval route (admin only, no active requests using it) ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Только администратор может редактировать маршруты согласования' },
        { status: 403 },
      )
    }

    const { id } = await params

    // Check route exists
    const existing = await db.approvalRoute.findUnique({
      where: { id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Маршрут согласования не найден' },
        { status: 404 },
      )
    }

    const body = await request.json()
    const { name, type, description, isActive, steps } = body

    // If steps are being replaced, check no active requests use this route
    if (steps && Array.isArray(steps)) {
      const activeRequestsCount = await db.zipRequest.count({
        where: {
          approvalRouteId: id,
          status: { in: ['pending_approval'] },
        },
      })

      if (activeRequestsCount > 0) {
        return NextResponse.json(
          {
            error: `Нельзя изменить шаги маршрута: ${activeRequestsCount} заявки находятся на согласовании`,
          },
          { status: 409 },
        )
      }

      // Validate steps
      if (steps.length === 0) {
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
            {
              error: `Неверная роль: ${step.role}. Допустимо: ${validRoles.join(', ')}`,
            },
            { status: 400 },
          )
        }
      }

      // If activating, check for existing active route of same type
      if (isActive === true && !existing.isActive) {
        const routeType = type || existing.type
        const existingActive = await db.approvalRoute.findFirst({
          where: { type: routeType, isActive: true, id: { not: id } },
        })
        if (existingActive) {
          return NextResponse.json(
            {
              error: `Уже существует активный маршрут для типа "${routeType}" (${existingActive.name})`,
            },
            { status: 409 },
          )
        }
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (description !== undefined) updateData.description = description
    if (isActive !== undefined) updateData.isActive = isActive

    // Update route and replace steps in a transaction
    const updatedRoute = await db.$transaction(async (tx) => {
      // Update main route
      const updated = await tx.approvalRoute.update({
        where: { id },
        data: updateData,
      })

      // Replace steps if provided
      if (steps && Array.isArray(steps)) {
        // Delete existing steps
        await tx.approvalStep.deleteMany({
          where: { approvalRouteId: id },
        })

        // Create new steps
        for (let i = 0; i < steps.length; i++) {
          const step = steps[i]
          await tx.approvalStep.create({
            data: {
              approvalRouteId: id,
              stepOrder: i + 1,
              role: step.role,
              position: step.position || null,
              description: step.description || null,
              isOptional: step.isOptional === true,
            },
          })
        }
      }

      return updated
    })

    // Fetch full updated route
    const fullRoute = await db.approvalRoute.findUnique({
      where: { id: updatedRoute.id },
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
        action: 'UPDATE',
        entity: 'ApprovalRoute',
        entityId: id,
        details: JSON.stringify({
          name: existing.name,
          changes: updateData,
          stepsReplaced: !!steps,
        }),
      },
    })

    return NextResponse.json(fullRoute)
  } catch (error) {
    console.error('Approval route update error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── DELETE: Delete an approval route (admin only, no requests using it) ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Только администратор может удалять маршруты согласования' },
        { status: 403 },
      )
    }

    const { id } = await params

    // Check route exists
    const existing = await db.approvalRoute.findUnique({
      where: { id },
      include: {
        _count: {
          select: { zipRequests: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Маршрут согласования не найден' },
        { status: 404 },
      )
    }

    // Check no requests use this route
    if (existing._count.zipRequests > 0) {
      return NextResponse.json(
        {
          error: `Нельзя удалить маршрут: с ним связано ${existing._count.zipRequests} заявок`,
        },
        { status: 409 },
      )
    }

    // Delete the route (cascade will delete steps)
    await db.approvalRoute.delete({
      where: { id },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'ApprovalRoute',
        entityId: id,
        details: JSON.stringify({
          name: existing.name,
          type: existing.type,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Approval route delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
