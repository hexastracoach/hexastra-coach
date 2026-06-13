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
  bg0: '#F8F6F1',
  bg1: '#EFE9DF',
  bg2: '#FFFFFF',
  panel: 'rgba(255, 255, 255, 0.72)',
  panelStrong: 'rgba(255, 255, 255, 0.88)',
  glass: 'rgba(255,255,255,0.62)',
  line: 'rgba(200,169,119,0.25)',
  lineStrong: 'rgba(200,169,119,0.42)',
  text: '#2E2A26',
  textSoft: 'rgba(46, 42, 38, 0.78)',
  textMuted: 'rgba(111, 103, 95, 0.74)',
  textFaint: 'rgba(111, 103, 95, 0.58)',
  textMute: 'rgba(111, 103, 95, 0.64)',
  emerald: '#B8C7B1',
  emeraldDeep: '#7E9874',
  emeraldSoft: 'rgba(184, 199, 177, 0.28)',
  emeraldGlow: 'rgba(184, 199, 177, 0.26)',
  gold: '#C8A977',
  amber: '#C8A977',
  gradient: 'linear-gradient(135deg, #C8A977 0%, #E9D7BE 100%)',
  surfaceGradient: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(239,233,223,0.68))',
  bodyFont: "'Inter', system-ui, sans-serif",
  titleFont: "'Sora', system-ui, sans-serif",
  monoFont: "'SF Mono', 'Fira Code', ui-monospace, monospace",
  shadowSoft: '0 18px 45px rgba(46, 42, 38, 0.08)',
  shadowCard: '0 24px 64px rgba(46, 42, 38, 0.11)',
  shadowLarge: '0 34px 95px rgba(46, 42, 38, 0.14)',
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
