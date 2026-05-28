'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800">
              Критическая ошибка приложения
            </h2>
            <p className="mt-2 text-sm text-red-600 break-all max-w-lg">
              {error.message || 'Неизвестная ошибка'}
            </p>
            {error.digest && (
              <p className="mt-1 text-xs text-muted-foreground">
                Digest: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
