'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { LoginForm } from '@/components/auth/login-form'
import { useAuthStore } from '@/store/auth-store'
import { ErrorBoundary } from '@/components/error-boundary'

// SSR-safe: AppShell is loaded client-side only
const AppShell = dynamic(
  () => import('@/components/layout/app-shell').then((m) => m.AppShell),
  { ssr: false, loading: () => <AppLoader /> }
)

function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f9fafb',
    }}>
      <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        Загрузка...
      </div>
    </div>
  )
}

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)

  const storeSetUser = useAuthStore((s) => s.setUser)

  // Load session from localStorage on mount
  useEffect(() => {
    setMounted(true)
    let storedUser: User | null = null
    try {
      const stored = localStorage.getItem('session_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed?.id && parsed?.isActive) storedUser = parsed
      }
    } catch { /* ignore */ }

    if (storedUser) {
      setUser(storedUser)
      storeSetUser(storedUser)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = useCallback((loggedInUser: User) => {
    setUser(loggedInUser)
    storeSetUser(loggedInUser)
  }, [storeSetUser])

  const handleLogout = useCallback(() => {
    setUser(null)
    storeSetUser(null)
    try {
      localStorage.removeItem('session_token')
      localStorage.removeItem('session_user')
      localStorage.removeItem('login_email')
      localStorage.removeItem('login_password')
    } catch { /* ignore */ }
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
  }, [storeSetUser])

  // Before mount — render nothing (matches SSR)
  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F1B2D 0%, #162236 50%, #1a2a42 100%)',
      }} />
    )
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F1B2D 0%, #162236 50%, #1a2a42 100%)',
        padding: '1rem',
      }}>
        <LoginForm onLogin={handleLogin} />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <AppShell user={user} onLogout={handleLogout} />
    </ErrorBoundary>
  )
}
