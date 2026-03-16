/**
 * Conversation layer for HexAstra — adds SHILO-toned small-talk handling
 * and lightweight moderation before engaging the main engine.
 *
 * This is intentionally heuristic and client-side only; backend models
 * (KS.Sentinel / Maât / Isfet) remain invisible to the user.
 */

export type ModerationClass =
  | 'SAFE'
  | 'CONFUSED'
  | 'SUSPICIOUS'
  | 'INAPPROPRIATE'
  | 'HOSTILE'
  | 'OUT_OF_SCOPE'

export type ConversationIntent =
  | 'GREETING'
  | 'SMALL_TALK'
  | 'EMOTIONAL'
  | 'QUESTION'
  | 'ANALYSIS_REQUEST'
  | 'DECISION'
  | 'EXPLORATION'
  | 'MENU_NAVIGATION'
  | 'RANDOM'
  | 'HOSTILE'
  | 'SPAM'

const PROFANITY = /\b(fuck|shit|merde|con(ne)?|fdp|pute|salope|bitch|asshole|enculé|nta)\b/i
const HOSTILE_MARKERS = /\b(haine|d[ée]teste|tu\s+es\s+nul|je\s+vais\s+te\s+detruire|ferme\s+la)\b/i
const SPAM_MARKERS = /(http[s]?:\/\/|bitcoin|crypto|gagner\s+de\s+l'argent|viagra)/i

export function moderateMessage(message: string): ModerationClass {
  const text = message.trim()
  if (!text) return 'CONFUSED'
  if (SPAM_MARKERS.test(text)) return 'OUT_OF_SCOPE'
  if (PROFANITY.test(text) || HOSTILE_MARKERS.test(text)) return 'HOSTILE'
  if (text.length < 3) return 'CONFUSED'
  if (text.length > 1400) return 'SUSPICIOUS'
  return 'SAFE'
}

export function detectUserIntent(message: string): ConversationIntent {
  const text = message.trim().toLowerCase()

  if (!text) return 'RANDOM'
  if (PROFANITY.test(text) || HOSTILE_MARKERS.test(text)) return 'HOSTILE'
  if (SPAM_MARKERS.test(text)) return 'SPAM'

  if (/(salut|bonjour|bonsoir|coucou|hello|hey|yo)\b/.test(text)) return 'GREETING'
  if (/(merci|thanks|thx|top|parfait)\b/.test(text)) return 'SMALL_TALK'
  if (/(ça va|ca va|comment tu vas|tu vas bien)\b/.test(text)) return 'SMALL_TALK'

  if (/(je suis (perdu|fatigu|épuis|vidé|stress|angoiss|triste|blasé)|j'en peux plus|marre)/i.test(message)) {
    return 'EMOTIONAL'
  }
  if (/(menu|choisir un menu|ouvrir le menu|voir les options)/i.test(text)) return 'MENU_NAVIGATION'
  if (/(j'hésite|je doute|je ne sais pas quoi faire|décision|choisir)/i.test(message)) return 'DECISION'

  const analysisTriggers = /(pourquoi|comment|que faire|qu'est-ce que|analyse|comprendre|situation|probl[eè]me|conflit|choix|relation|travail)/i
  if (analysisTriggers.test(message)) {
    if (/(analyse|multi-angle|syst[eé]mique)/i.test(message)) return 'ANALYSIS_REQUEST'
    return 'QUESTION'
  }

  if (/(explorer|exploration|regarder sous un angle|creuser)/i.test(message)) return 'EXPLORATION'

  if (text.length < 12) return 'SMALL_TALK'
  return 'RANDOM'
}

export function isConversationalIntent(intent: ConversationIntent): boolean {
  return ['GREETING', 'SMALL_TALK', 'EMOTIONAL', 'RANDOM'].includes(intent)
}

type ShiloOptions = {
  intent: ConversationIntent
  message: string
}

export function buildShiloReply({ intent }: ShiloOptions): string {
  switch (intent) {
    case 'GREETING':
      return "Salut, je suis là.\nComment tu te sens aujourd’hui ? Si quelque chose est présent pour toi, on peut le regarder ensemble."
    case 'SMALL_TALK':
      return "Je vais bien, merci.\nEt toi, comment ça se passe de ton côté ? Si un sujet te traverse, on peut l’explorer."
    case 'EMOTIONAL':
      return "Merci de me le partager.\nQuand on se sent bousculé, c’est souvent qu’un ajustement intérieur cherche sa place.\nQu’est-ce qui pèse le plus pour toi en ce moment ?"
    case 'WELLBEING':
      return "Je t’entends.\nOn peut prendre un moment pour voir ce qui te fatigue et ce qui pourrait t’apaiser.\nPar quoi tu veux commencer ?"
    case 'RANDOM':
      return "Je suis là pour toi.\nDis-moi simplement ce qui est le plus vivant ou le plus flou pour toi maintenant."
    default:
      return "Je t’écoute.\nQu’est-ce qui est important pour toi dans ce que tu vis ?"
  }
}

export function buildClarificationPrompt(): string {
  return "Je veux être sûr de bien comprendre.\nPeux-tu préciser ce que tu aimerais explorer ou clarifier ?"
}

export function buildGuardResponse(kind: ModerationClass): string {
  if (kind === 'HOSTILE') {
    return "Je préfère que nos échanges restent respectueux.\nSi tu veux parler d’une situation ou d’une question importante pour toi, je suis là."
  }
  if (kind === 'INAPPROPRIATE') {
    return "Je suis là pour t’aider à clarifier une situation ou une décision.\nRevenons à ce qui compte vraiment pour toi."
  }
  if (kind === 'SUSPICIOUS') {
    return "Je peux t’aider sur ce que tu traverses.\nPeux-tu formuler plus simplement ce qui t’amène ?"
  }
  if (kind === 'OUT_OF_SCOPE') {
    return "Je suis spécialisé pour t’aider à comprendre une situation, prendre une décision ou explorer un thème de vie.\nSi tu veux, raconte-moi ce que tu traverses en ce moment."
  }
  return buildClarificationPrompt()
}
