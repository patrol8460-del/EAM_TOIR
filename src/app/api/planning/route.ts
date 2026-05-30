import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'


export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const [plans, tasksByStatus] = await Promise.all([
      db.maintenancePlan.findMany({
        include: {
          equipment: { select: { name: true, code: true, department: { select: { name: true } } } },
          tasks: {
            include: {
              brigade: { select: { name: true, code: true } },
            },
            orderBy: { scheduledDate: 'asc' },
          },
        },
        orderBy: { nextMaintenance: 'asc' },
      }),
      db.maintenanceTask.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ])

    const taskStatusMap: Record<string, number> = {}
    tasksByStatus.forEach((item) => {
      taskStatusMap[item.status] = item._count.status
    })

    return NextResponse.json({
      plans,
      tasksByStatus: taskStatusMap,
    })
  } catch (error) {
    console.error('Planning list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// POST — Create maintenance plan
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { equipmentId, planName, intervalDays, description, status } = body

    if (!equipmentId || !intervalDays) {
      return NextResponse.json({ error: 'Укажите оборудование и интервал (дни)' }, { status: 400 })
    }

    const interval = Number(intervalDays)
    if (isNaN(interval) || interval <= 0) {
      return NextResponse.json({ error: 'Интервал должен быть положительным числом' }, { status: 400 })
    }

    // Check equipment exists
    const equipment = await db.equipment.findUnique({
      where: { id: equipmentId },
      select: { id: true, name: true },
    })
    if (!equipment) {
      return NextResponse.json({ error: 'Оборудование не найдено' }, { status: 404 })
    }

    // Check if plan already exists for this equipment
    const existingPlan = await db.maintenancePlan.findUnique({
      where: { equipmentId },
    })
    if (existingPlan) {
      return NextResponse.json({ error: `Для оборудования «${equipment.name}» уже существует план ППР` }, { status: 409 })
    }

    // Calculate next maintenance date (from now + interval)
    const nextMaintenance = new Date()
    nextMaintenance.setDate(nextMaintenance.getDate() + interval)

    const plan = await db.maintenancePlan.create({
      data: {
        equipmentId,
        planName: planName || `ППР для ${equipment.name}`,
        intervalDays: interval,
        description: description || null,
        status: status || 'active',
        nextMaintenance: nextMaintenance.toISOString().split('T')[0],
      },
      include: {
        equipment: { select: { name: true, code: true, department: { select: { name: true } } } },
        tasks: {
          include: { brigade: { select: { name: true, code: true } } },
          orderBy: { scheduledDate: 'asc' },
        },
      },
    })

    // Create the first task
    await db.maintenanceTask.create({
      data: {
        planId: plan.id,
        scheduledDate: plan.nextMaintenance,
        description: plan.planName,
        status: 'planned',
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'MaintenancePlan',
        entityId: plan.id,
        details: JSON.stringify({ equipmentId, planName: plan.planName, intervalDays: interval }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      },
    })

    return NextResponse.json({ plan }, { status: 201 })
  } catch (error) {
    console.error('Create plan error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// PUT — Update maintenance plan or task
export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { taskId, id, status, notes, completedAt, ...rest } = body

    if (taskId) {
      // Update task
      const task = await db.maintenanceTask.findUnique({
        where: { id: taskId },
        include: { plan: true },
      })
      if (!task) {
        return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (notes !== undefined) updateData.notes = notes
      if (completedAt) updateData.completedAt = completedAt

      const updatedTask = await db.maintenanceTask.update({
        where: { id: taskId },
        data: updateData,
        include: {
          brigade: { select: { name: true, code: true } },
          plan: {
            include: {
              equipment: { select: { name: true, code: true, department: { select: { name: true } } } },
            },
          },
        },
      })

      // If task completed, update plan's lastMaintenance and nextMaintenance
      if (status === 'completed') {
        const plan = task.plan
        const nextDate = new Date(task.scheduledDate)
        nextDate.setDate(nextDate.getDate() + plan.intervalDays)
        await db.maintenancePlan.update({
          where: { id: plan.id },
          data: {
            lastMaintenance: task.scheduledDate,
            nextMaintenance: nextDate.toISOString().split('T')[0],
          },
        })

        // Create next task
        await db.maintenanceTask.create({
          data: {
            planId: plan.id,
            scheduledDate: nextDate.toISOString().split('T')[0],
            description: plan.planName,
            status: 'planned',
          },
        })
      }

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entity: 'MaintenanceTask',
          entityId: taskId,
          details: JSON.stringify(updateData),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      })

      return NextResponse.json({ task: updatedTask })
    } else if (id) {
      // Update plan
      const plan = await db.maintenancePlan.findUnique({
        where: { id },
      })
      if (!plan) {
        return NextResponse.json({ error: 'План не найден' }, { status: 404 })
      }

      const updateData: Record<string, unknown> = {}
      if (status) updateData.status = status
      if (rest.planName) updateData.planName = rest.planName
      if (rest.intervalDays) {
        const interval = Number(rest.intervalDays)
        if (isNaN(interval) || interval <= 0) {
          return NextResponse.json({ error: 'Интервал должен быть положительным числом' }, { status: 400 })
        }
        updateData.intervalDays = interval
      }
      if (rest.description !== undefined) updateData.description = rest.description

      const updatedPlan = await db.maintenancePlan.update({
        where: { id },
        data: updateData,
        include: {
          equipment: { select: { name: true, code: true, department: { select: { name: true } } } },
          tasks: {
            include: { brigade: { select: { name: true, code: true } } },
            orderBy: { scheduledDate: 'asc' },
          },
        },
      })

      // Audit log
      await db.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entity: 'MaintenancePlan',
          entityId: id,
          details: JSON.stringify(updateData),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      })

      return NextResponse.json({ plan: updatedPlan })
    } else {
      return NextResponse.json({ error: 'Укажите id плана или taskId' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update plan/task error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
