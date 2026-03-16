export function buildResponse(intent: string): string {
  switch (intent) {
    case 'greeting':
      return 'Salut.\nJe suis là.'
    case 'gratitude':
      return 'Avec plaisir.'
    case 'emotion':
      return "Je vois.\nQu'est-ce qui te pèse le plus ?"
    case 'analysis':
      return "Je prépare une lecture.\nDonne-moi ce qui est le plus important."
    default:
      return "Dis-moi ce qui t'amène."
  }
}
