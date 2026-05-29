import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/procurement/lots/[id]
 */
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

    const lot = await db.procurementLot.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    })

    if (!lot) {
      return NextResponse.json({ error: 'Лот не найден' }, { status: 404 })
    }

    // Parse sourceData JSON for each item
    const parsedItems = lot.items.map((item) => ({
      ...item,
      sources: item.sourceData ? JSON.parse(item.sourceData) : [],
    }))

    return NextResponse.json({
      lot: {
        ...lot,
        items: parsedItems,
      },
    })
  } catch (error) {
    console.error('Procurement lot get error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * PUT /api/procurement/lots/[id] — update lot (title, description, status, items)
 */
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
    const body = await request.json()
    const { title, description, status, items } = body

    const existing = await db.procurementLot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Лот не найден' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (title !== undefined) updateData.title = String(title)
    if (description !== undefined) updateData.description = description ? String(description) : null
    if (status !== undefined) {
      const validStatuses = ['draft', 'submitted', 'ordered', 'completed', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 })
      }
      updateData.status = status

      // When status changes to ordered, mark source zip requests as ordered too
      if (status === 'ordered' && existing.status !== 'ordered') {
        const lotItems = await db.procurementLotItem.findMany({
          where: { procurementLotId: id },
          select: { sourceData: true },
        })

        const zipRequestIds = new Set<string>()
        for (const item of lotItems) {
          if (item.sourceData) {
            try {
              const sources = JSON.parse(item.sourceData) as Array<{ zipRequestId: string }>
              for (const s of sources) {
                zipRequestIds.add(s.zipRequestId)
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        if (zipRequestIds.size > 0) {
          await db.zipRequest.updateMany({
            where: { id: { in: Array.from(zipRequestIds) }, status: 'approved' },
            data: { status: 'ordered' },
          })
        }
      }
    }

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete old items
      await db.procurementLotItem.deleteMany({ where: { procurementLotId: id } })

      // Create new items
      const validatedItems = items.map((item: Record<string, unknown>) => ({
        articleNumber: String(item.articleNumber || '').trim(),
        name: String(item.name || '').trim(),
        unit: String(item.unit || 'шт'),
        quantity: Math.max(1, parseInt(String(item.quantity)) || 1),
        unitPrice: item.unitPrice != null ? parseFloat(String(item.unitPrice)) : null,
        notes: item.notes ? String(item.notes) : null,
        sourceData: item.sources ? JSON.stringify(item.sources) : null,
      }))

      updateData.items = {
        create: validatedItems,
      }
    }

    const lot = await db.procurementLot.update({
      where: { id },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, role: true } },
        items: true,
      },
    })

    const parsedItems = lot.items.map((item) => ({
      ...item,
      sources: item.sourceData ? JSON.parse(item.sourceData) : [],
    }))

    return NextResponse.json({
      lot: {
        ...lot,
        items: parsedItems,
      },
    })
  } catch (error) {
    console.error('Procurement lot update error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

/**
 * DELETE /api/procurement/lots/[id]
 */
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

    const existing = await db.procurementLot.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Лот не найден' }, { status: 404 })
    }

    if (existing.status === 'ordered' || existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Нельзя удалить отправленный или завершённый лот' },
        { status: 400 },
      )
    }

    await db.procurementLot.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Procurement lot delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
