import { NextRequest, NextResponse } from 'next/server'
import okeiData from '@/lib/okei-units.json'

// GET /api/okei?q=... — поиск единиц измерения по коду, названию или символу
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!q) {
      // Без запроса — вернуть пустой список (или топ-N часто используемых)
      return NextResponse.json([])
    }

    const filtered = okeiData.filter((item) => {
      const code = String(item.code).toLowerCase()
      const name = String(item.name).toLowerCase()
      const symbol = String(item.symbol).toLowerCase()
      const symbolIntl = String(item.symbol_intl).toLowerCase()

      return (
        code.includes(q) ||
        name.includes(q) ||
        symbol.includes(q) ||
        symbolIntl.includes(q)
      )
    })

    // Сортируем: точные совпадения по коду — первыми, затем по релевантности имени
    const scored = filtered.map((item) => {
      let score = 0
      const code = String(item.code)
      const name = String(item.name).toLowerCase()

      if (code === q) score += 100
      else if (code.startsWith(q)) score += 50

      if (name === q) score += 80
      else if (name.startsWith(q)) score += 40
      else if (name.includes(q)) score += 10

      return { ...item, _score: score }
    })

    scored.sort((a, b) => b._score - a._score)

    // Убираем служебное поле _score
    const result = scored.slice(0, limit).map(({ _score, ...rest }) => rest)

    return NextResponse.json(result)
  } catch (error) {
    console.error('OKEI search error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
