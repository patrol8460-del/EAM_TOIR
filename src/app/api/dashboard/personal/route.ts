import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET: Personal dashboard — tasks for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const tasks: {
      id: string
      type: 'approval' | 'request_draft' | 'request_rejected'
      entityType: string
      entityId: string
      title: string
      description: string
      role: string
      status: string
      createdAt: string
    }[] = []

    // 1. Pending approvals for this user's role (or admin sees all pending)
    const pendingRequests = await db.zipRequest.findMany({
      where: { status: 'pending_approval' },
      include: {
        approvalActions: {
          include: { approvalStep: true },
          orderBy: { createdAt: 'asc' },
        },
        author: { select: { id: true, name: true } },
      },
      take: 50,
      orderBy: { updatedAt: 'desc' },
    })

    for (const req of pendingRequests) {
      const currentPending = req.approvalActions.find(
        (a) => a.approvalStep.stepOrder === req.currentStepOrder && a.status === 'pending',
      )
      if (!currentPending) continue
      // Only the user whose role matches the step's required role sees the task
      if (user.role !== currentPending.approvalStep.role) continue

      tasks.push({
        id: req.id,
        type: 'approval',
        entityType: 'zip-request',
        entityId: req.id,
        title: `Заявка на согласование #${req.number}`,
        description: `${req.title || 'Без названия'} — от ${req.author?.name || 'Неизвестен'}`,
        role: currentPending.approvalStep.role,
        status: `Шаг ${currentPending.approvalStep.stepOrder}: ${currentPending.approvalStep.position || currentPending.approvalStep.role}`,
        createdAt: req.createdAt.toISOString(),
      })
    }

    // 2. User's own rejected requests
    const rejectedRequests = await db.zipRequest.findMany({
      where: { requestedBy: user.id, status: 'rejected' },
      include: {
        approvalActions: {
          include: { decidedByUser: { select: { name: true } } },
          where: { status: 'rejected' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    for (const req of rejectedRequests) {
      const rejectAction = req.approvalActions[0]
      tasks.push({
        id: req.id,
        type: 'request_rejected',
        entityType: 'zip-request',
        entityId: req.id,
        title: `Отклонена заявка #${req.number}`,
        description: rejectAction
          ? `Отклонено: ${rejectAction.decidedByUser?.name || 'Неизвестен'}${rejectAction.comment ? `. Комментарий: ${rejectAction.comment}` : ''}`
          : 'Заявка отклонена на согласовании',
        role: user.role,
        status: 'Требуется редактирование или удаление',
        createdAt: req.updatedAt.toISOString(),
      })
    }

    // 3. User's own draft requests
    const draftRequests = await db.zipRequest.findMany({
      where: { requestedBy: user.id, status: 'draft' },
      orderBy: { updatedAt: 'desc' },
    })

    for (const req of draftRequests) {
      tasks.push({
        id: req.id,
        type: 'request_draft',
        entityType: 'zip-request',
        entityId: req.id,
        title: `Черновик #${req.number}`,
        description: req.title || 'Без названия',
        role: user.role,
        status: 'Черновик — можно отправить на согласование',
        createdAt: req.updatedAt.toISOString(),
      })
    }

    // Sort: approvals first, then rejected, then drafts
    const typeOrder: Record<string, number> = { approval: 0, request_rejected: 1, request_draft: 2 }
    tasks.sort((a, b) => {
      const orderA = typeOrder[a.type] ?? 99
      const orderB = typeOrder[b.type] ?? 99
      if (orderA !== orderB) return orderA - orderB
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    const summary = {
      pendingApprovals: tasks.filter((t) => t.type === 'approval').length,
      rejectedRequests: tasks.filter((t) => t.type === 'request_rejected').length,
      draftRequests: tasks.filter((t) => t.type === 'request_draft').length,
    }

    return NextResponse.json({ tasks, summary })
  } catch (error) {
    console.error('Personal dashboard error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
