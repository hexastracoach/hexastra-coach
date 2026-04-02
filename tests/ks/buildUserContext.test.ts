import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/hexastra/memory/userMemory', () => ({
  readUserMemory: vi.fn(async () => null),
}))

vi.mock('@/lib/hexastra/data/readingSubjectService', () => ({
  getDefaultSubject: vi.fn(async () => null),
}))

import { buildUserContext } from '@/lib/hexastra/context/buildUserContext'
import { getDefaultSubject } from '@/lib/hexastra/data/readingSubjectService'

const mockedGetDefaultSubject = vi.mocked(getDefaultSubject)

function makeSupabase(profileRow: Record<string, unknown> | null) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: profileRow })),
        })),
      })),
    })),
  } as any
}

describe('buildUserContext birth data source lock', () => {
  beforeEach(() => {
    mockedGetDefaultSubject.mockReset()
    mockedGetDefaultSubject.mockResolvedValue(null)
  })

  it('keeps explicit frontend birth data ahead of reading subject and profile', async () => {
    mockedGetDefaultSubject.mockResolvedValue({
      source: 'reading_subject',
      subjectId: 'subject_123',
      firstName: 'Lina',
      label: 'Lina',
      relationType: 'self',
      birthData: {
        birthDate: '1990-02-02',
        birthTime: '08:00',
        birthPlace: 'Lyon',
        birthLat: 45.75,
        birthLng: 4.85,
      },
      fusionParams: {
        firstName: 'Lina',
        birthDate: '1990-02-02',
        birthTime: '08:00',
        birthPlace: 'Lyon',
        birthLat: 45.75,
        birthLng: 4.85,
      },
    })

    const context = await buildUserContext({
      supabase: makeSupabase({
        first_name: 'Profile Lina',
        birth_date: '1988-01-01',
        birth_time: '07:00',
        birth_location: 'Paris',
        birth_country_code: 'FR',
      }),
      user: {
        id: 'user_1',
        user_metadata: {},
      } as any,
      fallbackPlan: 'premium',
      fallbackLanguage: 'fr',
      birthData: {
        firstName: 'Frontend Lina',
        date: '1993-03-03',
        time: '09:30',
        place: 'Marseille',
      },
      practitionerUsage: null,
    })

    expect(context.birthDataSource).toBe('frontend_payload')
    expect(context.birthData?.date).toBe('1993-03-03')
    expect(context.birthData?.place).toBe('Marseille')
    expect(context.readingSubjectId).toBe('subject_123')
  })

  it('uses reading subject before profile fallback when no explicit frontend payload exists', async () => {
    mockedGetDefaultSubject.mockResolvedValue({
      source: 'reading_subject',
      subjectId: 'subject_456',
      firstName: 'Mila',
      label: 'Mila',
      relationType: 'self',
      birthData: {
        birthDate: '1991-04-04',
        birthTime: '10:15',
        birthPlace: 'Bordeaux',
        birthLat: 44.84,
        birthLng: -0.58,
      },
      fusionParams: {
        firstName: 'Mila',
        birthDate: '1991-04-04',
        birthTime: '10:15',
        birthPlace: 'Bordeaux',
        birthLat: 44.84,
        birthLng: -0.58,
      },
    })

    const context = await buildUserContext({
      supabase: makeSupabase({
        first_name: 'Profile Mila',
        birth_date: '1987-07-07',
        birth_time: '06:45',
        birth_location: 'Nantes',
        birth_country_code: 'FR',
      }),
      user: {
        id: 'user_2',
        user_metadata: {},
      } as any,
      fallbackPlan: 'premium',
      fallbackLanguage: 'fr',
      birthData: null,
      practitionerUsage: null,
    })

    expect(context.birthDataSource).toBe('reading_subject')
    expect(context.birthData?.date).toBe('1991-04-04')
    expect(context.birthData?.place).toBe('Bordeaux')
    expect(context.readingSubjectId).toBe('subject_456')
  })

  it('falls back to supabase profile when no explicit or reading-subject birth data exists', async () => {
    const context = await buildUserContext({
      supabase: makeSupabase({
        first_name: 'Profile Nora',
        birth_date: '1985-05-05',
        birth_time: '05:45',
        birth_location: 'Lille',
        birth_country_code: 'FR',
        birth_lat: '50.63',
        birth_lng: '3.06',
      }),
      user: {
        id: 'user_3',
        user_metadata: {},
      } as any,
      fallbackPlan: 'premium',
      fallbackLanguage: 'fr',
      birthData: null,
      practitionerUsage: null,
    })

    expect(context.birthDataSource).toBe('supabase_profile')
    expect(context.birthData?.date).toBe('1985-05-05')
    expect(context.birthData?.place).toBe('Lille')
    expect(context.birthData?.lat).toBeCloseTo(50.63)
    expect(context.readingSubjectId).toBeNull()
  })
})
