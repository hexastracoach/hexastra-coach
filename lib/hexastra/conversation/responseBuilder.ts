export type ResponseKind = 'short' | 'conversation' | 'analysis' | 'decision' | 'hexastra'

export function buildResponse(kind: ResponseKind, intent: string): string {
  switch (kind) {
    case 'short':
      return 'Salut.\nJe suis là.'
    case 'conversation':
      return "Je t'écoute.\nQu'est-ce qui t'amène ?"
    case 'analysis':
      return "Je prépare une lecture précise.\nDis-moi le point central à éclairer."
    case 'decision':
      return "On peut peser tes options.\nQu'est-ce qui compte le plus pour toi ?"
    case 'hexastra':
      return "Lecture HexAstra en cours.\nJ'ai besoin du point essentiel et des nuances."
    default:
      return "Je suis là.\nParle-moi de ce qui compte."
  }
}
