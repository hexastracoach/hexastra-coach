import type { DomainRoute } from '@/lib/hexastra/types'

export function classifyQuery(message: string): DomainRoute {
  const text = message.toLowerCase()

  if (/(\bkua\b|direction|orientation|boussole|feng|gps)/i.test(text)) return 'gps_kua'
  if (/(theme natal|theme astral|carte du ciel|hexastral)/i.test(text)) return 'fusion'
  if (/(neurokua|energie|equilibre|fatigue|stress|surcharge|recharge)/i.test(text)) return 'neurokua'
  if (/(lecture generale|hexastra complete|fusion|synthese)/i.test(text)) return 'fusion'
  if (/(relation|couple|amour|famille|proches)/i.test(text)) return 'relationship'
  if (/(travail|carriere|argent|professionnel|emploi|projet pro)/i.test(text)) return 'career'
  if (/(decision|choix|trancher|attendre|agir)/i.test(text)) return 'decision'
  if (/(timing|cycle|phase|periode|mois a venir|prochains mois)/i.test(text)) return 'timing'
  if (/(bien-etre|recentrage|confiance|motivation interieure)/i.test(text)) return 'wellbeing'
  if (/(maslow|pyramide de maslow)/i.test(text)) return 'wellbeing'
  if (
    /(science|astrologie|astrolex|human design|porteum|triangle|enneagram|numerologie|neurokua|kua|spiritlex|mutalex|totemlex)/i.test(
      text,
    )
  ) {
    return 'science'
  }

  return 'general'
}
