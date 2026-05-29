'use client'

import { useEffect, useState } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [details, setDetails] = useState('')

  useEffect(() => {
    // Collect all available error info
    const info = [
      `Message: ${error.message || 'none'}`,
      `Name: ${error.name || 'Error'}`,
      `Digest: ${error.digest || 'none'}`,
      `Stack: ${error.stack || 'none'}`,
    ].join('\n')
    setDetails(info)

    // Also capture unhandled errors globally
    const handler = (e: ErrorEvent) => {
      console.error('Unhandled error:', e.error)
      setDetails(prev => prev + `\n\nUnhandled: ${e.message} ${e.error?.stack || ''}`)
    }
    const rejHandler = (e: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', e.reason)
      setDetails(prev => prev + `\n\nRejected: ${e.reason}`)
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejHandler)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center max-w-2xl w-full">
        <h2 className="text-lg font-semibold text-red-800">
          Произошла ошибка
        </h2>
        <p className="mt-2 text-sm text-red-600 break-all">
          {error.message || 'Неизвестная ошибка'}
        </p>
        {error.digest && (
          <p className="mt-1 text-xs text-muted-foreground">
            Digest: {error.digest}
          </p>
        )}
        <pre className="mt-4 p-3 bg-red-100 rounded-lg text-left text-xs overflow-auto max-h-64 w-full">
          {details}
        </pre>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Перезагрузить
        </button>
      </div>
    </div>
  )
}
