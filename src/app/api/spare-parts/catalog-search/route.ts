import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/spare-parts/catalog-search
 * Batch lookup: given an array of ОЗМ codes, return matching catalog items
 * Used by clipboard paste to auto-fill name & price
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { codes } = body as { codes?: string[] }

    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'codes array required' }, { status: 400 })
    }

    // Find all matching spare parts (case-insensitive)
    const items = await db.sparePart.findMany({
      where: {
        OR: codes.map((code) => ({
          code: { equals: code },
        })),
      },
      select: {
        id: true,
        name: true,
        code: true,
        unit: true,
        price: true,
      },
    })

    // Also try case-insensitive if no exact matches
    if (items.length === 0) {
      const allParts = await db.sparePart.findMany({
        select: {
          id: true,
          name: true,
          code: true,
          unit: true,
          price: true,
        },
      })

      const codeLowerMap = new Map(allParts.map((p) => [p.code.toLowerCase().trim(), p]))

      for (const code of codes) {
        const match = codeLowerMap.get(code.toLowerCase().trim())
        if (match && !items.find((i) => i.id === match.id)) {
          items.push(match)
        }
      }
    }

    // Build a map: code -> item for easy client-side lookup
    const resultMap: Record<string, { id: string; name: string; code: string; unit: string; price: number | null }> = {}
    for (const item of items) {
      resultMap[item.code] = item
      resultMap[item.code.toLowerCase().trim()] = item
    }

    return NextResponse.json({ items, map: resultMap })
  } catch (error) {
    console.error('Catalog search error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
