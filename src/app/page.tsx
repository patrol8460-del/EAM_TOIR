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
  // Start with null to match SSR output — load from localStorage in useEffect
  const [user, setUser] = useState<User | null>(null)

  const storeSetUser = useAuthStore((s) => s.setUser)

  // Load session from localStorage on mount + verify with server
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

      // Verify session in background
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${storedUser.id}` },
      }).then(res => {
        if (res.ok) return
        // Session invalid — clear
        localStorage.removeItem('session_token')
        localStorage.removeItem('session_user')
        localStorage.removeItem('login_email')
        localStorage.removeItem('login_password')
        setUser(null)
        storeSetUser(null)
      }).catch(() => { /* network error, keep local session */ })
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
