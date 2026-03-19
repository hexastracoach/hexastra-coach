/**
 * errorReporter — abstraction légère pour le reporting d'erreurs côté serveur.
 *
 * - Logue toujours via logger (console Vercel)
 * - Envoie optionnellement à un webhook externe via ERROR_REPORTING_WEBHOOK_URL
 * - Branchement futur possible sur Sentry, Datadog, etc. sans changer les call-sites
 */

import { logger } from './logger'

export type ErrorContext = {
  userId?: string
  path?: string
  requestId?: string
  extra?: Record<string, unknown>
}

/**
 * Capture une erreur serveur de manière structurée.
 * À utiliser dans les catch de routes API et d'orchestration.
 */
export function captureError(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  logger.error('[captureError]', {
    message,
    stack,
    ...context,
  })

  // Reporting externe optionnel (Sentry, custom webhook, etc.)
  const webhookUrl = process.env.ERROR_REPORTING_WEBHOOK_URL
  if (typeof webhookUrl === 'string' && webhookUrl.length > 0) {
    const payload = JSON.stringify({
      timestamp: new Date().toISOString(),
      message,
      stack,
      ...context,
    })

    try {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      }).catch(() => {
        // silent fail — ne pas cascader une erreur sur une erreur
      })
    } catch {
      // intentionally silent
    }
  }
}

/**
 * Wraps une Promise et capture toute exception non gérée.
 * Utile pour les blocs try/catch d'API route.
 */
export async function withErrorCapture<T>(
  fn: () => Promise<T>,
  context: ErrorContext = {}
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    captureError(error, context)
    throw error
  }
}
