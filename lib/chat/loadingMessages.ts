export const LOADING_MESSAGE_ROTATION_MS = 1700

const LOADING_MESSAGES = {
  fr: [
    'Je regarde ce qui est en train de se jouer…',
    'Je clarifie les points importants…',
    'Je relie les éléments entre eux…',
  ],
  en: [
    'I am looking at what is really unfolding…',
    'I am clarifying the important points…',
    'I am connecting the pieces together…',
  ],
} as const

export function getLoadingMessages(language?: string | null): readonly string[] {
  const normalized = (language ?? 'fr').toLowerCase()

  if (normalized.startsWith('en')) {
    return LOADING_MESSAGES.en
  }

  return LOADING_MESSAGES.fr
}
