import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

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

    // Run all count queries in parallel
    const [
      totalEquipment,
      activeRequests,
      activeMaintenancePlans,
      totalSpareParts,
      equipmentByStatus,
      recentActivity,
      requestsByStatus,
      requestsByPriority,
    ] = await Promise.all([
      // Total equipment
      db.equipment.count(),

      // Active unplanned requests (new, assigned, in_progress)
      db.unplannedRequest.count({
        where: { status: { in: ['new', 'assigned', 'in_progress'] } },
      }),

      // Active maintenance plans
      db.maintenancePlan.count({
        where: { status: 'active' },
      }),

      // Total spare parts
      db.sparePart.count(),

      // Equipment breakdown by status
      db.equipment.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Recent audit log activity (last 50)
      db.auditLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true } },
        },
      }),

      // Requests by status
      db.unplannedRequest.groupBy({
        by: ['status'],
        _count: { status: true },
      }),

      // Requests by priority
      db.unplannedRequest.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
    ])

    // Build status maps
    const equipStatusMap: Record<string, number> = {}
    equipmentByStatus.forEach((item) => {
      equipStatusMap[item.status] = item._count.status
    })

    const reqStatusMap: Record<string, number> = {}
    requestsByStatus.forEach((item) => {
      reqStatusMap[item.status] = item._count.status
    })

    const reqPriorityMap: Record<string, number> = {}
    requestsByPriority.forEach((item) => {
      reqPriorityMap[item.priority] = item._count.priority
    })

    return NextResponse.json({
      stats: {
        totalEquipment,
        activeRequests,
        activeMaintenancePlans,
        totalSpareParts,
        equipmentByStatus: equipStatusMap,
        requestsByStatus: reqStatusMap,
        requestsByPriority: reqPriorityMap,
      },
      recentActivity: recentActivity.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        details: log.details,
        userName: log.user?.name || 'Система',
        createdAt: log.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
