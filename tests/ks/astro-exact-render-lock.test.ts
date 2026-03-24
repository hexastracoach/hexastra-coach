import { describe, expect, it } from 'vitest'
import { buildSystemPrompt } from '@/lib/hexastra/prompts/buildSystemPrompt'

describe('astro exact render lock', () => {
  const baseInput = {
    plan: 'free' as const,
    mode: 'libre' as const,
    language: 'fr',
    firstName: 'Marie',
    contextType: 'general' as const,
    practitionerUsage: null,
    requestType: 'chat' as const,
    isAstroExactCompact: true,
    exactDataBlock: [
      'PLACEMENTS ASTRO EXACTS VALIDES:',
      '- SOLEIL: Verseau',
      '- LUNE: Capricorne',
      '- ASCENDANT: indisponible',
      '- ASPECTS CLES VALIDES: Soleil trigone Lune',
    ].join('\n'),
  }

  it('adds explicit exact-data fidelity rules to the compact astro prompt', () => {
    const prompt = buildSystemPrompt(baseInput)

    expect(prompt).toMatch(/FIDELITE AUX DONNEES EXACTES|EXACT DATA FIDELITY/)
    expect(prompt).toMatch(/Ne jamais inventer un aspect absent|Never invent an aspect that is absent/)
    expect(prompt).toMatch(/Utiliser uniquement les placements|Use only the placements/)
  })

  it('switches the compact astro prompt to a short direct-answer mode for simple sign questions', () => {
    const prompt = buildSystemPrompt({
      ...baseInput,
      messages: [{ role: 'user' as const, content: 'je suis quel signe' }],
    })

    expect(prompt).toContain('REPONSE COURTE OBLIGATOIRE')
    expect(prompt).toContain('Ton signe solaire est Verseau.')
    expect(prompt).not.toContain('5 a 10 paragraphes fluides')
  })
})
