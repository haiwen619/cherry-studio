import { Alert, Button } from '@cherrystudio/ui'
import { loggerService } from '@logger'
import { ipcApi } from '@renderer/ipc'
import { formatErrorDetails } from '@renderer/utils/errorDetails'
import type { ComponentType, ErrorInfo, ReactNode } from 'react'
import type { FallbackProps } from 'react-error-boundary'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'

const logger = loggerService.withContext('ErrorBoundary')
const DefaultFallback: ComponentType<FallbackProps> = (props: FallbackProps): ReactNode => {
  const { t } = useTranslation()
  const { error } = props
  const debug = async () => {
    await ipcApi.request('system.toggle_dev_tools')
  }
  const reload = async () => {
    await ipcApi.request('window.main.reload')
  }
  const details = formatErrorDetails(error)
  const err = error as any
  const stack = err?.stack || ''
  return (
    <div className="flex w-full items-center justify-center p-2">
      <Alert
        message={t('error.boundary.default.message')}
        showIcon
        description={
          <div className="max-h-[40vh] max-w-xl overflow-auto text-left text-xs whitespace-pre-wrap font-mono">
            <div className="font-semibold">{details || String(error)}</div>
            {stack && <div className="mt-2 text-muted-foreground opacity-80">{stack}</div>}
          </div>
        }
        type="error"
        action={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={debug}>
              {t('error.boundary.default.devtools')}
            </Button>
            <Button size="sm" onClick={reload}>
              {t('error.boundary.default.reload')}
            </Button>
          </div>
        }
      />
    </div>
  )
}

const ErrorBoundaryCustomized = ({
  children,
  fallbackComponent,
  onError
}: {
  children: ReactNode
  fallbackComponent?: ComponentType<FallbackProps>
  onError?: (error: Error, info: ErrorInfo) => void
}) => {
  const handleError = (error: Error, info: ErrorInfo) => {
    const err = error as any
    const errName = err?.name || 'Error'
    const errMsg = err?.message || String(error)
    const errStack = err?.stack || ''
    const compStack = info?.componentStack || ''
    console.error(`[ErrorBoundary] ${errName}: ${errMsg}\n${errStack}\nComponentStack:${compStack}`)
    logger.error(`Caught a render error: ${errName}: ${errMsg}`, {
      name: errName,
      message: errMsg,
      stack: errStack,
      componentStack: compStack
    })
    onError?.(error, info)
  }
  return (
    <ErrorBoundary FallbackComponent={fallbackComponent ?? DefaultFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  )
}

export { ErrorBoundaryCustomized as ErrorBoundary }
