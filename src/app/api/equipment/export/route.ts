import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { headers, rows } = body as { headers?: string[]; rows?: string[][] }

    if (!headers || !rows || !Array.isArray(headers) || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Dynamic import — xlsx only loaded server-side
    const XLSX = await import('xlsx')

    const wsData = [headers, ...rows]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto-fit column widths
    ws['!cols'] = headers.map((h, i) => {
      const maxLen = Math.max(
        h.length,
        ...rows.map((r) => (r[i] || '').length)
      )
      return { wch: Math.min(maxLen + 2, 50) }
    })

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Оборудование')

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="equipment.xlsx"`,
      },
    })
  } catch (error) {
    console.error('Excel export error:', error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}
