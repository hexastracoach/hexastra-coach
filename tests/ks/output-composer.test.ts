import { describe, expect, it } from 'vitest'
import { buildKsLeadSummary } from '@/lib/hexastra/orchestrator/ksOutputComposer'

describe('KS output composer', () => {
  it('adds structured lead markers for a natal reading', () => {
    const result = buildKsLeadSummary({
      flowStep: 'analysis',
      selectedOutputStructure: 'Signature de naissance -> axes dominants -> forces -> vigilances -> orientation actuelle',
      fusedSignal: {
        dominantSignal: 'signature_de_naissance',
        zone: 'identity',
        phase: 'stabilisation',
      },
      executedSubmodules: [
        {
          key: 'KS.ThemeHexAstra.V1',
          result: { publicSummary: 'Signature de naissance integree.' },
        },
      ],
      message: 'Voici ta lecture natale.',
    })

    expect(result).toContain('Repères clés')
    expect(result).toContain('Signal dominant : signature de naissance')
    expect(result).toContain('Axe principal : identity')
    expect(result).toContain('Mouvement du moment : Signature de naissance integree.')
    expect(result).toContain('Voici ta lecture natale.')
  })

  it('adds an action-oriented lead for NeuroKua state readings', () => {
    const result = buildKsLeadSummary({
      flowStep: 'analysis',
      selectedOutputStructure: 'Etat global -> desequilibre dominant -> levier immediat -> conseil pratique',
      fusedSignal: {
        dominantSignal: 'besoin_de_regulation',
        zone: 'security',
        risk_flag: true,
      },
      executedSubmodules: [
        {
          key: 'KS.ActionTranslator',
          result: { publicSummary: 'Action prioritaire: ralentir et recentrer.' },
        },
      ],
      message: 'Voici ton bilan du jour.',
    })

    expect(result).toContain('Repères clés')
    expect(result).toContain('Signal dominant : besoin de regulation')
    expect(result).toContain('Action utile : Action prioritaire: ralentir et recentrer.')
    expect(result).toContain('Voici ton bilan du jour.')
  })

  it('does not duplicate the lead block when already present', () => {
    const initial = 'Repères clés\n- Signal dominant : signature de naissance\n\nLecture déjà structurée.'
    const result = buildKsLeadSummary({
      flowStep: 'analysis',
      selectedOutputStructure: 'Signature de naissance -> axes dominants -> forces -> vigilances -> orientation actuelle',
      fusedSignal: {
        dominantSignal: 'signature_de_naissance',
      },
      message: initial,
    })

    expect(result).toBe(initial)
  })
})
