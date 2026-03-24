export const LOADING_MESSAGE_ROTATION_MS = 1700

const LOADING_MESSAGES = {
  fr: [
    'Je regarde ce qui se joue…',
    'Je clarifie les points importants…',
    'Je relie les éléments…',
  ],
  en: [
    'I am looking at what is unfolding…',
    'I am clarifying the important points…',
    'I am connecting the elements…',
  ],
} as const

export function getLoadingMessages(language?: string | null): readonly string[] {
  const normalized = (language ?? 'fr').toLowerCase()

  if (normalized.startsWith('en')) {
    return LOADING_MESSAGES.en
  }

  return LOADING_MESSAGES.fr
}
