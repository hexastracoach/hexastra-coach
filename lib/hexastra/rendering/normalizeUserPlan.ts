import type { UserPlan } from '@/lib/hexastra/rendering/selectRenderProfile'

function normalize(value: string): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function normalizeUserPlan(value: unknown): UserPlan {
  const normalized = normalize(typeof value === 'string' ? value : '')

  if (normalized === 'essential' || normalized === 'essentiel') {
    return 'essentiel'
  }

  if (normalized === 'premium') {
    return 'premium'
  }

  if (
    normalized === 'practitioner' ||
    normalized === 'praticien' ||
    normalized === 'practitioner mode'
  ) {
    return 'praticien'
  }

  if (
    normalized === 'free' ||
    normalized === 'gratuit' ||
    normalized === 'discovery' ||
    normalized === 'decouverte'
  ) {
    return 'free'
  }

  return 'free'
}
