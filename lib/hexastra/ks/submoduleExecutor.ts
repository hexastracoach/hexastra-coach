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

function buildTypeProfileResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const types = [
    {
      type: 'Generator',
      signature: 'satisfaction',
      notSelf: 'frustration',
      strategy: 'repondre a ce qui se presente avant de forcer',
      authority: 'sacrale',
    },
    {
      type: 'Manifesting Generator',
      signature: 'satisfaction en mouvement',
      notSelf: 'frustration impatiente',
      strategy: 'repondre puis informer avant d accelerer',
      authority: 'sacrale',
    },
    {
      type: 'Projector',
      signature: 'reconnaissance juste',
      notSelf: 'amertume',
      strategy: 'attendre la bonne invitation',
      authority: 'splenique',
    },
    {
      type: 'Manifestor',
      signature: 'paix par l initiative juste',
      notSelf: 'colere',
      strategy: 'informer avant de lancer le mouvement',
      authority: 'emotionnelle',
    },
    {
      type: 'Reflector',
      signature: 'surprise lucide',
      notSelf: 'deception',
      strategy: 'laisser passer un cycle avant de conclure',
      authority: 'lunaire',
    },
  ] as const

  const profile = types[anchor % types.length] ?? types[0]

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'identity',
    notes: 'Type, signature et non-soi Human Design derives du profil de naissance disponible.',
    dominantSignals: [`type_${profile.type.toLowerCase().replace(/\s+/g, '_')}`],
    signals: [
      {
        tag: `type_${profile.type.toLowerCase().replace(/\s+/g, '_')}`,
        description: 'Type Human Design dominant pour la lecture en cours.',
        intensity: 0.79,
        confidence: 0.72,
      },
    ],
    type_label: profile.type,
    signature: profile.signature,
    not_self: profile.notSelf,
    strategy: profile.strategy,
    authority_hint: profile.authority,
    publicSummary: `Type Human Design dominant: ${profile.type}. Signature: ${profile.signature}. Non-soi: ${profile.notSelf}.`,
  }
}

function buildProfileMapResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const lineA = (anchor % 6) + 1
  const lineB = ((anchor + 2) % 6) + 1
  const profile = `${lineA}/${lineB}`

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'identity',
    notes: 'Lecture du profil Human Design et du style naturel d incarnation.',
    dominantSignals: [`profil_${lineA}_${lineB}`],
    signals: [
      {
        tag: `profil_${lineA}_${lineB}`,
        description: 'Profil Human Design le plus structurant.',
        intensity: 0.75,
        confidence: 0.7,
      },
    ],
    profile,
    publicSummary: `Profil Human Design: ${profile}. Il colore ta posture naturelle, ton style d apprentissage et ta maniere d entrer en relation avec l experience.`,
  }
}

function buildChannelMapResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const channels = ['1-8', '2-14', '10-20', '13-33', '21-45', '29-46', '34-57', '35-36', '48-16', '57-20']
  const first = channels[anchor % channels.length] ?? channels[0]
  const second = channels[(anchor + 3) % channels.length] ?? channels[1]

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'expression',
    notes: 'Lecture des canaux Human Design dominants et de leur circulation.',
    dominantSignals: ['canaux_hd_dominants'],
    signals: [
      {
        tag: 'canaux_hd_dominants',
        description: 'Canaux Human Design les plus utiles a regarder maintenant.',
        intensity: 0.74,
        confidence: 0.7,
      },
    ],
    channels: [first, second],
    publicSummary: `Canaux mis en avant: ${first} et ${second}. Ils parlent de ta circulation naturelle entre expression, direction et mise en mouvement.`,
  }
}

function describeGate(gate: number) {
  if (gate <= 8) return 'expression et contribution'
  if (gate <= 16) return 'focalisation et talent'
  if (gate <= 24) return 'mental et clarification'
  if (gate <= 32) return 'valeur, instinct et engagement'
  if (gate <= 40) return 'experience et transmission'
  if (gate <= 48) return 'profondeur et pression evolutive'
  if (gate <= 56) return 'relation et stimulation'
  return 'intuition et finesse de perception'
}

function buildGateMapResult(birthData: BirthProfile | null, latestUserMessage: string) {
  const anchor = inferBirthAnchor(birthData)
  const message = normalizeText(latestUserMessage)
  const gates = [
    ((anchor % 64) || 64),
    (((anchor + 11) % 64) || 64),
    (((anchor + 27) % 64) || 64),
  ]

  const gateLabels = gates.map((gate) => `${gate} (${describeGate(gate)})`)
  const emphasis =
    message.includes('porte') || message.includes('hd')
      ? 'Ce sont celles a regarder en priorite dans ta question actuelle.'
      : 'Elles donnent le ton de ta dynamique Human Design du moment.'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'identity',
    notes: 'Lecture des portes Human Design les plus saillantes dans le contexte actuel.',
    dominantSignals: ['portes_hd_actives'],
    signals: [
      {
        tag: 'portes_hd_actives',
        description: 'Portes Human Design dominantes pour la lecture en cours.',
        intensity: 0.77,
        confidence: 0.71,
      },
    ],
    gates,
    publicSummary: `Portes mises en avant: ${gateLabels.join(', ')}. ${emphasis}`,
  }
}

function buildAuthorityStrategyResult(birthData: BirthProfile | null) {
  const typeProfile = buildTypeProfileResult(birthData)
  const authority = typeof typeProfile.authority_hint === 'string' ? typeProfile.authority_hint : 'interieure'
  const strategy = typeof typeProfile.strategy === 'string' ? typeProfile.strategy : 'attendre un signal clair avant d agir'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'direction',
    notes: 'Lecture de l autorite interieure et de la strategie de decision Human Design.',
    dominantSignals: ['autorite_et_strategie_hd'],
    signals: [
      {
        tag: 'autorite_et_strategie_hd',
        description: 'Mode de decision Human Design le plus fiable dans ce contexte.',
        intensity: 0.78,
        confidence: 0.72,
      },
    ],
    authority,
    strategy,
    publicSummary: `Autorite interieure: ${authority}. Strategie conseillee: ${strategy}.`,
  }
}

function buildPolarityMapResult(birthData: BirthProfile | null) {
  const anchor = inferBirthAnchor(birthData)
  const polarity =
    anchor % 2 === 0
      ? 'equilibre entre perception et action'
      : 'equilibre entre receptivite et impulsion'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'identity',
    notes: 'Lecture des polarites utiles pour arbitrer la dynamique Human Design.',
    dominantSignals: ['polarite_hd'],
    signals: [
      {
        tag: 'polarite_hd',
        description: 'Polarite dominante a harmoniser dans la lecture Human Design.',
        intensity: 0.73,
        confidence: 0.69,
      },
    ],
    publicSummary: `Polarite dominante: ${polarity}.`,
  }
}

function buildIncarnationCrossResult(results: ExecutedKsSubmodule[]) {
  const profile = findExecuted(results, 'KS.ProfileMap')
  const gates = findExecuted(results, 'KS.GateMap')
  const profileLabel = typeof profile?.profile === 'string' ? profile.profile : 'profil a preciser'
  const gateList = Array.isArray(gates?.gates) ? gates.gates.join(', ') : 'portes a confirmer'

  return {
    module_version: 'v1',
    phase_hint: 'stabilisation',
    zone_hint: 'meaning',
    notes: 'Lecture simplifiee de l axe d incarnation a partir du profil et des portes dominantes.',
    dominantSignals: ['croix_d_incarnation'],
    signals: [
      {
        tag: 'croix_d_incarnation',
        description: 'Axe directeur de l incarnation Human Design.',
        intensity: 0.71,
        confidence: 0.67,
      },
    ],
    publicSummary: `Axe d incarnation suggere: profil ${profileLabel}, avec un accent sur les portes ${gateList}.`,
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

    if (key === 'KS.TypeProfile') {
      results.push({
        key,
        result: buildTypeProfileResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.ProfileMap') {
      results.push({
        key,
        result: buildProfileMapResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.ChannelMap') {
      results.push({
        key,
        result: buildChannelMapResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.GateMap') {
      results.push({
        key,
        result: buildGateMapResult(params.birthData, params.latestUserMessage),
      })
      continue
    }

    if (key === 'KS.AuthorityStrategy') {
      results.push({
        key,
        result: buildAuthorityStrategyResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.PolarityMap') {
      results.push({
        key,
        result: buildPolarityMapResult(params.birthData),
      })
      continue
    }

    if (key === 'KS.IncarnationCross') {
      results.push({
        key,
        result: buildIncarnationCrossResult(results),
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
