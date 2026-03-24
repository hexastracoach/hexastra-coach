type BuildChatEntryHrefParams = {
  prompt?: string | null
  source?: string | null
}

export function buildChatEntryHref(params: BuildChatEntryHrefParams = {}): string {
  const searchParams = new URLSearchParams()
  const prompt = params.prompt?.trim()
  const source = params.source?.trim()

  if (prompt) {
    searchParams.set('q', prompt)
  }

  if (source) {
    searchParams.set('source', source)
  }

  const query = searchParams.toString()
  return query ? `/chat?${query}` : '/chat'
}
