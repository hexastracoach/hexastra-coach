import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'
import type { BuildPromptInput } from '@/lib/hexastra/types'

function makeInput(userMessage: string, overrides: Partial<BuildPromptInput> = {}): BuildPromptInput {
  return {
    plan: 'free',
    mode: 'libre',
    language: 'fr',
    requestType: 'chat',
    flowStep: 'analysis',
    contextType: 'energy',
    domainRoute: 'neurokua',
    messages: [{ role: 'user', content: userMessage }],
    isHoroscopeRoute: false,
    isAstroExactCompact: false,
    ...overrides,
  } as BuildPromptInput
}

describe('inner-state prompt guardrails', () => {
  it('forces a HexAstra inner-state reading for fatigue questions', () => {
    const prompt = buildSystemPrompt(
      makeInput('Pourquoi je suis fatigué ?', {
        readingSummary: {
          detectedTheme: 'neuro_equilibre',
          detectedSubtheme: 'fatigue_recharge',
          detectedScience: 'neurokua',
          mainLever: 'ralentir et remettre du rythme',
        },
      }),
    )

    expect(prompt).toContain('pourquoi je suis fatigue ?')
    expect(prompt).toContain('lecture HexAstra de la dynamique interieure')
    expect(prompt).toContain('Interdiction de repondre comme un assistant generaliste de bien-etre')
    expect(prompt).toContain('Les conseils pratiques viennent APRES la lecture interieure')
  })
})
