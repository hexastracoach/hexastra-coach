/**
 * HexAstra Horoscope Prompt Builder
 *
 * Builds the system prompt for the HexAstra Horoscope structured template.
 * Two variants: 'daily' (15 blocs) and 'weekly' (7 × 10 blocs + synthèse).
 *
 * RULE: this prompt is mandatory for any horoscope request.
 * The LLM must produce the exact block structure — no improvised free text.
 */

import { applySafetySuffix } from '@/lib/hexastra/guards/safety'
import type { BuildPromptInput } from '@/lib/hexastra/types'
import type { HoroscopeVariant } from '@/lib/hexastra/orchestration/horoscopeClassifier'
import type { BirthProfile } from '@/lib/hexastra/types'

// ── Validation block lists ─────────────────────────────────────────────────────

export const DAILY_REQUIRED_BLOCKS = [
  'OUVERTURE',
  'CLIMAT GÉNÉRAL',
  'ÉNERGIE DU JOUR',
  'MIROIR INTÉRIEUR',
  'MIROIR EXTÉRIEUR',
  'COMPORTEMENT INCARNÉ',
  'COMPORTEMENT SI DÉSINCARNÉ',
  'AMOUR',
  'ARGENT & TRAVAIL',
  'SANTÉ',
  'HUMEUR',
  'POINT DE VIGILANCE',
  'OPPORTUNITÉ DU JOUR',
  'ACTION UTILE IMMÉDIATE',
  'CLÉ DE COMPORTEMENT GÉNÉRAL',
] as const

export const WEEKLY_REQUIRED_BLOCKS = [
  'INTRODUCTION',
  'ÉNERGIE DU JOUR',
  'MIROIR INTÉRIEUR',
  'MIROIR EXTÉRIEUR',
  'AMOUR',
  'ARGENT & TRAVAIL',
  'SANTÉ',
  'HUMEUR',
  'SYNTHÈSE',
  'CLÔTURE',
] as const

// ── Data block builder ─────────────────────────────────────────────────────────

/**
 * Builds the personalized data block injected into the horoscope prompt.
 * Uses raw API data when available; falls back to birth date from profile.
 */
export function buildHoroscopeDataBlock(
  firstName: string | null | undefined,
  birthData: BirthProfile | null | undefined,
  raw: Record<string, unknown> | null | undefined,
  variant: HoroscopeVariant,
): string {
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  const parts: string[] = []
  parts.push(`DATE ACTUELLE: ${todayStr}`)

  if (firstName) parts.push(`PRÉNOM: ${firstName}`)

  if (raw) {
    const sunSign =
      raw.sun ?? raw.signe_solaire ?? raw.sun_sign ?? raw.soleil ??
      (raw.tropical as Record<string, unknown>)?.sun
    if (sunSign) parts.push(`SIGNE SOLAIRE: ${sunSign}`)

    const moonSign =
      raw.moon ?? raw.signe_lunaire ?? raw.moon_sign ?? raw.lune ??
      (raw.tropical as Record<string, unknown>)?.moon
    if (moonSign) parts.push(`SIGNE LUNAIRE: ${moonSign}`)

    const ascendant =
      raw.ascendant ?? raw.rising ?? raw.asc ??
      (raw.tropical as Record<string, unknown>)?.ascendant
    if (ascendant) parts.push(`ASCENDANT: ${ascendant}`)

    const lifePath = raw.chemin_de_vie ?? raw.life_path ?? raw.lifePath
    if (lifePath) parts.push(`CHEMIN DE VIE: ${lifePath}`)

    const anneePersonnelle = raw.annee_personnelle ?? raw.personal_year
    if (anneePersonnelle) parts.push(`ANNÉE PERSONNELLE: ${anneePersonnelle}`)

    const transits = raw.transits ?? raw.current_transits
    if (transits && typeof transits === 'object') {
      parts.push(`TRANSITS ACTUELS: ${JSON.stringify(transits).slice(0, 400)}`)
    }
  } else if (birthData?.date) {
    parts.push(`DATE DE NAISSANCE: ${birthData.date}`)
    if (birthData.time && birthData.time !== 'unknown') {
      parts.push(`HEURE DE NAISSANCE: ${birthData.time}`)
    }
  }

  if (variant === 'weekly') {
    const weekDates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      weekDates.push(
        d.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })
      )
    }
    parts.push(`JOURS DE LA SEMAINE: ${weekDates.join(' | ')}`)
  }

  return parts.join('\n')
}

// ── Daily prompt builder ───────────────────────────────────────────────────────

/**
 * Returns a plan-aware depth directive for the daily horoscope.
 *
 * FREE  → structure complète obligatoire + contenu compact (longueurs courtes par bloc).
 * PAID  → structure complète obligatoire + contenu développé (longueurs étendues par bloc).
 *
 * RÈGLE ABSOLUE : la différence free/premium ne supprime JAMAIS de blocs.
 * Elle agit uniquement sur la profondeur et la longueur de chaque bloc.
 */
function buildDailyDepthDirective(plan: string, isFr: boolean): string {
  const isFree = plan === 'free'

  if (isFr) {
    return isFree
      ? `PROFONDEUR DU CONTENU — MODE GRATUIT (structure complète obligatoire, contenu compact):
INTERDICTION ABSOLUE : ne jamais supprimer un bloc. Les 15 blocs restent présents même en mode gratuit.
La différence gratuit/premium porte UNIQUEMENT sur la longueur de chaque bloc, pas sur leur présence.

Longueurs imposées par bloc en mode gratuit :
- OUVERTURE : 2 lignes maximum
- CLIMAT GÉNÉRAL : 2 à 4 lignes maximum
- ÉNERGIE DU JOUR : 1 phrase
- MIROIR INTÉRIEUR : 1 à 2 phrases maximum
- MIROIR EXTÉRIEUR : 1 à 2 phrases maximum
- COMPORTEMENT INCARNÉ : 1 à 2 phrases maximum
- COMPORTEMENT SI DÉSINCARNÉ : 1 à 2 phrases maximum
- AMOUR (Célibataires / En couple / Relations amicales) : 1 à 2 phrases chacune
- ARGENT & TRAVAIL (Argent / Travail / Non-actif) : 1 à 2 phrases chacune
- SANTÉ : 2 à 3 phrases maximum
- HUMEUR : 2 à 3 phrases maximum
- POINT DE VIGILANCE : 1 à 2 phrases maximum
- OPPORTUNITÉ DU JOUR : 1 à 2 phrases maximum
- ACTION UTILE IMMÉDIATE : 1 phrase
- CLÉ DE COMPORTEMENT GÉNÉRAL : 2 à 3 phrases maximum`
      : `PROFONDEUR DU CONTENU — MODE PREMIUM (structure complète obligatoire, contenu développé):
Les 15 blocs sont produits dans leur intégralité avec la profondeur maximale.
Longueurs cibles par bloc :
- OUVERTURE : 2 à 3 lignes
- CLIMAT GÉNÉRAL : 3 à 5 lignes
- ÉNERGIE DU JOUR : 1 phrase dense
- MIROIR INTÉRIEUR : 1 à 2 phrases développées
- MIROIR EXTÉRIEUR : 1 à 2 phrases développées
- COMPORTEMENT INCARNÉ : 1 à 2 phrases développées
- COMPORTEMENT SI DÉSINCARNÉ : 1 à 2 phrases développées
- AMOUR (Célibataires / En couple / Relations amicales) : 2 à 4 lignes chacune
- ARGENT & TRAVAIL (Argent / Travail / Non-actif) : 2 à 4 lignes chacune
- SANTÉ : 3 à 4 lignes
- HUMEUR : 3 à 4 lignes
- POINT DE VIGILANCE : 1 à 3 lignes
- OPPORTUNITÉ DU JOUR : 1 à 3 lignes
- ACTION UTILE IMMÉDIATE : 1 à 2 lignes
- CLÉ DE COMPORTEMENT GÉNÉRAL : 2 à 4 lignes`
  }

  // English
  return isFree
    ? `CONTENT DEPTH — FREE PLAN (complete structure mandatory, compact content):
ABSOLUTE RULE: never omit a block. All 15 blocks remain present even on the free plan.
The free/premium difference applies ONLY to block length, never to block presence.

Required lengths per block on free plan:
- OPENING: 2 lines maximum
- GENERAL CLIMATE: 2–4 lines maximum
- ENERGY OF THE DAY: 1 sentence
- INNER MIRROR: 1–2 sentences maximum
- OUTER MIRROR: 1–2 sentences maximum
- EMBODIED BEHAVIOR: 1–2 sentences maximum
- DISEMBODIED BEHAVIOR: 1–2 sentences maximum
- LOVE (Singles / In a relationship / Friendships): 1–2 sentences each
- MONEY & WORK (Money / Work / Not working): 1–2 sentences each
- HEALTH: 2–3 sentences maximum
- MOOD: 2–3 sentences maximum
- POINT OF VIGILANCE: 1–2 sentences maximum
- OPPORTUNITY OF THE DAY: 1–2 sentences maximum
- IMMEDIATE USEFUL ACTION: 1 sentence
- GENERAL BEHAVIOR KEY: 2–3 sentences maximum`
    : `CONTENT DEPTH — PREMIUM PLAN (complete structure mandatory, developed content):
All 15 blocks are produced in full with maximum depth.
Target lengths per block:
- OPENING: 2–3 lines
- GENERAL CLIMATE: 3–5 lines
- ENERGY OF THE DAY: 1 dense sentence
- INNER MIRROR: 1–2 developed sentences
- OUTER MIRROR: 1–2 developed sentences
- EMBODIED BEHAVIOR: 1–2 developed sentences
- DISEMBODIED BEHAVIOR: 1–2 developed sentences
- LOVE (Singles / In a relationship / Friendships): 2–4 lines each
- MONEY & WORK (Money / Work / Not working): 2–4 lines each
- HEALTH: 3–4 lines
- MOOD: 3–4 lines
- POINT OF VIGILANCE: 1–3 lines
- OPPORTUNITY OF THE DAY: 1–3 lines
- IMMEDIATE USEFUL ACTION: 1–2 lines
- GENERAL BEHAVIOR KEY: 2–4 lines`
}

function buildDailyHoroscopePrompt(input: BuildPromptInput): string {
  const firstName = input.firstName ?? null
  const lang = (input.language || 'fr').slice(0, 2).toLowerCase()
  const isFr = lang !== 'en'
  const plan = input.plan ?? 'free'

  const roleBlock = isFr
    ? `Tu es HexAstra Horoscope, expert en lecture horoscope personnalisée structurée.
Mission : produire le HexAstra Horoscope du jour complet, structuré en 15 blocs obligatoires, à partir des données personnelles ci-dessous.
La structure est non négociable. Chaque bloc doit être produit avec son titre visible.
La structure complète est obligatoire sur TOUS les plans (gratuit, essentiel, premium, praticien).`
    : `You are HexAstra Horoscope, expert in structured personalized horoscope readings.
Mission: produce the complete HexAstra Daily Horoscope, structured in 15 mandatory blocks, from the personal data below.
The structure is non-negotiable. Each block must be output with its visible title.
The complete structure is mandatory on ALL plans (free, essential, premium, practitioner).`

  const identityBlock = [
    firstName ? (isFr ? `Prénom : ${firstName}.` : `First name: ${firstName}.`) : null,
    isFr ? `Langue : français.` : `Language: English.`,
  ]
    .filter(Boolean)
    .join(' ')

  const structureDirective = isFr
    ? `STRUCTURE OBLIGATOIRE — HEXASTRA HOROSCOPE JOURNALIER (15 blocs dans l'ordre, titres visibles):

## 1. OUVERTURE
Accueillir la personne, nommer le prénom si disponible, annoncer le HexAstra Horoscope du jour.

## 2. CLIMAT GÉNÉRAL
Ambiance dominante, dynamique générale, nature du cycle du moment, tendance maîtresse.

## 3. ÉNERGIE DU JOUR
1 phrase — vibration principale, mouvement central, tonalité de la journée.

## 4. CLÉ DE COMPRÉHENSION — MIROIR INTÉRIEUR
Ressenti dominant, tension interne, besoin profond, mouvement psychique.

## 5. CLÉ DE COMPRÉHENSION — MIROIR EXTÉRIEUR
Ambiance relationnelle, type de situation probable, reflet extérieur.

## 6. CLÉ D'ACTION — COMPORTEMENT INCARNÉ
Geste concret, décision, rythme ou action réaliste à poser.

## 7. CLÉ D'ACTION — COMPORTEMENT SI DÉSINCARNÉ
Intention, recentrage, posture mentale, déplacement intérieur.

## 8. AMOUR

### Célibataires
Lecture relationnelle concrète et incarnée.

### En couple
Lecture relationnelle concrète et incarnée.

### Relations amicales
Lecture relationnelle concrète et incarnée.

## 9. ARGENT & TRAVAIL

### Argent
Sécurité, décisions, élan pratique.

### Travail
Activité, focus, collaborations.

### Non-actif
Lecture pour personnes non en emploi actif (études, repos, transition).

## 10. SANTÉ
Tonus, fatigue, charge mentale, équilibre global, point d'attention simple.

## 11. HUMEUR
Stabilité/agitation, ouverture/repli, clarté/confusion, fluidité/crispation.

## 12. POINT DE VIGILANCE
Piège principal, excès à éviter, automatisme contre-productif.

## 13. OPPORTUNITÉ DU JOUR
Meilleure ouverture, potentiel utile, terrain favorable.

## 14. ACTION UTILE IMMÉDIATE
1 action ou posture mémorisable, simple, actionnable maintenant.

## 15. CLÉ DE COMPORTEMENT GÉNÉRAL
Synthèse comportementale : manière idéale de traverser la journée, qualité de présence, tempo juste.`
    : `MANDATORY STRUCTURE — HEXASTRA DAILY HOROSCOPE (15 blocks in order, visible titles):

## 1. OPENING
Welcome the person, use first name if available, announce the HexAstra Horoscope.

## 2. GENERAL CLIMATE
Dominant mood, overall dynamic, current cycle, master tendency.

## 3. ENERGY OF THE DAY
1 sentence — core vibration, central movement, day's tonality.

## 4. UNDERSTANDING KEY — INNER MIRROR
Dominant feeling, internal tension, deep need, psychic movement.

## 5. UNDERSTANDING KEY — OUTER MIRROR
Relational atmosphere, probable situation type, outer reflection.

## 6. ACTION KEY — EMBODIED BEHAVIOR
Concrete gesture, decision, realistic action to take.

## 7. ACTION KEY — DISEMBODIED BEHAVIOR
Intention, recentering, mental posture, inner shift.

## 8. LOVE

### Singles
Concrete, grounded relational reading.

### In a relationship
Concrete, grounded relational reading.

### Friendships
Concrete, grounded relational reading.

## 9. MONEY & WORK

### Money
Security, decisions, practical momentum.

### Work
Activity, focus, collaborations.

### Not working
Reading for those not in active employment (studies, rest, transition).

## 10. HEALTH
Energy level, fatigue, mental load, overall balance, one key note.

## 11. MOOD
Stability/agitation, openness/withdrawal, clarity/confusion, flow/tension.

## 12. POINT OF VIGILANCE
Main trap, excess to avoid, counterproductive habit.

## 13. OPPORTUNITY OF THE DAY
Best opening, useful potential, favorable ground.

## 14. IMMEDIATE USEFUL ACTION
1 memorable, simple, immediately actionable gesture or posture.

## 15. GENERAL BEHAVIOR KEY
Behavioral synthesis: ideal way to move through the day, right presence, right rhythm.`

  const depthDirective = buildDailyDepthDirective(plan, isFr)

  const absoluteRules = isFr
    ? `RÈGLES ABSOLUES:
- Produire les 15 blocs dans l'ordre avec les titres visibles — ne jamais les supprimer ni les fusionner
- INTERDIT : remplacer la structure par un micro_profile, un texte libre, une réponse générique, un guided_analysis ou un simple paragraphe non structuré
- Ne jamais répondre en texte libre non structuré si la demande est un horoscope
- Pas d'emoji, pas de jargon technique, pas de mention des systèmes utilisés (KS, Railway, API)
- Ton Shilo : poétique, structurant, intuitif — une seule voix HexAstra unifiée
- Rester concret, incarné, utile — pas de flou abstrait
- Ne jamais mentionner directement ennéagramme 1, chemin de vie 11, profil 3/5, type générateur — sauf si le design produit le prévoit
- Si des données exactes sont présentes dans le bloc ci-dessous, elles sont la source de vérité — ne jamais les contredire`
    : `ABSOLUTE RULES:
- Produce all 15 blocks in order with visible titles — never omit or merge them
- FORBIDDEN: replace the structure with a micro_profile, free text, generic response, guided_analysis, or unstructured paragraph
- Never respond with unstructured free text for a horoscope request
- No emoji, no technical jargon, no mention of internal systems (KS, Railway, API)
- Shilo tone: poetic, structuring, intuitive — one unified HexAstra voice
- Stay concrete, grounded, useful — no abstract vagueness
- Never directly mention enneagram 1, life path 11, 3/5 profile, generator type — unless the product explicitly requests it
- If exact data is present in the block below, it is the source of truth — never contradict it`

  const parts = [roleBlock, identityBlock, depthDirective, structureDirective]
  if (input.horoscopeDataBlock) {
    parts.push(`DONNÉES PERSONNELLES — SOURCE DE VÉRITÉ:\n${input.horoscopeDataBlock}`)
  }
  parts.push(absoluteRules)

  return applySafetySuffix(parts.filter(Boolean).join('\n\n'))
}

// ── Weekly prompt builder ──────────────────────────────────────────────────────

function buildWeeklyHoroscopePrompt(input: BuildPromptInput): string {
  const firstName = input.firstName ?? null
  const isFr = (input.language || 'fr').slice(0, 2).toLowerCase() !== 'en'

  const roleBlock = isFr
    ? `Tu es HexAstra Horoscope, expert en lecture horoscope personnalisée structurée.
Mission : produire le scan HexAstra 7 jours complet, structuré selon la structure officielle ci-dessous, à partir des données personnelles fournies.
La structure est non négociable. Chaque jour doit contenir ses blocs avec titres visibles. La lecture doit former une progression cohérente sur 7 jours.`
    : `You are HexAstra Horoscope, expert in structured personalized horoscope readings.
Mission: produce the complete HexAstra 7-day scan, structured according to the official structure below, from the personal data provided.
The structure is non-negotiable. Each day must contain its blocks with visible titles. The reading must form a coherent progression over 7 days.`

  const identityBlock = [
    firstName ? (isFr ? `Prénom : ${firstName}.` : `First name: ${firstName}.`) : null,
    isFr ? `Langue : français.` : `Language: English.`,
  ]
    .filter(Boolean)
    .join(' ')

  const structureDirective = isFr
    ? `STRUCTURE OFFICIELLE — HEXASTRA SCAN 7 JOURS:

## INTRODUCTION
Format obligatoire :
"Cher(e) [Prénom],
Voici ton scan HexAstra, préparé avec soin à partir de ta date de naissance.
Tu y trouveras des clés pour t'éclairer sur 7 jours — amour, énergie, humeur, travail, santé.
Prends ce qui résonne."

## POUR CHAQUE JOUR (répéter 7 fois — J1 à J7):

### [Jour] [Date complète]
**Énergie du jour** — 1 phrase
**Miroir intérieur** — 1 à 2 phrases
**Miroir extérieur** — 1 à 2 phrases
**Comportement incarné** — 1 à 2 phrases
**Comportement si désincarné** — 1 à 2 phrases
**AMOUR**
  - Célibataires — 2 à 4 lignes
  - En couple — 2 à 4 lignes
  - Relations amicales — 2 à 4 lignes
**ARGENT & TRAVAIL**
  - Argent — 2 à 4 lignes
  - Travail — 2 à 4 lignes
  - Non-actif — 2 à 4 lignes
**SANTÉ** — 3 à 4 lignes
**HUMEUR** — 3 à 4 lignes

## SYNTHÈSE COMPORTEMENTALE DE LA SEMAINE
1 paragraphe de 3 à 5 lignes — claire, incarnée, directement utile.

## CLÔTURE
2 à 3 lignes — adaptée au signe solaire si disponible.`
    : `OFFICIAL STRUCTURE — HEXASTRA 7-DAY SCAN:

## INTRODUCTION
Mandatory format:
"Dear [First name],
Here is your HexAstra scan, prepared carefully from your birth date.
You will find keys to illuminate 7 days — love, energy, mood, work, health.
Take what resonates."

## FOR EACH DAY (repeat 7 times — D1 to D7):

### [Day] [Full date]
**Energy of the day** — 1 sentence
**Inner mirror** — 1–2 sentences
**Outer mirror** — 1–2 sentences
**Embodied behavior** — 1–2 sentences
**Disembodied behavior** — 1–2 sentences
**LOVE**
  - Singles — 2–4 lines
  - In a relationship — 2–4 lines
  - Friendships — 2–4 lines
**MONEY & WORK**
  - Money — 2–4 lines
  - Work — 2–4 lines
  - Not working — 2–4 lines
**HEALTH** — 3–4 lines
**MOOD** — 3–4 lines

## WEEKLY BEHAVIORAL SYNTHESIS
1 paragraph of 3–5 lines — clear, grounded, directly useful.

## CLOSING
2–3 lines — tailored to sun sign if available.`

  const absoluteRules = isFr
    ? `RÈGLES ABSOLUES:
- Produire tous les blocs pour les 7 jours + synthèse + clôture — jamais de raccourci
- Chaque jour doit être utile et non répétitif — les 7 jours forment une progression
- Pas d'emoji, pas de jargon technique, pas de mention des systèmes utilisés
- Ton Shilo : poétique, structurant, intuitif — voix unifiée HexAstra
- Si des données exactes sont disponibles ci-dessous, les utiliser comme source de vérité`
    : `ABSOLUTE RULES:
- Produce all blocks for 7 days + synthesis + closing — no shortcuts
- Each day must be useful and non-repetitive — the 7 days form a progression
- No emoji, no technical jargon, no mention of internal systems
- Shilo tone: poetic, structuring, intuitive — unified HexAstra voice
- If exact data is available below, use it as source of truth`

  const parts = [roleBlock, identityBlock, structureDirective]
  if (input.horoscopeDataBlock) {
    parts.push(`DONNÉES PERSONNELLES — SOURCE DE VÉRITÉ:\n${input.horoscopeDataBlock}`)
  }
  parts.push(absoluteRules)

  return applySafetySuffix(parts.filter(Boolean).join('\n\n'))
}

// ── Main entry point ───────────────────────────────────────────────────────────

/**
 * Build the HexAstra Horoscope system prompt.
 * Called from buildSystemPrompt when input.isHoroscopeRoute = true.
 */
export function buildHoroscopeSystemPrompt(input: BuildPromptInput): string {
  if (input.horoscopeVariant === 'weekly') {
    return buildWeeklyHoroscopePrompt(input)
  }
  return buildDailyHoroscopePrompt(input)
}

// ── Output validator ───────────────────────────────────────────────────────────

/**
 * Validates that an LLM horoscope response contains the required blocks.
 * Used post-render for observability logging.
 *
 * Returns valid=true if all required blocks are present.
 * Returns missingBlocks list for diagnostic logging.
 */
export function validateHoroscopeOutput(
  text: string,
  variant: HoroscopeVariant,
): { valid: boolean; missingBlocks: string[] } {
  const upper = (text || '').toUpperCase()

  const required: readonly string[] =
    variant === 'weekly' ? WEEKLY_REQUIRED_BLOCKS : DAILY_REQUIRED_BLOCKS

  const missingBlocks = required.filter((block) => !upper.includes(block.toUpperCase()))

  return {
    valid: missingBlocks.length === 0,
    missingBlocks,
  }
}
