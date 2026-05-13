'use client'

import { useState, useRef } from 'react'
import { Wrench, Mail, Lock, Eye, EyeOff, Info } from 'lucide-react'

const demoCredentials = [
  { email: 'admin@enterprise.ru', password: 'admin123', role: 'Администратор' },
  { email: 'manager@enterprise.ru', password: 'manager123', role: 'Менеджер' },
  { email: 'engineer@enterprise.ru', password: 'engineer123', role: 'Инженер' },
]

interface User {
  id: string
  email: string
  name: string
  role: string
  isActive: boolean
}

interface LoginFormProps {
  onLogin?: (user: User) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Keep a ref so async callbacks always see the latest onLogin
  const onLoginRef = useRef(onLogin)
  onLoginRef.current = onLogin

  async function doLogin(loginEmail: string, loginPassword: string) {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Ошибка авторизации')
      }

      const data = await res.json()

      // Store session in localStorage for iframe / cookie-blocked environments
      try {
        localStorage.setItem('session_token', data.user.id)
        localStorage.setItem('session_user', JSON.stringify(data.user))
        localStorage.setItem('login_email', loginEmail)
        localStorage.setItem('login_password', loginPassword)
      } catch { /* ignore */ }

      // Notify parent
      const cb = onLoginRef.current
      if (cb) {
        cb(data.user)
      } else {
        window.location.replace('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при входе')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doLogin(email, password)
  }

  const fillAndSubmitDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail)
    setPassword(demoPassword)
    setError('')
    doLogin(demoEmail, demoPassword)
  }

  return (
    <div style={{ width: '100%', maxWidth: '448px', position: 'relative', zIndex: 10 }}>
      <div style={{
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: '#fff',
        padding: '32px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}>
        {/* Logo and title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: '#FF9900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 14px rgba(255,153,0,0.3)',
          }}>
            <Wrench size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0 }}>
            ЦС ТОРО
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
            Система управления ремонтной службой
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                placeholder="email@enterprise.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '40px',
                  paddingRight: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#FF9900'; e.target.style.boxShadow = '0 0 0 3px rgba(255,153,0,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Пароль
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '40px',
                  paddingRight: '40px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#FF9900'; e.target.style.boxShadow = '0 0 0 3px rgba(255,153,0,0.1)' }}
                onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#9ca3af',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#ccc' : '#FF9900',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(255,153,0,0.2)',
              marginTop: '4px',
            }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        {/* Demo credentials */}
        <div style={{
          marginTop: '24px',
          borderRadius: '8px',
          border: '1px solid #f3f4f6',
          background: '#f9fafb',
          padding: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Info size={14} color="#9ca3af" />
            <span style={{ fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' }}>
              Демо-доступ
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {demoCredentials.map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => fillAndSubmitDemo(cred.email, cred.password)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  padding: '8px 12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>{cred.email}</div>
                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>{cred.password}</div>
                </div>
                <span style={{
                  borderRadius: '4px',
                  background: '#f3f4f6',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#4b5563',
                }}>
                  {cred.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '24px' }}>
        &copy; 2025 ЦС ТОРО. Все права защищены.
      </p>
    </div>
  )
}
