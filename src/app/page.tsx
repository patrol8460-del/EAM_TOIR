'use client'

import { useState, useCallback, useEffect } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { AppShell } from '@/components/layout/app-shell'
import { useAuthStore } from '@/store/auth-store'

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const storeSetUser = useAuthStore((s) => s.setUser)

  // Global fetch interceptor — always attach Bearer token for API calls
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      if (url.startsWith('/api/')) {
        const token = localStorage.getItem('session_token')
        if (token) {
          const headers = new Headers(init?.headers)
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          return originalFetch(input, { ...init, headers, credentials: 'include' })
        }
      }
      return originalFetch(input, init)
    }
    return () => { window.fetch = originalFetch }
  }, [])

  // On mount: read localStorage and sync to zustand
  useEffect(() => {
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
  }, [storeSetUser])

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

  return <AppShell user={user} onLogout={handleLogout} />
}
