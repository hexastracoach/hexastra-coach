import type { HexastraMenuItem, HexastraMode } from '@/lib/hexastra/types'

const libreMenu: HexastraMenuItem[] = [
  {
    key: 'neurokua',
    label: 'NeuroKua™',
    description: 'Regle ton etat interieur et ton energie du moment.',
    contextType: 'energy',
    domainRoute: 'neurokua',
    promptHint: 'Active le module NeuroKua et la logique GPS/Kua si utile.',
    submenu: [
      { key: 'state_today', label: 'Mon etat du jour', description: 'Un scan simple de ton etat global.', contextType: 'energy', domainRoute: 'neurokua', promptHint: 'Produire directement un scan NeuroKua du jour.' },
      { key: 'fatigue_recharge', label: 'Fatigue / recharge', description: 'Comprendre et recharger ce qui manque.', contextType: 'wellbeing', domainRoute: 'neurokua', promptHint: 'Diagnostiquer la fatigue et prioriser la recharge.' },
      { key: 'stress_overload', label: 'Stress / surcharge', description: 'Identifier la tension et la faire redescendre.', contextType: 'wellbeing', domainRoute: 'neurokua', promptHint: 'Identifier la surcharge et donner un levier simple de stabilisation.' },
      { key: 'stability_or_action', label: 'Stabilite ou action', description: 'Savoir s il faut agir ou consolider.', contextType: 'decision', domainRoute: 'neurokua', promptHint: 'Dire clairement si le moment demande action, consolidation ou recuperation.' },
      { key: 'quick_adjustment', label: 'Ajustement rapide', description: 'Une action courte qui change le ressenti.', contextType: 'energy', domainRoute: 'neurokua', promptHint: 'Donner un ajustement bref et immediat.' },
    ],
  },
  {
    key: 'energy_now',
    label: 'Energie du moment',
    description: "Lis la tendance du jour et ce qu'elle active en toi.",
    contextType: 'energy',
    domainRoute: 'general',
    submenu: [
      { key: 'emotional_state', label: 'Etat emotionnel', description: "Nommer l'ambiance interieure du jour.", contextType: 'energy' },
      { key: 'motivation', label: 'Motivation / elan', description: 'Mesurer ton niveau d elan reel.', contextType: 'energy' },
      { key: 'act_or_rest', label: 'Agir ou recuperer', description: 'Choisir le bon rythme aujourd hui.', contextType: 'decision' },
      { key: 'priority_zone', label: 'Zone prioritaire', description: 'Voir ou la vie te pousse a regarder.', contextType: 'general' },
    ],
  },
  {
    key: 'relations',
    label: 'Amour / Relations',
    description: 'Clarifie tes dynamiques affectives et sociales.',
    contextType: 'relationship',
    domainRoute: 'relationship',
    submenu: [
      { key: 'single', label: 'Celibataire', description: 'Attirer juste sans se trahir.', contextType: 'relationship' },
      { key: 'couple', label: 'En couple', description: 'Ajuster le lien et la communication.', contextType: 'relationship' },
      { key: 'complex_relation', label: 'Relation compliquee', description: 'Clarifier le noeud et le levier.', contextType: 'relationship' },
      { key: 'family', label: 'Famille / proches', description: 'Pacifier et mieux poser tes limites.', contextType: 'relationship' },
      { key: 'specific_person', label: 'Une personne precise', description: 'Comprendre la dynamique entre vous.', contextType: 'relationship' },
    ],
  },
  {
    key: 'career',
    label: 'Travail / Argent',
    description: 'Oriente tes choix pro et ta stabilite materielle.',
    contextType: 'career',
    domainRoute: 'career',
    submenu: [
      { key: 'current_situation', label: 'Situation actuelle', description: 'Lire ce qui est en train de se jouer.', contextType: 'career' },
      { key: 'evolution', label: 'Evolution / changement', description: 'Choisir ta prochaine marche.', contextType: 'career' },
      { key: 'conflicts', label: 'Ambiance / conflits', description: 'Reduire la friction et gagner en stabilite.', contextType: 'career' },
      { key: 'money_security', label: 'Argent / securite', description: 'Securiser et prioriser sans panique.', contextType: 'career' },
      { key: 'personal_project', label: 'Projet perso', description: 'Avancer avec un plan realiste.', contextType: 'career' },
    ],
  },
  {
    key: 'wellbeing',
    label: 'Bien-etre / Etat interieur',
    description: 'Apaise, recentre et retrouve ton axe.',
    contextType: 'wellbeing',
    domainRoute: 'wellbeing',
    submenu: [
      { key: 'stress', label: 'Stress', description: 'Retrouver du calme mental.', contextType: 'wellbeing' },
      { key: 'fatigue', label: 'Fatigue', description: 'Reprendre de la force sans te forcer.', contextType: 'wellbeing' },
      { key: 'confidence', label: 'Confiance', description: 'Reactiver ton assurance.', contextType: 'wellbeing' },
      { key: 'motivation_wb', label: 'Motivation', description: 'Relancer ton moteur interne.', contextType: 'wellbeing' },
      { key: 'recenter', label: 'Recentrage', description: 'Revenir a ton axe et a l essentiel.', contextType: 'wellbeing' },
    ],
  },
  {
    key: 'decision',
    label: 'Decision a prendre',
    description: 'Compare tes options et choisis avec clarte.',
    contextType: 'decision',
    domainRoute: 'decision',
    submenu: [
      { key: 'decision_pro', label: 'Pro', description: 'Choisir avec logique et timing.', contextType: 'decision' },
      { key: 'decision_relation', label: 'Relationnel', description: 'Choisir sans te perdre.', contextType: 'decision' },
      { key: 'decision_project', label: 'Projet', description: 'Valider la direction et l energie.', contextType: 'decision' },
      { key: 'change_or_wait', label: 'Changer ou attendre', description: 'Savoir quand bouger et quand tenir.', contextType: 'decision' },
      { key: 'global_decision', label: 'Analyse globale', description: 'Trancher avec une vue complete.', contextType: 'decision' },
    ],
  },
  {
    key: 'timing',
    label: 'Vision des prochains mois',
    description: 'Anticipe la phase a venir et ton timing.',
    contextType: 'timing',
    domainRoute: 'timing',
    submenu: [
      { key: 'general_trends', label: 'Tendances generales', description: 'Voir la meteo globale de ta phase.', contextType: 'timing' },
      { key: 'when_act', label: 'Periode pour agir', description: 'Reperer les fenetres d action.', contextType: 'timing' },
      { key: 'when_stabilize', label: 'Periode pour stabiliser', description: 'Consolider ce qui doit tenir.', contextType: 'timing' },
      { key: 'watch_domains', label: 'Domaines a surveiller', description: 'Anticiper les points sensibles.', contextType: 'timing' },
      { key: 'strategic_advice', label: 'Conseils strategiques', description: 'Plan simple pour avancer.', contextType: 'timing' },
    ],
  },
  {
    key: 'general',
    label: 'Lecture generale pour moi',
    description: 'Synthese complete de ton moment actuel.',
    contextType: 'hexastraReading',
    domainRoute: 'fusion',
    submenu: [
      { key: 'quick_summary', label: 'Synthese rapide', description: 'L essentiel en peu de lignes.', contextType: 'general' },
      { key: 'detailed_reading', label: 'Lecture detaillee', description: 'Une lecture plus profonde et structuree.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Produire une lecture fusionnee detaillee et directement utile.' },
      { key: 'current_strengths', label: 'Forces du moment', description: 'Ce qui te porte naturellement.', contextType: 'general' },
      { key: 'vigilance_points', label: 'Vigilances', description: 'Ce qui peut te freiner si tu forces.', contextType: 'general' },
      { key: 'orientation', label: 'Orientation', description: 'La direction prioritaire a suivre.', contextType: 'general' },
    ],
  },
  {
    key: 'science',
    label: 'Analyse par science',
    description: 'Choisis une science pour eclairer la situation avec un angle specifique.',
    contextType: 'science',
    domainRoute: 'science',
    submenu: [
      { key: 'science_neurokua', label: 'NeuroKua™', description: 'Equilibre mental, energie, rythme.', contextType: 'energy', domainRoute: 'neurokua', promptHint: 'Lecture NeuroKua specialisee et directe.' },
      { key: 'science_astrolex', label: 'Astrolex™', description: 'Influences actuelles, phase traversee.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Lecture Astrolex du cycle, de la phase et du timing.' },
      { key: 'science_porteum', label: 'Porteum™', description: 'Fonctionnement naturel et energie.', contextType: 'energy', domainRoute: 'science', promptHint: 'Lecture Porteum centree sur le fonctionnement naturel et l incarnation.' },
      { key: 'science_triangle', label: 'TriangleNumeris™', description: 'Cycle actuel et ce qu il favorise.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Lecture TriangleNumeris du cycle dominant et de la temporalite.' },
      { key: 'science_enneagram', label: 'Enneagramme™', description: 'Reactions automatiques et leviers.', contextType: 'relationship', domainRoute: 'science', promptHint: 'Lecture archetypale des reactions, defenses et leviers.' },
      { key: 'science_kua', label: 'Kua™', description: 'Orientation et environnement personnel.', contextType: 'decision', domainRoute: 'gps_kua', promptHint: 'Lecture Kua de l orientation et du positionnement utile.' },
      { key: 'science_fusion', label: 'Fusion complete™', description: 'Synthese avec tous les angles.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Lecture fusionnee complete avec arbitrage des dominantes.' },
    ],
  },
]

const practitionerMenu: HexastraMenuItem[] = [
  {
    key: 'pract_neurokua',
    label: 'NeuroKua™',
    description: 'Diagnostic de l etat interne et reglages d equilibre.',
    contextType: 'energy',
    domainRoute: 'neurokua',
    submenu: [
      { key: 'balance', label: 'Equilibre global', description: 'Mesure de coherence et stabilite interne.', contextType: 'energy', domainRoute: 'neurokua' },
      { key: 'dominant_imbalance', label: 'Desequilibre dominant', description: 'Identifier l axe principal de correction.', contextType: 'energy', domainRoute: 'neurokua' },
      { key: 'recovery', label: 'Surcharge / recuperation', description: 'Evaluer le risque d epuisement.', contextType: 'wellbeing', domainRoute: 'neurokua' },
      { key: 'prioritized_adjustments', label: 'Ajustements prioritaires', description: 'Actions a fort effet immediat.', contextType: 'decision', domainRoute: 'neurokua' },
      { key: 'protocol', label: 'Protocole court', description: 'Routine simple de stabilisation.', contextType: 'energy', domainRoute: 'neurokua' },
    ],
  },
  { key: 'pract_relation', label: 'Relationnel™', description: 'Lecture des dynamiques, tensions et leviers relationnels.', contextType: 'relationship', domainRoute: 'relationship' },
  { key: 'pract_professional', label: 'Professionnel™', description: 'Analyse de positionnement, risques et strategie d evolution.', contextType: 'career', domainRoute: 'career' },
  { key: 'pract_cycle', label: 'Cycle a venir™', description: 'Projection de phase et timing d action a moyen terme.', contextType: 'timing', domainRoute: 'timing' },
  { key: 'pract_decision', label: 'Decision precise™', description: 'Comparatif structure A/B avec risques et plan.', contextType: 'decision', domainRoute: 'decision' },
  { key: 'pract_general', label: 'Lecture generale actuelle™', description: 'Synthese multidimensionnelle exploitable.', contextType: 'hexastraReading', domainRoute: 'fusion' },
  {
    key: 'science',
    label: 'Analyses par science',
    description: 'Choisis une science pour eclairer la situation.',
    contextType: 'science',
    domainRoute: 'science',
    submenu: [
      { key: 'science_neurokua', label: 'NeuroKua™', description: 'Diagnostic d equilibre et de regulation.', contextType: 'energy', domainRoute: 'neurokua', promptHint: 'Lecture praticienne NeuroKua centree sur le diagnostic d equilibre.' },
      { key: 'science_astrolex', label: 'Astrolex™', description: 'Phase, activation, timing.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Lecture praticienne Astrolex centree sur la phase et le timing.' },
      { key: 'science_porteum', label: 'Porteum™', description: 'Fonctionnement d incarnation.', contextType: 'energy', domainRoute: 'science', promptHint: 'Lecture praticienne Porteum du fonctionnement naturel.' },
      { key: 'science_triangle', label: 'TriangleNumeris™', description: 'Cycle et temporalite.', contextType: 'timing', domainRoute: 'timing', promptHint: 'Lecture praticienne du cycle et des leviers numeriques.' },
      { key: 'science_enneagram', label: 'Enneagramme™', description: 'Defense, reaction, levier.', contextType: 'relationship', domainRoute: 'science', promptHint: 'Lecture praticienne archetypale des mecanismes et du levier.' },
      { key: 'science_kua', label: 'Kua™', description: 'Orientation et environnement.', contextType: 'decision', domainRoute: 'gps_kua', promptHint: 'Lecture praticienne Kua/GPS du positionnement optimal.' },
      { key: 'science_fusion', label: 'Fusion complete™', description: 'Synthese complete exploitable.', contextType: 'hexastraReading', domainRoute: 'fusion', promptHint: 'Lecture praticienne fusionnee, structuree et exploitable.' },
    ],
  },
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
