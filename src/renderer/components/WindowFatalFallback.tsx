import { Alert, Button } from '@cherrystudio/ui'
import i18n from '@renderer/i18n/resolver'
import { ipcApi } from '@renderer/ipc'
import { formatErrorDetails } from '@renderer/utils/errorDetails'
import { useEffect } from 'react'
import type { FallbackProps } from 'react-error-boundary'

/**
 * Fallback for the top-level ErrorBoundary that wraps each window's provider stack.
 *
 * It renders after a provider crashed, so no React context exists here: translations
 * must go through the global i18n singleton (never `useTranslation`), and styling can
 * only rely on the unconditional `:root` token defaults — the fallback stays in the
 * light palette because ThemeProvider never got to apply the `dark` class.
 */
export const WindowFatalFallback = ({ error }: FallbackProps) => {
  // The main window's boot spinner is normally removed by the main-only ready effect
  // in MainWindowRuntime, a leaf inside the provider stack; when a provider throws it
  // never runs, and the leftover fixed full-viewport overlay would block clicks here.
  useEffect(() => {
    document.getElementById('spinner')?.remove()
    console.error('[WindowFatalFallback]', error)
  }, [error])

  const details = formatErrorDetails(error)
  const err = error as any
  const stack = err?.stack || ''
  const componentStack = err?.componentStack || ''

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 p-4">
      <Alert
        type="error"
        message={i18n.t('error.boundary.default.message')}
        description={
          <div className="max-h-[60vh] max-w-2xl overflow-auto text-left text-xs whitespace-pre-wrap font-mono">
            <div className="font-semibold text-destructive">{details || String(error)}</div>
            {stack && <div className="mt-2 text-muted-foreground opacity-90">{stack}</div>}
            {componentStack && <div className="mt-2 text-muted-foreground opacity-75">{componentStack}</div>}
          </div>
        }
        className="max-w-2xl"
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void ipcApi.request('system.toggle_dev_tools')}>
          {i18n.t('error.boundary.default.devtools')}
        </Button>
        <Button size="sm" onClick={() => void ipcApi.request('window.main.reload')}>
          {i18n.t('error.boundary.default.reload')}
        </Button>
      </div>
    </div>
  )
}

