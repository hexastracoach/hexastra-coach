/**
 * Intent classifier — pure lexical/pattern matching.
 * No API call, no latency. Runs entirely client-side.
 */

export type UserIntent =
  | 'life_decision'       // choices, directions, "que faire ?"
  | 'relationship'        // love, family, couple, social dynamics
  | 'career'              // work, project, professional evolution
  | 'personal_growth'     // blocks, confidence, identity, inner evolution
  | 'life_situation'      // current life phase, traversing a period
  | 'timing'              // when to act, cycles, favorable moment
  | 'technical_question'  // IT, programming, debugging
  | 'academic_question'   // homework, dissertation, exam exercises
  | 'practical_task'      // cooking, mechanics, repairs, DIY
  | 'medical_question'    // clinical diagnosis, medication, treatment
  | 'legal_question'      // contract, lawyer, legal/tax advice
  | 'general_assistant'   // encyclopedia, translation, generic search

// ── Pattern maps ─────────────────────────────────────────────────────────────

type PatternEntry = {
  intent: UserIntent
  patterns: RegExp[]
  weight: number  // higher = wins ties
}

const INTENT_PATTERNS: PatternEntry[] = [
  // ── OUT-OF-SCOPE (checked first — higher weight) ──────────────────────────

  {
    intent: 'technical_question',
    weight: 10,
    patterns: [
      /\b(cod[eo]r?|programmer?|d[ée]bugger?|bug\b|erreur\s+(de\s+)?code|stack\s*overflow)\b/i,
      /\b(javascript|typescript|python|java\b|c\+\+|react\b|sql\b|html\b|css\b|api\b)\b/i,
      /\b(serveur|backend|frontend|d[ée]ployer|docker|git\b|github|npm|node\.?js)\b/i,
      /\b(algorithme|fonction|variable|objet|class[e]?\b|module|import|export)\b/i,
      /\b(ordinateur|pc\b|mac\b|windows|linux|logiciel|application\s+mobile)\b/i,
      /\b(r[ée]seau\s+wifi|connexion\s+internet|vpn\b|firewall|ip\s+adresse)\b/i,
    ],
  },

  {
    intent: 'academic_question',
    weight: 10,
    patterns: [
      /\b(dissertation|devoir|exercice\s+(scolaire|de\s+maths?|de\s+physique))\b/i,
      /\b(bac\b|brevet|examen\s+(scolaire|universit)|concours\s+(scolaire|pr[ée]pa))\b/i,
      /\b(r[ée]soudre?\s+(une?\s+)?[ée]quation|int[ée]grale|d[ée]riv[ée]e|calcul\s+matriciel)\b/i,
      /\b(cit[ée]r?\s+les?\s+sources|bibliographie|th[ée]or[ée]me\s+de|d[ée]montrer?\s+que)\b/i,
      /\b(cours\s+de\s+(maths?|histoire|physique|chimie|biologie|philosophie))\b/i,
      /\b(corrig[ée]r?\s+mon\s+(devoir|texte\s+scolaire|r[ée]daction\s+scolaire))\b/i,
    ],
  },

  {
    intent: 'practical_task',
    weight: 9,
    patterns: [
      /\b(recette\s+de|cuisiner?|cuire?\s+le?|faire?\s+cuire|ingr[ée]dients?\s+pour)\b/i,
      /\b(r[ée]parer?\s+(une?\s+)?(voiture|moteur|tuyau|frein|fuite|robinet|machine))\b/i,
      /\b(bricolage|monter?\s+(un\s+meuble|un\s+kit)|visser?|peindre?\s+(un\s+mur|une?\s+pi[ée]ce))\b/i,
      /\b(installer?\s+(un[e]?\s+)?logiciel|pilote\s+imprimante|configurer?\s+(le\s+)?wifi)\b/i,
      /\b(plomberie|[ée]lectricit[ée]\s+domestique|changer?\s+(un\s+)?disjoncteur)\b/i,
    ],
  },

  {
    intent: 'medical_question',
    weight: 9,
    patterns: [
      /\b(diagnostic\s+m[ée]dical|symptômes?\s+(de\s+)?(maladie|infection|virus))\b/i,
      /\b(m[ée]dicaments?\s+(pour|contre|dosage)|posologie|prescription)\b/i,
      /\b(traitement\s+m[ée]dical|ordonnance|m[ée]decin\s+(g[ée]n[ée]raliste))\b/i,
      /\b(douleur\s+(chronique|aigu[ëe]|persistante)|infection\s+(bact[ée]rienne|virale))\b/i,
      /\b(chirurgie|op[ée]ration\s+m[ée]dicale|hospitalisation|urgences?\s+m[ée]dicales?)\b/i,
    ],
  },

  {
    intent: 'legal_question',
    weight: 9,
    patterns: [
      /\b(avocat|tribunal|proc[ée]s|jugement\s+(juridique)|plaidoirie)\b/i,
      /\b(contrat\s+(de\s+travail|de\s+bail|de\s+vente)\s+[àa]\s+v[ée]rifier)\b/i,
      /\b(l[ée]galement\s+(autoris[ée]|interdit)|code\s+(p[ée]nal|civil)\s+article)\b/i,
      /\b(d[ée]claration\s+fiscale|impôts?\s+(sur|foncier)|d[ée]ficit\s+fiscal)\b/i,
      /\b(licenciement\s+(abusif|proc[ée]dure)|prud'hommes?|droit\s+du\s+travail\s+article)\b/i,
    ],
  },

  {
    intent: 'general_assistant',
    weight: 7,
    patterns: [
      /\b(traduis?|traduire\s+en|traduction\s+de)\b/i,
      /\b(qu'?est[- ]ce\s+que\s+(?!ma|mon|cette|cette?\s+situation|je\s+vis))\b/i,
      /\b(wikipedia|wikip[ée]dia|d[ée]finition\s+de\s+(?!ma|mon))\b/i,
      /\b(cherche[r]?\s+sur\s+internet|fais?\s+une?\s+recherche\s+google)\b/i,
      /\b(convertir?\s+\d+\s+(euros?|dollars?|kg|km|miles?)\s+en)\b/i,
      /\b(m[ée]t[ée]o\s+(de\s+)?(?!ma\s+vie|ma\s+situation))\b/i,
    ],
  },

  // ── IN-SCOPE ──────────────────────────────────────────────────────────────

  {
    intent: 'life_decision',
    weight: 5,
    patterns: [
      /\b(que\s+faire|quoi\s+faire|comment\s+choisir|quel\s+choix|choisir\s+entre)\b/i,
      /\b(d[ée]cision\s+[àa]\s+prendre|je\s+(dois|devrais?)\s+(d[ée]cider|choisir))\b/i,
      /\b(je\s+(n'?sais?|ne\s+sais?\s+pas)\s+(plus\s+)?quoi\s+(faire|d[ée]cider|choisir))\b/i,
      /\b(h[ée]siter?\s+entre|c[ôo]t[ée]\s+(positif|n[ée]gatif)|peser?\s+les?\s+options?)\b/i,
      /\b(rester?\s+ou\s+partir?|changer?\s+ou\s+attendre?|lancer?\s+ou\s+consolider?)\b/i,
    ],
  },

  {
    intent: 'relationship',
    weight: 5,
    patterns: [
      /\b(relation(nel)?|couple\b|amour\b|rupture|s[ée]paration|ex\b|retour\s+d'?ex)\b/i,
      /\b(famille|parents?|enfants?|fr[ée]re|sœur|am(is?|iti[ée]))\b/i,
      /\b(c[ée]libataire|rencontrer?\s+(quelqu'un|une?\s+personne)|draguer?)\b/i,
      /\b(conflit\s+(avec|familial|relationnel)|tension\s+(avec|dans\s+ma\s+relation))\b/i,
      /\b(communication\s+dans|lien\s+(avec|entre)|dynamique\s+relationnelle)\b/i,
      /\b(quelqu'un\s+(m'?ignore|m'?[ée]vite|me\s+blesse|me\s+manipule))\b/i,
    ],
  },

  {
    intent: 'career',
    weight: 5,
    patterns: [
      /\b(travail\b|carri[ée]re|emploi\b|job\b|entreprise|business\b|projet\s+perso)\b/i,
      /\b(professionnel(lement)?|[ée]volution\s+(professionnelle|de\s+carri[ée]re))\b/i,
      /\b(reconversion|changer?\s+de\s+(travail|m[ée]tier|poste)|chercher?\s+un\s+emploi)\b/i,
      /\b(patron|manager|coll[ée]gues?|[ée]quipe\s+de\s+travail|lieu\s+de\s+travail)\b/i,
      /\b(argent\b|finances?\s+personnelles?|stabilitÃ©\s+financi[ée]re|revenus?)\b/i,
      /\b(lancer?\s+(mon|son|un)\s+(projet|business|activit[ée]))\b/i,
    ],
  },

  {
    intent: 'personal_growth',
    weight: 5,
    patterns: [
      /\b(blocage|bloqu[ée]\b|j'?avance\s+pas|tourner?\s+en\s+rond)\b/i,
      /\b(confiance\s+en\s+(moi|soi)|manque\s+de\s+confiance|estime\s+de\s+soi)\b/i,
      /\b([ée]voluer?|grandir?\s+(int[ée]rieurement?|personnellement?)|me\s+d[ée]passer?)\b/i,
      /\b(peur\s+(de\s+|d'[ée]chouer|de\s+changer|du\s+regard)|anxiÃ©t[ée]\s+int[ée]rieure)\b/i,
      /\b(mieux\s+(me\s+)?comprendre|connaissance\s+de\s+moi|qui\s+je\s+suis\s+vraiment)\b/i,
      /\b(recentrer?|retrouver?\s+mon\s+axe|revenir\s+[àa]\s+moi|me\s+realigner?)\b/i,
    ],
  },

  {
    intent: 'life_situation',
    weight: 4,
    patterns: [
      /\b(situation\s+(actuelle|que\s+je\s+vis|difficile)|pÃ©riode\s+(difficile|de\s+transition))\b/i,
      /\b(je\s+(traverse|vis|ressens?|passe\s+par)\s+(une?\s+)?(p[ée]riode|phase|moment))\b/i,
      /\b(phase\s+(de\s+)?[ée]volution|[ée]tape\s+(de\s+)?ma\s+vie|tournant\s+de\s+ma\s+vie)\b/i,
      /\b(ce\s+qui\s+se\s+passe\s+(dans\s+ma\s+vie|pour\s+moi)|comprendre\s+ma\s+situation)\b/i,
      /\b(sens\s+(de\s+)?(ma\s+vie|ce\s+que\s+je\s+vis)|direction\s+(de\s+)?ma\s+vie)\b/i,
    ],
  },

  {
    intent: 'timing',
    weight: 4,
    patterns: [
      /\b(timing\b|bon\s+moment|mauvais\s+moment|moment\s+(id[ée]al|favorable|juste))\b/i,
      /\b(quand\s+(agir|lancer|d[ée]cider|partir|commencer|changer))\b/i,
      /\b(attendre\s+(ou\s+agir|ou\s+foncer)|agir\s+maintenant\s+ou\s+attendre)\b/i,
      /\b(cycle\s+(de\s+vie|actuel|du\s+moment)|phase\s+(favorable|de\s+action|de\s+repos))\b/i,
      /\b(prochains?\s+mois|mois\s+[àa]\s+venir|ann[ée]e\s+[àa]\s+venir|p[ée]riode\s+[àa]\s+venir)\b/i,
    ],
  },
]

// ── Classifier ───────────────────────────────────────────────────────────────

export function classifyUserIntent(message: string): UserIntent {
  const normalized = message.trim()

  if (/\b(j'ai\s+faim|jai\s+faim|que\s+manger|quoi\s+manger|quoi\s+cuisiner|qu'est-ce\s+que\s+je\s+peux\s+manger)\b/i.test(normalized)) {
    return 'practical_task'
  }

  // Empty or very short messages fall into life_situation by default
  if (normalized.length < 8) return 'life_situation'

  type Hit = { intent: UserIntent; score: number; weight: number }
  const hits: Hit[] = []

  for (const entry of INTENT_PATTERNS) {
    let score = 0
    for (const pattern of entry.patterns) {
      if (pattern.test(normalized)) score++
    }
    if (score > 0) {
      hits.push({ intent: entry.intent, score, weight: entry.weight })
    }
  }

  if (hits.length === 0) {
    // No match — assume it's a life situation question (safe default for HexAstra)
    return 'life_situation'
  }

  // Sort by weight desc, then score desc
  hits.sort((a, b) => b.weight - a.weight || b.score - a.score)

  return hits[0].intent
}
