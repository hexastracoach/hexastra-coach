import { describe, expect, it } from 'vitest'
import { buildChatEntryHref } from '@/lib/chat/chatEntryHref'

describe('chat entry href', () => {
  it('builds a direct chat entry with prompt and source', () => {
    expect(
      buildChatEntryHref({
        prompt: 'Aide-moi à comprendre ce que je traverse en ce moment.',
        source: 'landing_hero',
      }),
    ).toBe(
      '/chat?q=Aide-moi+%C3%A0+comprendre+ce+que+je+traverse+en+ce+moment.&source=landing_hero',
    )
  })

  it('falls back to the plain chat route when no params are provided', () => {
    expect(buildChatEntryHref()).toBe('/chat')
  })
})
