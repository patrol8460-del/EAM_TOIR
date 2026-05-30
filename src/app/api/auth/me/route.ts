import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Try cookie first
    let sessionToken = request.cookies.get('session_token')?.value

    // Fallback: accept token from Authorization header (for iframe / localStorage sessions)
    if (!sessionToken) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        sessionToken = authHeader.slice(7)
      }
    }

    // Fallback: accept token from query param (for iframe)
    if (!sessionToken) {
      sessionToken = request.nextUrl.searchParams.get('token') || undefined
    }

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: sessionToken },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        departmentId: true,
        brigadeId: true,
        createdAt: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
