export type ResponseKind =
  | 'greeting'
  | 'small_talk'
  | 'gratitude'
  | 'navigation'
  | 'clarification'
  | 'conversation'
  | 'analysis'
  | 'decision'
  | 'hexastra'

export function buildResponse(kind: ResponseKind): string {
  switch (kind) {
    case 'greeting':
      return 'Salut.\nJe suis là.'
    case 'small_talk':
      return 'Je vais bien, merci.\nEt toi ?'
    case 'gratitude':
      return 'Avec plaisir.'
    case 'navigation':
      return "D'accord.\nVoici les angles que nous pouvons explorer."
    case 'clarification':
      return "Je veux être sûr de bien te suivre.\nTu veux ouvrir le menu ou approfondir un sujet précis ?"
    case 'analysis':
      return "Je prépare une lecture HexAstra.\nDonne-moi le point central et le contexte rapide."
    case 'decision':
      return "On peut peser tes options.\nQu'est-ce qui compte le plus pour toi ?"
    case 'hexastra':
      return "Lecture HexAstra en cours.\nJ'ai besoin du point essentiel et des nuances."
    case 'conversation':
    default:
      return "Je t'écoute.\nQu'est-ce qui t'amène ?"
  }
}
