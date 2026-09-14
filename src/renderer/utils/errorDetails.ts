/**
 * Dependency-light error → string helpers.
 *
 * This module sits on every window's first-screen graph through the fatal
 * fallbacks (ErrorBoundary / WindowFatalFallback / RouteErrorFallback), so it
 * must never import the heavy error-classification bucket (zod, axios, ai,
 * agent schemas) — that lives in `./error`. Guarded by import-graph probes in
 * `__tests__/errorDetails.test.ts`.
 */
export function getErrorDetails(err: any, seen = new WeakSet()): any {
  // Handle circular references
  if (err === null || typeof err !== 'object' || seen.has(err)) {
    return err
  }

  seen.add(err)
  const result: any = {}

  // Explicitly pull standard or prototype properties (e.g. DOMException, Custom Errors)
  if (err.name) result.name = err.name
  if (err.message) result.message = err.message
  if (err.code !== undefined) result.code = err.code

  // Get all enumerable properties, including those from the prototype chain
  const allProps = new Set([
    ...Object.getOwnPropertyNames(err),
    ...Object.keys(err),
    ...(err.constructor?.prototype ? Object.getOwnPropertyNames(err.constructor.prototype) : [])
  ])

  for (const prop of allProps) {
    try {
      const value = err[prop]
      // Skip function properties
      if (typeof value === 'function') continue
      // Recursively process nested objects
      result[prop] = getErrorDetails(value, seen)
    } catch (e) {
      result[prop] = '<Unable to access property>'
    }
  }

  return result
}

export function formatErrorDetails(error: unknown): string {
  if (!error) {
    return ''
  }

  const err = error as any
  const errName = err?.name || (err?.constructor?.name ?? 'Error')
  const errMsg = err?.message || (typeof error === 'string' ? error : '')
  const detailedError = getErrorDetails(error)
  delete detailedError?.headers
  delete detailedError?.stack
  delete detailedError?.request_id

  if (detailedError?.message) {
    return detailedError.name ? `${detailedError.name}: ${detailedError.message}` : detailedError.message
  }

  if (errMsg) {
    return `${errName}: ${errMsg}`
  }

  if (!detailedError || Object.keys(detailedError).length === 0) {
    return String(error)
  }

  const formattedJson = JSON.stringify(detailedError, null, 2)
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n')
  return `Error Details:\n${formattedJson}`
}

