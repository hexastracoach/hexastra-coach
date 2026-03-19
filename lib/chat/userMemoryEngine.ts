export type UserMemory = {
  themes_recurrents: string[]
  etats_dominants: string[]
  styles_utilisateur: string[]
  historique_situations: string[]
}

const THEME_PATTERNS: Record<string, RegExp[]> = {
  travail: [/\b(travail|boulot|job|manager|coll[èe]gue|entreprise)\b/i],
  relations: [/\b(couple|relation|famille|ami|amour|partner|relat)\b/i],
  fatigue: [/\b(fatigu[ée]|épuis[ée]|burn ?out|us[ée])\b/i],
  decisions: [/\b(d[ée]cision|choix|h[ée]sitation|que faire|direction)\b/i],
  équilibre: [/\b(équilibre|balance|pro[\\/-]perso|juste milieu)\b/i],
}

const EMOTION_PATTERNS: Record<string, RegExp[]> = {
  stress: [/\b(stress[ée]?|tendu|pression)\b/i],
  confusion: [/\b(perdu|confus|flou|ne sais pas)\b/i],
  doute: [/\b(doute|incertain|h[ée]sitant)\b/i],
  épuisement: [/\b(fatigu[ée]|vid[ée]|épuis[ée])\b/i],
  curiosité: [/\b(curieux|explorer|comprendre)\b/i],
}

const STYLE_PATTERNS: Record<string, RegExp[]> = {
  direct: [/\b(ok|fais|dis-moi|vite|direct)\b/i],
  réflexif: [/\b(pense|réfl[ée]chis|questionne|interpelle)\b/i],
  émotionnel: [/\b(je ressens|je sens|ça me touche|cœur|émotion)\b/i],
  analytique: [/\b(analyse|structure|hypothèse|angle|syst[ée]mique)\b/i],
}

type Signal = { themes: string[]; emotions: string[]; styles: string[]; situations: string[] }

export function detectMemorySignals(message: string): Signal {
  const themes: string[] = []
  const emotions: string[] = []
  const styles: string[] = []

  const addMatches = (bucket: string[], map: Record<string, RegExp[]>) => {
    for (const [key, patterns] of Object.entries(map)) {
      if (patterns.some((rx) => rx.test(message))) bucket.push(key)
    }
  }

  addMatches(themes, THEME_PATTERNS)
  addMatches(emotions, EMOTION_PATTERNS)
  addMatches(styles, STYLE_PATTERNS)

  const situations = themes.map((t) => `focus:${t}`)

  return { themes, emotions, styles, situations }
}

function dedupeLimit(list: string[], limit: number): string[] {
  return Array.from(new Set(list)).slice(0, limit)
}

export function updateUserMemory(prev: UserMemory, signal: Signal): UserMemory {
  const themes = dedupeLimit([...signal.themes, ...prev.themes_recurrents], 5)
  const emotions = dedupeLimit([...signal.emotions, ...prev.etats_dominants], 3)
  const styles = dedupeLimit([...signal.styles, ...prev.styles_utilisateur], 3)
  const situations = dedupeLimit([...signal.situations, ...prev.historique_situations], 8)

  return {
    themes_recurrents: themes,
    etats_dominants: emotions,
    styles_utilisateur: styles,
    historique_situations: situations,
  }
}

export function getUserMemoryContext(memory: UserMemory): string | null {
  if (!memory) return null
  const hints: string[] = []
  if (memory.themes_recurrents.length) {
    hints.push(`Sujet récurrent : ${memory.themes_recurrents[0]}`)
  }
  if (memory.etats_dominants.length) {
    hints.push(`État souvent présent : ${memory.etats_dominants[0]}`)
  }
  if (memory.styles_utilisateur.length) {
    hints.push(`Style : ${memory.styles_utilisateur[0]}`)
  }
  return hints.length ? hints.join(' · ') : null
}

export const EMPTY_USER_MEMORY: UserMemory = {
  themes_recurrents: [],
  etats_dominants: [],
  styles_utilisateur: [],
  historique_situations: [],
}
