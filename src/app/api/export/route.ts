import { NextRequest, NextResponse } from 'next/server'

/** Transliterate Cyrillic to Latin for xlsx-compat sheet names */
function transliterate(str: string): string {
  const map: Record<string, string> = {
    А:'A', Б:'B', В:'V', Г:'G', Д:'D', Е:'E', Ё:'Yo', Ж:'Zh', З:'Z', И:'I', Й:'Y',
    К:'K', Л:'L', М:'M', Н:'N', О:'O', П:'P', Р:'R', С:'S', Т:'T', У:'U', Ф:'F',
    Х:'Kh', Ц:'Ts', Ч:'Ch', Ш:'Sh', Щ:'Shch', Ъ:'', Ы:'Y', Ь:'', Э:'E', Ю:'Yu', Я:'Ya',
    а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z', и:'i', й:'y',
    к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f',
    х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya',
  }
  return str.split('').map(ch => map[ch] ?? ch).join('')
}

/** Make a safe ASCII sheet name for xlsx (max 31 chars, alphanumeric + underscore only) */
function safeSheetName(name: string, fallback: string): string {
  const translit = transliterate(name || fallback)
  const ascii = translit.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
  return ascii.slice(0, 31) || 'Data'
}

// Generic Excel export — receives headers[] and rows[][] from any module
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { headers, rows, sheetName } = body as {
      headers?: string[]
      rows?: string[][]
      sheetName?: string
    }

    if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const XLSX = await import('xlsx')

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto-fit column widths (capped at 50 chars)
    ws['!cols'] = headers.map((h, i) => {
      const maxLen = Math.max(h.length, ...rows.map((r) => (r[i] || '').length))
      return { wch: Math.min(maxLen + 2, 50) }
    })

    const wb = XLSX.utils.book_new()
    const sheet = safeSheetName(sheetName || '', 'Data')
    XLSX.utils.book_append_sheet(wb, ws, sheet)

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    // Filename for Content-Disposition must be ASCII-encoded per RFC 5987
    const rawName = (sheetName || 'export').replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_')
    const encodedName = encodeURIComponent(rawName)

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodedName}.xlsx"; filename*=UTF-8''${encodedName}.xlsx`,
      },
    })
  } catch (error) {
    console.error('[export POST]', error)
    return NextResponse.json({ error: String(error?.constructor?.name === 'Error' ? (error as Error).message : 'Export failed') }, { status: 500 })
  }
}
