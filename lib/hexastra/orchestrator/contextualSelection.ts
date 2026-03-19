import type { HexastraMenuItem } from '@/lib/hexastra/types'

type ExecutionStrategy = 'api_first' | 'module_first' | 'support'

export type ScienceSubanalysisDefinition = {
  key: string
  parentScienceKey: string
  choice: string
  label: string
  aliases: string[]
  promptHint: string
  outputStructure: string
  contextFrame: string
  clarificationQuestion: string
  modules: string[]
  submodules: string[]
  executionStrategy: ExecutionStrategy
}

export type MenuSelectionMatch =
  | {
      kind: 'open_parent'
      item: HexastraMenuItem
    }
  | {
      kind: 'submenu'
      item: HexastraMenuItem
      parent: HexastraMenuItem
    }
  | {
      kind: 'subscience'
      science: HexastraMenuItem
      option: ScienceSubanalysisDefinition
    }

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function normalizeSelectionText(value: string) {
  return (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[™®]/g, '')
    .replace(/[_/]+/g, ' ')
    .replace(/[()]/g, ' ')
    .replace(/\s*(?:->|→|>|:)\s*/g, ' -> ')
    .replace(/[^a-z0-9+\-&>\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function isQuestionLikeSelectionMessage(value: string) {
  const text = normalizeSelectionText(value)
  if (!text) return false
  if (value.includes('?')) return true

  return /\b(quels?|quelle?s?|comment|pourquoi|est ce|peux tu|peut tu|fais moi|donne moi|dis moi|explique|regarde|montre moi|aide moi|j ai|je suis|je veux|pour moi|qu est ce|c est quoi|quel sont|quelles sont)\b/.test(
    text
  )
}

function isStandaloneSelectionMessage(value: string) {
  const text = normalizeSelectionText(value)
  if (!text) return false
  if (isQuestionLikeSelectionMessage(value)) return false
  if (text.includes(' -> ')) return true
  return text.split(' ').length <= 6
}

function aliasesForMenuItem(item: HexastraMenuItem) {
  const manualAliases: Record<string, string[]> = {
    science: ['analyse par science', 'analyse par sciences', 'sciences'],
    science_astrolex: ['astrologie', 'astrolex', 'astro'],
    science_porteum: ['human design', 'hd', 'porteum'],
    science_enneagram: ['enneagramme', 'enneagram', 'ennea'],
    science_kua: ['kua', 'gps kua', 'orientation kua'],
    science_neurokua: ['neurokua', 'neuro kua'],
    science_triangle: ['numerologie', 'numerology', 'triangle numeris', 'trianglenumeris'],
    general: ['lecture generale', 'lecture generale pour moi'],
    relations: ['amour', 'relations', 'amour relations'],
    career: ['travail', 'argent', 'travail argent'],
    wellbeing: ['bien etre', 'etat interieur'],
    decision: ['decision', 'decision a prendre'],
    timing: ['vision des prochains mois', 'timing'],
    pract_relation: ['relationnel'],
    pract_professional: ['professionnel'],
    pract_cycle: ['cycle a venir'],
    pract_decision: ['decision precise'],
    pract_general: ['lecture generale actuelle'],
  }

  return unique([
    normalizeSelectionText(item.label),
    normalizeSelectionText(item.key.replace(/_/g, ' ')),
    ...((manualAliases[item.key] ?? []).map((alias) => normalizeSelectionText(alias))),
  ])
}

function matchesAlias(input: string, aliases: string[]) {
  return aliases.some((alias) => input === alias || (alias.length >= 4 && input.includes(alias)))
}

function matchScienceItemByText(items: HexastraMenuItem[], rawText: string) {
  const text = normalizeSelectionText(rawText)
  const matches = items.filter((item) =>
    matchesAlias(
      text,
      unique([
        normalizeSelectionText(item.label),
        normalizeSelectionText(item.key.replace(/_/g, ' ')),
        ...(item.key === 'science_astrolex' ? ['astrologie', 'astrolex', 'astro'] : []),
        ...(item.key === 'science_porteum' ? ['human design', 'hd', 'porteum'] : []),
        ...(item.key === 'science_enneagram' ? ['enneagramme', 'enneagram', 'ennea'] : []),
        ...(item.key === 'science_kua' ? ['kua', 'gps kua', 'orientation kua'] : []),
        ...(item.key === 'science_neurokua' ? ['neurokua', 'neuro kua'] : []),
        ...(item.key === 'science_triangle'
          ? ['numerologie', 'numerology', 'triangle numeris', 'trianglenumeris']
          : []),
      ].map((alias) => normalizeSelectionText(alias)))
    )
  )

  return matches.length === 1 ? matches[0] : null
}

export const SCIENCE_SUBANALYSIS_LIST: ScienceSubanalysisDefinition[] = [
  {
    key: 'science_astrolex_transits',
    parentScienceKey: 'science_astrolex',
    choice: '1',
    label: 'Transits / energie actuelle',
    aliases: ['transits', 'transit', 'energie actuelle', 'energie du moment', 'situation actuelle', 'transitus'],
    promptHint: 'Focaliser la lecture astrologique sur les transits, la phase actuelle et le tempo immediat.',
    outputStructure: 'Phase active -> transits majeurs -> mouvement du moment -> timing utile',
    contextFrame: 'Contexte Astrologie - Transits / energie actuelle actif.',
    clarificationQuestion: 'Pose maintenant ta question sur la phase actuelle, le timing ou ce que le moment active.',
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Aspectum', 'KS.SENTINEL'],
    submodules: ['KS.Planetarium', 'KS.Aspectum'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_houses',
    parentScienceKey: 'science_astrolex',
    choice: '2',
    label: 'Maisons / domaine actif',
    aliases: ['maisons', 'maison', 'domaine', 'domaine actif', 'domus', 'house', 'houses'],
    promptHint: 'Focaliser la lecture astrologique sur les maisons actives, les axes et le domaine de vie central.',
    outputStructure: 'Maison active -> domaine prioritaire -> axe en jeu -> lecture concrete',
    contextFrame: 'Contexte Astrologie - Maisons / domaine actif actif.',
    clarificationQuestion: 'Pose maintenant ta question sur les maisons, le domaine de vie ou les axes concernes.',
    modules: ['KS.ASTROLEX.V1', 'KS.Domus', 'KS.SENTINEL'],
    submodules: ['KS.Domus', 'KS.HouseOppositionMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_aspects',
    parentScienceKey: 'science_astrolex',
    choice: '3',
    label: 'Aspects / tension',
    aliases: ['aspects', 'aspects du moment', 'tension', 'opportunite', 'aspectum'],
    promptHint: 'Focaliser la lecture astrologique sur les aspects, tensions, appuis et rapports de force.',
    outputStructure: 'Tension dominante -> appui disponible -> contradiction centrale -> levier',
    contextFrame: 'Contexte Astrologie - Aspects / tension actif.',
    clarificationQuestion: 'Pose maintenant ta question sur la tension du moment, un blocage ou une opportunite astrologique.',
    modules: ['KS.ASTROLEX.V1', 'KS.Aspectum', 'KS.SENTINEL'],
    submodules: ['KS.Aspectum'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_synastry',
    parentScienceKey: 'science_astrolex',
    choice: '4',
    label: 'Synastrie',
    aliases: ['synastrie', 'synastry', 'compatibilite', 'relation astrologique'],
    promptHint: 'Focaliser la lecture astrologique sur la synastrie, la dynamique entre deux personnes et les appuis relationnels.',
    outputStructure: 'Dynamique relationnelle -> appuis -> tension -> orientation',
    contextFrame: 'Contexte Astrologie - Synastrie actif.',
    clarificationQuestion: 'Pose maintenant ta question sur une relation, une compatibilite ou la dynamique avec une personne.',
    modules: ['KS.ASTROLEX.V1', 'KS.Synastria', 'KS.SENTINEL'],
    submodules: ['KS.Planetarium', 'KS.Aspectum', 'KS.Synastria'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_geo',
    parentScienceKey: 'science_astrolex',
    choice: '5',
    label: 'Geo-astrologie / lieux',
    aliases: ['geo astrologie', 'geoastrologie', 'lieux', 'lieu', 'environnement astrologique', 'geo astro'],
    promptHint: 'Focaliser la lecture astrologique sur les lieux, le cadre geographique, les deplacements et leur impact.',
    outputStructure: 'Lieu dominant -> effet du cadre -> zone d appui -> ajustement',
    contextFrame: 'Contexte Astrologie - Geo-astrologie / lieux actif.',
    clarificationQuestion: 'Pose maintenant ta question sur un lieu, un demenagement, un voyage ou ton environnement geographique.',
    modules: ['KS.ASTROLEX.V1', 'KS.GeoAstroMap', 'KS.SENTINEL'],
    submodules: ['KS.Domus', 'KS.GeoAstroMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_planetarium',
    parentScienceKey: 'science_astrolex',
    choice: '6',
    label: 'Planetarium / planetes dominantes',
    aliases: ['planetarium', 'planetes', 'planete dominante', 'planetes dominantes'],
    promptHint: 'Focaliser la lecture astrologique sur les planetes dominantes, leurs messages et leur tonalite.',
    outputStructure: 'Planete dominante -> tonalite -> message cle -> integration',
    contextFrame: 'Contexte Astrologie - Planetarium actif.',
    clarificationQuestion: 'Pose maintenant ta question sur une planete dominante, une energie planetaire ou un message cle.',
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.SENTINEL'],
    submodules: ['KS.Planetarium'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_astrolex_synthesis',
    parentScienceKey: 'science_astrolex',
    choice: '7',
    label: 'Synthese astrologique',
    aliases: ['synthese', 'synthese astrologique', 'lecture complete', 'lecture astrologique complete'],
    promptHint: 'Focaliser la lecture astrologique sur une synthese globale du moment, des maisons, aspects et timing.',
    outputStructure: 'Phase -> dominantes -> tension -> timing -> conseil',
    contextFrame: 'Contexte Astrologie - Synthese actif.',
    clarificationQuestion: 'Pose maintenant ta question dans un angle astrologique global, et je ferai la synthese a partir de ce cadre.',
    modules: ['KS.ASTROLEX.V1', 'KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.SENTINEL'],
    submodules: ['KS.Planetarium', 'KS.Domus', 'KS.Aspectum', 'KS.AethericMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_centers',
    parentScienceKey: 'science_porteum',
    choice: '1',
    label: 'Centres',
    aliases: ['centres', 'centre', 'centers', 'center'],
    promptHint: 'Focaliser la lecture Human Design sur les centres stables, sensibles et la regulation de l energie.',
    outputStructure: 'Centres stables -> centres sensibles -> impact concret -> ajustement',
    contextFrame: 'Contexte Human Design - Centres actif.',
    clarificationQuestion: 'Pose maintenant ta question sur tes centres, tes zones stables ou tes zones sensibles.',
    modules: ['KS.PORTEUM.V1', 'KS.TypeProfile', 'KS.PolarityMap', 'KS.SENTINEL'],
    submodules: ['KS.TypeProfile', 'KS.PolarityMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_channels',
    parentScienceKey: 'science_porteum',
    choice: '2',
    label: 'Canaux',
    aliases: ['canaux', 'canal', 'channels', 'channel'],
    promptHint: 'Focaliser la lecture Human Design sur les canaux, la circulation et les dynamiques d expression.',
    outputStructure: 'Canaux dominants -> expression -> tension -> usage juste',
    contextFrame: 'Contexte Human Design - Canaux actif.',
    clarificationQuestion: 'Pose maintenant ta question sur tes canaux, leur dynamique ou leur impact concret.',
    modules: ['KS.PORTEUM.V1', 'KS.ChannelMap', 'KS.SENTINEL'],
    submodules: ['KS.ChannelMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_gates',
    parentScienceKey: 'science_porteum',
    choice: '3',
    label: 'Portes',
    aliases: ['portes', 'porte', 'gates', 'gate'],
    promptHint: 'Focaliser la lecture Human Design sur les portes actives, leur sens et leur application concrete.',
    outputStructure: 'Portes actives -> themes -> appui -> vigilance',
    contextFrame: 'Contexte Human Design - Portes actif.',
    clarificationQuestion: 'Pose maintenant ta question sur tes portes actives, leur sens ou leur application pour toi.',
    modules: ['KS.PORTEUM.V1', 'KS.GateMap', 'KS.SENTINEL'],
    submodules: ['KS.GateMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_profile',
    parentScienceKey: 'science_porteum',
    choice: '4',
    label: 'Profil',
    aliases: ['profil', 'profile', 'profil hd'],
    promptHint: 'Focaliser la lecture Human Design sur le profil, la posture naturelle et le style d incarnation.',
    outputStructure: 'Profil -> posture -> force -> point de vigilance',
    contextFrame: 'Contexte Human Design - Profil actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton profil, ta posture naturelle ou ton style d incarnation.',
    modules: ['KS.PORTEUM.V1', 'KS.ProfileMap', 'KS.TypeProfile', 'KS.SENTINEL'],
    submodules: ['KS.TypeProfile', 'KS.ProfileMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_authority',
    parentScienceKey: 'science_porteum',
    choice: '5',
    label: 'Autorite / strategie',
    aliases: ['autorite', 'strategie', 'autorite strategie', 'authority', 'strategy', 'decision hd'],
    promptHint: 'Focaliser la lecture Human Design sur l autorite interieure, la strategie et la prise de decision.',
    outputStructure: 'Autorite -> strategie -> erreur a eviter -> bon reflexe',
    contextFrame: 'Contexte Human Design - Autorite / strategie actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ta facon de decider, ton autorite interieure ou ta strategie.',
    modules: ['KS.PORTEUM.V1', 'KS.AuthorityStrategy', 'KS.TypeProfile', 'KS.SENTINEL'],
    submodules: ['KS.TypeProfile', 'KS.AuthorityStrategy'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_porteum_synthesis',
    parentScienceKey: 'science_porteum',
    choice: '6',
    label: 'Synthese Human Design',
    aliases: ['synthese', 'synthese hd', 'lecture complete', 'lecture complete hd'],
    promptHint: 'Focaliser la lecture Human Design sur une synthese utile des centres, canaux, portes, profil et decision.',
    outputStructure: 'Type -> profil -> portes -> autorite -> synthese utile',
    contextFrame: 'Contexte Human Design - Synthese actif.',
    clarificationQuestion: 'Pose maintenant ta question dans un angle Human Design global, et je ferai la synthese a partir de ce cadre.',
    modules: ['KS.PORTEUM.V1', 'KS.TypeProfile', 'KS.ProfileMap', 'KS.ChannelMap', 'KS.GateMap', 'KS.AuthorityStrategy', 'KS.SENTINEL'],
    submodules: ['KS.TypeProfile', 'KS.ProfileMap', 'KS.ChannelMap', 'KS.GateMap', 'KS.AuthorityStrategy', 'KS.IncarnationCross'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_baseline',
    parentScienceKey: 'science_neurokua',
    choice: '1',
    label: 'Baseline',
    aliases: ['baseline', 'etat de reference', 'niveau de reference'],
    promptHint: 'Focaliser la lecture NeuroKua sur le niveau de reference, le mode dominant et la base de regulation.',
    outputStructure: 'Reference -> mode dominant -> deviation -> ajustement',
    contextFrame: 'Contexte NeuroKua - Baseline actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton etat de reference, ton niveau de base ou ton mode dominant.',
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    submodules: ['KS.StateActivation', 'KS.InnerStateReader'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_balance',
    parentScienceKey: 'science_neurokua',
    choice: '2',
    label: 'Balance',
    aliases: ['balance', 'equilibre', 'axe correctif', 'axe dominant'],
    promptHint: 'Focaliser la lecture NeuroKua sur l equilibre des axes, le desequilibre principal et la correction utile.',
    outputStructure: 'Axe dominant -> axe correctif -> desequilibre -> action',
    contextFrame: 'Contexte NeuroKua - Balance actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton equilibre, ton axe correctif ou le desequilibre principal.',
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    submodules: ['KS.StateActivation', 'KS.InnerStateReader', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_timing',
    parentScienceKey: 'science_neurokua',
    choice: '3',
    label: 'Timing',
    aliases: ['timing', 'agir ou recuperer', 'fenetre du moment', 'moment juste'],
    promptHint: 'Focaliser la lecture NeuroKua sur la fenetre du moment, le bon tempo et le choix agir ou recuperer.',
    outputStructure: 'Fenetre -> risque -> bon rythme -> geste utile',
    contextFrame: 'Contexte NeuroKua - Timing actif.',
    clarificationQuestion: 'Pose maintenant ta question sur le bon tempo, le moment juste ou le choix agir versus recuperer.',
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    submodules: ['KS.NeuroTimingMap', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_overload',
    parentScienceKey: 'science_neurokua',
    choice: '4',
    label: 'Overload / surcharge',
    aliases: ['overload', 'surcharge', 'epuisement', 'usure', 'stress'],
    promptHint: 'Focaliser la lecture NeuroKua sur la surcharge, le manque et le risque d epuisement.',
    outputStructure: 'Surcharge -> cout principal -> stabilisation -> priorite',
    contextFrame: 'Contexte NeuroKua - Overload actif.',
    clarificationQuestion: 'Pose maintenant ta question sur la surcharge, l usure, le stress ou le risque d epuisement.',
    modules: ['KS.NeuroKua.System.V1', 'KS.NEUROSOMA', 'KS.SENTINEL'],
    submodules: ['KS.InnerStateReader', 'KS.RecoveryProtocol', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_recalibration',
    parentScienceKey: 'science_neurokua',
    choice: '5',
    label: 'Recalibration',
    aliases: ['recalibration', 'recalibrage', 'ajustement', 'reglage rapide'],
    promptHint: 'Focaliser la lecture NeuroKua sur un recalibrage concret du rythme, de la direction ou de l environnement.',
    outputStructure: 'Constat -> reglage -> effet attendu -> integration',
    contextFrame: 'Contexte NeuroKua - Recalibration actif.',
    clarificationQuestion: 'Pose maintenant ta question sur un ajustement concret, un reglage rapide ou un recalibrage utile.',
    modules: ['KS.NeuroKua.System.V1', 'KS.Q-INCARNATIO.V1', 'KS.SENTINEL'],
    submodules: ['KS.ActionTranslator', 'KS.SynesthesiaMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_neurokua_synesthesia',
    parentScienceKey: 'science_neurokua',
    choice: '6',
    label: 'Synesthesia',
    aliases: ['synesthesia', 'synesthesie', 'couleur', 'environnement sensoriel', 'orientation sensorielle'],
    promptHint: 'Focaliser la lecture NeuroKua sur la synesthesie, la couleur, la direction et le support sensoriel.',
    outputStructure: 'Signal sensoriel -> support utile -> ajustement spatial -> effet',
    contextFrame: 'Contexte NeuroKua - Synesthesia actif.',
    clarificationQuestion: 'Pose maintenant ta question sur la synesthesie, la couleur, la direction ou le support sensoriel utile.',
    modules: ['KS.NeuroKua.System.V1', 'KS.Q-INCARNATIO.V1', 'KS.SENTINEL'],
    submodules: ['KS.SynesthesiaMap', 'KS.ActionTranslator'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_year',
    parentScienceKey: 'science_triangle',
    choice: '1',
    label: 'Cycle annuel',
    aliases: ['cycle annuel', 'annee personnelle', 'annee', 'cycle de l annee'],
    promptHint: 'Focaliser la lecture de numerologie sur le cycle annuel et la dynamique de fond.',
    outputStructure: 'Cycle annuel -> tonalite -> opportunite -> vigilance',
    contextFrame: 'Contexte Numerologie - Cycle annuel actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton cycle annuel, l annee personnelle ou la dynamique de fond.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.NumCycle', 'KS.SENTINEL'],
    submodules: ['KS.NumCore', 'KS.NumCycle'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_month',
    parentScienceKey: 'science_triangle',
    choice: '2',
    label: 'Mois personnel',
    aliases: ['mois personnel', 'cycle mensuel', 'mois', 'cycle du mois'],
    promptHint: 'Focaliser la lecture de numerologie sur le mois personnel et ce que le moment active.',
    outputStructure: 'Mois actif -> focus -> vigilance -> conseil',
    contextFrame: 'Contexte Numerologie - Mois personnel actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton mois personnel, le focus du moment ou le cycle mensuel.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCycle', 'KS.SENTINEL'],
    submodules: ['KS.NumCycle', 'KS.PersonalMonthMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_vibration',
    parentScienceKey: 'science_triangle',
    choice: '3',
    label: 'Chemin / vibration',
    aliases: ['chemin', 'chemin de vie', 'vibration', 'vibration dominante'],
    promptHint: 'Focaliser la lecture de numerologie sur le chemin de vie, la vibration dominante et la frequence active.',
    outputStructure: 'Vibration -> chemin -> resonance -> integration',
    contextFrame: 'Contexte Numerologie - Chemin / vibration actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton chemin de vie, ta vibration dominante ou ta resonance actuelle.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.SENTINEL'],
    submodules: ['KS.NumCore'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_transition',
    parentScienceKey: 'science_triangle',
    choice: '4',
    label: 'Defis / transition',
    aliases: ['defis', 'transition', 'changement de periode', 'passage'],
    promptHint: 'Focaliser la lecture de numerologie sur les defis, les transitions et les ajustements de periode.',
    outputStructure: 'Transition -> defi -> risque -> adaptation',
    contextFrame: 'Contexte Numerologie - Defis / transition actif.',
    clarificationQuestion: 'Pose maintenant ta question sur une transition, un defi numerologique ou un changement de periode.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCycle', 'KS.SENTINEL'],
    submodules: ['KS.NumCycle', 'KS.NumericChallengeMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_opportunity',
    parentScienceKey: 'science_triangle',
    choice: '5',
    label: 'Opportunite / vigilance',
    aliases: ['opportunite', 'vigilance', 'fenetre numerologique', 'ce qui est favorise'],
    promptHint: 'Focaliser la lecture de numerologie sur les opportunites, vigilances et fenetres utiles.',
    outputStructure: 'Opportunite -> vigilance -> bon rythme -> action',
    contextFrame: 'Contexte Numerologie - Opportunite / vigilance actif.',
    clarificationQuestion: 'Pose maintenant ta question sur une opportunite, une vigilance ou une fenetre numerologique utile.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCycle', 'KS.SENTINEL'],
    submodules: ['KS.NumCore', 'KS.NumCycle'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_triangle_synthesis',
    parentScienceKey: 'science_triangle',
    choice: '6',
    label: 'Synthese numerologique',
    aliases: ['synthese', 'synthese numerologique', 'conseil du cycle', 'lecture complete'],
    promptHint: 'Focaliser la lecture de numerologie sur une synthese claire du cycle, de la vibration et du timing.',
    outputStructure: 'Cycle -> vibration -> opportunite -> conseil',
    contextFrame: 'Contexte Numerologie - Synthese actif.',
    clarificationQuestion: 'Pose maintenant ta question dans un angle numerologique global, et je ferai la synthese a partir de ce cadre.',
    modules: ['KS.TRIANGLENUMERIS.V1', 'KS.NumCore', 'KS.NumCycle', 'KS.SENTINEL'],
    submodules: ['KS.NumCore', 'KS.NumCycle', 'KS.HexaNum.LinkBridge'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_enneagram_type',
    parentScienceKey: 'science_enneagram',
    choice: '1',
    label: 'Type / reaction dominante',
    aliases: ['type', 'reaction dominante', 'mecanisme', 'type enneagramme'],
    promptHint: 'Focaliser la lecture Enneagramme sur le type dominant, le reflexe central et la reaction de base.',
    outputStructure: 'Type -> reflexe -> defense -> effet concret',
    contextFrame: 'Contexte Enneagramme - Type / reaction dominante actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton type, ton mecanisme dominant ou ta reaction de base.',
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.SENTINEL'],
    submodules: ['KS.ArchetypeMap', 'KS.EnneaTypeMap'],
    executionStrategy: 'module_first',
  },
  {
    key: 'science_enneagram_stress',
    parentScienceKey: 'science_enneagram',
    choice: '2',
    label: 'Stress / securite',
    aliases: ['stress', 'securite', 'stress securite', 'bascule'],
    promptHint: 'Focaliser la lecture Enneagramme sur la bascule stress ou securite et ses effets.',
    outputStructure: 'Declencheur -> bascule -> risque -> sortie',
    contextFrame: 'Contexte Enneagramme - Stress / securite actif.',
    clarificationQuestion: 'Pose maintenant ta question sur le stress, la securite ou ta facon de basculer sous pression.',
    modules: ['KS.SPIRITLEX.V1', 'KS.EmotionMap', 'KS.SENTINEL'],
    submodules: ['KS.EmotionMap', 'KS.EnneaStressMap'],
    executionStrategy: 'module_first',
  },
  {
    key: 'science_enneagram_defense',
    parentScienceKey: 'science_enneagram',
    choice: '3',
    label: 'Defense / pieges',
    aliases: ['defense', 'pieges', 'boucles', 'sabotage'],
    promptHint: 'Focaliser la lecture Enneagramme sur la defense automatique, les pieges et les boucles de sabotage.',
    outputStructure: 'Defense -> piege -> cout -> correction',
    contextFrame: 'Contexte Enneagramme - Defense / pieges actif.',
    clarificationQuestion: 'Pose maintenant ta question sur tes defenses automatiques, tes pieges ou une boucle repetitive.',
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.SENTINEL'],
    submodules: ['KS.ArchetypeMap', 'KS.EnneaWingMap', 'KS.EnneaInstinctMap'],
    executionStrategy: 'module_first',
  },
  {
    key: 'science_enneagram_resources',
    parentScienceKey: 'science_enneagram',
    choice: '4',
    label: 'Ressources / levier',
    aliases: ['ressources', 'levier', 'evolution', 'sortie de boucle'],
    promptHint: 'Focaliser la lecture Enneagramme sur les ressources, le levier de sortie et l evolution utile.',
    outputStructure: 'Ressource -> appui -> levier -> integration',
    contextFrame: 'Contexte Enneagramme - Ressources / levier actif.',
    clarificationQuestion: 'Pose maintenant ta question sur tes ressources, ton levier evolutif ou une sortie de boucle.',
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.SENTINEL'],
    submodules: ['KS.ArchetypeMap', 'KS.EmotionMap'],
    executionStrategy: 'module_first',
  },
  {
    key: 'science_enneagram_synthesis',
    parentScienceKey: 'science_enneagram',
    choice: '5',
    label: 'Synthese Enneagramme',
    aliases: ['synthese', 'lecture complete', 'synthese enneagramme'],
    promptHint: 'Focaliser la lecture Enneagramme sur une synthese globale du type, stress, defense et levier.',
    outputStructure: 'Type -> stress -> defense -> levier -> synthese',
    contextFrame: 'Contexte Enneagramme - Synthese actif.',
    clarificationQuestion: 'Pose maintenant ta question dans un angle Enneagramme global, et je ferai la synthese a partir de ce cadre.',
    modules: ['KS.SPIRITLEX.V1', 'KS.ArchetypeMap', 'KS.EmotionMap', 'KS.SENTINEL'],
    submodules: ['KS.ArchetypeMap', 'KS.EmotionMap', 'KS.EnneaTypeMap', 'KS.EnneaStressMap'],
    executionStrategy: 'module_first',
  },
  {
    key: 'science_kua_orientation',
    parentScienceKey: 'science_kua',
    choice: '1',
    label: 'Orientation generale',
    aliases: ['orientation', 'direction', 'directions favorables', 'orientation generale'],
    promptHint: 'Focaliser la lecture Kua sur l orientation generale, les directions favorables et le positionnement utile.',
    outputStructure: 'Orientation -> appui -> risque -> direction utile',
    contextFrame: 'Contexte Kua - Orientation generale actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton orientation generale, tes directions favorables ou ton positionnement.',
    modules: ['KS.HexAstra.GPS.V1', 'KS.SignalReader', 'KS.SENTINEL'],
    submodules: ['KS.SignalReader', 'KS.DirectionMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_kua_space',
    parentScienceKey: 'science_kua',
    choice: '2',
    label: 'Espace de vie',
    aliases: ['espace', 'espace de vie', 'zones sensibles', 'piece', 'maison'],
    promptHint: 'Focaliser la lecture Kua sur les zones sensibles, l espace de vie et les ajustements utiles.',
    outputStructure: 'Zone -> effet -> correction -> integration',
    contextFrame: 'Contexte Kua - Espace de vie actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton espace de vie, une zone sensible ou un ajustement de lieu.',
    modules: ['KS.HexAstra.GPS.V1', 'KS.SpaceMap', 'KS.SENTINEL'],
    submodules: ['KS.DirectionMap', 'KS.SpaceMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_kua_decision',
    parentScienceKey: 'science_kua',
    choice: '3',
    label: 'Decision',
    aliases: ['decision', 'choix', 'orientation d une decision'],
    promptHint: 'Focaliser la lecture Kua sur une decision, la direction a privilegier et le bon alignement.',
    outputStructure: 'Decision -> direction utile -> erreur a eviter -> bon choix',
    contextFrame: 'Contexte Kua - Decision actif.',
    clarificationQuestion: 'Pose maintenant ta question sur une decision, un choix ou la direction la plus juste.',
    modules: ['KS.HexAstra.GPS.V1', 'KS.SignalReader', 'KS.SENTINEL'],
    submodules: ['KS.SignalReader', 'KS.KuaTimingMap'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_kua_environment',
    parentScienceKey: 'science_kua',
    choice: '4',
    label: 'Equilibre environnemental',
    aliases: ['equilibre environnemental', 'environnement', 'ajustements espace', 'ajustement environnemental'],
    promptHint: 'Focaliser la lecture Kua sur l environnement, l equilibre energetique du lieu et les ajustements progressifs.',
    outputStructure: 'Environnement -> tension -> ajustement -> effet attendu',
    contextFrame: 'Contexte Kua - Equilibre environnemental actif.',
    clarificationQuestion: 'Pose maintenant ta question sur ton environnement, un desequilibre de lieu ou un ajustement concret.',
    modules: ['KS.HexAstra.GPS.V1', 'KS.SpaceMap', 'KS.SENTINEL'],
    submodules: ['KS.DirectionMap', 'KS.SpaceMap', 'KS.PlantInterface'],
    executionStrategy: 'api_first',
  },
  {
    key: 'science_kua_synthesis',
    parentScienceKey: 'science_kua',
    choice: '5',
    label: 'Synthese Kua',
    aliases: ['synthese', 'conseil pratique', 'lecture complete', 'synthese kua'],
    promptHint: 'Focaliser la lecture Kua sur une synthese claire des directions, zones sensibles et ajustements utiles.',
    outputStructure: 'Direction -> zone sensible -> ajustement -> plan simple',
    contextFrame: 'Contexte Kua - Synthese actif.',
    clarificationQuestion: 'Pose maintenant ta question dans un angle Kua global, et je ferai la synthese a partir de ce cadre.',
    modules: ['KS.HexAstra.GPS.V1', 'KS.SignalReader', 'KS.SpaceMap', 'KS.SENTINEL'],
    submodules: ['KS.SignalReader', 'KS.DirectionMap', 'KS.SpaceMap', 'KS.PlantInterface'],
    executionStrategy: 'api_first',
  },
]

export const SCIENCE_SUBANALYSIS_REGISTRY: Record<string, ScienceSubanalysisDefinition> = Object.fromEntries(
  SCIENCE_SUBANALYSIS_LIST.map((entry) => [entry.key, entry])
)

export function getScienceSubanalysisDefinition(key?: string | null) {
  if (!key) return null
  return SCIENCE_SUBANALYSIS_REGISTRY[key] ?? null
}

export function getScienceSubanalysisDefinitions(parentScienceKey?: string | null) {
  if (!parentScienceKey) return []
  return SCIENCE_SUBANALYSIS_LIST.filter((entry) => entry.parentScienceKey === parentScienceKey)
}

export function resolveScienceSubanalysisSelection(
  parentScienceKey: string | null | undefined,
  message: string
) {
  if (!parentScienceKey) return null
  const text = normalizeSelectionText(message)
  if (!text) return null

  const singleChoice = text.match(/^(\d{1,2})$/)?.[1] ?? null
  const options = getScienceSubanalysisDefinitions(parentScienceKey)
  if (!options.length) return null

  if (singleChoice) {
    return options.find((option) => option.choice === singleChoice) ?? null
  }

  if (!isStandaloneSelectionMessage(message)) return null

  return (
    options.find((option) => matchesAlias(text, option.aliases.map((alias) => normalizeSelectionText(alias)))) ??
    null
  )
}

function matchMenuItem(items: HexastraMenuItem[], rawText: string) {
  const text = normalizeSelectionText(rawText)
  const matches = items.filter((item) => matchesAlias(text, aliasesForMenuItem(item)))
  return matches.length === 1 ? matches[0] : null
}

export function findLooseMenuSelection(params: {
  items: HexastraMenuItem[]
  message: string
  selectedMenuKey?: string | null
}) {
  const { items, message, selectedMenuKey } = params
  if (!isStandaloneSelectionMessage(message)) return null

  const text = normalizeSelectionText(message)
  if (!text) return null

  const arrowSegments = text
    .split(' -> ')
    .map((part) => part.trim())
    .filter(Boolean)

  const scienceParent = items.find((item) => item.key === 'science') ?? null
  const selectedParent =
    (selectedMenuKey
      ? items.find((item) => item.key === selectedMenuKey) ?? null
      : null) ?? null

  if (selectedParent?.submenu?.length) {
    const submenuItem = matchMenuItem(selectedParent.submenu, text)
    if (submenuItem) {
      return { kind: 'submenu' as const, item: submenuItem, parent: selectedParent }
    }
  }

  if (arrowSegments.length >= 2) {
    if (scienceParent?.submenu?.length) {
      const directSciencePath = matchScienceItemByText(scienceParent.submenu, arrowSegments[0])
      if (directSciencePath && arrowSegments[1]) {
        const subscience = resolveScienceSubanalysisSelection(directSciencePath.key, arrowSegments[1])
        if (subscience) {
          return { kind: 'subscience' as const, science: directSciencePath, option: subscience }
        }
        return { kind: 'submenu' as const, item: directSciencePath, parent: scienceParent }
      }
    }

    if (arrowSegments.length >= 3 && scienceParent?.submenu?.length) {
      const explicitSciencePath =
        matchesAlias(arrowSegments[0], aliasesForMenuItem(scienceParent)) ||
        arrowSegments[0].includes('science')
      if (explicitSciencePath) {
        const scienceMatch = matchScienceItemByText(scienceParent.submenu, arrowSegments[1])
        if (scienceMatch) {
          const subscience = resolveScienceSubanalysisSelection(scienceMatch.key, arrowSegments[2])
          if (subscience) {
            return { kind: 'subscience' as const, science: scienceMatch, option: subscience }
          }
        }
      }
    }

    const topLevelMatch = matchMenuItem(items, arrowSegments[0])
    if (topLevelMatch?.submenu?.length) {
      const submenuMatch = matchMenuItem(topLevelMatch.submenu, arrowSegments[1])
      if (submenuMatch) {
        if (arrowSegments[2] && submenuMatch.key.startsWith('science_')) {
          const subscience = resolveScienceSubanalysisSelection(submenuMatch.key, arrowSegments[2])
          if (subscience) {
            return { kind: 'subscience' as const, science: submenuMatch, option: subscience }
          }
        }
        return { kind: 'submenu' as const, item: submenuMatch, parent: topLevelMatch }
      }
      return { kind: 'open_parent' as const, item: topLevelMatch }
    }

    if (scienceParent?.submenu?.length) {
      const scienceMatch = matchScienceItemByText(scienceParent.submenu, arrowSegments[0])
      if (scienceMatch && arrowSegments[1]) {
        const subscience = resolveScienceSubanalysisSelection(scienceMatch.key, arrowSegments[1])
        if (subscience) {
          return { kind: 'subscience' as const, science: scienceMatch, option: subscience }
        }
      }
    }
  }

  if (scienceParent?.submenu?.length) {
    const scienceItem = matchScienceItemByText(scienceParent.submenu, text)
    if (scienceItem) {
      return { kind: 'submenu' as const, item: scienceItem, parent: scienceParent }
    }
  }

  const directTopLevel = matchMenuItem(items, text)
  if (directTopLevel) {
    if (directTopLevel.submenu?.length) {
      return { kind: 'open_parent' as const, item: directTopLevel }
    }
    return { kind: 'submenu' as const, item: directTopLevel, parent: directTopLevel }
  }

  const submenuMatches = items.flatMap((parent) =>
    (parent.submenu ?? []).map((item) => ({ item, parent }))
  )
  const matchingChildren = submenuMatches.filter(({ item }) =>
    matchesAlias(text, aliasesForMenuItem(item))
  )

  if (matchingChildren.length === 1) {
    const match = matchingChildren[0]
    return { kind: 'submenu' as const, item: match.item, parent: match.parent }
  }

  return null
}

export function buildContextSelectionPrompt(params: {
  language: string
  label: string
  parentLabel?: string | null
}) {
  const { language, label, parentLabel } = params
  const contextLabel = parentLabel ? `${parentLabel} - ${label}` : label
  const isEnglish = (language || '').toLowerCase().startsWith('en')

  if (isEnglish) {
    return [
      `Context active: ${contextLabel}.`,
      '',
      'I will keep this angle as the reading frame.',
      'Ask your actual question now, and I will answer from this context.',
    ].join('\n')
  }

  return [
    `Contexte actif : ${contextLabel}.`,
    '',
    'Je garde maintenant cet angle comme cadre de lecture.',
    'Pose ta vraie question dans ce contexte, et je declencherai la lecture a partir de cet angle.',
  ].join('\n')
}
