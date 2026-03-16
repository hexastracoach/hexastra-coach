import { applyHumanTone as legacyHumanTone } from '@/lib/chat/humanToneEngine'

export function addHumanTone(text: string) {
  return legacyHumanTone(text)
}
