import { describe, expect, it } from 'vitest'
import { buildKsLeadSummary } from '@/lib/hexastra/orchestrator/ksOutputComposer'

describe('KS output composer', () => {
  it('adds an invisible lead for a natal reading', () => {
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

    expect(result).toContain('En ce moment')
    expect(result).toContain("L'axe a renforcer tourne autour de identity.")
    expect(result).toContain('Voici ta lecture natale.')
  })

  it('adds an action-oriented invisible lead for NeuroKua state readings', () => {
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

    expect(result).toContain('besoin de regulation')
    expect(result).toContain('Action prioritaire: ralentir et recentrer.')
    expect(result).toContain('Voici ton bilan du jour.')
  })

  it('does not overwrite an already structured reading', () => {
    const initial =
      "Tu es dans une phase de recentrage.\n\nCe qui compte maintenant, c est de ralentir.\n\nLecture deja structuree."
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
