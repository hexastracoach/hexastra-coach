import type { DomainRoute } from '@/lib/hexastra/types'

export function classifyQuery(message: string): DomainRoute {
  const text = message.toLowerCase()

  if (/(\bkua\b|direction|orientation|boussole|feng|gps)/i.test(text)) return 'gps_kua'
  if (/(theme natal|thème natal|theme astral|thème astral|carte du ciel|hexastral)/i.test(text)) return 'fusion'
  if (/(neurokua|energie|énergie|equilibre|équilibre|fatigue|stress|surcharge|recharge)/i.test(text)) return 'neurokua'
  if (/(lecture generale|lecture générale|hexastra complete|hexastra complète|fusion|synthese|synthèse)/i.test(text)) return 'fusion'
  if (/(relation|couple|amour|famille|proches)/i.test(text)) return 'relationship'
  if (/(travail|carriere|carrière|argent|professionnel|emploi|projet pro)/i.test(text)) return 'career'
  if (/(decision|décision|choix|trancher|attendre|agir)/i.test(text)) return 'decision'
  if (/(timing|cycle|phase|periode|période|mois a venir|mois à venir|prochains mois)/i.test(text)) return 'timing'
  if (/(bien-etre|bien-être|recentrage|confiance|motivation interieure|motivation intérieure)/i.test(text)) return 'wellbeing'
  if (/(science|astrolex|porteum|triangle|enneagram|ennéagram|numerologie|numérologie|spiritlex|mutalex|totemlex)/i.test(text)) return 'science'

  return 'general'
}
