import type { HexastraMenuItem, HexastraMode } from '@/lib/hexastra/types'

const libreMenu: HexastraMenuItem[] = [
  {
    key: 'neurokua',
    label: 'NeuroKua\u2122',
    description: 'Règle ton état intérieur et ton énergie du moment.',
    contextType: 'energy',
    domainRoute: 'neurokua',
    promptHint: 'Active le module NeuroKua et la logique GPS/Kua si utile.',
    submenu: [
      { key: 'state_today', label: 'Mon état du jour', description: 'Un scan simple de ton état global.', contextType: 'energy', domainRoute: 'neurokua' },
      { key: 'fatigue_recharge', label: 'Fatigue / recharge', description: 'Comprendre et recharger ce qui manque.', contextType: 'wellbeing', domainRoute: 'neurokua' },
      { key: 'stress_overload', label: 'Stress / surcharge', description: 'Identifier la tension et la faire redescendre.', contextType: 'wellbeing', domainRoute: 'neurokua' },
      { key: 'stability_or_action', label: 'Stabilité ou action', description: 'Savoir s’il faut agir ou consolider.', contextType: 'decision', domainRoute: 'neurokua' },
      { key: 'quick_adjustment', label: 'Ajustement rapide', description: 'Une action courte qui change le ressenti.', contextType: 'energy', domainRoute: 'neurokua' },
    ],
  },
  {
    key: 'energy_now',
    label: 'Énergie du moment',
    description: 'Lis la tendance du jour et ce qu’elle active en toi.',
    contextType: 'energy',
    domainRoute: 'general',
    submenu: [
      { key: 'emotional_state', label: 'État émotionnel', description: 'Nommer l’ambiance intérieure du jour.', contextType: 'energy' },
      { key: 'motivation', label: 'Motivation / élan', description: 'Mesurer ton niveau d’élan réel.', contextType: 'energy' },
      { key: 'act_or_rest', label: 'Agir ou récupérer', description: 'Choisir le bon rythme aujourd’hui.', contextType: 'decision' },
      { key: 'priority_zone', label: 'Zone prioritaire', description: 'Voir où la vie te pousse à regarder.', contextType: 'general' },
    ],
  },
  {
    key: 'relations',
    label: 'Amour / Relations',
    description: 'Clarifie tes dynamiques affectives et sociales.',
    contextType: 'relationship',
    domainRoute: 'relationship',
    submenu: [
      { key: 'single', label: 'Célibataire', description: 'Attirer juste sans se trahir.', contextType: 'relationship' },
      { key: 'couple', label: 'En couple', description: 'Ajuster le lien et la communication.', contextType: 'relationship' },
      { key: 'complex_relation', label: 'Relation compliquée', description: 'Clarifier le nœud et le levier.', contextType: 'relationship' },
      { key: 'family', label: 'Famille / proches', description: 'Pacifier et mieux poser tes limites.', contextType: 'relationship' },
      { key: 'specific_person', label: 'Une personne précise', description: 'Comprendre la dynamique entre vous.', contextType: 'relationship' },
    ],
  },
  {
    key: 'career',
    label: 'Travail / Argent',
    description: 'Oriente tes choix pro et ta stabilité matérielle.',
    contextType: 'career',
    domainRoute: 'career',
    submenu: [
      { key: 'current_situation', label: 'Situation actuelle', description: 'Lire ce qui est en train de se jouer.', contextType: 'career' },
      { key: 'evolution', label: 'Évolution / changement', description: 'Choisir ta prochaine marche.', contextType: 'career' },
      { key: 'conflicts', label: 'Ambiance / conflits', description: 'Réduire la friction et gagner en stabilité.', contextType: 'career' },
      { key: 'money_security', label: 'Argent / sécurité', description: 'Sécuriser et prioriser sans panique.', contextType: 'career' },
      { key: 'personal_project', label: 'Projet perso', description: 'Avancer avec un plan réaliste.', contextType: 'career' },
    ],
  },
  {
    key: 'wellbeing',
    label: 'Bien-être / État intérieur',
    description: 'Apaise, recentre et retrouve ton axe.',
    contextType: 'wellbeing',
    domainRoute: 'wellbeing',
    submenu: [
      { key: 'stress', label: 'Stress', description: 'Retrouver du calme mental.', contextType: 'wellbeing' },
      { key: 'fatigue', label: 'Fatigue', description: 'Reprendre de la force sans te forcer.', contextType: 'wellbeing' },
      { key: 'confidence', label: 'Confiance', description: 'Réactiver ton assurance.', contextType: 'wellbeing' },
      { key: 'motivation_wb', label: 'Motivation', description: 'Relancer ton moteur interne.', contextType: 'wellbeing' },
      { key: 'recenter', label: 'Recentrage', description: 'Revenir à ton axe et à l’essentiel.', contextType: 'wellbeing' },
    ],
  },
  {
    key: 'decision',
    label: 'Décision à prendre',
    description: 'Compare tes options et choisis avec clarté.',
    contextType: 'decision',
    domainRoute: 'decision',
    submenu: [
      { key: 'decision_pro', label: 'Pro', description: 'Choisir avec logique et timing.', contextType: 'decision' },
      { key: 'decision_relation', label: 'Relationnel', description: 'Choisir sans te perdre.', contextType: 'decision' },
      { key: 'decision_project', label: 'Projet', description: 'Valider la direction et l’énergie.', contextType: 'decision' },
      { key: 'change_or_wait', label: 'Changer ou attendre', description: 'Savoir quand bouger et quand tenir.', contextType: 'decision' },
      { key: 'global_decision', label: 'Analyse globale', description: 'Trancher avec une vue complète.', contextType: 'decision' },
    ],
  },
  {
    key: 'timing',
    label: 'Vision des prochains mois',
    description: 'Anticipe la phase à venir et ton timing.',
    contextType: 'timing',
    domainRoute: 'timing',
    submenu: [
      { key: 'general_trends', label: 'Tendances générales', description: 'Voir la météo globale de ta phase.', contextType: 'timing' },
      { key: 'when_act', label: 'Période pour agir', description: 'Repérer les fenêtres d’action.', contextType: 'timing' },
      { key: 'when_stabilize', label: 'Période pour stabiliser', description: 'Consolider ce qui doit tenir.', contextType: 'timing' },
      { key: 'watch_domains', label: 'Domaines à surveiller', description: 'Anticiper les points sensibles.', contextType: 'timing' },
      { key: 'strategic_advice', label: 'Conseils stratégiques', description: 'Plan simple pour avancer.', contextType: 'timing' },
    ],
  },
  {
    key: 'general',
    label: 'Lecture générale pour moi',
    description: 'Synthèse complète de ton moment actuel.',
    contextType: 'hexastraReading',
    domainRoute: 'fusion',
    submenu: [
      { key: 'quick_summary', label: 'Synthèse rapide', description: 'L’essentiel en peu de lignes.', contextType: 'general' },
      { key: 'detailed_reading', label: 'Lecture détaillée', description: 'Une lecture plus profonde et structurée.', contextType: 'hexastraReading', domainRoute: 'fusion' },
      { key: 'current_strengths', label: 'Forces du moment', description: 'Ce qui te porte naturellement.', contextType: 'general' },
      { key: 'vigilance_points', label: 'Vigilances', description: 'Ce qui peut te freiner si tu forces.', contextType: 'general' },
      { key: 'orientation', label: 'Orientation', description: 'La direction prioritaire à suivre.', contextType: 'general' },
    ],
  },
]

const practitionerMenu: HexastraMenuItem[] = [
  {
    key: 'pract_neurokua',
    label: 'NeuroKua\u2122',
    description: 'Diagnostic de l’état interne et réglages d’équilibre.',
    contextType: 'energy',
    domainRoute: 'neurokua',
    submenu: [
      { key: 'balance', label: 'Équilibre global', description: 'Mesure de cohérence et stabilité interne.', contextType: 'energy', domainRoute: 'neurokua' },
      { key: 'dominant_imbalance', label: 'Déséquilibre dominant', description: 'Identifier l’axe principal de correction.', contextType: 'energy', domainRoute: 'neurokua' },
      { key: 'recovery', label: 'Surcharge / récupération', description: 'Évaluer le risque d’épuisement.', contextType: 'wellbeing', domainRoute: 'neurokua' },
      { key: 'prioritized_adjustments', label: 'Ajustements prioritaires', description: 'Actions à fort effet immédiat.', contextType: 'decision', domainRoute: 'neurokua' },
      { key: 'protocol', label: 'Protocole court', description: 'Routine simple de stabilisation.', contextType: 'energy', domainRoute: 'neurokua' },
    ],
  },
  { key: 'pract_relation', label: 'Relationnel\u2122', description: 'Lecture des dynamiques, tensions et leviers relationnels.', contextType: 'relationship', domainRoute: 'relationship' },
  { key: 'pract_professional', label: 'Professionnel\u2122', description: 'Analyse de positionnement, risques et stratégie d’évolution.', contextType: 'career', domainRoute: 'career' },
  { key: 'pract_cycle', label: 'Cycle à venir\u2122', description: 'Projection de phase et timing d’action à moyen terme.', contextType: 'timing', domainRoute: 'timing' },
  { key: 'pract_decision', label: 'Décision précise\u2122', description: 'Comparatif structuré A/B avec risques et plan.', contextType: 'decision', domainRoute: 'decision' },
  { key: 'pract_general', label: 'Lecture générale actuelle\u2122', description: 'Synthèse multidimensionnelle exploitable.', contextType: 'hexastraReading', domainRoute: 'fusion' },
  { key: 'science', label: 'Analyses par science', description: 'Choisis une science pour éclairer la situation.', contextType: 'science', domainRoute: 'science' },
]

export function getMenuForMode(mode: HexastraMode): HexastraMenuItem[] {
  return mode === 'praticien' ? practitionerMenu : libreMenu
}

export function findMenuItem(items: HexastraMenuItem[], key?: string | null): HexastraMenuItem | null {
  if (!key || !Array.isArray(items)) return null
  for (const item of items) {
    if (item.key === key) return item
    const sub = item.submenu?.find((child) => child.key === key)
    if (sub) return sub
  }
  return null
}
