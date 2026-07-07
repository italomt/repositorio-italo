import posthog from 'posthog-js'
import { APP_VERSION } from './version'

const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let initialized = false

export function initPostHog() {
  if (!key || initialized) return
  initialized = true

  posthog.init(key, {
    api_host: host,
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    person_profiles: 'identified_only',
    mask_all_text: false,
    mask_all_element_attributes: false,
    request_batching: true,
    loaded: () => {
      posthog.register({ app_version: APP_VERSION, app: 'europa-trip' })
    },
  })
}

export function setPostHogUser(user) {
  if (!initialized) return
  if (user) {
    posthog.identify(user.id, {
      email: user.email,
      name: user.nome,
      app_version: APP_VERSION,
    })
  } else {
    posthog.reset()
  }
}

export function capturePageview() {
  if (!initialized) return
  const pathname = window.location.pathname + window.location.search + window.location.hash
  posthog.capture('$pageview', { $current_url: window.location.origin + pathname })
}

export function captureEvent(name, properties = {}) {
  if (!initialized) return
  posthog.capture(name, properties)
}

export { posthog }
