/**
 * contextualActionWording — Hexastra Coach
 *
 * Variation contextuelle des actions prioritaires selon le type HD et l'intent.
 *
 * RÈGLE :
 * - Même vérité de fond (la stratégie HD est réelle et invariante)
 * - Formulation adaptée au contexte de la question
 * - Pas de random, pas de variation décorative
 * - Pilotée par l'intent utilisateur
 *
 * Structure : HDType × ActionContext → formulation contextuelle
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type ActionContext =
  | 'relationship'
  | 'love'
  | 'work_money'
  | 'decision'
  | 'blocage'
  | 'timing'
  | 'identity'
  | 'inner_state'
  | 'life_period'
  | 'fusion_general_question'
  | 'exact_profile'

type HDKey =
  | 'projecteur'
  | 'generateur'
  | 'generateur_manifestant'
  | 'manifesteur'
  | 'reflecteur'

type ContextualActions = Partial<Record<ActionContext, string>>

// ── Tables de formulation contextuelle ────────────────────────────────────────

const ACTIONS_FR: Record<HDKey, ContextualActions> = {
  projecteur: {
    relationship:"ne pas forcer la connexion — laisser l'invitation venir naturellement",
    love:                  "ne pas projeter d'énergie sans retour — attendre que l'intérêt de l'autre soit réel",
    work_money:            "te placer là où ton expertise est reconnue et sollicitée, pas partout",
    decision:              "ne pas décider sous pression externe — laisser l'invitation clarifier le chemin",
    blocage:               "identifier où l'invitation manque — arrêter d'initier sans retour réel",
    timing:                "laisser le bon signal venir jusqu'à toi avant d'engager ton énergie",
    identity:              "accepter que ton fonctionnement repose sur la reconnaissance, pas sur la poussée permanente",
    inner_state:           "repérer si l'environnement actuel te reconnaît ou t'épuise",
    life_period:           "naviguer ce passage depuis la clarté de l'invitation, pas la pression",
    fusion_general_question: "attendre l'invitation avant de partager ou de s'impliquer profondément",
    exact_profile:         "comprendre que ta valeur s'active par la reconnaissance, pas par l'initiative",
  },
  generateur: {
    relationship:"répondre depuis le ventre, pas depuis les attentes mentales — choisir ce qui illumine",
    love:                  "laisser la réponse sacrale guider vers les liens qui génèrent un vrai oui",
    work_money:            "choisir ce qui génère un 'oui' corporel authentique, pas ce qui semble logique",
    decision:              "attendre la réponse du ventre — le oui ou le non — avant de t'engager",
    blocage:               "identifier ce qui ne génère plus de réponse vraie — et s'en libérer progressivement",
    timing:                "agir quand la réponse corporelle est claire et sans ambiguïté, pas avant",
    identity:              "comprendre que tu es fait pour répondre et construire, pas pour initier dans le vide",
    inner_state:           "observer ce qui dans l'environnement génère de la réponse ou de la résistance",
    life_period:           "suivre ce qui génère une réponse authentique pendant ce passage",
    fusion_general_question: "attendre la réponse sacrale avant de t'engager pleinement",
    exact_profile:         "nourrir ce qui génère un vrai oui — libérer ce qui ne résonne plus",
  },
  generateur_manifestant: {
    relationship:"informer avant d'agir — même dans les liens, la vitesse sans annonce crée des frictions",
    love:                  "ralentir juste assez pour laisser l'autre s'intégrer dans ton rythme naturel",
    work_money:            "informer les personnes clés avant de changer de cap — la communication réduit la résistance",
    decision:              "prévenir avant d'agir — même si la décision est déjà prise dans ta tête",
    blocage:               "identifier les résistances créées par le manque d'information vers les autres",
    timing:                "informer et lancer — ton énergie est rapide, mais l'annonce réduit le frottement",
    identity:              "accepter ta multi-directionnalité tout en cultivant l'art de la communication",
    inner_state:           "observer si ton énergie rapide actuelle crée de la résistance autour de toi",
    life_period:           "avancer vite mais communiquer — c'est la formule juste pour ce passage",
    fusion_general_question: "informer brièvement avant d'agir pour réduire les frictions",
    exact_profile:         "canaliser la rapidité par la communication, pas la freiner",
  },
  manifesteur: {
    relationship:"informer tes proches de tes mouvements — l'autonomie ne signifie pas l'isolement",
    love:                  "créer les conditions pour que l'autre comprenne et accueille ton besoin d'initier",
    work_money:            "lancer ce qui doit être lancé — après avoir informé les personnes clés",
    decision:              "décider et informer — c'est ton droit naturel, mais l'annonce désamorce la résistance",
    blocage:               "identifier où la résistance vient du manque d'information vers l'entourage",
    timing:                "initier quand l'impulsion intérieure est là — mais informer en premier",
    identity:              "comprendre que ton rôle est d'initier les cycles, pas de les gérer en continu",
    inner_state:           "vérifier si la résistance actuelle vient d'un manque de communication vers les autres",
    life_period:           "lancer les cycles de cette période — et embarquer les autres dans le mouvement",
    fusion_general_question: "informer les personnes clés avant d'agir pour désamorcer la résistance",
    exact_profile:         "initier avec clarté — l'information libère l'énergie qui se bloque",
  },
  reflecteur: {
    relationship:"prendre le temps d'un cycle lunaire avant de s'engager profondément dans un lien",
    love:                  "observer comment tu te sens dans la présence de l'autre sur la durée d'un mois",
    work_money:            "ne pas décider d'une orientation professionnelle sans avoir observé au moins un cycle lunaire",
    decision:              "attendre 28 jours — pas par peur, mais pour laisser la clarté s'installer vraiment",
    blocage:               "identifier si l'environnement actuel te reflète quelque chose de juste ou de faux",
    timing:                "laisser passer le cycle lunaire entier avant d'engager un mouvement important",
    identity:              "comprendre que tu es un miroir — ce que tu ressens dit la vérité sur ton environnement",
    inner_state:           "observer ce que l'environnement actuel te fait ressentir — c'est de l'information précieuse",
    life_period:           "ne pas accélérer ce passage — la clarté vient naturellement avec le cycle",
    fusion_general_question: "prendre 28 jours avant les décisions importantes pour laisser la clarté s'installer",
    exact_profile:         "honorer ton besoin de cycle — les grandes décisions méritent le temps lunaire",
  },
}

const ACTIONS_EN: Record<HDKey, ContextualActions> = {
  projecteur: {
    relationship:"don't force connection — let the invitation come naturally",
    love:                  "don't project energy without return — wait for genuine interest from the other",
    work_money:            "position yourself where your expertise is recognized and invited, not everywhere",
    decision:              "don't decide under external pressure — let the invitation clarify the path",
    blocage:               "identify where the invitation is missing — stop initiating without real return",
    timing:                "let the right signal come to you before engaging your energy",
    identity:              "accept that your functioning relies on recognition, not constant pushing",
    inner_state:           "notice if the current environment recognizes you or depletes you",
    life_period:           "navigate this passage from clarity of invitation, not pressure",
    fusion_general_question: "wait for the invitation before sharing or deeply engaging",
    exact_profile:         "understand that your value activates through recognition, not initiative",
  },
  generateur: {
    relationship:"respond from the gut, not from mental expectations — choose what lights you up",
    love:                  "let the sacral response guide you toward connections that generate a true yes",
    work_money:            "choose what generates an authentic body yes, not what seems logically correct",
    decision:              "wait for the gut response — the yes or no — before committing",
    blocage:               "identify what no longer generates a true response — and release it gradually",
    timing:                "act when the body response is clear and unambiguous, not before",
    identity:              "understand you are built to respond and build, not to initiate in the void",
    inner_state:           "observe what in your environment generates response or resistance",
    life_period:           "follow what generates authentic response during this passage",
    fusion_general_question: "wait for the sacral response before fully engaging",
    exact_profile:         "nurture what generates a true yes — release what no longer resonates",
  },
  generateur_manifestant: {
    relationship:"inform before acting — even in relationships, speed without announcement creates friction",
    love:                  "slow down just enough to let the other integrate into your natural rhythm",
    work_money:            "inform key people before changing course — communication reduces resistance",
    decision:              "notify before acting — even if the decision is already made in your head",
    blocage:               "identify resistance created by lack of information toward others",
    timing:                "inform and launch — your energy is fast, but the announcement reduces friction",
    identity:              "accept your multi-directionality while cultivating the art of communication",
    inner_state:           "observe if your current fast energy is creating resistance around you",
    life_period:           "move fast but communicate — that's the right formula for this passage",
    fusion_general_question: "briefly inform before acting to reduce friction",
    exact_profile:         "channel speed through communication — don't suppress it",
  },
  manifesteur: {
    relationship:"inform those close to you of your movements — autonomy doesn't mean isolation",
    love:                  "create conditions for the other to understand and welcome your need to initiate",
    work_money:            "launch what needs to be launched — after informing key people",
    decision:              "decide and inform — it's your natural right, but the announcement defuses resistance",
    blocage:               "identify where resistance comes from lack of information toward others",
    timing:                "initiate when the inner impulse is there — but inform first",
    identity:              "understand your role is to initiate cycles, not to manage them continuously",
    inner_state:           "check if current resistance comes from a lack of communication toward others",
    life_period:           "launch the cycles of this period — and bring others along in the movement",
    fusion_general_question: "inform key people before acting to defuse resistance",
    exact_profile:         "initiate with clarity — information releases blocked energy",
  },
  reflecteur: {
    relationship:"take the time of a lunar cycle before deeply committing to a connection",
    love:                  "observe how you feel in the other's presence over the duration of a month",
    work_money:            "don't decide on a professional direction without observing at least one lunar cycle",
    decision:              "wait 28 days — not from fear, but to let clarity truly settle",
    blocage:               "identify if the current environment reflects something true or false to you",
    timing:                "let the full lunar cycle pass before engaging an important movement",
    identity:              "understand you are a mirror — what you feel tells the truth about your environment",
    inner_state:           "observe what the current environment makes you feel — that's precious information",
    life_period:           "don't rush this passage — clarity comes naturally with the cycle",
    fusion_general_question: "take 28 days before major decisions for clarity to settle",
    exact_profile:         "honor your need for cycles — major decisions deserve lunar time",
  },
}

// ── Normalisation du type HD ───────────────────────────────────────────────────

function normalizeHDKey(hdType: string | null): HDKey | null {
  if (!hdType) return null
  const t = hdType.toLowerCase().trim()
  // Ordre important : générateur manifestant avant générateur
  if (
    (t.includes('génér') && t.includes('manifest')) ||
    (t.includes('generat') && t.includes('manifest')) ||
    t === 'générateur manifestant' ||
    t === 'manifesting generator'
  ) return 'generateur_manifestant'
  if (t.includes('projecteur') || t.includes('projector')) return 'projecteur'
  if (t.includes('générateur') || t.includes('generator')) return 'generateur'
  if (t.includes('manifesteur') || t.includes('manifestor')) return 'manifesteur'
  if (t.includes('réflecteur') || t.includes('reflecteur') || t.includes('reflector')) return 'reflecteur'
  return null
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Retourne la formulation contextuelle de l'action prioritaire selon le type HD et l'intent.
 *
 * @param hdType   Type HD de la personne ("Projecteur", "Générateur", etc.)
 * @param hdStrategy  Stratégie HD brute (utilisée comme fallback si hdType non résolu)
 * @param intent   Intent utilisateur (context de la question)
 * @param isFr     true pour le français
 * @returns        Formulation contextuelle, ou null si non résolu
 */
export function getContextualAction(
  hdType: string | null,
  hdStrategy: string | null,
  intent: string,
  isFr: boolean,
): string | null {
  const key = normalizeHDKey(hdType)
  if (!key) return null

  const table = isFr ? ACTIONS_FR : ACTIONS_EN
  const actions = table[key]
  const ctx = intent as ActionContext

  // Essai avec le context exact, fallback sur fusion_general_question
  return actions[ctx] ?? actions['fusion_general_question'] ?? null
}

/**
 * Retourne toutes les variantes contextuelles pour un type HD donné.
 * Utile pour les tests et la validation.
 */
export function getAllContextualActions(
  hdType: string | null,
  isFr: boolean,
): Partial<Record<ActionContext, string>> | null {
  const key = normalizeHDKey(hdType)
  if (!key) return null
  const table = isFr ? ACTIONS_FR : ACTIONS_EN
  return table[key]
}
