import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Helper: map raw Prisma ZipRequest to frontend-friendly format
function mapZipRequest(item: any) {
  return {
    ...item,
    requestNumber: item.number,
    equipmentName: item.equipment?.name || null,
    equipmentCode: item.equipment?.code || null,
    authorId: item.author?.id || '',
    authorName: item.author?.name || '',
    authorRole: item.author?.role || '',
    applicantDepartmentName: item.applicantDepartment?.name || null,
    approvalActions: (item.approvalActions || []).map((a: any) => ({
      id: a.id,
      stepId: a.approvalStepId,
      stepOrder: a.approvalStep?.stepOrder || 0,
      role: a.approvalStep?.role || '',
      position: a.approvalStep?.position || '',
      description: a.approvalStep?.description || '',
      isOptional: a.approvalStep?.isOptional || false,
      action: a.status,
      userId: a.decidedByUser?.id || null,
      userName: a.decidedByUser?.name || null,
      comment: a.comment || null,
      actedAt: a.decidedAt ? new Date(a.decidedAt).toISOString() : null,
    })),
  }
}

// ─── GET: List ZIP requests with pagination, filtering, and search ───
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const type = searchParams.get('type') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const myRequests = searchParams.get('myRequests') === 'true'

    // Build where clause
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { number: { contains: search } },
        { title: { contains: search } },
        { description: { contains: search } },
        { items: { some: { name: { contains: search } } } },
      ]
    }

    if (type && type !== 'all') {
      where.type = type
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (myRequests) {
      where.requestedBy = user.id
    }

    // Fetch data with relations
    const [items, total] = await Promise.all([
      db.zipRequest.findMany({
        where,
        include: {
          author: {
            select: { id: true, name: true, email: true, role: true },
          },
          applicantDepartment: {
            select: { id: true, name: true, code: true },
          },
          equipment: {
            select: { id: true, name: true, code: true },
          },
          items: {
            include: {
              sparePart: {
                select: { id: true, name: true, code: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          approvalRoute: {
            select: { id: true, name: true, type: true },
          },
          approvalActions: {
            include: {
              approvalStep: {
                select: { id: true, stepOrder: true, role: true, position: true },
              },
              decidedByUser: {
                select: { id: true, name: true, role: true },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.zipRequest.count({ where }),
    ])

    // Count by status for the current filter
    const statusCounts = await db.zipRequest.groupBy({
      by: ['status'],
      where: myRequests ? { requestedBy: user.id } : {},
      _count: { status: true },
    })

    const statusCountMap: Record<string, number> = {}
    for (const sc of statusCounts) {
      statusCountMap[sc.status] = sc._count.status
    }

    // Map raw Prisma objects to frontend-friendly format
    const mappedItems = items.map(mapZipRequest)

    return NextResponse.json({
      items: mappedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      statusCounts: statusCountMap,
    })
  } catch (error) {
    console.error('ZIP requests list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── POST: Create a new ZIP request ───
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const {
      type,
      title,
      description,
      neededBy,
      equipmentId,
      priority,
      items,
      applicantName,
      applicantDepartmentId,
      submitForApproval,
    } = body

    // Validate required fields
    if (!type || !title) {
      return NextResponse.json(
        { error: 'Тип и название обязательны' },
        { status: 400 },
      )
    }

    const validTypes = [
      'purchase',
      'manufacturing',
    ]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Неверный тип заявки' },
        { status: 400 },
      )
    }

    if (items && !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items must be an array' },
        { status: 400 },
      )
    }

    // Generate auto-number: ЗИП-YYYYMMDD-NNN
    const today = new Date()
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`
    const numberPrefix = `ЗИП-${dateStr}-`

    const todayCount = await db.zipRequest.count({
      where: { number: { startsWith: numberPrefix } },
    })
    const sequenceNumber = String(todayCount + 1).padStart(3, '0')
    const number = `${numberPrefix}${sequenceNumber}`

    // Find active approval route matching the request type
    const approvalRoute = await db.approvalRoute.findFirst({
      where: {
        type,
        isActive: true,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    })

    // Determine status and approval data
    // If submitForApproval is true and route exists, go to pending_approval
    // Otherwise save as draft
    let status = 'draft'
    let approvalRouteId: string | null = null
    let currentStepOrder = 0
    let approvalActionsData: {
      approvalStepId: string
      zipRequestId: string
      status: string
    }[] = []

    if (submitForApproval && approvalRoute && approvalRoute.steps.length > 0) {
      status = 'pending_approval'
      approvalRouteId = approvalRoute.id
      currentStepOrder = approvalRoute.steps[0].stepOrder

      // We'll create ApprovalAction records inside the transaction below
      approvalActionsData = approvalRoute.steps.map((step) => ({
        approvalStepId: step.id,
        zipRequestId: '', // will be set after zipRequest creation
        status: 'pending',
      }))
    }

    // Create the request and items in a transaction
    const zipRequest = await db.$transaction(async (tx) => {
      // Create the main request
      const created = await tx.zipRequest.create({
        data: {
          number,
          type,
          title,
          description: description || null,
          neededBy: neededBy || null,
          equipmentId: equipmentId || null,
          priority: priority || 'additional',
          status,
          requestedBy: user.id,
          applicantName: applicantName || null,
          applicantDepartmentId: applicantDepartmentId || null,
          approvalRouteId,
          currentStepOrder,
        },
      })

      // Create approval actions if route exists
      if (approvalActionsData.length > 0) {
        for (const actionData of approvalActionsData) {
          await tx.approvalAction.create({
            data: {
              zipRequestId: created.id,
              approvalStepId: actionData.approvalStepId,
              status: 'pending',
            },
          })
        }
      }

      // Create items if provided
      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.articleNumber || !item.name || item.quantity == null) {
            throw new Error(
              'Каждая позиция должна содержать articleNumber, name и quantity',
            )
          }

          const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : null
          const quantity = Number(item.quantity)
          const totalPrice =
            unitPrice != null ? unitPrice * quantity : null

          await tx.zipRequestItem.create({
            data: {
              zipRequestId: created.id,
              sparePartId: item.sparePartId || null,
              articleNumber: String(item.articleNumber),
              name: String(item.name),
              description: item.description || null,
              quantity,
              unit: item.unit || 'шт',
              unitPrice,
              totalPrice,
              drawingNumber: item.drawingNumber || null,
              material: item.material || null,
              specifications: item.specifications || null,
              notes: item.notes || null,
            },
          })
        }
      }

      return created
    })

    // Fetch the full created request with all relations
    const fullRequest = await db.zipRequest.findUnique({
      where: { id: zipRequest.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
        applicantDepartment: {
          select: { id: true, name: true, code: true },
        },
        equipment: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            sparePart: {
              select: { id: true, name: true, code: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        approvalRoute: {
          select: { id: true, name: true, type: true },
        },
        approvalActions: {
          include: {
            approvalStep: {
              select: {
                id: true,
                stepOrder: true,
                role: true,
                position: true,
              },
            },
            decidedByUser: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'CREATE',
        entity: 'ZipRequest',
        entityId: zipRequest.id,
        details: JSON.stringify({
          number: zipRequest.number,
          title: zipRequest.title,
          type: zipRequest.type,
          itemCount: items?.length || 0,
        }),
      },
    })

    return NextResponse.json(mapZipRequest(fullRequest), { status: 201 })
  } catch (error) {
    console.error('ZIP request create error:', error)
    if (error instanceof Error && error.message.includes('Каждая позиция')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
