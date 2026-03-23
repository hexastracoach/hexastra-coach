import { describe, expect, it } from 'vitest'
import { getMenuForMode } from '@/lib/hexastra/menus/getMenuForMode'
import {
  buildContextSelectionPrompt,
  findLooseMenuSelection,
  resolveScienceSubanalysisSelection,
} from '@/lib/hexastra/orchestrator/contextualSelection'

describe('contextual selection helpers', () => {
  it('resolves Human Design gates from a numeric subscience choice', () => {
    const option = resolveScienceSubanalysisSelection('science_porteum', '3')

    expect(option?.key).toBe('science_porteum_gates')
    expect(option?.label).toBe('Portes')
  })

  it('resolves a loose Human Design gates selection but ignores real questions', () => {
    const looseSelection = resolveScienceSubanalysisSelection('science_porteum', 'portes en hd')
    const actualQuestion = resolveScienceSubanalysisSelection(
      'science_porteum',
      'quelles sont mes portes en hd ?'
    )

    expect(looseSelection?.key).toBe('science_porteum_gates')
    expect(actualQuestion).toBeNull()
  })

  it('understands a typed science path with arrows down to the current submenu', () => {
    const match = findLooseMenuSelection({
      items: getMenuForMode('libre'),
      message: 'Human Design -> Portes actives',
      selectedMenuKey: null,
    })

    expect(match?.kind).toBe('submenu')
    if (match?.kind === 'submenu') {
      expect(match.parent.key).toBe('science_human_design')
      expect(match.item.key).toBe('hd_portes')
    }
  })

  it('understands a loose submenu selection inside an already active science', () => {
    const match = findLooseMenuSelection({
      items: getMenuForMode('libre'),
      message: 'portes actives',
      selectedMenuKey: 'science_human_design',
    })

    expect(match?.kind).toBe('submenu')
    if (match?.kind === 'submenu') {
      expect(match.parent.key).toBe('science_human_design')
      expect(match.item.key).toBe('hd_portes')
    }
  })

  it('builds a context prompt that asks for the real question before reading', () => {
    const prompt = buildContextSelectionPrompt({
      language: 'fr',
      label: 'Portes',
      parentLabel: 'Human Design',
    })

    expect(prompt).toContain('Contexte actif')
    expect(prompt).toContain('Pose ta vraie question')
  })
})
