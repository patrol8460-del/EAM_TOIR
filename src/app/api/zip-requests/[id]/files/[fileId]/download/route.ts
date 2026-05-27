import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { readFile, stat } from 'fs/promises'
import { existsSync } from 'fs'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const user = await getSessionUser(request)
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const { id, fileId } = await params

    // Fetch the file record
    const fileRecord = await db.zipRequestFile.findUnique({
      where: { id: fileId },
    })

    if (!fileRecord || fileRecord.zipRequestId !== id) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 },
      )
    }

    // Check file exists on disk
    if (!existsSync(fileRecord.filePath)) {
      return NextResponse.json(
        { error: 'Файл не найден на диске' },
        { status: 404 },
      )
    }

    const fileBuffer = await readFile(fileRecord.filePath)
    const fileStat = await stat(fileRecord.filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileRecord.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileRecord.fileName)}`,
        'Content-Length': fileStat.size.toString(),
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error('File download error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
