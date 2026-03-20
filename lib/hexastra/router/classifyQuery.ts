import type { DomainRoute } from '@/lib/hexastra/types'

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function classifyQuery(message: string): DomainRoute {
  const text = deaccent((message || '').toLowerCase())
  const refersToHumanDesign =
    /(human design|design humain|bodygraph|porteum)/i.test(text) ||
    /\bmon hd\b/i.test(text) ||
    (/\bhd\b/i.test(text) && /(porte|portes|canal|canaux|centre|centres|profil|autorite|strategie|type|design)/i.test(text))

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
    refersToHumanDesign ||
    /(science|astrologie|astrolex|triangle|enneagram|numerologie|neurokua|kua|spiritlex|mutalex|totemlex)/i.test(
      text,
    )
  ) {
    return 'science'
  }

  // Situational / current moment — avoid falling to 'general' for these
  if (
    /(situation actuelle|analyser? ma situation|analyser? la situation|bilan (actuel|du moment)|comment [çc]a se passe|comment je me sens|je me sens|ce qui se passe|ma vie en ce moment|[eé]tat actuel|[eé]tat du moment)/i.test(
      text,
    )
  ) {
    return 'wellbeing'
  }

  return 'general'
}
