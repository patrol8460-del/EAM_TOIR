import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      )
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    const isValid = verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      )
    }

    // Audit log
    await db.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'User',
        entityId: user.id,
      },
    })

    // Auto-seed approval routes if admin and none exist (blocking)
    if (user.role === 'admin') {
      try { await seedApprovalRoutesIfNeeded() } catch { /* silent */ }
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
    })

    // Set session cookie
    response.cookies.set('session_token', user.id, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

// ─── Seed default approval routes if none exist ───
const DEFAULT_APPROVAL_ROUTES = [
  {
    name: 'Закупка ЗИП',
    type: 'purchase',
    description: 'Согласование заявки на закупку запасных частей',
    steps: [
      { role: 'engineer', position: 'Инженер ТО', description: 'Проверка технической необходимости', isOptional: false },
      { role: 'manager', position: 'Руководитель', description: 'Финансовое согласование', isOptional: false },
    ],
  },
  {
    name: 'Изготовление ЗИП',
    type: 'manufacturing',
    description: 'Согласование заявки на изготовление запчастей',
    steps: [
      { role: 'engineer', position: 'Инженер ТО', description: 'Проверка технической возможности изготовления', isOptional: false },
      { role: 'manager', position: 'Руководитель', description: 'Согласование с руководителем подразделения', isOptional: false },
      { role: 'admin', position: 'Администратор', description: 'Финальное согласование', isOptional: false },
    ],
  },
]

async function seedApprovalRoutesIfNeeded() {
  for (const routeDef of DEFAULT_APPROVAL_ROUTES) {
    const existing = await db.approvalRoute.findFirst({
      where: { type: routeDef.type, isActive: true },
    })
    if (existing) continue

    await db.$transaction(async (tx) => {
      const route = await tx.approvalRoute.create({
        data: {
          name: routeDef.name,
          type: routeDef.type,
          description: routeDef.description,
          isActive: true,
        },
      })
      for (let i = 0; i < routeDef.steps.length; i++) {
        const step = routeDef.steps[i]
        await tx.approvalStep.create({
          data: {
            approvalRouteId: route.id,
            stepOrder: i + 1,
            role: step.role,
            position: step.position || null,
            description: step.description || null,
            isOptional: step.isOptional,
          },
        })
      }
    })

    console.log(`[seed] Created approval route: ${routeDef.name} (${routeDef.type})`)
  }
}
