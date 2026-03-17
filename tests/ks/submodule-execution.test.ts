import { describe, expect, it } from 'vitest'
import { executeKsSubmodules } from '@/lib/hexastra/ks/submoduleExecutor'
import type { BirthProfile } from '@/lib/hexastra/types'

const birthData: BirthProfile = {
  firstName: 'Christopher',
  date: '1990-01-24',
  time: '13:10',
  place: 'Sucy-en-Brie',
  country: 'France',
  birthDateISO: '1990-01-24T13:10:00Z',
}

describe('KS deterministic submodule execution', () => {
  it('executes a natal reading stack including the final theme bridge', () => {
    const results = executeKsSubmodules({
      submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.AethericMap', 'KS.ThemeHexAstra.V1'],
      birthData,
      latestUserMessage: 'Je veux mon theme natal',
      domainRoute: 'fusion',
      practitionerUsage: 'self',
    })

    expect(results.map((entry) => entry.key)).toEqual([
      'KS.Planetarium',
      'KS.Domus',
      'KS.Aspectum',
      'KS.AethericMap',
      'KS.ThemeHexAstra.V1',
    ])
    expect(results.at(-1)?.result.publicSummary).toContain('Signature de naissance')
  })

  it('executes a Triangle stack including the numeric bridge', () => {
    const results = executeKsSubmodules({
      submodules: ['KS.NumCore', 'KS.NumCycle', 'KS.HexaNum.LinkBridge'],
      birthData,
      latestUserMessage: 'Je veux une lecture Triangle',
      domainRoute: 'timing',
      practitionerUsage: 'self',
    })

    expect(results.map((entry) => entry.key)).toEqual([
      'KS.NumCore',
      'KS.NumCycle',
      'KS.HexaNum.LinkBridge',
    ])
    expect(results.at(-1)?.result.publicSummary).toContain('Cycle numerique')
  })

  it('executes a Kua stack including the environment bridge', () => {
    const results = executeKsSubmodules({
      submodules: ['KS.SignalReader', 'KS.PlantInterface'],
      birthData,
      latestUserMessage: 'Je veux une lecture Kua',
      domainRoute: 'gps_kua',
      practitionerUsage: 'self',
    })

    expect(results.map((entry) => entry.key)).toEqual(['KS.SignalReader', 'KS.PlantInterface'])
    expect(results.at(-1)?.result.publicSummary).toContain('Ajustement environnemental')
  })
})
