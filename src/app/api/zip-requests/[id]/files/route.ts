import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const UPLOAD_DIR = 'uploads/zip'

// ─── GET: List files for a ZIP request ───
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

    // Verify the ZIP request exists
    const zipRequest = await db.zipRequest.findUnique({
      where: { id },
    })

    if (!zipRequest) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    // Fetch files (without filePath for security)
    const files = await db.zipRequestFile.findMany({
      where: { zipRequestId: id },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ files })
  } catch (error) {
    console.error('ZIP request files list error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── POST: Upload a file to a ZIP request ───
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

    // Verify the ZIP request exists
    const zipRequest = await db.zipRequest.findUnique({
      where: { id },
    })

    if (!zipRequest) {
      return NextResponse.json(
        { error: 'Заявка ЗИП не найдена' },
        { status: 404 },
      )
    }

    // Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Файл не предоставлен' },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Размер файла превышает лимит ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 },
      )
    }

    // Validate file size > 0
    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Файл пуст' },
        { status: 400 },
      )
    }

    // Generate unique filename
    const fileExtension = file.name.includes('.')
      ? file.name.substring(file.name.lastIndexOf('.'))
      : ''
    const uniquePrefix = randomUUID()
    const storedFileName = `${uniquePrefix}${fileExtension}`

    // Ensure upload directory exists
    const fullUploadDir = join(process.cwd(), UPLOAD_DIR)
    await mkdir(fullUploadDir, { recursive: true })

    // Save file to disk
    const filePath = join(UPLOAD_DIR, storedFileName)
    const absoluteFilePath = join(process.cwd(), filePath)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(absoluteFilePath, fileBuffer)

    // Create file record in database
    const fileRecord = await db.zipRequestFile.create({
      data: {
        zipRequestId: id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        filePath,
        uploadedBy: user.id,
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'FILE_UPLOAD',
        entity: 'ZipRequestFile',
        entityId: fileRecord.id,
        details: JSON.stringify({
          zipRequestId: id,
          requestNumber: zipRequest.number,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        }),
      },
    })

    return NextResponse.json(
      {
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        fileSize: fileRecord.fileSize,
        mimeType: fileRecord.mimeType,
        uploadedBy: fileRecord.uploadedBy,
        createdAt: fileRecord.createdAt,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('ZIP request file upload error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}

// ─── DELETE: Delete a file from a ZIP request ───
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

    // Parse body for fileId
    const body = await request.json()
    const { fileId } = body

    if (!fileId) {
      return NextResponse.json(
        { error: 'ID файла обязателен' },
        { status: 400 },
      )
    }

    // Fetch the file record
    const fileRecord = await db.zipRequestFile.findUnique({
      where: { id: fileId },
    })

    if (!fileRecord) {
      return NextResponse.json(
        { error: 'Файл не найден' },
        { status: 404 },
      )
    }

    // Verify the file belongs to this ZIP request
    if (fileRecord.zipRequestId !== id) {
      return NextResponse.json(
        { error: 'Файл не относится к данной заявке' },
        { status: 400 },
      )
    }

    // Permission check: only uploader or admin
    if (fileRecord.uploadedBy !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Нет прав для удаления файла' },
        { status: 403 },
      )
    }

    // Delete file from disk
    try {
      const absolutePath = join(process.cwd(), fileRecord.filePath)
      await unlink(absolutePath)
    } catch (fileError) {
      console.warn(
        `Failed to delete file ${fileRecord.fileName} from disk:`,
        fileError,
      )
      // Continue deleting the record even if file removal fails
    }

    // Delete the file record
    await db.zipRequestFile.delete({
      where: { id: fileId },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'FILE_DELETE',
        entity: 'ZipRequestFile',
        entityId: fileId,
        details: JSON.stringify({
          zipRequestId: id,
          fileName: fileRecord.fileName,
          fileSize: fileRecord.fileSize,
        }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('ZIP request file delete error:', error)
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 })
  }
}
