import { describe, expect, it } from 'vitest'
import { LOADING_MESSAGE_ROTATION_MS, getLoadingMessages } from '@/lib/chat/loadingMessages'

describe('chat loading messages', () => {
  it('returns the new French micro-interactions in order', () => {
    expect(getLoadingMessages('fr')).toEqual([
      'Je regarde ce qui est en train de se jouer…',
      'Je clarifie les points importants…',
      'Je relie les éléments entre eux…',
    ])
  })

  it('falls back to French and keeps the English set available', () => {
    expect(getLoadingMessages(undefined)).toEqual(getLoadingMessages('fr'))
    expect(getLoadingMessages('en')).toEqual([
      'I am looking at what is really unfolding…',
      'I am clarifying the important points…',
      'I am connecting the pieces together…',
    ])
  })

  it('keeps a readable rotation cadence for the typing state', () => {
    expect(LOADING_MESSAGE_ROTATION_MS).toBe(1700)
  })
})
