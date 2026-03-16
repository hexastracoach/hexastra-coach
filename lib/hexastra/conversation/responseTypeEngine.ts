export type ResponseType = 'short' | 'light' | 'structured' | 'empathetic' | 'conversation'

export function chooseResponseType(intent: string): ResponseType {
  switch (intent) {
    case 'greeting':
    case 'small_talk':
    case 'gratitude':
      return 'short'
    case 'analysis':
    case 'hexastra_reading':
      return 'structured'
    case 'emotion':
    case 'decision':
      return 'empathetic'
    default:
      return 'conversation'
  }
}
