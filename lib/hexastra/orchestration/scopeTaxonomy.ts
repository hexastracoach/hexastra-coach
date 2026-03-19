/**
 * Hexastra scope taxonomy — positive keyword domains and negative exclusion patterns.
 * Used by detectScope to determine if a user message falls within the Hexastra universe.
 */

export type ScopeDomain = {
  id: string
  keywords: RegExp[]
}

export const HEXASTRA_DOMAINS: ScopeDomain[] = [
  {
    id: 'astrology',
    keywords: [
      /\b(th[eè]me\s+(astral|natal)|maison\s+\d+|plan[eè]te|transit|ascendant|soleil|lune|v[eé]nus|mars|saturne|jupiter|mercure|uranus|neptune|pluton)\b/i,
      /\b(balance\b|verseau|b[eé]lier|taureau|g[eé]meaux|cancer\b|lion\b|vierge|scorpion|sagittaire|capricorne|poissons)\b/i,
      /\b(astroleg|astrolex|carte\s+du\s+ciel|synastrie|retour\s+solaire|th[eè]me\s+compar[eé])\b/i,
      /\b(conjonction|opposition\s+astrale|trigone|carr[eé]\s+astral|sextile)\b/i,
    ],
  },
  {
    id: 'numerology',
    keywords: [
      /\b(num[eé]rologie|chemin\s+de\s+vie|nombre\s+(de\s+)?(naissance|destin[eé]e?|expression|intime|actif)|trianglenumeris)\b/i,
      /\b(ann[eé]e\s+personnelle|mois\s+personnel|cycle\s+personnel|cycle\s+de\s+vie|vibration\s+num[eé]rique)\b/i,
      /\b(calcul\s+num[eé]rique|chemin\s+de\s+vie|numeris)\b/i,
    ],
  },
  {
    id: 'human_design',
    keywords: [
      /\b(human\s+design|centres?\s+(hd|d[eé]fini|ind[eé]fini)|canaux?\b|portes?\s+(hd|\d+)|type\s+hd|profil\s+hd)\b/i,
      /\b(g[eé]n[eé]rateur|projecteur|manifesteur|r[eé]flecteur|strat[eé]gie\s+hd|autorit[eé]\s+(hd|int[eé]rieure|sacrale))\b/i,
      /\b(porteum|neurokua|baseline|balance\s+(hd|kua)|overload|recalibration)\b/i,
    ],
  },
  {
    id: 'kua_fengshui',
    keywords: [
      /\b(kua\b|feng\s+shui|gps\s+kua|nombre\s+kua|direction\s+(favorable|kua)|[eé]nergie\s+kua)\b/i,
      /\b(kua\s+(nord|sud|est|ouest|favori|personnel)|trigram|bagua)\b/i,
    ],
  },
  {
    id: 'hexastra_sciences',
    keywords: [
      /\b(hexastra|astrolex|porteum|trianglenumeris|neurokua|fusion\s+ks|ks\s+fusion|sciences?\s+hexastra)\b/i,
      /\b(lecture\s+(ks|hexastra|astrale?|num[eé]rique|profil|ann[eé]e|mois))\b/i,
      /\b(profil\s+(hexastra|de\s+naissance|kua|hd)|analyse\s+(hexastra|de\s+profil))\b/i,
      /\b(shilo\b|coach\s+hexastra|mon\s+coach\s+hexastra)\b/i,
    ],
  },
  {
    id: 'life_guidance',
    keywords: [
      /\b(alignement|r[eé]alignment|orientation\s+(de\s+vie|personnelle)|levier\s+(prioritaire|de\s+vie))\b/i,
      /\b([eé]nergie\s+(du\s+moment|actuelle|personnelle)|dynamique\s+(de\s+vie|personnelle))\b/i,
      /\b(lire?\s+(ma|mon)\s+(profil|vie|ann[eé]e|situation)|analyse\s+(mon|ma)\s+(profil|vie|ann[eé]e))\b/i,
    ],
  },
]

/**
 * Patterns that strongly indicate the message is outside the Hexastra universe.
 * A match here overrides any positive signal.
 */
export const HEXASTRA_NEGATIVE_PATTERNS: RegExp[] = [
  /\b(m[eé]t[eé]o\b|pr[eé]vision\s+m[eé]t[eé]o|temp[eé]rature\s+de\s+demain)\b/i,
  /\b(recette\s+(de|du|pour)|cuisiner?|faire\s+cuire|ingr[eé]dients?\s+pour)\b/i,
  /\b(cod[eo]r?|programmer?|d[eé]bugger?|javascript|typescript|python|sql\b|react\b|docker|github\b|npm\b|backend|frontend)\b/i,
  /\b(impôts?\s+(sur|foncier)|d[eé]claration\s+fiscale|avocat|tribunal\b|jugement\s+juridique|prud.?hommes?)\b/i,
  /\b(diagnostic\s+m[eé]dical|m[eé]dicament|posologie|ordonnance|chirurgie|hospitalisation)\b/i,
  /\b(dissertation|devoir\s+scolaire|exercice\s+(de\s+maths?|de\s+physique)|bac\b|brevet|examen\s+(scolaire|universitaire))\b/i,
  /\b(r[eé]seau\s+wifi|firewall|vpn\b|serveur\s+web|base\s+de\s+donn[eé]es|algorithme\s+(de|du))\b/i,
  /\b(traduis?\s+en|traduction\s+de\s+(?!ma|mon)|wikipedia|wikip[eé]dia|cherche\s+sur\s+internet)\b/i,
  /\b(r[eé]parer?\s+(une?\s+)?(voiture|moteur|robinet|tuyau)|bricolage|plomberie)\b/i,
]
