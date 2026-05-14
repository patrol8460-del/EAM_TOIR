import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'

// ─── GET: Retrieve full detail of a single ZIP request ───
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

    const zipRequest = await db.zipRequest.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
        equipment: {
          select: {
            id: true,
            name: true,
            code: true,
            criticality: true,
          },
        },
        items: {
          include: {
            sparePart: {
              select: {
                id: true,
                name: true,
                code: true,
                currentStock: true,
                unit: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        files: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            uploadedBy: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        approvalRoute: {
          select: { id: true, name: true, type: true, description: true },
        },
        approvalActions: {
          include: {
            approvalStep: {
              select: {
                id: true,
                stepOrder: true,
                role: true,
                position: true,
                description: true,
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

    if (!zipRequest) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    return NextResponse.json(zipRequest)
  } catch (error) {
    console.error('ZIP request detail error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── PUT: Update a ZIP request (only draft requests by author) ───
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    // Fetch existing request
    const existing = await db.zipRequest.findUnique({
      where: { id },
      include: {
        files: { select: { id: true, filePath: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    // Only author or admin can edit
    if (existing.requestedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нет прав для редактирования' },
        { status: 403 },
      )
    }

    // Only draft requests can be edited (unless cancelling)
    const body = await request.json()
    const { title, description, neededBy, priority, status, items } = body

    // Allow status change only from draft to cancelled
    if (status) {
      if (status === 'cancelled') {
        if (existing.status !== 'draft') {
          return NextResponse.json(
            { error: 'Отменить можно только черновик' },
            { status: 400 },
          )
        }
      } else if (status !== existing.status) {
        return NextResponse.json(
          { error: 'Нельзя изменить статус заявки через этот метод' },
          { status: 400 },
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (neededBy !== undefined) updateData.neededBy = neededBy
    if (priority !== undefined) updateData.priority = priority
    if (status === 'cancelled') updateData.status = 'cancelled'

    // Update request and optionally replace items in a transaction
    const updatedRequest = await db.$transaction(async (tx) => {
      // Update main request
      const updated = await tx.zipRequest.update({
        where: { id },
        data: updateData,
      })

      // Replace items if provided
      if (items && Array.isArray(items)) {
        // Delete all existing items
        await tx.zipRequestItem.deleteMany({
          where: { zipRequestId: id },
        })

        // Create new items
        for (const item of items) {
          if (!item.articleNumber || !item.name || item.quantity == null) {
            throw new Error(
              'Каждая позиция должна содержать articleNumber, name и quantity',
            )
          }

          const unitPrice =
            item.unitPrice != null ? Number(item.unitPrice) : null
          const quantity = Number(item.quantity)
          const totalPrice =
            unitPrice != null ? unitPrice * quantity : null

          await tx.zipRequestItem.create({
            data: {
              zipRequestId: id,
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

      return updated
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
        action: status === 'cancelled' ? 'CANCEL' : 'UPDATE',
        entity: 'ZipRequest',
        entityId: id,
        details: JSON.stringify({
          number: existing.number,
          changes: updateData,
          itemCount: items?.length,
        }),
      },
    })

    return NextResponse.json(fullRequest)
  } catch (error) {
    console.error('ZIP request update error:', error)
    if (error instanceof Error && error.message.includes('Каждая позиция')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── DELETE: Delete a ZIP request (only admin or author, draft/cancelled only) ───
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id } = await params

    // Fetch existing request with files
    const existing = await db.zipRequest.findUnique({
      where: { id },
      include: {
        files: { select: { id: true, filePath: true, fileName: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    // Permission check: only admin or author
    if (existing.requestedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нет прав для удаления' },
        { status: 403 },
      )
    }

    // Status check: only draft or cancelled
    if (existing.status !== 'draft' && existing.status !== 'cancelled') {
      return NextResponse.json(
        { error: 'Удалить можно только черновик или отменённую заявку' },
        { status: 400 },
      )
    }

    // Delete files from disk
    for (const file of existing.files) {
      try {
        const absolutePath = join(process.cwd(), file.filePath)
        await unlink(absolutePath)
      } catch (fileError) {
        console.warn(
          `Failed to delete file ${file.fileName} from disk:`,
          fileError,
        )
        // Continue deleting even if file removal fails
      }
    }

    // Delete the request (cascades will handle items, files records, and approval actions)
    await db.zipRequest.delete({
      where: { id },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        entity: 'ZipRequest',
        entityId: id,
        details: JSON.stringify({
          number: existing.number,
          title: existing.title,
          deletedFileCount: existing.files.length,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ZIP request delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
