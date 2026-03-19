import { describe, expect, it } from 'vitest'
import { EMPTY_BIRTH_DATA, type BirthData } from '@/app/chat/_lib/chat'
import { computeBootstrapStep } from '@/lib/chat/bootstrapMachine'
import { getBootstrapMicroRequestType, resolveBootstrapUiState } from '@/lib/chat/bootstrapPolicy'
import { buildChatPayload } from '@/lib/chat/chatPayloadBuilder'
import { normalizeNominatimResult } from '@/lib/location/normalizeNominatimResult'
import { normalizeOpenCageResult } from '@/lib/location/normalizeOpenCageResult'

const COMPLETE_BIRTH_DATA: BirthData = {
  ...EMPTY_BIRTH_DATA,
  firstName: 'Christopher',
  birthDate: '1990-01-24',
  birthTime: '13:10',
  birthCity: 'Sucy-en-Brie',
  birthCountryName: 'France',
}

describe('birth bootstrap and location normalization', () => {
  it('does not force automatic micro-readings after birth data is saved when auto bootstrap is disabled', () => {
    const step = computeBootstrapStep({
      planLoaded: true,
      plan: 'free',
      practitionerUsage: null,
      analysisMode: null,
      renderMode: null,
      birthData: COMPLETE_BIRTH_DATA,
      microReadings: {
        profileKey: null,
        yearKey: null,
        monthKey: null,
      },
      allowAutomaticMicroReadings: false,
    })

    expect(step).toBe('conversation_ready')
  })

  it('keeps the one-shot automatic bootstrap when explicitly enabled', () => {
    const step = computeBootstrapStep({
      planLoaded: true,
      plan: 'free',
      practitionerUsage: null,
      analysisMode: null,
      renderMode: null,
      birthData: COMPLETE_BIRTH_DATA,
      microReadings: {
        profileKey: null,
        yearKey: null,
        monthKey: null,
      },
      allowAutomaticMicroReadings: true,
    })

    expect(step).toBe('micro_profile_pending')
  })

  it('derives bootstrap UI state from a single resolver', () => {
    const practitionerState = resolveBootstrapUiState('practitioner_usage_needed')
    const microState = resolveBootstrapUiState('micro_year_pending')

    expect(practitionerState.overlayKind).toBe('practitioner_usage')
    expect(practitionerState.chatReady).toBe(true)
    expect(microState.isMicroPending).toBe(true)
    expect(getBootstrapMicroRequestType('micro_year_pending')).toBe('micro_year')
  })

  it('builds micro instructions with the exact welcome bootstrap endings', () => {
    const profilePayload = buildChatPayload({
      requestType: 'micro_profile',
      plan: 'free',
      birthData: COMPLETE_BIRTH_DATA,
      practitionerUsage: null,
      chatLanguage: 'fr',
      conversationId: null,
      messages: [],
    })

    const monthPayload = buildChatPayload({
      requestType: 'micro_month',
      plan: 'free',
      birthData: COMPLETE_BIRTH_DATA,
      practitionerUsage: null,
      chatLanguage: 'fr',
      conversationId: null,
      messages: [],
    })

    expect(profilePayload.messages[0]?.content).toContain('Cette lecture decrit ton fonctionnement de base.')
    expect(profilePayload.messages[0]?.content).toContain('Nous pouvons maintenant explorer ta situation actuelle.')
    expect(monthPayload.messages[0]?.content).toContain('Ton profil, ton annee et ton contexte actuel sont maintenant poses.')
    expect(monthPayload.messages[0]?.content).toContain('Que souhaites-tu explorer ?')
  })

  it('prefers a latin-friendly OpenCage city label when components are returned in another script', () => {
    const place = normalizeOpenCageResult({
      components: {
        city: '京都市',
        state: '京都府',
        country: '日本',
      },
      formatted: 'Kyoto, Kyoto, Japan',
      geometry: {
        lat: 35.0116,
        lng: 135.7681,
      },
    })

    expect(place.city).toBe('Kyoto')
    expect(place.country).toBe('Japan')
    expect(place.label).toContain('Kyoto')
  })

  it('normalizes Nominatim suggestions to a latin-friendly city and country when possible', () => {
    const place = normalizeNominatimResult({
      lat: '35.6764',
      lon: '139.65',
      display_name: 'Tokyo, Japan',
      name: '東京都',
      namedetails: {
        'name:en': 'Tokyo',
      },
      address: {
        state: '東京都',
        country: '日本',
      },
    })

    expect(place.city).toBe('Tokyo')
    expect(place.country).toBe('Japan')
    expect(place.label).toContain('Tokyo')
  })
})
