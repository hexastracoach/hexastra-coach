export type HexastraApiJsonPostRequest = {
  init: RequestInit
  debug: {
    method: 'POST'
    hasBody: boolean
    bodyBytes: number
    hasApiKey: boolean
  }
}

export function buildHexastraApiJsonPostRequest(
  payload: unknown,
  apiKey?: string | null,
): HexastraApiJsonPostRequest {
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers['x-api-key'] = apiKey
  }

  return {
    init: {
      method: 'POST',
      headers,
      body,
    },
    debug: {
      method: 'POST',
      hasBody: body.length > 0,
      bodyBytes: body.length,
      hasApiKey: Boolean(apiKey),
    },
  }
}
