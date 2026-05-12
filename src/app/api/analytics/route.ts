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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [
      totalEquipment,
      activeEquipment,
      underRepairEquipment,
      totalRequests,
      completedRequestsThisMonth,
      requestsAvgResolutionHours,
      totalMaintenancePlans,
      completedTasksThisMonth,
      totalTasksThisMonth,
      totalSpareParts,
      lowStockParts,
      departments,
      brigades,
      requestsByMonth,
    ] = await Promise.all([
      // Equipment stats
      db.equipment.count(),
      db.equipment.count({ where: { status: 'active' } }),
      db.equipment.count({ where: { status: 'under_repair' } }),

      // Request stats
      db.unplannedRequest.count(),
      db.unplannedRequest.count({
        where: {
          status: 'completed',
          completedAt: { gte: startOfMonth.toISOString() },
        },
      }),

      // Average resolution time for completed requests (in hours)
      (() => {
        return db.unplannedRequest.findMany({
          where: { status: 'completed', completedAt: { not: null } },
          select: { createdAt: true, completedAt: true },
          take: 100,
        }).then((requests) => {
          if (requests.length === 0) return 0
          const totalHours = requests.reduce((sum, r) => {
            if (!r.completedAt) return sum
            const diff = new Date(r.completedAt).getTime() - new Date(r.createdAt).getTime()
            return sum + diff / (1000 * 60 * 60)
          }, 0)
          return Math.round(totalHours / requests.length)
        })
      })(),

      // Maintenance stats
      db.maintenancePlan.count({ where: { status: 'active' } }),
      db.maintenanceTask.count({
        where: {
          status: 'completed',
          completedAt: { gte: startOfMonth.toISOString() },
        },
      }),
      db.maintenanceTask.count({
        where: {
          scheduledDate: { gte: startOfMonth.toISOString().split('T')[0] },
        },
      }),

      // Spare parts stats
      db.sparePart.count(),
      db.sparePart.count({
        where: { currentStock: { lte: db.sparePart.fields.minStock } },
      }),

      // Org structure
      db.department.count(),
      db.brigade.count(),

      // Monthly request counts for the last 6 months
      (() => {
        const months: { year: number; month: number }[] = []
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          months.push({ year: d.getFullYear(), month: d.getMonth() })
        }
        return Promise.all(
          months.map(async ({ year, month }) => {
            const start = new Date(year, month, 1).toISOString()
            const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
            const count = await db.unplannedRequest.count({
              where: { createdAt: { gte: start, lte: end } },
            })
            const completed = await db.unplannedRequest.count({
              where: {
                status: 'completed',
                completedAt: { gte: start, lte: end },
              },
            })
            return {
              month: new Date(year, month).toLocaleDateString('ru-RU', { month: 'short' }),
              total: count,
              completed,
            }
          })
        )
      })(),
    ])

    const pprCompletionPercent = totalTasksThisMonth > 0
      ? Math.round((completedTasksThisMonth / totalTasksThisMonth) * 100)
      : 0

    const equipmentWorkingPercent = totalEquipment > 0
      ? Math.round((activeEquipment / totalEquipment) * 100)
      : 0

    return NextResponse.json({
      kpi: {
        pprCompletionPercent,
        requestsAvgResolutionHours,
        equipmentWorkingPercent,
        lowStockParts,
      },
      stats: {
        totalEquipment,
        activeEquipment,
        underRepairEquipment,
        totalRequests,
        completedRequestsThisMonth,
        totalMaintenancePlans,
        completedTasksThisMonth,
        totalSpareParts,
        departments,
        brigades,
      },
      requestsByMonth,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
