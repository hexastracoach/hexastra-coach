import type { BirthProfile, DomainRoute, PractitionerUsageHex } from '@/lib/hexastra/types'

export type ExecutedKsSubmodule = {
  key: string
  result: Record<string, unknown>
}

function findExecuted(results: ExecutedKsSubmodule[], key: string) {
  return results.find((entry) => entry.key === key)?.result ?? null
}

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function sumDigits(value: string) {
  return value
    .replace(/\D/g, '')
    .split('')
    .reduce((sum, digit) => sum + Number(digit), 0)
}

function inferBirthAnchor(birthData: BirthProfile | null) {
  const date = birthData?.birthDateISO ?? birthData?.date ?? ''
  const city = birthData?.place ?? ''
  const time = birthData?.time ?? ''
  const score = sumDigits(`${date}${time}${city}`)
  return score || 1
}

function buildPlanetariumResult(birthData: BirthProfile | null, latestUserMessage: string) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const phase =
    message.includes('jour') || message.includes('maintenant')
      ? 'activation'
      : anchor % 3 === 0
        ? 'transition'
        : 'stabilisation'
  const zone =
    anchor % 5 === 0 ? 'identity' : anchor % 2 === 0 ? 'direction' : 'relation'
  const dominantPlanet =
    anchor % 4 === 0 ? 'structure_saturnienne' : anchor % 3 === 0 ? 'elan_jovien' : 'sensibilite_lunaire'

  return {
    module_version: 'v1',
    phase_hint: phase,
    zone_hint: zone,
    notes: 'Lecture planetarium derivee des donnees de naissance deja enregistrees.',
    dominantSignals: [dominantPlanet, 'dominante_astrale'],
    signals: [
      {
        tag: dominantPlanet,
        description: 'Dominante planetaire prioritaire pour la lecture en cours.',
        intensity: 0.78,
        confidence: 0.72,
      },
      {
        tag: 'dominante_astrale',
        description: 'Pression astrale generale structurante.',
        intensity: 0.74,
        confidence: 0.69,
      },
    ],
    publicSummary: `Dominante astrale: ${dominantPlanet}. Phase ${phase}. Axe ${zone}.`,
  }
}

function buildDomusResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const zone =
    anchor % 4 === 0 ? 'relation' : anchor % 3 === 0 ? 'meaning' : 'direction'
  const houseSignal =
    zone === 'relation' ? 'maisons_relationnelles_activees' : zone === 'meaning' ? 'maisons_de_sens_activees' : 'maisons_de_direction_activees'

  return {
    module_version: 'v1',
    zone_hint: zone,
    notes: 'Cartographie des zones de vie les plus activees dans la lecture actuelle.',
    dominantSignals: [houseSignal],
    signals: [
      {
        tag: houseSignal,
        description: 'Zone de vie la plus activee selon la cartographie maison.',
        intensity: 0.75,
        confidence: 0.7,
      },
    ],
    publicSummary: `Zone de vie dominante: ${houseSignal}.`,
  }
}

function buildAspectumResult(birthData: BirthProfile | null, latestUserMessage: string) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const aspectSignal =
    message.includes('relation')
      ? 'tension_relationnelle_active'
      : anchor % 3 === 0
        ? 'aspect_de_reconfiguration'
        : 'aspect_de_cohesion'

  return {
    module_version: 'v1',
    phase_hint: aspectSignal === 'aspect_de_reconfiguration' ? 'transition' : 'stabilisation',
    zone_hint: aspectSignal === 'tension_relationnelle_active' ? 'relation' : 'direction',
    risk_flag: aspectSignal === 'tension_relationnelle_active',
    notes: 'Lecture des aspects dominants et de leur tension utile dans la situation.',
    dominantSignals: [aspectSignal],
    signals: [
      {
        tag: aspectSignal,
        description: 'Aspect dominant pour arbitrer la lecture astrale actuelle.',
        intensity: aspectSignal === 'tension_relationnelle_active' ? 0.81 : 0.74,
        confidence: 0.7,
      },
    ],
    publicSummary: `Aspect dominant: ${aspectSignal}.`,
  }
}

function buildInnerStateReaderResult(
  birthData: BirthProfile | null,
  latestUserMessage: string,
  domainRoute: DomainRoute
) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const state =
    message.includes('fatigue')
      ? 'fatigue_dominante'
      : message.includes('stress') || message.includes('surcharge')
        ? 'surcharge_interieure'
        : domainRoute === 'neurokua'
          ? anchor % 2 === 0
            ? 'besoin_de_regulation'
            : 'equilibre_fragile'
          : 'equilibre_interieur'

  return {
    module_version: 'v1',
    phase_hint: state === 'surcharge_interieure' ? 'activation' : 'stabilisation',
    zone_hint: 'security',
    risk_flag: state === 'surcharge_interieure',
    notes: "Lecture deterministe de l'etat interieur a partir du contexte et des donnees deja connues.",
    dominantSignals: [state],
    signals: [
      {
        tag: state,
        description: "Etat interieur dominant pour guider l'ajustement.",
        intensity: state === 'surcharge_interieure' ? 0.82 : 0.73,
        confidence: 0.71,
      },
    ],
    publicSummary: `Etat interieur dominant: ${state}.`,
  }
}

function buildActionTranslatorResult(
  latestUserMessage: string,
  practitionerUsage: PractitionerUsageHex
) {
  const message = normalizeText(latestUserMessage)
  const action =
    message.includes('theme') || message.includes('astral')
      ? 'prioriser_la_lecture_de_naissance'
      : message.includes('stress')
        ? 'ralentir_et_recentrer'
        : message.includes('fatigue')
          ? 'recharger_avant_d_agir'
          : practitionerUsage === 'client'
            ? 'formuler_un_conseil_clair_et_prudent'
            : 'passer_a_un_geste_simple'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'direction',
    notes: 'Traduction deterministe de la lecture en geste concret.',
    dominantSignals: [action],
    signals: [
      {
        tag: action,
        description: 'Ajustement pratique prioritaire a proposer maintenant.',
        intensity: 0.76,
        confidence: 0.74,
      },
    ],
    publicSummary: `Action prioritaire: ${action}.`,
  }
}

function buildNumCoreResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const core =
    anchor % 9 === 0
      ? 'cycle_d_expansion'
      : anchor % 4 === 0
        ? 'cycle_de_structuration'
        : 'cycle_de_maturation'

  return {
    module_version: 'v1',
    phase_hint: core === 'cycle_d_expansion' ? 'activation' : 'stabilisation',
    zone_hint: 'direction',
    notes: 'Signature numerique centrale derivee des donnees de naissance.',
    dominantSignals: [core],
    signals: [
      {
        tag: core,
        description: 'Cycle numerique structurant dominant.',
        intensity: 0.77,
        confidence: 0.72,
      },
    ],
    publicSummary: `Cycle numerique central: ${core}.`,
  }
}

function buildNumCycleResult(birthData: BirthProfile | null, latestUserMessage: string) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const cycle =
    message.includes('timing') || message.includes('moment')
      ? 'fenetre_temporelle_active'
      : anchor % 5 === 0
        ? 'phase_de_transition_numerique'
        : 'phase_de_consolidation_numerique'

  return {
    module_version: 'v1',
    phase_hint: cycle.includes('transition') ? 'transition' : 'stabilisation',
    zone_hint: cycle.includes('fenetre') ? 'expansion' : 'direction',
    notes: 'Lecture de la temporalite numerique utile pour la decision actuelle.',
    dominantSignals: [cycle],
    signals: [
      {
        tag: cycle,
        description: 'Cycle numerique actif pour guider le bon rythme.',
        intensity: 0.79,
        confidence: 0.71,
      },
    ],
    publicSummary: `Cycle numerique actif: ${cycle}.`,
  }
}

function buildSignalReaderResult(birthData: BirthProfile | null, latestUserMessage: string) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const direction =
    message.includes('ou') || message.includes('orientation')
      ? 'orientation_a_confirmer'
      : anchor % 4 === 0
        ? 'axe_est_ouverture'
        : anchor % 3 === 0
          ? 'axe_nord_recentrage'
          : 'axe_sud_ancrage'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'direction',
    notes: "Lecture directionnelle et d'orientation issue du contexte GPS Kua.",
    dominantSignals: [direction],
    signals: [
      {
        tag: direction,
        description: 'Orientation utile prioritaire pour le contexte actuel.',
        intensity: 0.76,
        confidence: 0.73,
      },
    ],
    publicSummary: `Orientation dominante: ${direction}.`,
  }
}

function buildAethericMapResult(results: ExecutedKsSubmodule[]) {
  const planetarium = findExecuted(results, 'KS.Planetarium')
  const domus = findExecuted(results, 'KS.Domus')
  const aspectum = findExecuted(results, 'KS.Aspectum')
  const summary = [
    typeof planetarium?.publicSummary === 'string' ? planetarium.publicSummary : null,
    typeof domus?.publicSummary === 'string' ? domus.publicSummary : null,
    typeof aspectum?.publicSummary === 'string' ? aspectum.publicSummary : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    module_version: 'v1',
    phase_hint: (planetarium?.phase_hint as string | undefined) ?? 'stabilisation',
    zone_hint:
      (domus?.zone_hint as string | undefined) ??
      (aspectum?.zone_hint as string | undefined) ??
      'direction',
    notes: 'Pont Astrolex vers une lecture integree HexAstra.',
    dominantSignals: ['carte_astrale_integree'],
    signals: [
      {
        tag: 'carte_astrale_integree',
        description: 'Signal astral integre issu du bundle planetarium/domus/aspectum.',
        intensity: 0.8,
        confidence: 0.75,
      },
    ],
    publicSummary: summary || 'Carte astrale integree pour la lecture globale.',
  }
}

function buildHexaNumLinkBridgeResult(results: ExecutedKsSubmodule[]) {
  const core = findExecuted(results, 'KS.NumCore')
  const cycle = findExecuted(results, 'KS.NumCycle')
  const summary = [
    typeof core?.publicSummary === 'string' ? core.publicSummary : null,
    typeof cycle?.publicSummary === 'string' ? cycle.publicSummary : null,
  ]
    .filter(Boolean)
    .join(' ')

  return {
    module_version: 'v1',
    phase_hint: (cycle?.phase_hint as string | undefined) ?? 'stabilisation',
    zone_hint: (cycle?.zone_hint as string | undefined) ?? 'direction',
    notes: 'Pont numerique vers la fusion HexAstra.',
    dominantSignals: ['cycle_numerique_integre'],
    signals: [
      {
        tag: 'cycle_numerique_integre',
        description: 'Signal numerique fusionne pour la lecture de rythme et de cycle.',
        intensity: 0.79,
        confidence: 0.74,
      },
    ],
    publicSummary: summary || 'Cycle numerique integre pour la lecture globale.',
  }
}

function buildPlantInterfaceResult(results: ExecutedKsSubmodule[]) {
  const direction = findExecuted(results, 'KS.SignalReader')
  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'direction',
    notes: "Traduction environnementale et d'espace a partir du signal directionnel.",
    dominantSignals: ['ajustement_environnemental'],
    signals: [
      {
        tag: 'ajustement_environnemental',
        description: "Ajustement concret de l'espace ou du positionnement.",
        intensity: 0.74,
        confidence: 0.73,
      },
    ],
    publicSummary:
      typeof direction?.publicSummary === 'string'
        ? `${direction.publicSummary} Ajustement environnemental recommande.`
        : 'Ajustement environnemental recommande.',
  }
}

function buildThemeHexAstraResult(results: ExecutedKsSubmodule[]) {
  const map = findExecuted(results, 'KS.AethericMap')
  return {
    module_version: 'v1',
    phase_hint: (map?.phase_hint as string | undefined) ?? 'stabilisation',
    zone_hint: (map?.zone_hint as string | undefined) ?? 'identity',
    notes: 'Contrat de lecture de theme natal stabilise pour la narration finale.',
    dominantSignals: ['signature_de_naissance'],
    signals: [
      {
        tag: 'signature_de_naissance',
        description: 'Signature natale integree prete a etre narree proprement.',
        intensity: 0.82,
        confidence: 0.77,
      },
    ],
    publicSummary:
      typeof map?.publicSummary === 'string'
        ? `${map.publicSummary} Signature de naissance integree.`
        : 'Signature de naissance integree.',
  }
}

export function executeKsSubmodules(params: {
  submodules: string[]
  birthData: BirthProfile | null
  latestUserMessage: string
  domainRoute: DomainRoute
  practitionerUsage: PractitionerUsageHex
}): ExecutedKsSubmodule[] {
  const results: ExecutedKsSubmodule[] = []

  for (const key of params.submodules) {
    if (key === 'KS.Planetarium') {
      results.push({
        key,
        result: buildPlanetariumResult(params.birthData, params.latestUserMessage),
      })
      continue
    }

    if (key === 'KS.Domus') {
      results.push({
        key,
        result: buildDomusResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.InnerStateReader') {
      results.push({
        key,
        result: buildInnerStateReaderResult(
          params.birthData,
          params.latestUserMessage,
          params.domainRoute
        ),
      })
      continue
    }

    if (key === 'KS.ActionTranslator') {
      results.push({
        key,
        result: buildActionTranslatorResult(
          params.latestUserMessage,
          params.practitionerUsage
        ),
      })
      continue
    }

    if (key === 'KS.Aspectum') {
      results.push({
        key,
        result: buildAspectumResult(params.birthData, params.latestUserMessage),
      })
      continue
    }

    if (key === 'KS.NumCore') {
      results.push({
        key,
        result: buildNumCoreResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.NumCycle') {
      results.push({
        key,
        result: buildNumCycleResult(params.birthData, params.latestUserMessage),
      })
      continue
    }

    if (key === 'KS.SignalReader') {
      results.push({
        key,
        result: buildSignalReaderResult(params.birthData, params.latestUserMessage),
      })
      continue
    }

    if (key === 'KS.AethericMap') {
      results.push({
        key,
        result: buildAethericMapResult(results),
      })
      continue
    }

    if (key === 'KS.HexaNum.LinkBridge') {
      results.push({
        key,
        result: buildHexaNumLinkBridgeResult(results),
      })
      continue
    }

    if (key === 'KS.PlantInterface') {
      results.push({
        key,
        result: buildPlantInterfaceResult(results),
      })
      continue
    }

    if (key === 'KS.ThemeHexAstra.V1') {
      results.push({
        key,
        result: buildThemeHexAstraResult(results),
      })
    }
  }

  return results
}
