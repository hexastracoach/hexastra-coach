export type ResponseType = 'short' | 'light' | 'structured' | 'empathetic' | 'conversation'

export function chooseResponseType(intent: string): ResponseType {
  switch (intent) {
    case 'greeting':
      return 'short'
    case 'gratitude':
      return 'light'
    case 'analysis':
      return 'structured'
    case 'emotion':
      return 'empathetic'
    default:
      return 'conversation'
  }
}
