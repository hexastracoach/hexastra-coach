import type { HexastraMode } from '@/lib/hexastra/types'

export type PromptMenuNode = {
  key: string
  label: string
  description?: string
  contextType?: string
  domainRoute?: string
  children?: PromptMenuNode[]
}

export const PROMPT_MENU: Record<HexastraMode, PromptMenuNode[]> = {
  libre: [
    {
      key: 'neurokua',
      label: 'NeuroKua™',
      description: 'Regule ton etat interieur et ton energie du moment.',
      contextType: 'energy',
      domainRoute: 'neurokua',
      children: [
        { key: 'state_today', label: 'Mon etat du jour', description: 'Scan global.', contextType: 'energy' },
        { key: 'fatigue_recharge', label: 'Fatigue / recharge', description: 'Comprendre et recharger.', contextType: 'wellbeing' },
        { key: 'stress_overload', label: 'Stress / surcharge', description: 'Identifier la tension.', contextType: 'wellbeing' },
        { key: 'stability_or_action', label: 'Stabilite ou action', description: 'Agir ou consolider.', contextType: 'decision' },
        { key: 'quick_adjustment', label: 'Ajustement rapide', description: 'Action courte qui change le ressenti.', contextType: 'energy' },
      ],
    },
    {
      key: 'energy_now',
      label: 'Energie du moment',
      description: "Lis la tendance du jour et ce qu'elle active en toi.",
      contextType: 'energy',
      domainRoute: 'general',
      children: [
        { key: 'emotional_state', label: 'Etat emotionnel', description: "Nommer l'ambiance interieure.", contextType: 'energy' },
        { key: 'motivation', label: 'Motivation / elan', description: 'Mesurer ton elan reel.', contextType: 'energy' },
        { key: 'act_or_rest', label: 'Agir ou recuperer', description: "Choisir le bon rythme aujourd'hui.", contextType: 'decision' },
        { key: 'priority_zone', label: 'Zone prioritaire', description: 'Voir ou porter ton regard.', contextType: 'general' },
      ],
    },
    {
      key: 'relations',
      label: 'Amour / Relations',
      description: 'Clarifie tes dynamiques affectives et sociales.',
      contextType: 'relationship',
      domainRoute: 'relationship',
      children: [
        { key: 'single', label: 'Celibataire', description: 'Attirer juste sans se trahir.', contextType: 'relationship' },
        { key: 'couple', label: 'En couple', description: 'Ajuster lien et communication.', contextType: 'relationship' },
        { key: 'complex_relation', label: 'Relation compliquee', description: 'Clarifier le noeud et le levier.', contextType: 'relationship' },
        { key: 'family', label: 'Famille / proches', description: 'Pacifier et poser tes limites.', contextType: 'relationship' },
        { key: 'specific_person', label: 'Une personne precise', description: 'Comprendre la dynamique entre vous.', contextType: 'relationship' },
      ],
    },
    {
      key: 'career',
      label: 'Travail / Argent',
      description: 'Oriente tes choix pro et ta stabilite materielle.',
      contextType: 'career',
      domainRoute: 'career',
      children: [
        { key: 'current_situation', label: 'Situation actuelle', description: 'Ce qui se joue.', contextType: 'career' },
        { key: 'evolution', label: 'Evolution / changement', description: 'Choisir ta prochaine marche.', contextType: 'career' },
        { key: 'conflicts', label: 'Ambiance / conflits', description: 'Reduire la friction.', contextType: 'career' },
        { key: 'money_security', label: 'Argent / securite', description: 'Securiser sans panique.', contextType: 'career' },
        { key: 'personal_project', label: 'Projet perso', description: 'Plan realiste.', contextType: 'career' },
      ],
    },
    {
      key: 'wellbeing',
      label: 'Bien-etre / Etat interieur',
      description: 'Apaise, recentre et retrouve ton axe.',
      contextType: 'wellbeing',
      domainRoute: 'wellbeing',
      children: [
        { key: 'stress', label: 'Stress', description: 'Retrouver du calme mental.', contextType: 'wellbeing' },
        { key: 'fatigue', label: 'Fatigue', description: 'Reprendre de la force.', contextType: 'wellbeing' },
        { key: 'confidence', label: 'Confiance', description: 'Reactiver ton assurance.', contextType: 'wellbeing' },
        { key: 'motivation_wb', label: 'Motivation', description: 'Relancer ton moteur interne.', contextType: 'wellbeing' },
        { key: 'recenter', label: 'Recentrage', description: 'Revenir a ton axe.', contextType: 'wellbeing' },
      ],
    },
    {
      key: 'decision',
      label: 'Decision a prendre',
      description: 'Compare tes options et choisis avec clarte.',
      contextType: 'decision',
      domainRoute: 'decision',
      children: [
        { key: 'decision_pro', label: 'Pro', description: 'Choisir avec logique et timing.', contextType: 'decision' },
        { key: 'decision_relation', label: 'Relationnel', description: 'Choisir sans te perdre.', contextType: 'decision' },
        { key: 'decision_project', label: 'Projet', description: "Valider la direction et l'energie.", contextType: 'decision' },
        { key: 'change_or_wait', label: 'Changer ou attendre', description: 'Quand bouger, quand tenir.', contextType: 'decision' },
        { key: 'global_decision', label: 'Analyse globale', description: 'Trancher avec vue complete.', contextType: 'decision' },
      ],
    },
    {
      key: 'timing',
      label: 'Vision des prochains mois',
      description: 'Anticipe la phase a venir et ton timing.',
      contextType: 'timing',
      domainRoute: 'timing',
      children: [
        { key: 'general_trends', label: 'Tendances generales', description: 'Meteo globale de ta phase.', contextType: 'timing' },
        { key: 'when_act', label: 'Periode pour agir', description: "Fenetres d'action.", contextType: 'timing' },
        { key: 'when_stabilize', label: 'Periode pour stabiliser', description: 'Consolider ce qui doit tenir.', contextType: 'timing' },
        { key: 'watch_domains', label: 'Domaines a surveiller', description: 'Points sensibles.', contextType: 'timing' },
        { key: 'strategic_advice', label: 'Conseils strategiques', description: 'Plan simple pour avancer.', contextType: 'timing' },
      ],
    },
    {
      key: 'general',
      label: 'Lecture generale',
      description: 'Synthese complete de ton moment.',
      contextType: 'hexastraReading',
      domainRoute: 'fusion',
      children: [
        { key: 'quick_summary', label: 'Synthese rapide', description: "L'essentiel en peu de lignes.", contextType: 'general' },
        { key: 'detailed_reading', label: 'Lecture detaillee', description: 'Lecture plus profonde.', contextType: 'hexastraReading', domainRoute: 'fusion' },
        { key: 'current_strengths', label: 'Forces du moment', description: 'Ce qui te porte.', contextType: 'general' },
        { key: 'vigilance_points', label: 'Vigilances', description: 'Ce qui peut freiner.', contextType: 'general' },
        { key: 'orientation', label: 'Orientation', description: 'Direction prioritaire.', contextType: 'general' },
      ],
    },
    {
      key: 'science',
      label: 'Analyse par science',
      description: 'Choisis une science pour eclairer la situation.',
      contextType: 'science',
      domainRoute: 'science',
      children: [
        { key: 'science_astrolex', label: 'Astrologie™', description: 'Cycles, maisons, aspects et timing.', contextType: 'timing', domainRoute: 'fusion' },
        { key: 'science_porteum', label: 'Human Design™', description: 'Fonctionnement naturel, centres et decision.', contextType: 'energy' },
        { key: 'science_enneagram', label: 'Enneagramme™', description: 'Reactions automatiques et leviers.', contextType: 'relationship' },
        { key: 'science_kua', label: 'Kua™', description: 'Orientation et environnement personnel.', contextType: 'decision' },
        { key: 'science_neurokua', label: 'NeuroKua™', description: 'Equilibre interne, axe dominant et reglage sensoriel.', contextType: 'energy', domainRoute: 'neurokua' },
        { key: 'science_triangle', label: 'Numerologie™', description: 'Cycle actuel, vibration et periode active.', contextType: 'timing' },
        { key: 'science_maslow', label: 'Pyramide de Maslow™', description: 'Besoin dominant, manque et prochain palier.', contextType: 'wellbeing' },
      ],
    },
  ],
  praticien: [
    {
      key: 'pract_neurokua',
      label: 'NeuroKua™',
      description: 'Diagnostic interne et reglages.',
      contextType: 'energy',
      domainRoute: 'neurokua',
      children: [
        { key: 'balance', label: 'Equilibre global', description: 'Coherence et stabilite interne.', contextType: 'energy' },
        { key: 'dominant_imbalance', label: 'Desequilibre dominant', description: 'Axe principal de correction.', contextType: 'energy' },
        { key: 'recovery', label: 'Surcharge / recuperation', description: "Risque d'epuisement.", contextType: 'wellbeing' },
        { key: 'prioritized_adjustments', label: 'Ajustements prioritaires', description: 'Actions a fort effet immediat.', contextType: 'decision' },
        { key: 'protocol', label: 'Protocole court', description: 'Routine simple de stabilisation.', contextType: 'energy' },
      ],
    },
    { key: 'pract_relation', label: 'Relationnel™', description: 'Dynamiques, tensions et leviers relationnels.', contextType: 'relationship', domainRoute: 'relationship' },
    { key: 'pract_professional', label: 'Professionnel™', description: 'Positionnement, risques, strategie.', contextType: 'career', domainRoute: 'career' },
    { key: 'pract_cycle', label: 'Cycle a venir™', description: 'Projection de phase et timing.', contextType: 'timing', domainRoute: 'timing' },
    { key: 'pract_decision', label: 'Decision precise™', description: 'Comparatif structure A/B.', contextType: 'decision', domainRoute: 'decision' },
    { key: 'pract_general', label: 'Lecture generale actuelle™', description: 'Synthese multidimensionnelle.', contextType: 'hexastraReading', domainRoute: 'fusion' },
    {
      key: 'science',
      label: 'Analyses par science',
      description: 'Sciences specifiques.',
      contextType: 'science',
      domainRoute: 'science',
      children: [
        { key: 'science_astrolex', label: 'Astrologie™', description: 'Cycles, maisons, aspects et timing.', contextType: 'timing', domainRoute: 'fusion' },
        { key: 'science_porteum', label: 'Human Design™', description: 'Centres, canaux, portes et decision.', contextType: 'energy' },
        { key: 'science_enneagram', label: 'Enneagramme™', description: 'Reactions automatiques et leviers.', contextType: 'relationship' },
        { key: 'science_kua', label: 'Kua™', description: 'Orientation et environnement personnel.', contextType: 'decision' },
        { key: 'science_neurokua', label: 'NeuroKua™', description: '4 dynamiques, axe correctif et reglage sensoriel.', contextType: 'energy', domainRoute: 'neurokua' },
        { key: 'science_triangle', label: 'Numerologie™', description: 'Cycle, vibration et temporalite.', contextType: 'timing' },
        { key: 'science_maslow', label: 'Pyramide de Maslow™', description: 'Diagnostic des besoins et du palier actif.', contextType: 'wellbeing' },
      ],
    },
  ],
  libre_avance: [],
  libre_approfondi: [],
}
