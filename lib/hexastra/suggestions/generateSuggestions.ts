export function generateSuggestions(analysisData: unknown): string[] {
  const base =
    typeof analysisData === 'string'
      ? analysisData.toLowerCase()
      : JSON.stringify(analysisData || '').toLowerCase()

  const suggestions: string[] = []

  if (/travail|job|carri|pro/.test(base)) {
    suggestions.push(
      'Regarder ce qui, dans ton travail, consomme le plus d’énergie en ce moment.',
      'Explorer la dynamique avec les personnes ou décisions qui pèsent le plus.',
      'Identifier un ajustement concret à tester cette semaine.'
    )
  } else if (/relation|couple|lien|famille/.test(base)) {
    suggestions.push(
      'Observer ce que tu cherches vraiment à préserver ou à changer dans cette relation.',
      'Clarifier ce que tu n’as plus envie de porter seul(e).',
      'Voir quel pas simple pourrait rétablir plus de clarté entre vous.'
    )
  } else if (/blocage|bloqu|peur|doute|stress/.test(base)) {
    suggestions.push(
      'Nommer ce qui te bloque le plus concrètement aujourd’hui.',
      'Distinguer ce qui est temporaire de ce qui est structurel dans ce blocage.',
      'Choisir un micro-pas pour remettre du mouvement sans te surcharger.'
    )
  } else {
    suggestions.push(
      'Regarder ce qui demande le plus de clarté pour toi maintenant.',
      'Explorer la dynamique centrale qui traverse ta situation actuelle.',
      'Identifier une action simple pour tester un nouvel angle.'
    )
  }

  return suggestions.slice(0, 3)
}
