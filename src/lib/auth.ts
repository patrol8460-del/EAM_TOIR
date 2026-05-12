import { scryptSync, randomBytes, timingSafeEqual } from 'crypto'

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  const candidateHash = scryptSync(password, salt, 64).toString('hex')
  try {
    return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidateHash, 'hex'))
  } catch {
    return false
  }
}

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}
