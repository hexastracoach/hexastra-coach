import { describe, expect, it } from 'vitest'
import { buildSignalEnvelope } from '@/lib/hexastra/fusion/signalEnvelope'
import { fusionEngine } from '@/lib/hexastra/fusion/fusionEngine'

describe('KS signal envelope and fusion', () => {
  it('builds a structured KS signal envelope for Astrolex signals', () => {
    const signal = buildSignalEnvelope({
      module: 'KS.Planetarium',
      domainRoute: 'fusion',
      result: {
        module_version: 'v1',
        phase_hint: 'transition',
        zone_hint: 'direction',
        dominantSignals: ['elan_jovien'],
        signals: [
          {
            tag: 'elan_jovien',
            description: 'Dominante planetaire du moment.',
            intensity: 0.8,
            confidence: 0.7,
          },
        ],
        publicSummary: 'Dominante astrale: elan jovien.',
      },
    })

    expect(signal.envelope.id).toBeTruthy()
    expect(signal.envelope.source_layer).toBe('cosmos')
    expect(signal.envelope.signals[0]?.tag).toBe('elan_jovien')
    expect(signal.dominantSignals).toContain('elan_jovien')
  })

  it('fuses multiple KS signals and exposes contract metadata', () => {
    const astro = buildSignalEnvelope({
      module: 'KS.Planetarium',
      domainRoute: 'fusion',
      result: {
        dominantSignals: ['dominante_astrale'],
        signals: [{ tag: 'dominante_astrale', description: 'Axe astral', intensity: 0.8, confidence: 0.72 }],
      },
    })
    const regulation = buildSignalEnvelope({
      module: 'KS.InnerStateReader',
      domainRoute: 'neurokua',
      result: {
        dominantSignals: ['besoin_de_regulation'],
        signals: [{ tag: 'besoin_de_regulation', description: 'Besoin d ajustement', intensity: 0.77, confidence: 0.74 }],
      },
    })

    const fused = fusionEngine([astro, regulation])

    expect(fused.contractVersion).toBe('ks_signal_envelope_v1')
    expect(fused.signalEnvelopeIds).toHaveLength(2)
    expect(fused.sourceLayers).toEqual(expect.arrayContaining(['cosmos', 'human']))
    expect(fused.topSignals).toEqual(expect.arrayContaining(['dominante_astrale', 'besoin_de_regulation']))
  })
})
