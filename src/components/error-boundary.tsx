'use client'

import { Component, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: (error: Error) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error)
    console.error('Component stack:', info.componentStack)
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error)
      }
      return (
        <div style={{
          padding: '24px',
          margin: '16px',
          borderRadius: '8px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          <strong>Client Error:</strong>{'\n'}
          {this.state.error.message}{'\n\n'}
          <div style={{ fontSize: '12px', color: '#991b1b', maxHeight: '300px', overflow: 'auto' }}>
            {this.state.error.stack}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
