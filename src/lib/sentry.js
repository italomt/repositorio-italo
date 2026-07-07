import * as Sentry from '@sentry/react'
import { APP_VERSION } from './version'

const dsn = import.meta.env.VITE_SENTRY_DSN
const environment = import.meta.env.VITE_SENTRY_ENVIRONMENT || (import.meta.env.PROD ? 'production' : 'development')

let initialized = false

export function initSentry() {
  if (!dsn || initialized) return
  initialized = true

  Sentry.init({
    dsn,
    environment,
    release: `europa-trip-app@${APP_VERSION}`,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    sendDefaultPii: false,
  })
}

export function setSentryUser(user) {
  if (!initialized) return
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, username: user.nome })
  } else {
    Sentry.setUser(null)
  }
}

export function captureException(error, context) {
  if (!initialized) {
    console.error('[Sentry disabled]', error, context)
    return
  }
  Sentry.captureException(error, context)
}

export const SentryErrorBoundary = Sentry.ErrorBoundary

export { Sentry }
