/**
 * Intent classifier - pure lexical/pattern matching.
 * No API call, no latency. Runs entirely client-side.
 */

export type UserIntent =
  | 'life_decision'
  | 'relationship'
  | 'career'
  | 'personal_growth'
  | 'life_situation'
  | 'timing'
  | 'technical_question'
  | 'academic_question'
  | 'practical_task'
  | 'medical_question'
  | 'legal_question'
  | 'general_assistant'

type PatternEntry = {
  intent: UserIntent
  patterns: RegExp[]
  weight: number
}

function normalizeIntentText(message: string) {
  return (message || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'+\s?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const INTENT_PATTERNS: PatternEntry[] = [
  {
    intent: 'technical_question',
    weight: 10,
    patterns: [
      /\b(coder?|programmer?|debugger?|bug\b|erreur\s+(de\s+)?code|stack\s*overflow)\b/i,
      /\b(javascript|typescript|python|java\b|c\+\+|react\b|sql\b|html\b|css\b|api\b)\b/i,
      /\b(serveur|backend|frontend|deployer|docker|git\b|github|npm|node\.?js)\b/i,
      /\b(algorithme|fonction|variable|objet|classe?\b|module|import|export)\b/i,
      /\b(ordinateur|pc\b|mac\b|windows|linux|logiciel|application\s+mobile)\b/i,
      /\b(reseau\s+wifi|connexion\s+internet|vpn\b|firewall|ip\s+adresse)\b/i,
    ],
  },
  {
    intent: 'academic_question',
    weight: 10,
    patterns: [
      /\b(dissertation|devoir|exercice\s+(scolaire|de\s+maths?|de\s+physique))\b/i,
      /\b(bac\b|brevet|examen\s+(scolaire|universit)|concours\s+(scolaire|prepa))\b/i,
      /\b(resoudre?\s+(une?\s+)?equation|integrale|derivee|calcul\s+matriciel)\b/i,
      /\b(citer?\s+les?\s+sources|bibliographie|theoreme\s+de|demontrer?\s+que)\b/i,
      /\b(cours\s+de\s+(maths?|histoire|physique|chimie|biologie|philosophie))\b/i,
      /\b(corriger?\s+mon\s+(devoir|texte\s+scolaire|redaction\s+scolaire))\b/i,
    ],
  },
  {
    intent: 'practical_task',
    weight: 9,
    patterns: [
      /\b(recette\s+de|cuisiner?|cuire?\s+le?|faire?\s+cuire|ingredients?\s+pour)\b/i,
      /\b(reparer?\s+(une?\s+)?(voiture|moteur|tuyau|frein|fuite|robinet|machine))\b/i,
      /\b(bricolage|monter?\s+(un\s+meuble|un\s+kit)|visser?|peindre?\s+(un\s+mur|une?\s+piece))\b/i,
      /\b(installer?\s+(un[e]?\s+)?logiciel|pilote\s+imprimante|configurer?\s+(le\s+)?wifi)\b/i,
      /\b(plomberie|electricite\s+domestique|changer?\s+(un\s+)?disjoncteur)\b/i,
    ],
  },
  {
    intent: 'medical_question',
    weight: 9,
    patterns: [
      /\b(diagnostic\s+medical|symptomes?\s+(de\s+)?(maladie|infection|virus))\b/i,
      /\b(medicaments?\s+(pour|contre|dosage)|posologie|prescription)\b/i,
      /\b(traitement\s+medical|ordonnance|medecin\s+(generaliste))\b/i,
      /\b(douleur\s+(chronique|aigue|persistante)|infection\s+(bacterienne|virale))\b/i,
      /\b(chirurgie|operation\s+medicale|hospitalisation|urgences?\s+medicales?)\b/i,
    ],
  },
  {
    intent: 'legal_question',
    weight: 9,
    patterns: [
      /\b(avocat|tribunal|proces|jugement\s+(juridique)|plaidoirie)\b/i,
      /\b(contrat\s+(de\s+travail|de\s+bail|de\s+vente)\s+a\s+verifier)\b/i,
      /\b(legalement\s+(autorise|interdit)|code\s+(penal|civil)\s+article)\b/i,
      /\b(declaration\s+fiscale|impots?\s+(sur|foncier)|deficit\s+fiscal)\b/i,
      /\b(licenciement\s+(abusif|procedure)|prud'hommes?|droit\s+du\s+travail\s+article)\b/i,
    ],
  },
  {
    intent: 'general_assistant',
    weight: 7,
    patterns: [
      /\b(traduis?|traduire\s+en|traduction\s+de)\b/i,
      /\b(qu'?est[- ]ce\s+que\s+(?!ma|mon|cette|situation|je\s+vis))\b/i,
      /\b(wikipedia|definition\s+de\s+(?!ma|mon))\b/i,
      /\b(cherche[r]?\s+sur\s+internet|fais?\s+une?\s+recherche\s+google)\b/i,
      /\b(convertir?\s+\d+\s+(euros?|dollars?|kg|km|miles?)\s+en)\b/i,
      /\b(meteo\s+(de\s+)?(?!ma\s+vie|ma\s+situation))\b/i,
    ],
  },
  {
    intent: 'life_decision',
    weight: 5,
    patterns: [
      /\b(que\s+faire|quoi\s+faire|comment\s+choisir|quel\s+choix|choisir\s+entre)\b/i,
      /\b(decision\s+a\s+prendre|je\s+(dois|devrais?)\s+(decider|choisir))\b/i,
      /\b(je\s+(n'?sais?|ne\s+sais?\s+pas)\s+(plus\s+)?quoi\s+(faire|decider|choisir))\b/i,
      /\b(hesiter?\s+entre|cote\s+(positif|negatif)|peser?\s+les?\s+options?)\b/i,
      /\b(rester?\s+ou\s+partir?|changer?\s+ou\s+attendre?|lancer?\s+ou\s+consolider?)\b/i,
    ],
  },
  {
    intent: 'relationship',
    weight: 5,
    patterns: [
      /\b(relation(nel)?|couple\b|amour\b|rupture|separation|ex\b|retour\s+d'?ex)\b/i,
      /\b(famille|parents?|enfants?|frere|soeur|am(is?|itie))\b/i,
      /\b(celibataire|rencontrer?\s+(quelqu'un|une?\s+personne)|draguer?)\b/i,
      /\b(conflit\s+(avec|familial|relationnel)|tension\s+(avec|dans\s+ma\s+relation))\b/i,
      /\b(communication\s+dans|lien\s+(avec|entre)|dynamique\s+relationnelle)\b/i,
      /\b(quelqu'un\s+(m'?ignore|m'?[e]vite|me\s+blesse|me\s+manipule))\b/i,
    ],
  },
  {
    intent: 'career',
    weight: 5,
    patterns: [
      /\b(travail\b|carriere|emploi\b|job\b|entreprise|business\b|projet\s+perso)\b/i,
      /\b(professionnel(lement)?|evolution\s+(professionnelle|de\s+carriere))\b/i,
      /\b(reconversion|changer?\s+de\s+(travail|metier|poste)|chercher?\s+un\s+emploi)\b/i,
      /\b(patron|manager|collegues?|equipe\s+de\s+travail|lieu\s+de\s+travail)\b/i,
      /\b(argent\b|finances?\s+personnelles?|stabilite\s+financiere|revenus?)\b/i,
      /\b(lancer?\s+(mon|son|un)\s+(projet|business|activite))\b/i,
    ],
  },
  {
    intent: 'personal_growth',
    weight: 5,
    patterns: [
      /\b(blocage|bloque\b|j'?avance\s+pas|tourner?\s+en\s+rond)\b/i,
      /\b(confiance\s+en\s+(moi|soi)|manque\s+de\s+confiance|estime\s+de\s+soi)\b/i,
      /\b(evoluer?|grandir?\s+(interieurement?|personnellement?)|me\s+depasser?)\b/i,
      /\b(peur\s+(de\s+|d'echouer|de\s+changer|du\s+regard)|anxiete\s+interieure)\b/i,
      /\b(mieux\s+(me\s+)?comprendre|connaissance\s+de\s+moi|qui\s+je\s+suis\s+vraiment)\b/i,
      /\b(recentrer?|retrouver?\s+mon\s+axe|revenir\s+a\s+moi|me\s+realigner?)\b/i,
    ],
  },
  {
    intent: 'life_situation',
    weight: 4,
    patterns: [
      /\b(situation\s+(actuelle|que\s+je\s+vis|difficile)|periode\s+(difficile|de\s+transition))\b/i,
      /\b(je\s+(traverse|vis|ressens?|passe\s+par)\s+(une?\s+)?(periode|phase|moment))\b/i,
      /\b(phase\s+(de\s+)?evolution|etape\s+(de\s+)?ma\s+vie|tournant\s+de\s+ma\s+vie)\b/i,
      /\b(ce\s+qui\s+se\s+passe\s+(dans\s+ma\s+vie|pour\s+moi)|comprendre\s+ma\s+situation)\b/i,
      /\b(sens\s+(de\s+)?(ma\s+vie|ce\s+que\s+je\s+vis)|direction\s+(de\s+)?ma\s+vie)\b/i,
    ],
  },
  {
    intent: 'timing',
    weight: 4,
    patterns: [
      /\b(timing\b|bon\s+moment|mauvais\s+moment|moment\s+(ideal|favorable|juste))\b/i,
      /\b(quand\s+(agir|lancer|decider|partir|commencer|changer))\b/i,
      /\b(attendre\s+(ou\s+agir|ou\s+foncer)|agir\s+maintenant\s+ou\s+attendre)\b/i,
      /\b(cycle\s+(de\s+vie|actuel|du\s+moment)|phase\s+(favorable|de\s+action|de\s+repos))\b/i,
      /\b(prochains?\s+mois|mois\s+a\s+venir|annee\s+a\s+venir|periode\s+a\s+venir)\b/i,
    ],
  },
]

export function classifyUserIntent(message: string): UserIntent {
  const normalized = normalizeIntentText(message)

  if (
    /\b(j'ai\s+faim|jai\s+faim|que\s+manger|quoi\s+manger|quoi\s+cuisiner|qu'est-ce\s+que\s+je\s+peux\s+manger)\b/i.test(
      normalized
    )
  ) {
    return 'practical_task'
  }

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
    return 'life_situation'
  }

  hits.sort((a, b) => b.weight - a.weight || b.score - a.score)
  return hits[0].intent
}
