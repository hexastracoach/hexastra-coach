import type { CSSProperties } from 'react'

export type Msg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  cached?: boolean
  isReading?: boolean
}

export type Mode = 'essentiel' | 'premium' | 'praticien'

export type Project = {
  id: string
  name: string
  collapsed: boolean
}

export type Reading = {
  id: string
  title: string
  science: string
  date: string
  preview: string
  fullContent?: string
  projectId?: string
}

export type BirthData = {
  firstName: string
  lastName: string
  birthDate: string
  birthTime: string
  birthTimeKnown?: boolean
  birthCity: string
  birthLat: string
  birthLng: string
  birthCountryCode: string
  birthCountryName: string
  gender?: string
}

export const EMPTY_BIRTH_DATA: BirthData = {
  firstName: '',
  lastName: '',
  birthDate: '',
  birthTime: '',
  birthTimeKnown: true,
  birthCity: '',
  birthLat: '',
  birthLng: '',
  birthCountryCode: '',
  birthCountryName: '',
  gender: '',
}

export const STORAGE_KEYS = {
  readings: 'hexastra.readings.v2',
  projects: 'hexastra.projects.v2',
  birthData: 'hexastra.birthData.v1',
  partnerBirthData: 'hexastra.birthData.partner.v1',
} as const

export const QUICK_PROMPTS = [
  'Je veux une lecture claire de ma situation actuelle.',
  'Quel est le bon timing pour agir maintenant ?',
  'Aide-moi à comprendre ce qui se rejoue dans cette relation.',
  'Quelle direction devient plus naturelle pour moi ?',
]

export const DS = {
  bg0: '#1E0F1C',
  bg1: '#271323',
  bg2: '#120911',
  panel: 'rgba(30, 15, 28, 0.76)',
  panelStrong: 'rgba(18, 9, 17, 0.88)',
  glass: 'rgba(226,233,192,0.06)',
  line: 'rgba(226,233,192,0.13)',
  lineStrong: 'rgba(167,0,30,0.34)',
  text: '#E2E9C0',
  textSoft: 'rgba(226, 233, 192, 0.80)',
  textMuted: 'rgba(226, 233, 192, 0.58)',
  textFaint: 'rgba(226, 233, 192, 0.42)',
  textMute: 'rgba(226, 233, 192, 0.48)',
  emerald: '#7AA95C',
  emeraldDeep: '#5F8847',
  emeraldSoft: 'rgba(122, 169, 92, 0.13)',
  emeraldGlow: 'rgba(122, 169, 92, 0.20)',
  gold: '#E2E9C0',
  amber: '#955149',
  gradient: 'linear-gradient(135deg, #A7001E 0%, #955149 52%, #7AA95C 100%)',
  surfaceGradient: 'linear-gradient(180deg, rgba(39,19,35,0.86), rgba(18,9,17,0.78))',
  bodyFont: "'Inter', system-ui, sans-serif",
  titleFont: "'Sora', system-ui, sans-serif",
  monoFont: "'SF Mono', 'Fira Code', ui-monospace, monospace",
  shadowSoft: '0 12px 30px rgba(0, 0, 0, 0.30)',
  shadowCard: '0 22px 56px rgba(0, 0, 0, 0.38)',
  shadowLarge: '0 32px 90px rgba(0, 0, 0, 0.46)',
} as const

export function cardStyle(overrides?: CSSProperties): CSSProperties {
  return {
    background: DS.surfaceGradient,
    border: `1px solid ${DS.line}`,
    borderRadius: 28,
    boxShadow: DS.shadowCard,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    ...overrides,
  }
}

export function makeReadingTitle(input: string): string {
  const clean = input.replace(/\s+/g, ' ').trim()
  if (!clean) return 'Lecture HexAstra'
  return clean.length > 48 ? `${clean.slice(0, 48).trim()}…` : clean
}
