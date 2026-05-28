import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/zip-requests/consolidated
 * 
 * Returns all items from approved (and ordered) zip requests, 
 * consolidated/summed by articleNumber (ОЗМ).
 * 
 * Query params:
 *   search — filter by ОЗМ or name (contains)
 *   departmentId — filter by applicant department
 *   hasSparePart — "true" to only show items linked to catalog
 *   noSparePart — "true" to only show items NOT linked to catalog
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const departmentId = searchParams.get('departmentId') || ''
    const hasSparePart = searchParams.get('hasSparePart') === 'true'
    const noSparePart = searchParams.get('noSparePart') === 'true'

    // Build where clause for zip requests — only approved
    const requestWhere: Record<string, unknown> = {
      status: { in: ['approved', 'ordered'] },
    }

    // Fetch all items from matching requests with their request info
    const items = await db.zipRequestItem.findMany({
      where: {
        zipRequest: requestWhere,
        ...(departmentId ? { zipRequest: { ...requestWhere, applicantDepartmentId: departmentId } } : {}),
        ...(hasSparePart ? { sparePartId: { not: null } } : {}),
        ...(noSparePart ? { sparePartId: null } : {}),
        ...(search ? {
          OR: [
            { articleNumber: { contains: search } },
            { name: { contains: search } },
          ],
        } : {}),
      },
      include: {
        zipRequest: {
          select: {
            id: true,
            number: true,
            title: true,
            type: true,
            status: true,
            priority: true,
            neededBy: true,
            requestedBy: true,
            applicantName: true,
            applicantDepartmentId: true,
            createdAt: true,
            applicantDepartment: {
              select: { id: true, name: true, code: true },
            },
            author: {
              select: { id: true, name: true, role: true },
            },
          },
        },
        sparePart: {
          select: {
            id: true,
            name: true,
            code: true,
            unit: true,
            currentStock: true,
            price: true,
          },
        },
      },
      orderBy: { articleNumber: 'asc' },
    })

    // Group by articleNumber (ОЗМ) — case-insensitive
    const grouped = new Map<string, {
      articleNumber: string
      names: Set<string>
      unit: string
      totalQuantity: number
      unitPrice: number | null
      totalPrice: number | null
      sparePartId: string | null
      sparePartCode: string | null
      sparePartName: string | null
      currentStock: number | null
      catalogPrice: number | null
      sources: Array<{
        zipRequestId: string
        zipRequestNumber: string
        zipRequestTitle: string
        zipRequestStatus: string
        zipRequestPriority: string
        zipRequestNeededBy: string | null
        zipRequestType: string
        zipRequestCreatedAt: string
        applicantName: string | null
        departmentName: string | null
        departmentId: string | null
        authorName: string
        itemId: string
        quantity: number
        unitPrice: number | null
        name: string
        unit: string
      }>
    }>()

    for (const item of items) {
      const key = (item.articleNumber || '').trim().toLowerCase()
      if (!key) continue

      const req = item.zipRequest
      const unitPrice = item.unitPrice ?? item.sparePart?.price ?? null

      if (!grouped.has(key)) {
        grouped.set(key, {
          articleNumber: item.articleNumber,
          names: new Set<string>(),
          unit: item.unit || 'шт',
          totalQuantity: 0,
          unitPrice,
          totalPrice: null,
          sparePartId: item.sparePartId,
          sparePartCode: item.sparePart?.code || null,
          sparePartName: item.sparePart?.name || null,
          currentStock: item.sparePart?.currentStock ?? null,
          catalogPrice: item.sparePart?.price ?? null,
          sources: [],
        })
      }

      const group = grouped.get(key)!
      group.names.add(item.name)
      group.totalQuantity += item.quantity

      // Use the best available price (prefer item-level price over catalog)
      if (unitPrice != null && (group.unitPrice == null || unitPrice > group.unitPrice)) {
        // keep the highest known price as reference
      }

      group.sources.push({
        zipRequestId: req.id,
        zipRequestNumber: req.number,
        zipRequestTitle: req.title,
        zipRequestStatus: req.status,
        zipRequestPriority: req.priority,
        zipRequestNeededBy: req.neededBy,
        zipRequestType: req.type,
        zipRequestCreatedAt: req.createdAt?.toISOString() || '',
        applicantName: req.applicantName || null,
        departmentName: req.applicantDepartment?.name || null,
        departmentId: req.applicantDepartmentId || null,
        authorName: req.author?.name || '',
        itemId: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        name: item.name,
        unit: item.unit || 'шт',
      })
    }

    // Convert Map to array and compute totals
    const consolidated = Array.from(grouped.values()).map((g) => {
      // Pick the most descriptive name
      const nameArr = Array.from(g.names)
      const name = nameArr.sort((a, b) => b.length - a.length)[0] || ''

      // Calculate total price
      const price = g.unitPrice ?? g.catalogPrice
      const totalPrice = price != null ? price * g.totalQuantity : null

      return {
        articleNumber: g.articleNumber,
        name,
        unit: g.unit,
        totalQuantity: g.totalQuantity,
        requestCount: g.sources.length,
        unitPrice: g.unitPrice ?? g.catalogPrice,
        totalPrice,
        sparePartId: g.sparePartId,
        sparePartCode: g.sparePartCode,
        sparePartName: g.sparePartName,
        currentStock: g.currentStock,
        catalogPrice: g.catalogPrice,
        sources: g.sources,
      }
    })

    // Sort by totalQuantity descending
    consolidated.sort((a, b) => b.totalQuantity - a.totalQuantity)

    // Compute summary stats
    const totalItems = consolidated.length
    const totalQuantity = consolidated.reduce((s, c) => s + c.totalQuantity, 0)
    const totalValue = consolidated.reduce((s, c) => s + (c.totalPrice || 0), 0)
    const linkedToCatalog = consolidated.filter((c) => c.sparePartId).length
    const notLinkedToCatalog = totalItems - linkedToCatalog

    return NextResponse.json({
      consolidated,
      stats: {
        totalItems,
        totalQuantity,
        totalValue,
        linkedToCatalog,
        notLinkedToCatalog,
      },
    })
  } catch (error) {
    console.error('Consolidated requests error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
