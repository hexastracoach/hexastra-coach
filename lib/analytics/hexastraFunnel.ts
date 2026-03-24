export type HexastraFunnelEventName =
  | 'landing_chat_cta_clicked'
  | 'chat_first_message_sent'
  | 'chat_second_message_sent'
  | 'chat_limit_reached'
  | 'chat_upgrade_clicked'

type HexastraFunnelPayload = Record<string, unknown> & {
  event: HexastraFunnelEventName
  timestamp: string
}

const STORAGE_KEY = 'hexastra.analytics.funnel'
const MAX_STORED_EVENTS = 50

declare global {
  interface Window {
    posthog?: {
      capture?: (event: string, properties?: Record<string, unknown>) => void
    }
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
  }
}

function appendStoredEvent(payload: HexastraFunnelPayload) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const previous = raw ? (JSON.parse(raw) as HexastraFunnelPayload[]) : []
    const next = [...previous, payload].slice(-MAX_STORED_EVENTS)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // noop
  }
}

export function trackHexastraFunnel(
  event: HexastraFunnelEventName,
  properties: Record<string, unknown> = {},
) {
  if (typeof window === 'undefined') return

  const payload: HexastraFunnelPayload = {
    event,
    timestamp: new Date().toISOString(),
    ...properties,
  }

  appendStoredEvent(payload)

  try {
    window.dispatchEvent(new CustomEvent('hexastra:funnel', { detail: payload }))
  } catch {
    // noop
  }

  try {
    window.posthog?.capture?.(event, properties)
  } catch {
    // noop
  }

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', event, properties)
    }
  } catch {
    // noop
  }

  try {
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event, ...properties })
    }
  } catch {
    // noop
  }
}
