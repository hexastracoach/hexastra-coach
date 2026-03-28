/**
 * softMessaging — Hexastra Coach
 *
 * Messages doux et contextuels pour une conversion naturelle.
 *
 * PRINCIPES :
 * - 1 phrase maximum
 * - Jamais commercial (interdit : acheter, payer, upgrade, offre)
 * - Jamais répétitif (rotation par sessionDepth)
 * - Jamais intrusif (seulement après la lecture, jamais avant)
 * - Contextuel (adapt according to intent/zone/phase)
 *
 * USAGE PIPELINE :
 * Fusion Arbiter → CompactReadingCore → renderPremiumReading → getSoftMessage
 *
 * MISSION :
 * L'utilisateur doit se dire "j'ai envie de continuer"
 * et jamais "on essaie de me vendre quelque chose".
 */

import type { UserPhase } from '@/lib/hexastra/context/userPhase'
import type { LifeZone } from '@/lib/hexastra/context/lifeZone'

// ── Types ──────────────────────────────────────────────────────────────────────

export type SoftMessageContext = {
  /** Intent utilisateur détecté (ex: 'blocage', 'timing', 'love'...) */
  intent?: string | null
  /** Zone de vie dominante */
  lifeZone?: LifeZone
  /** Profondeur de session : nombre de messages utilisateur échangés */
  sessionDepth?: number
  /** Phase détectée pour adapter le ton */
  userPhase?: UserPhase
  /** Langue : 'fr' (défaut) | 'en' */
  lang?: string
}

export type QuotaLimitMessage = {
  /** Texte principal de la limite (2 lignes max, naturel, non agressif) */
  text: string
  /** Label du bouton (jamais "acheter" ou "upgrade") */
  ctaLabel: string
  /** Lien vers la page pricing */
  ctaHref: string
}

// ── Tables de messages par contexte ───────────────────────────────────────────

type MessagePool = {
  fr: string[]
  en: string[]
}

const BLOCAGE_MESSAGES: MessagePool = {
  fr: [
    "Je peux t'aider à voir exactement où ça bloque si tu veux.",
    "On peut identifier le point précis du blocage ensemble.",
    "Je peux affiner l'origine de ce frein si tu veux aller plus loin.",
  ],
  en: [
    "I can help you see exactly where it's blocking, if you want.",
    "We can identify the precise point of the block together.",
    "I can pinpoint the origin of this obstacle if you want to go further.",
  ],
}

const TIMING_MESSAGES: MessagePool = {
  fr: [
    "On peut affiner le moment idéal si tu veux aller plus loin.",
    "Je peux préciser le timing si tu veux.",
    "On peut voir ensemble quand agir exactement.",
  ],
  en: [
    "We can refine the ideal timing if you want to go further.",
    "I can be more precise about timing if you want.",
    "We can figure out exactly when to act together.",
  ],
}

const RELATION_MESSAGES: MessagePool = {
  fr: [
    "On peut regarder ce qui se joue plus précisément si tu veux.",
    "Je peux affiner la dynamique relationnelle si tu veux aller plus loin.",
    "On peut creuser ce point ensemble si tu veux.",
  ],
  en: [
    "We can look more closely at what's happening, if you want.",
    "I can refine this dynamic further if you'd like.",
    "We can dig into this together if you want.",
  ],
}

const IDENTITY_MESSAGES: MessagePool = {
  fr: [
    "On peut approfondir ton fonctionnement naturel si tu veux.",
    "Je peux t'aider à voir encore plus précisément comment tu fonctionnes.",
    "On peut aller plus loin sur ce point si tu veux.",
  ],
  en: [
    "We can go deeper into your natural functioning if you want.",
    "I can help you see even more precisely how you operate.",
    "We can go further on this if you want.",
  ],
}

const ENERGY_MESSAGES: MessagePool = {
  fr: [
    "On peut regarder de plus près ce que tu ressens en ce moment.",
    "Je peux affiner ce que tu traverses si tu veux.",
    "On peut creuser ça ensemble si tu veux.",
  ],
  en: [
    "We can look more closely at what you're feeling right now.",
    "I can refine what you're going through if you want.",
    "We can dig into this together if you want.",
  ],
}

const DECISION_MESSAGES: MessagePool = {
  fr: [
    "Je peux t'aider à clarifier le choix plus précisément si tu veux.",
    "On peut affiner le signal décisif ensemble.",
    "Je peux préciser l'orientation si tu veux aller plus loin.",
  ],
  en: [
    "I can help you clarify the choice more precisely if you want.",
    "We can refine the decisive signal together.",
    "I can sharpen the direction if you want to go further.",
  ],
}

const TRANSITION_MESSAGES: MessagePool = {
  fr: [
    "Je peux t'aider à voir exactement ce qui est en jeu en ce moment.",
    "On peut regarder ça de plus près si tu veux.",
  ],
  en: [
    "I can help you see exactly what's at stake right now.",
    "We can look at this more closely if you want.",
  ],
}

const EXPANSION_MESSAGES: MessagePool = {
  fr: [
    "On peut affiner l'action si tu veux aller encore plus loin.",
    "Je peux préciser le prochain mouvement si tu veux.",
  ],
  en: [
    "We can refine the action if you want to go further.",
    "I can clarify the next move if you want.",
  ],
}

const GENERIC_MESSAGES: MessagePool = {
  fr: [
    "On peut aller encore plus précis si tu veux.",
    "Je peux affiner ça si tu veux.",
    "On peut creuser ce point ensemble.",
  ],
  en: [
    "We can be even more precise if you want.",
    "I can refine this if you want.",
    "We can dig into this point together.",
  ],
}

// ── Sélection du pool ──────────────────────────────────────────────────────────

function selectPool(
  intent: string | null | undefined,
  lifeZone: LifeZone | undefined,
  userPhase: UserPhase | undefined,
): MessagePool {
  // 1. Priorité : intent spécifique
  if (intent === 'blocage') return BLOCAGE_MESSAGES
  if (intent === 'timing' || intent === 'decision' || intent === 'make_decision') return TIMING_MESSAGES

  // 2. Zone de vie
  if (lifeZone === 'relation') return RELATION_MESSAGES
  if (lifeZone === 'work') return BLOCAGE_MESSAGES  // même sensibilité que blocage
  if (lifeZone === 'identity') return IDENTITY_MESSAGES
  if (lifeZone === 'energy') return ENERGY_MESSAGES
  if (lifeZone === 'decision') return DECISION_MESSAGES

  // 3. Phase si pas de zone identifiée
  if (userPhase === 'transition') return TRANSITION_MESSAGES
  if (userPhase === 'expansion') return EXPANSION_MESSAGES

  // 4. Générique
  return GENERIC_MESSAGES
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Retourne un message doux et contextuel à afficher après la lecture.
 *
 * Règles :
 * - Null si sessionDepth < 2 (trop tôt)
 * - Max 1 phrase
 * - Jamais commercial
 * - Rotation par sessionDepth (jamais répétitif)
 *
 * @param ctx  Contexte : intent, zone, phase, profondeur de session
 * @returns    Message ou null
 *
 * @example
 * getSoftMessage({ intent: 'blocage', sessionDepth: 2 })
 * // "Je peux t'aider à voir exactement où ça bloque si tu veux."
 *
 * getSoftMessage({ sessionDepth: 1 })
 * // null (trop tôt)
 */
export function getSoftMessage(ctx: SoftMessageContext): string | null {
  const { intent, lifeZone, sessionDepth = 1, userPhase, lang = 'fr' } = ctx
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'

  // Trop tôt — ne pas afficher avant le 2ème échange
  if (sessionDepth < 2) return null

  const pool = selectPool(intent, lifeZone, userPhase)
  const variants = isFr ? pool.fr : pool.en
  if (!variants || variants.length === 0) return null

  // Rotation stable basée sur sessionDepth (évite la répétition)
  const idx = (sessionDepth - 2) % variants.length
  return variants[idx] ?? null
}

// ── Message limite free ────────────────────────────────────────────────────────

/**
 * Retourne le message de limite quotidienne (plan free).
 *
 * Ton : naturel, non-agressif, sans pression.
 * Aucun mot interdit : acheter, payer, upgrade, offre, limité.
 *
 * @param lang  'fr' | 'en'
 * @returns     QuotaLimitMessage (text + ctaLabel + ctaHref)
 */
export function getQuotaLimitMessage(lang = 'fr'): QuotaLimitMessage {
  const isFr = lang.slice(0, 2).toLowerCase() !== 'en'

  if (isFr) {
    return {
      text: "Tu as utilisé tes lectures du jour.\nReviens dans 24h ou continue si tu veux aller plus loin.",
      ctaLabel: 'Voir les options',
      ctaHref: '/pricing',
    }
  }

  return {
    text: "You've used today's readings.\nCome back in 24h, or continue if you want to go deeper.",
    ctaLabel: 'See options',
    ctaHref: '/pricing',
  }
}
