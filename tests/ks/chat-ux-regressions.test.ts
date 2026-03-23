import { describe, expect, it } from 'vitest'
import { classifyUserIntent } from '@/lib/chat/intentClassifier'
import { buildSessionContext } from '@/lib/hexastra/context/buildSessionContext'

describe('chat UX regressions', () => {
  it('keeps NeuroKua fatigue phrasing on the neurokua route', async () => {
    const session = await buildSessionContext({
      supabase: null,
      conversationId: null,
      message: 'Je veux un scan NeuroKua de ma fatigue du moment',
      contextType: 'general',
      practitioner: false,
    })

    expect(session.domainRoute).toBe('neurokua')
    expect(session.activeModule).toBe('KS.NeuroKua.System.V1')
  })

  it('keeps orientation-focused Kua phrasing on the gps_kua route', async () => {
    const session = await buildSessionContext({
      supabase: null,
      conversationId: null,
      message: 'Je veux comprendre mon orientation Kua',
      contextType: 'general',
      practitioner: false,
    })

    expect(session.domainRoute).toBe('gps_kua')
    expect(session.activeModule).toBe('KS.HexAstra.GPS.V1')
  })

  it('classifies accented career phrasing correctly', () => {
    expect(classifyUserIntent('Je vis une évolution professionnelle difficile')).toBe('career')
  })

  it('classifies accented personal growth phrasing correctly', () => {
    expect(classifyUserIntent("J'ai une anxiété intérieure et je veux me réaligner")).toBe(
      'personal_growth'
    )
  })

  it('classifies accented life situation phrasing correctly', () => {
    expect(classifyUserIntent('Je traverse une période de transition')).toBe('life_situation')
  })
})
