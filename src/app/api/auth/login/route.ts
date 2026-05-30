import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/auth'
import { scryptSync, randomBytes } from 'crypto'

// ─── Auto-seed if database is empty ───
let seedPromise: Promise<void> | null = null

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

async function ensureSeeded() {
  if (seedPromise) return seedPromise
  seedPromise = (async () => {
    try {
      const userCount = await db.user.count()

      console.log('[auto-seed] Checking demo users...')

      // Create / update demo users — always reset password to keep it in sync
      const users = [
        { email: 'admin@enterprise.ru', name: 'Администратор', role: 'admin' },
        { email: 'manager@enterprise.ru', name: 'Иванов Иван Иванович', role: 'manager' },
        { email: 'engineer@enterprise.ru', name: 'Петров Пётр Петрович', role: 'engineer' },
        { email: 'worker@enterprise.ru', name: 'Сидоров Сергей Сергеевич', role: 'worker' },
        { email: 'kovalev@enterprise.ru', name: 'Ковалёв Алексей Дмитриевич', role: 'worker' },
        { email: 'morozov@enterprise.ru', name: 'Морозов Дмитрий Владимирович', role: 'worker' },
        { email: 'volkov@enterprise.ru', name: 'Волков Николай Андреевич', role: 'engineer' },
      ]

      const passwordHash = hashPassword('admin123')
      for (const u of users) {
        await db.user.upsert({
          where: { email: u.email },
          update: { passwordHash, name: u.name, role: u.role, isActive: true },
          create: {
            email: u.email,
            passwordHash,
            name: u.name,
            role: u.role,
            isActive: true,
          },
        })
      }

      // Seed approval routes
      await seedApprovalRoutesIfNeeded()

      if (userCount === 0) {
        console.log('[auto-seed] Done — created demo users and approval routes')
      } else {
        console.log('[auto-seed] Done — verified demo users and approval routes')
      }
    } catch (err) {
      console.error('[auto-seed] Failed:', err)
      seedPromise = null // Allow retry
    }
  })()
  return seedPromise
}

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

    // Ensure database is seeded
    await ensureSeeded()

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
