'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('App error:', error)
  }, [error])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0F1B2D 0%, #162236 50%, #1a2a42 100%)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '32px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '12px',
          background: '#fee2e2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: '0 0 8px' }}>
          Произошла ошибка
        </h2>
        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 16px', lineHeight: 1.5 }}>
          {error.message || 'Неизвестная ошибка при загрузке приложения'}
        </p>
        {error.digest && (
          <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 16px' }}>
            Код ошибки: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          style={{
            width: '100%',
            height: '44px',
            borderRadius: '8px',
            border: 'none',
            background: '#FF9900',
            color: '#fff',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,153,0,0.2)',
          }}
        >
          Перезагрузить
        </button>
      </div>
    </div>
  )
}
