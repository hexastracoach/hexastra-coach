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
      description: 'Régule ton état intérieur et ton énergie du moment.',
      contextType: 'energy',
      domainRoute: 'neurokua',
      children: [
        { key: 'state_today', label: 'Mon état du jour', description: 'Scan global.', contextType: 'energy' },
        { key: 'fatigue_recharge', label: 'Fatigue / recharge', description: 'Comprendre et recharger.', contextType: 'wellbeing' },
        { key: 'stress_overload', label: 'Stress / surcharge', description: 'Identifier la tension.', contextType: 'wellbeing' },
        { key: 'stability_or_action', label: 'Stabilité ou action', description: 'Agir ou consolider.', contextType: 'decision' },
        { key: 'quick_adjustment', label: 'Ajustement rapide', description: 'Action courte qui change le ressenti.', contextType: 'energy' },
      ],
    },
    {
      key: 'energy_now',
      label: 'Énergie du moment',
      description: "Lis la tendance du jour et ce qu'elle active en toi.",
      contextType: 'energy',
      domainRoute: 'general',
      children: [
        { key: 'emotional_state', label: 'État émotionnel', description: "Nommer l'ambiance intérieure.", contextType: 'energy' },
        { key: 'motivation', label: 'Motivation / élan', description: 'Mesurer ton élan réel.', contextType: 'energy' },
        { key: 'act_or_rest', label: 'Agir ou récupérer', description: 'Choisir le bon rythme aujourd’hui.', contextType: 'decision' },
        { key: 'priority_zone', label: 'Zone prioritaire', description: 'Voir où porter ton regard.', contextType: 'general' },
      ],
    },
    {
      key: 'relations',
      label: 'Amour / Relations',
      description: 'Clarifie tes dynamiques affectives et sociales.',
      contextType: 'relationship',
      domainRoute: 'relationship',
      children: [
        { key: 'single', label: 'Célibataire', description: 'Attirer juste sans se trahir.', contextType: 'relationship' },
        { key: 'couple', label: 'En couple', description: 'Ajuster lien et communication.', contextType: 'relationship' },
        { key: 'complex_relation', label: 'Relation compliquée', description: 'Clarifier le nœud et le levier.', contextType: 'relationship' },
        { key: 'family', label: 'Famille / proches', description: 'Pacifier et poser tes limites.', contextType: 'relationship' },
        { key: 'specific_person', label: 'Une personne précise', description: 'Comprendre la dynamique entre vous.', contextType: 'relationship' },
      ],
    },
    {
      key: 'career',
      label: 'Travail / Argent',
      description: 'Oriente tes choix pro et ta stabilité matérielle.',
      contextType: 'career',
      domainRoute: 'career',
      children: [
        { key: 'current_situation', label: 'Situation actuelle', description: 'Ce qui se joue.', contextType: 'career' },
        { key: 'evolution', label: 'Évolution / changement', description: 'Choisir ta prochaine marche.', contextType: 'career' },
        { key: 'conflicts', label: 'Ambiance / conflits', description: 'Réduire la friction.', contextType: 'career' },
        { key: 'money_security', label: 'Argent / sécurité', description: 'Sécuriser sans panique.', contextType: 'career' },
        { key: 'personal_project', label: 'Projet perso', description: 'Plan réaliste.', contextType: 'career' },
      ],
    },
    {
      key: 'wellbeing',
      label: 'Bien-être / État intérieur',
      description: 'Apaise, recentre et retrouve ton axe.',
      contextType: 'wellbeing',
      domainRoute: 'wellbeing',
      children: [
        { key: 'stress', label: 'Stress', description: 'Retrouver du calme mental.', contextType: 'wellbeing' },
        { key: 'fatigue', label: 'Fatigue', description: 'Reprendre de la force.', contextType: 'wellbeing' },
        { key: 'confidence', label: 'Confiance', description: 'Réactiver ton assurance.', contextType: 'wellbeing' },
        { key: 'motivation_wb', label: 'Motivation', description: 'Relancer ton moteur interne.', contextType: 'wellbeing' },
        { key: 'recenter', label: 'Recentrage', description: 'Revenir à ton axe.', contextType: 'wellbeing' },
      ],
    },
    {
      key: 'decision',
      label: 'Décision à prendre',
      description: 'Compare tes options et choisis avec clarté.',
      contextType: 'decision',
      domainRoute: 'decision',
      children: [
        { key: 'decision_pro', label: 'Pro', description: 'Choisir avec logique et timing.', contextType: 'decision' },
        { key: 'decision_relation', label: 'Relationnel', description: 'Choisir sans te perdre.', contextType: 'decision' },
        { key: 'decision_project', label: 'Projet', description: 'Valider la direction et l’énergie.', contextType: 'decision' },
        { key: 'change_or_wait', label: 'Changer ou attendre', description: 'Quand bouger, quand tenir.', contextType: 'decision' },
        { key: 'global_decision', label: 'Analyse globale', description: 'Trancher avec vue complète.', contextType: 'decision' },
      ],
    },
    {
      key: 'timing',
      label: 'Vision des prochains mois',
      description: 'Anticipe la phase à venir et ton timing.',
      contextType: 'timing',
      domainRoute: 'timing',
      children: [
        { key: 'general_trends', label: 'Tendances générales', description: 'Météo globale de ta phase.', contextType: 'timing' },
        { key: 'when_act', label: 'Période pour agir', description: "Fenêtres d'action.", contextType: 'timing' },
        { key: 'when_stabilize', label: 'Période pour stabiliser', description: 'Consolider ce qui doit tenir.', contextType: 'timing' },
        { key: 'watch_domains', label: 'Domaines à surveiller', description: 'Points sensibles.', contextType: 'timing' },
        { key: 'strategic_advice', label: 'Conseils stratégiques', description: 'Plan simple pour avancer.', contextType: 'timing' },
      ],
    },
    {
      key: 'general',
      label: 'Lecture générale',
      description: 'Synthèse complète de ton moment.',
      contextType: 'hexastraReading',
      domainRoute: 'fusion',
      children: [
        { key: 'quick_summary', label: 'Synthèse rapide', description: 'L’essentiel en peu de lignes.', contextType: 'general' },
        { key: 'detailed_reading', label: 'Lecture détaillée', description: 'Lecture plus profonde.', contextType: 'hexastraReading', domainRoute: 'fusion' },
        { key: 'current_strengths', label: 'Forces du moment', description: 'Ce qui te porte.', contextType: 'general' },
        { key: 'vigilance_points', label: 'Vigilances', description: 'Ce qui peut freiner.', contextType: 'general' },
        { key: 'orientation', label: 'Orientation', description: 'Direction prioritaire.', contextType: 'general' },
      ],
    },
    {
      key: 'science',
      label: 'Analyse par science',
      description: 'Choisis une science pour éclairer la situation.',
      contextType: 'science',
      domainRoute: 'science',
      children: [
        { key: 'science_neurokua', label: 'NeuroKua™', description: 'Équilibre mental, énergie, rythme.', contextType: 'energy', domainRoute: 'neurokua' },
        { key: 'science_astrolex', label: 'Astrolex™', description: 'Influences actuelles, phase traversée.', contextType: 'timing', domainRoute: 'fusion' },
        { key: 'science_porteum', label: 'Porteum™', description: 'Fonctionnement naturel et énergie.', contextType: 'energy' },
        { key: 'science_triangle', label: 'TriangleNumeris™', description: 'Cycle actuel et ce qu’il favorise.', contextType: 'timing' },
        { key: 'science_enneagram', label: 'Ennéagramme™', description: 'Réactions automatiques et leviers.', contextType: 'relationship' },
        { key: 'science_kua', label: 'Kua™', description: 'Orientation et environnement personnel.', contextType: 'decision' },
        { key: 'science_fusion', label: 'Fusion complète™', description: 'Synthèse avec tous les angles.', contextType: 'hexastraReading', domainRoute: 'fusion' },
      ],
    },
  ],
  praticien: [
    {
      key: 'pract_neurokua',
      label: 'NeuroKua™',
      description: 'Diagnostic interne et réglages.',
      contextType: 'energy',
      domainRoute: 'neurokua',
      children: [
        { key: 'balance', label: 'Équilibre global', description: 'Cohérence et stabilité interne.', contextType: 'energy' },
        { key: 'dominant_imbalance', label: 'Déséquilibre dominant', description: 'Axe principal de correction.', contextType: 'energy' },
        { key: 'recovery', label: 'Surcharge / récupération', description: 'Risque d’épuisement.', contextType: 'wellbeing' },
        { key: 'prioritized_adjustments', label: 'Ajustements prioritaires', description: 'Actions à fort effet immédiat.', contextType: 'decision' },
        { key: 'protocol', label: 'Protocole court', description: 'Routine simple de stabilisation.', contextType: 'energy' },
      ],
    },
    { key: 'pract_relation', label: 'Relationnel™', description: 'Dynamiques, tensions et leviers relationnels.', contextType: 'relationship', domainRoute: 'relationship' },
    { key: 'pract_professional', label: 'Professionnel™', description: 'Positionnement, risques, stratégie.', contextType: 'career', domainRoute: 'career' },
    { key: 'pract_cycle', label: 'Cycle à venir™', description: 'Projection de phase et timing.', contextType: 'timing', domainRoute: 'timing' },
    { key: 'pract_decision', label: 'Décision précise™', description: 'Comparatif structuré A/B.', contextType: 'decision', domainRoute: 'decision' },
    { key: 'pract_general', label: 'Lecture générale actuelle™', description: 'Synthèse multidimensionnelle.', contextType: 'hexastraReading', domainRoute: 'fusion' },
    { key: 'science', label: 'Analyses par science', description: 'Sciences spécifiques.', contextType: 'science', domainRoute: 'science' },
  ],
  libre_avance: [],
  libre_approfondi: [],
}
