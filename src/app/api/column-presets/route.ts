import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/column-presets?module=xxx&type=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const mod = searchParams.get('module')
    const type = searchParams.get('type') || 'view'

    if (!mod) {
      return NextResponse.json({ error: 'module parameter is required' }, { status: 400 })
    }

    // Get all presets for module (userId filtering done client-side for simplicity)
    const presets = await db.columnPreset.findMany({
      where: { module: mod, type },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ presets })
  } catch (error) {
    console.error('[column-presets GET]', error)
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 })
  }
}

// POST /api/column-presets — create or update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, module: mod, name, type, columns, isDefault } = body

    if (!userId || !mod || !name || !columns || !Array.isArray(columns)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // If setting as default, clear other defaults for same module+type
    if (isDefault) {
      await db.columnPreset.updateMany({
        where: { userId, module: mod, type: type || 'view', isDefault: true },
        data: { isDefault: false },
      })
    }

    // Check if preset with same name+module+userId exists → update
    const existing = await db.columnPreset.findFirst({
      where: { userId, module: mod, name, type: type || 'view' },
    })

    if (existing) {
      const updated = await db.columnPreset.update({
        where: { id: existing.id },
        data: {
          columns: JSON.stringify(columns),
          isDefault: isDefault ? true : existing.isDefault,
        },
      })
      return NextResponse.json({ preset: updated })
    }

    const preset = await db.columnPreset.create({
      data: {
        userId,
        module: mod,
        name,
        type: type || 'view',
        columns: JSON.stringify(columns),
        isDefault: isDefault || false,
      },
    })

    return NextResponse.json({ preset }, { status: 201 })
  } catch (error) {
    console.error('[column-presets POST]', error)
    return NextResponse.json({ error: 'Failed to save preset' }, { status: 500 })
  }
}

// DELETE /api/column-presets
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    await db.columnPreset.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[column-presets DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 })
  }
}
