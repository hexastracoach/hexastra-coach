import { describe, it, expect } from 'vitest'
import { detectSubcategory } from '@/lib/hexastra/orchestration/detectSubcategory'
import { classifyRequestKind } from '@/lib/hexastra/orchestration/requestKinds'
import { detectContext } from '@/lib/hexastra/orchestration/detectContext'
import { classifyMessage } from '@/lib/hexastra/orchestration/universalClassification'
import { isActionableDirectRequest } from '@/lib/hexastra/orchestration/directRequest'

describe('User phrasing regressions', () => {
  it('keeps natal chart + transits in astrology', () => {
    const result = detectSubcategory('Je veux explorer mon thème natal et mes transits astrologiques.')
    const found = result.matches.map((entry) => entry.subcategory)

    expect(found).toContain('theme_natal')
    expect(found).toContain('transits')
    expect(detectContext('Je veux explorer mon thème natal et mes transits astrologiques.').contextType).toBe('astro_exact')
    expect(isActionableDirectRequest(
      'Je veux explorer mon thème natal et mes transits astrologiques.',
      classifyMessage('Je veux explorer mon thème natal et mes transits astrologiques.')
    )).toBe(true)
  })

  it('keeps Human Design type + strategy as an exact HD request', () => {
    const result = detectSubcategory('Je veux comprendre mon type Human Design et ma stratégie.')
    const found = result.matches.map((entry) => entry.subcategory)

    expect(found).toContain('type_hd')
    expect(found).toContain('strategie_hd')
    expect(classifyRequestKind('Je veux comprendre mon type Human Design et ma stratégie.', 'type_hd')).toBe('exact_profile')
    expect(detectContext('Je veux comprendre mon type Human Design et ma stratégie.').contextType).toBe('human_design_exact')
    expect(isActionableDirectRequest(
      'Je veux comprendre mon type Human Design et ma stratégie.',
      classifyMessage('Je veux comprendre mon type Human Design et ma stratégie.')
    )).toBe(true)
  })

  it('keeps enneagram profile + wing as an enneagram request instead of a hypothetical reading', () => {
    const result = detectSubcategory('Je veux explorer mon profil ennéagramme et mon aile.')
    const found = result.matches.map((entry) => entry.subcategory)

    expect(found).toContain('type_enn')
    expect(found).toContain('aile_enn')
    expect(classifyRequestKind('Je veux explorer mon profil ennéagramme et mon aile.', 'type_enn')).toBe('exact_profile')
    expect(isActionableDirectRequest(
      'Je veux explorer mon profil ennéagramme et mon aile.',
      classifyMessage('Je veux explorer mon profil ennéagramme et mon aile.')
    )).toBe(true)
  })
})
