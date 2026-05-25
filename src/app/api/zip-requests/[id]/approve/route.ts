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

// ─── POST: Approve, reject, or skip a ZIP request at current step ───
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    const body = await request.json()
    const { action, comment } = body

    // Validate action
    const validActions = ['approve', 'reject', 'skip']
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Действие должно быть approve, reject или skip' },
        { status: 400 },
      )
    }

    // Fetch the request with approval data
    const zipRequest = await db.zipRequest.findUnique({
      where: { id },
      include: {
        approvalRoute: {
          include: {
            steps: {
              orderBy: { stepOrder: 'asc' },
            },
          },
        },
        approvalActions: {
          include: {
            approvalStep: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!zipRequest) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    // Check request is in pending_approval status
    if (zipRequest.status !== 'pending_approval') {
      return NextResponse.json(
        { error: `Заявка имеет статус "${zipRequest.status}", согласование недоступно` },
        { status: 400 },
      )
    }

    // Find the current pending approval action based on currentStepOrder
    const currentAction = zipRequest.approvalActions.find(
      (a) =>
        a.approvalStep.stepOrder === zipRequest.currentStepOrder &&
        a.status === 'pending',
    )

    if (!currentAction) {
      return NextResponse.json(
        { error: 'Нет активного шага согласования' },
        { status: 400 },
      )
    }

    // Verify user's role matches the step's required role
    const requiredRole = currentAction.approvalStep.role
    if (user.role !== requiredRole && user.role !== 'admin') {
      return NextResponse.json(
        {
          error: `Для этого шага требуется роль "${requiredRole}" или admin`,
        },
        { status: 403 },
      )
    }

    // Handle skip action — only optional steps can be skipped
    if (action === 'skip') {
      if (!currentAction.approvalStep.isOptional) {
        return NextResponse.json(
          { error: 'Пропускить можно только необязательные шаги' },
          { status: 400 },
        )
      }
    }

    // Determine the next step
    const allSteps = zipRequest.approvalRoute?.steps || []
    const currentStepIndex = allSteps.findIndex(
      (s) => s.stepOrder === zipRequest.currentStepOrder,
    )
    const nextStep = allSteps[currentStepIndex + 1]

    // Process the action in a transaction
    const updatedRequest = await db.$transaction(async (tx) => {
      // Update the approval action
      const actionStatus =
        action === 'approve'
          ? 'approved'
          : action === 'reject'
            ? 'rejected'
            : 'skipped'

      await tx.approvalAction.update({
        where: { id: currentAction.id },
        data: {
          status: actionStatus,
          decidedBy: user.id,
          comment: comment || null,
          decidedAt: new Date(),
        },
      })

      // Update the request
      if (action === 'reject') {
        // Rejection — return request to applicant for editing/deleting
        // Reset currentStepOrder to 0 since the approval route is finished
        return await tx.zipRequest.update({
          where: { id },
          data: {
            status: 'rejected',
            currentStepOrder: 0,
          },
        })
      }

      if (nextStep) {
        // Advance to next step
        return await tx.zipRequest.update({
          where: { id },
          data: { currentStepOrder: nextStep.stepOrder },
        })
      }

      // All steps completed — set status to approved
      return await tx.zipRequest.update({
        where: { id },
        data: { status: 'approved' },
      })
    })

    // Fetch full updated request with relations
    const fullRequest = await db.zipRequest.findUnique({
      where: { id: updatedRequest.id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
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
                isOptional: true,
              },
            },
            decidedByUser: {
              select: { id: true, name: true, email: true, role: true },
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
        action: `APPROVAL_${action.toUpperCase()}`,
        entity: 'ZipRequest',
        entityId: id,
        details: JSON.stringify({
          number: zipRequest.number,
          action,
          stepOrder: currentAction.approvalStep.stepOrder,
          role: currentAction.approvalStep.role,
          comment: comment || null,
          newStatus: updatedRequest.status,
        }),
      },
    })

    return NextResponse.json(mapZipRequest(fullRequest))
  } catch (error) {
    console.error('ZIP request approval error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
