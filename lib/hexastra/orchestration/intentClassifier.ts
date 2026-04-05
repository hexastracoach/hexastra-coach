import { isCareerOrientationPrompt } from '@/lib/hexastra/orchestration/careerGuidance'
import { isYearlyPriorityQuestion } from '@/lib/hexastra/orchestration/yearlyPriorityRouting'

export type UserIntent =
  | 'direct_knowledge_query'
  | 'timing_decision'
  | 'behavior_change'
  | 'fusion_general_question'
  | 'relationship'
  | 'love'
  | 'decision'
  | 'career_guidance'
  | 'work_money'
  | 'inner_state'
  | 'blocage'
  | 'timing'
  | 'identity'
  | 'life_period'
  | 'science_specific'
  | 'exact_profile'
  | 'horoscope'
  | 'birth_update'
  | 'out_of_scope'

export const FUSION_INTENTS: ReadonlySet<UserIntent> = new Set([
  'timing_decision',
  'behavior_change',
  'fusion_general_question',
  'relationship',
  'love',
  'decision',
  'career_guidance',
  'work_money',
  'inner_state',
  'blocage',
  'timing',
  'identity',
  'life_period',
])

export function isFusionIntent(intent: UserIntent): boolean {
  return FUSION_INTENTS.has(intent)
}

function deaccent(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

const TIMING_DECISION_PATTERNS: RegExp[] = [
  /\b(meilleur moment (pour|d[''']|de))\b/i,
  /\b(quel est (le |un )?(bon|meilleur) moment)\b/i,
  /\b(quelle est (la |une )?(bonne|meilleure) (periode|fenetre))\b/i,
  /\b(est.?ce (le|un) bon moment (pour|de|d[''']))\b/i,
  /\b(est.?ce le moment (de|pour|d[''']))\b/i,
  /\b(c[''']est le bon moment)\b/i,
  /\b(quand (est.?ce que je (dois|devrais)|faut.?il que je))\b/i,
  /\b(now or later|attendre ou agir|agir ou attendre)\b/i,
  /\b(dois.?je attendre ou)\b/i,
  /\b(le bon timing (pour|de|d[''']))\b/i,
  /\b(la bonne (fenetre|periode) (pour|de|d[''']))\b/i,
]

function isTimingDecisionCombined(msg: string): boolean {
  const hasWhen = /\b(quand|meilleur moment|bon moment|bonne periode|fenetre|timing)\b/i.test(msg)
  const hasChange = /\b(arr[eê]ter?|stopper?|quitter|se lib[eé]rer|changer|d[eé]crocher)\b/i.test(msg)
  return hasWhen && hasChange
}

const BEHAVIOR_CHANGE_PATTERNS: RegExp[] = [
  /\b(arr[eê]ter? de (fumer|boire|manger|procrast|consommer|jouer|scroller))\b/i,
  /\b(arr[eê]ter? (le|la|les) (tabac|cigarette|alcool|sucre|porn|r[eé]seaux))\b/i,
  /\b(addiction|d[eé]pendance|compulsion|accro[cq]?)\b/i,
  /\b(fumer|tabac|cigarettes?|clope)\b/i,
  /\b(procrastination|procrast[ei]n|je procrastine)\b/i,
  /\b(habitude[s]? (n[eé]gative[s]?|toxique[s]?|[àa] changer|[àa] arr[eê]ter))\b/i,
  /\b(je veux (changer|arr[eê]ter|stopper|me lib[eé]rer|d[eé]crocher))\b/i,
  /\b(comment (arr[eê]ter|me d[eé]barrasser de|changer (cette |une |l['''])?habitude))\b/i,
  /\b(me lib[eé]rer de|sortir de (cette |une )?(habitude|addiction|d[eé]pendance|compulsion))\b/i,
  /\b(comportement r[eé]p[eé]titif|r[eé]p[eé]tition comportementale|pattern de comportement)\b/i,
]

const DIRECT_KNOWLEDGE_PATTERNS: RegExp[] = [
  /\b(mes canaux|mes channels|quels (sont mes|sont les) canaux|canal[x]? d[eé]fini[s]?)\b/i,
  /\b(mes centres?|quels (sont mes|sont les) centres?|centres? d[eé]fini[s]?|centres? ouverts?)\b/i,
  /\b(mes (gates?|portes?)|quelles? (sont mes|sont les) (gates?|portes?)|porte[s]? activ[eé]e?[s]?)\b/i,
  /\b(mon type hd|quel est mon type hd|mon type human design|mon type de design)\b/i,
  /\b(mon autorit[eé]( hd)?|quelle est mon autorit[eé])\b/i,
  /\b(mon profil hd|mon profil [0-9]\/[0-9]|quel est mon profil hd)\b/i,
  /\b(mon (human design|design humain|hd|bodygraph)( complet)?\b)(?! (est|me|te|nous|vous|lui|leur))\b/i,
  /\b(mon (type |)enn[eé](agramme)?|quel est mon (type |)enn[eé]|mon enn[eé]a\b|mon (type [1-9])\b)\b/i,
  /\b(mon (nombre |num[eé]ro |)kua|mon kua|mes directions (kua|favorables?)|quel est mon kua)\b/i,
  /\b(mon chemin de vie|quel est mon chemin de vie|mon chemin de vie \b)\b/i,
  /\b(mon ann[eé]e personnelle|mon ann[eé]e perso|quelle est mon ann[eé]e (personnelle|perso))\b/i,
  /\b(mon signe solaire|mon signe lunaire|ma lune en|mon ascendant|quel est mon (signe|ascendant|soleil|lune))\b/i,
]

const LOVE_PATTERNS: RegExp[] = [
  /\b(vie (amoureuse|sentimentale)|s[eé]duction|attirance (romantique)?|tomber amoureux|coup de foudre|l.amour dans ma vie)\b/i,
  /\b(relation amoureuse|partenaire (amoureux|id[eé]al|de vie)|l.amour et moi|pourquoi (je|j[''']) (n[''']arrive pas [àa] trouver|repousse|attire mal|suis seul))\b/i,
  /\b(compat?ibilit[eé] amoureuse|attirer l.amour|trouver l.amour|ouvrir (mon|le) coeur|blocage amoureux)\b/i,
  /\bsch[eé]mas? (amoureux|sentimental[s]?|en amour)\b/i,
  /\b(en amour|relations? amoureuses?|vie amoureuse|pourquoi (je|j.)(attire|repousse|choisis?))\b/i,
]

const WORK_MONEY_PATTERNS: RegExp[] = [
  /\b(travail|carri[eè]re|boulot|emploi|poste|job\b|business|entrepreneuriat|metier)\b/i,
  /\b(argent|finance[s]?|salaire|revenus?|prosp[eé]rit[eé]|abondance|richesse|manque d.argent)\b/i,
  /\b(mission (de vie|professionnelle)|trouver ma voie|ma vocation|qu.est.?ce que je dois (faire|cr[eé]er)|avancer (professionnellement|dans ma carri[eè]re))\b/i,
  /\b(reconversion|changer de travail|quitter mon poste|cr[eé]er mon entreprise)\b/i,
  /\b(activit[eé] (professionnelle|[eé]conomique)?|dans mon activit[eé]|mon (projet (pro)?|entreprise|business))\b/i,
]

const BLOCAGE_PATTERNS: RegExp[] = [
  /\b(je (suis|me sens) bloqu[eé]|blocage|obstacle (int[eé]rieur|personnel)|frein int[eé]rieur)\b/i,
  /\b(pattern r[eé]p[eé]titif|je r[e]?tombe (toujours|encore)|ca recommence|memes? sch[eé]mas?|le meme cercle)\b/i,
  /\b(je n[''']arrive (plus|pas) [àa] avancer|je tourne en rond|je m[''']auto.?sabot|je (me )?(sabote|bloque))\b/i,
  /\b(cycle de souffrance|sortir de ce (cycle|pattern|sch[eé]ma)|pourquoi (ca|ça|je) recommence)\b/i,
  /\bje (suis|me sens) frein[eé]|je me sens (retenu[e]?|stopp[eé][e]?|coinc[eé][e]?)\b/i,
]

const BLOCAGE_PRO_PATTERNS: RegExp[] = [
  /\b(bloque[reée]?|bloqu[eé]e?|frein[eé]e?|stagne?|n[''']avance (plus|pas))\b.{0,40}\b(activit[eé][s]?|travail|boulot|business|projet[s]?|carri[eè]re)\b/i,
  /\b(activit[eé][s]?|travail|boulot|business|projet[s]?|carri[eè]re)\b.{0,40}\b(bloque[reée]?|bloqu[eé]e?|frein[eé]e?|stagne?|n[''']avance (plus|pas))\b/i,
  /\bpourquoi (je|j[''']) bloque[sz]?\b/i,
]

const TIMING_PATTERNS: RegExp[] = [
  /\b(quand (agir|partir|commencer|me lancer|est.?ce le bon moment|dois.?je))\b/i,
  /\b(bon moment|moment (juste|propice|favorable)|le timing|mon timing|bonne p[eé]riode)\b/i,
  /\b(maintenant ou (plus tard|attendre)|est.?ce (le bon|un bon) moment|est.?ce la bonne p[eé]riode)\b/i,
  /\b(mon cycle (actuel|en ce moment)|dans quel cycle je suis)\b/i,
]

const IDENTITY_PATTERNS: RegExp[] = [
  /\b(qui (suis.?je|je suis) (vraiment|r[eé]ellement|au fond)?|ma vraie nature|ma nature (profonde|r[eé]elle|essentielle))\b/i,
  /\b(mon fonctionnement naturel|comment je suis (vraiment|fait|câbl[eé])|ma nature (int[eé]rieure|profonde))\b/i,
  /\b(mon identit[eé] (profonde|essentielle|r[eé]elle)|comprendre qui je suis|conna[iî]tre ma nature)\b/i,
  /\b(comment (je|tu) fonctionn[eo][sz]?( r[eé]ellement| vraiment)?|mon fonctionnement( r[eé]el| naturel)?)\b/i,
  /\b(comment (je suis|tu es) (fait[e]?|constru[iy]t[e]?|cabl[eé]e?)|ma mani[eè]re (naturell[e]? |vrai[e]? |propre )?(d['''][êe]tre|de fonctionner))\b/i,
  /\b(comment (je|tu) (r[eé]agi[st]? naturellement|march[eé][sz]?)|mon vrai (moi|fonctionnement|[êe]tre))\b/i,
]

const LIFE_PERIOD_PATTERNS: RegExp[] = [
  /\b(p[eé]riode (de (vie|transition)|de changement|difficile|importante))\b/i,
  /\b(transition (de vie)?|grand changement|passage [àa] vide|[àa] un (carrefour|tournant)|passage)\b/i,
  /\b(transformation (profonde|de vie)|cycle (de vie|de fin|de commencement)|une nouvelle [eé]tape)\b/i,
  /\b(je traverse (une|un) (période|phase|moment|changement)|qu.est.?ce que je traverse)\b/i,
]

const SCIENCE_SPECIFIC_PATTERNS: RegExp[] = [
  /\b(astrologie|astrology|theme natal|theme astral|carte du ciel|ascendant|maisons|transits|signe solaire|signe lunaire|lune en|soleil en)\b/i,
  /\b(numerolog|numerologie|chemin de vie|nombre expression|nombre d(e |')ame|annee personnelle)\b/i,
  /\b(human design|design humain|bodygraph|mon hd\b|portes? hd|centres? hd|canaux hd|type hd|autorite hd|strategie hd)\b/i,
  /\b(enneagramme|ennéagramme|mon type [1-9]\b|type ennea)\b/i,
  /\b(kua\b|feng.?shui|gps kua|neurokua|nombre kua|direction kua)\b/i,
  /\b(hexastra fusion|fusion des sciences|toutes les sciences|lecture multi.?science)\b/i,
]

const EXACT_PROFILE_PATTERNS: RegExp[] = [
  /\b(profil complet|lecture compl[eè]te|tout mon profil|mon profil [eé]nerg[eé]tique|bilan complet|profil fusionn[eé])\b/i,
  /\b(mon th[eè]me (natal|astral)|ma carte du ciel|th[eè]me natal complet)\b/i,
  /\b(qui suis.?je|quelle est ma nature|quel est mon profil)\b/i,
]

const DECISION_PATTERNS: RegExp[] = [
  /\b(dois.?je|devrais.?je|faut.?il que je|est.?ce que je dois)\b/i,
  /\b(d[eé]cision|choix|trancher|choisir entre|partir ou rester|accepter ou refuser)\b/i,
  /\b(quelle (option|voie|direction)|quel chemin|quelle d[eé]cision)\b/i,
]

const RELATIONSHIP_PATTERNS: RegExp[] = [
  /\b(relations?|couple|amours?|famille|proches|ami(e)?s|entourage|partenaires?|conjoint)\b/i,
  /\b(les gens (ne |n['''])?m[''']([eé]coutent|comprennent|respectent|voient))\b/i,
  /\b(compatibilit[eé]|affinit[eé]|communication avec|conflit avec|tension avec)\b/i,
  /\b(je n[''']arrive pas [àa] me connecter|personne ne me comprend|mal compris|incompris)\b/i,
]

const INNER_STATE_PATTERNS: RegExp[] = [
  /\b([eé]nergie|[eé]tat int[eé]rieur|surcharge|fatigue|recharge|[eé]puisement|burn.?out)\b/i,
  /\b(comment je me sens|ce que je ressens|ce que je vis|mon [eé]tat|je me sens)\b/i,
  /\b(motiv|[eé]lan|blocage int[eé]rieur|frein|paralys|anxi|peur de)\b/i,
]

const FUSION_GENERAL_PATTERNS: RegExp[] = [
  /\bpourquoi\b/i,
  /\bcomment\b/i,
  /\bje (ressens|sens|vis|traverse|n[''']arrive pas|n[''']y arrive|bloque|souffre|manque|cherche)\b/i,
  /\bje ne (comprends|sais|peux|vois|trouve|r[eé]ussis) pas\b/i,
  /\bqu[''']est.?ce qui (se passe|m[''']emp[eê]che|bloque|ne va pas)\b/i,
  /\bma (vie|situation|[eé]nergie|relation|carri[eè]re|sant[eé])\b/i,
  /\bmon (fonctionnement|comportement|rapport [àa]|probl[eè]me|blocage)\b/i,
  /\b(qu[''']est.?ce que je|pourquoi est.?ce que je|comment [eé]viter|comment sortir)\b/i,
  /\b(analyser?|comprendre|expliquer?|d[eé]chiffrer?) (ma |mon |ma situation|ce qui)\b/i,
  /\b(quel est mon|quelle est ma|quels sont mes) (rapport|relation|lien|tendance|pattern|mode de fonctionnement)\b/i,
]

export function classifyUserIntent(
  message: string,
  sidebarIntentKey?: string | null,
  isOutOfScope?: boolean,
): UserIntent {
  if (isOutOfScope) return 'out_of_scope'

  const normalized = deaccent((message || '').toLowerCase())

  if (isYearlyPriorityQuestion(normalized)) return 'fusion_general_question'
  if (DIRECT_KNOWLEDGE_PATTERNS.some((p) => p.test(normalized))) return 'direct_knowledge_query'
  if (isTimingDecisionCombined(normalized)) return 'timing_decision'
  if (TIMING_DECISION_PATTERNS.some((p) => p.test(normalized))) return 'timing_decision'
  if (BEHAVIOR_CHANGE_PATTERNS.some((p) => p.test(normalized))) return 'behavior_change'

  if (LOVE_PATTERNS.some((p) => p.test(normalized))) return 'love'
  if (IDENTITY_PATTERNS.some((p) => p.test(normalized))) return 'identity'
  if (TIMING_PATTERNS.some((p) => p.test(normalized))) return 'timing'
  if (BLOCAGE_PRO_PATTERNS.some((p) => p.test(normalized))) return 'blocage'
  if (isCareerOrientationPrompt(normalized)) return 'career_guidance'
  if (WORK_MONEY_PATTERNS.some((p) => p.test(normalized))) return 'work_money'
  if (BLOCAGE_PATTERNS.some((p) => p.test(normalized))) return 'blocage'
  if (LIFE_PERIOD_PATTERNS.some((p) => p.test(normalized))) return 'life_period'

  if (SCIENCE_SPECIFIC_PATTERNS.some((p) => p.test(normalized))) return 'science_specific'
  if (EXACT_PROFILE_PATTERNS.some((p) => p.test(normalized))) return 'exact_profile'
  if (DECISION_PATTERNS.some((p) => p.test(normalized))) return 'decision'
  if (RELATIONSHIP_PATTERNS.some((p) => p.test(normalized))) return 'relationship'
  if (INNER_STATE_PATTERNS.some((p) => p.test(normalized))) return 'inner_state'
  if (FUSION_GENERAL_PATTERNS.some((p) => p.test(normalized))) return 'fusion_general_question'

  if (sidebarIntentKey) {
    const SIDEBAR_TO_INTENT: Record<string, UserIntent> = {
      understand_situation: 'fusion_general_question',
      make_decision: 'decision',
      relationships: 'relationship',
      money_work: 'career_guidance',
      inner_state: 'inner_state',
    }
    const mapped = SIDEBAR_TO_INTENT[sidebarIntentKey]
    if (mapped) return mapped
  }

  return 'fusion_general_question'
}
