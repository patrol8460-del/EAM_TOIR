import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

const SCRYPT_KEYLEN = 64

/**
 * Hash a password using scrypt with a random salt.
 * Returns a string in the format: salt:hash (both hex-encoded).
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return `${salt}:${hash}`
}

/**
 * Verify a password against a stored hash (salt:hash format).
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, expectedHash] = storedHash.split(':')
  if (!salt || !expectedHash) return false
  const actualHash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex')
  return timingSafeEqual(Buffer.from(actualHash, 'hex'), Buffer.from(expectedHash, 'hex'))
}

/**
 * Get authenticated user from request.
 * Supports both:
 * 1. Cookie-based: session_token cookie (works in normal browser)
 * 2. Header-based: Authorization: Bearer <userId> (works in iframes/preview)
 */
export async function getSessionUser(request: NextRequest) {
  // Try cookie first
  let sessionToken = request.cookies.get('session_token')?.value

  // Fallback to Authorization header (for iframe / cookie-blocked environments)
  if (!sessionToken) {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      sessionToken = authHeader.slice(7)
    }
  }

  if (!sessionToken) return null

  return db.user.findUnique({
    where: { id: sessionToken },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })
}
