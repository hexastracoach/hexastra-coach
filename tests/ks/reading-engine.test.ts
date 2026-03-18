import { describe, expect, it } from 'vitest'
import { buildExecutiveSummary, generateHexastraReading } from '@/lib/hexastra/reading/hexastraReadingEngine'

describe('HexAstra reading engine', () => {
  it('builds a natal/fusion-oriented reading summary with theme and structure', () => {
    const reading = generateHexastraReading({
      latestUserMessage: 'Je veux mon theme natal',
      domainRoute: 'fusion',
      contextType: 'hexastraReading',
      practitionerUsage: 'self',
      fusedSignal: {
        dominantSignal: 'signature_de_naissance',
        zone: 'identity',
        phase: 'stabilisation',
      },
    })

    expect(reading.detectedTheme).toBe('lecture_generale')
    expect(reading.detectedScience).toBe('astrolex')
    expect(reading.structureTemplate).toEqual(
      expect.arrayContaining(['Reconnaissance', 'Energie actuelle', 'Domaine active', 'Timing'])
    )
    expect(reading.executiveSummary).toHaveLength(3)
  })

  it('builds a NeuroKua-oriented reading summary with regulation structure', () => {
    const reading = generateHexastraReading({
      latestUserMessage: 'Je veux mon bilan NeuroKua du jour, je suis fatigue',
      domainRoute: 'neurokua',
      contextType: 'energy',
      practitionerUsage: 'self',
      fusedSignal: {
        dominantSignal: 'besoin_de_regulation',
        zone: 'security',
        risk_flag: true,
      },
    })

    expect(reading.detectedTheme).toBe('neuro_equilibre')
    expect(reading.detectedSubtheme).toBe('fatigue_recharge')
    expect(reading.detectedScience).toBe('neurokua')
    expect(reading.structureTemplate).toEqual(
      expect.arrayContaining(['Reconnaissance', 'Equilibre des axes', 'Desequilibre principal', 'Cle d action'])
    )
    expect(reading.keyRisk).toContain('forcer')
  })

  it('uses practitioner structure when analysis is for a client', () => {
    const reading = generateHexastraReading({
      latestUserMessage: 'Analyse professionnelle pour un client sur une decision',
      domainRoute: 'decision',
      contextType: 'decision',
      practitionerUsage: 'client',
    })

    expect(reading.readingLevel).toBe('praticien')
    expect(reading.structureTemplate).toEqual([
      'Situation',
      'Phase',
      'Dynamique',
      'Risques',
      'Levier',
      'Recommandation',
    ])
  })

  it('does not expose Maslow as a standalone detected science in public reading output', () => {
    const reading = generateHexastraReading({
      latestUserMessage: 'Je veux comprendre mon besoin dominant avec Maslow',
      domainRoute: 'wellbeing',
      contextType: 'wellbeing',
      practitionerUsage: 'self',
      fusedSignal: {
        dominantSignal: 'besoin_de_securite',
        zone: 'security',
      },
    })

    expect(reading.detectedScience).not.toBe('maslow')
    expect(reading.structureTemplate).not.toEqual(
      expect.arrayContaining(['Besoin dominant', 'Prochain palier', 'Action de stabilisation'])
    )
  })

  it('builds the executive summary in the expected 3-line format', () => {
    const summary = buildExecutiveSummary({
      mainDynamic: 'phase de repositionnement et de clarification',
      keyRisk: 'reagir trop vite sous pression',
      mainLever: 'choisir un seul axe et avancer dessus clairement',
    })

    expect(summary).toEqual([
      'Situation actuelle : phase de repositionnement et de clarification',
      'Enjeu cle : reagir trop vite sous pression',
      'Orientation prioritaire : choisir un seul axe et avancer dessus clairement',
    ])
  })
})
