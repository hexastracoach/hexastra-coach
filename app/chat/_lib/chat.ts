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
  bg0: '#f7faf6',
  bg1: '#ffffff',
  bg2: '#f1f6f1',
  panel: 'rgba(255,255,255,0.82)',
  panelStrong: '#ffffff',
  glass: 'rgba(255,255,255,0.72)',
  line: 'rgba(20, 33, 26, 0.08)',
  lineStrong: 'rgba(20, 33, 26, 0.12)',
  text: '#14211A',
  textSoft: '#526157',
  textMuted: 'rgba(82, 97, 87, 0.82)',
  textFaint: 'rgba(20, 33, 26, 0.46)',
  textMute: 'rgba(20, 33, 26, 0.54)',
  emerald: '#19C37D',
  emeraldDeep: '#0E8F5B',
  emeraldSoft: 'rgba(25, 195, 125, 0.10)',
  emeraldGlow: 'rgba(25, 195, 125, 0.16)',
  gold: '#19C37D',
  amber: '#19C37D',
  gradient: 'linear-gradient(135deg, #19C37D 0%, #0E8F5B 100%)',
  surfaceGradient: 'linear-gradient(180deg, rgba(255,255,255,0.88), rgba(255,255,255,0.76))',
  bodyFont: "'Inter', system-ui, sans-serif",
  titleFont: "'Sora', system-ui, sans-serif",
  monoFont: "'SF Mono', 'Fira Code', ui-monospace, monospace",
  shadowSoft: '0 8px 24px rgba(16, 24, 20, 0.05)',
  shadowCard: '0 18px 48px rgba(16, 24, 20, 0.08)',
  shadowLarge: '0 24px 80px rgba(16, 24, 20, 0.10)',
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
