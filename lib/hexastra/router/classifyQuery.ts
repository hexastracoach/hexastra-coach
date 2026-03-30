import type { DomainRoute } from '@/lib/hexastra/types'
import { isCareerGuidanceQuery } from '@/lib/hexastra/orchestration/careerGuidance'

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function classifyQuery(message: string): DomainRoute {
  const text = deaccent((message || '').toLowerCase())
  if (isCareerGuidanceQuery(text)) return 'career'

  const refersToHumanDesign =
    /(human design|design humain|bodygraph|porteum)/i.test(text) ||
    /\bmon hd\b/i.test(text) ||
    (/\bhd\b/i.test(text) && /(porte|portes|canal|canaux|centre|centres|profil|autorite|strategie|type|design)/i.test(text))

  if (/(\bkua\b|direction|orientation|boussole|feng|gps)/i.test(text)) return 'gps_kua'
  if (/(theme natal|theme astral|carte du ciel|hexastral)/i.test(text)) return 'fusion'
  if (/(neurokua|energie|equilibre|fatigue|stress|surcharge|recharge)/i.test(text)) return 'neurokua'
  if (/(lecture generale|hexastra complete|fusion|synthese)/i.test(text)) return 'fusion'
  if (/(relation|couple|amour|famille|proches)/i.test(text)) return 'relationship'
  if (/(travail|carriere|argent|professionnel|emploi|projet pro|metier|voie pro|voie professionnelle|orientation professionnelle)/i.test(text)) return 'career'
  if (/(decision|choix|trancher|attendre|agir)/i.test(text)) return 'decision'
  if (/(timing|cycle|phase|periode|mois a venir|prochains mois)/i.test(text)) return 'timing'
  if (/(bien-etre|recentrage|confiance|motivation interieure)/i.test(text)) return 'wellbeing'
  if (/(maslow|pyramide de maslow)/i.test(text)) return 'wellbeing'
  if (
    refersToHumanDesign ||
    /(science|astrologie|astrologique|astrolex|triangle|enneagram|numerologie|neurokua|kua|spiritlex|mutalex|totemlex)/i.test(
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

  // Personal/existential questions without explicit science → fusion (never leave as 'general')
  // RULE: pourquoi / comment / je ressens / je bloque / les gens / dois-je → fusion
  if (
    /(^pourquoi\b|^comment\b|\bpourquoi\b|\bcomment\b)/i.test(text) ||
    /\bje (ressens|sens|vis|traverse|n arrive pas|bloque|souffre|manque|cherche|ne comprends|ne sais|ne peux|ne vois)\b/i.test(text) ||
    /\bqu est.?ce qui (se passe|m empeche|bloque)\b/i.test(text) ||
    /\b(ma vie|ma situation|mon fonctionnement|mon comportement|mon rapport a|mon blocage)\b/i.test(text) ||
    /\b(les gens ne|les gens m|personne ne)\b/i.test(text) ||
    /\b(dois.?je|devrais.?je|faut.?il que)\b/i.test(text)
  ) {
    return 'fusion'
  }

  return 'general'
}
