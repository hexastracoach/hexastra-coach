import { describe, expect, it } from 'vitest'
import { buildKnowledgePacket } from '@/lib/hexastra/orchestrator/buildKnowledgePacket'
import type { LayerResult } from '@/lib/hexastra/retrieval/multiLayerRetrieval'
import { getDocumentRegistryBlocks, lookupDocumentRegistry } from '@/lib/hexastra/vector/documentRegistry'

describe('buildKnowledgePacket', () => {
  it('uses the local document registry for explicit file mapping', () => {
    const entry = lookupDocumentRegistry('KS.NeuroKua.Synesthesia.V1 Architecture officielle.pdf')

    expect(entry?.role).toBe('referenceBook')
    expect(entry?.scienceTag).toBe('neurokua')
  })

  it('uses registry patterns for enneagram and maslow documents', () => {
    const enneagramEntry = lookupDocumentRegistry('Guide_Enneagramme_Type_6.pdf')
    const maslowEntry = lookupDocumentRegistry('Pyramide_de_Maslow_Besoins_du_moment.pdf')

    expect(enneagramEntry?.role).toBe('referenceBook')
    expect(enneagramEntry?.scienceTag).toBe('enneagramme')
    expect(maslowEntry?.role).toBe('referenceBook')
    expect(maslowEntry?.scienceTag).toBe('maslow')
  })

  it('exposes the document registry by science blocks', () => {
    const blocks = getDocumentRegistryBlocks()

    expect(blocks.astrologie.some((entry) => entry.canonicalName === 'PROMPT_ASTROLEX.txt')).toBe(true)
    expect(blocks.human_design.some((entry) => entry.canonicalName === 'PROMPT_PORTEUM.txt')).toBe(true)
    expect(blocks.neurokua.some((entry) => entry.canonicalName === 'PROMPT_NEUROSOMA.txt')).toBe(true)
    expect(
      blocks.ks_fusion_globaux.some(
        (entry) => entry.canonicalName === 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
      ),
    ).toBe(true)
  })

  it('orders the astrology block by priority and keeps astro subfocuses explicit', () => {
    const blocks = getDocumentRegistryBlocks()
    const astrologyBlock = blocks.astrologie

    expect(astrologyBlock[0]?.canonicalName).toBe('PROMPT_ASTROLEX.txt')
    expect(
      astrologyBlock.find((entry) => entry.canonicalName === 'La+charte.pdf')?.subscienceFocus,
    ).toBe('theme natal')
    expect(
      astrologyBlock.find((entry) => entry.canonicalName === "LA+STRUCTURE+D'UNE+CHARTE.pdf")
        ?.subscienceFocus,
    ).toBe('maisons')
    expect(
      astrologyBlock.find((entry) => entry.canonicalName === 'Chiron And The Healing Journey PDF.pdf')
        ?.subscienceFocus,
    ).toBe('chiron')
  })

  it('uses astrology registry patterns for synastry, geo-astrology and transits', () => {
    const synastryEntry = lookupDocumentRegistry('Guide_de_Synastrie_relationnelle.pdf')
    const geoEntry = lookupDocumentRegistry('Atlas_de_geo_astrologie.pdf')
    const transitEntry = lookupDocumentRegistry('Les_transits_de_Saturne.pdf')

    expect(synastryEntry?.scienceTag).toBe('astrolex')
    expect(synastryEntry?.subscienceFocus).toBe('synastrie')
    expect(geoEntry?.scienceTag).toBe('astrolex')
    expect(geoEntry?.subscienceFocus).toBe('geo astrologie')
    expect(transitEntry?.scienceTag).toBe('astrolex')
    expect(transitEntry?.subscienceFocus).toBe('transits')
  })

  it('orders the human design block by priority and keeps hd subfocuses explicit', () => {
    const blocks = getDocumentRegistryBlocks()
    const humanDesignBlock = blocks.human_design

    expect(humanDesignBlock[0]?.canonicalName).toBe('PROMPT_PORTEUM.txt')
    expect(
      humanDesignBlock.find((entry) => entry.canonicalName === 'Vivre de son desgin Humain.pdf')
        ?.subscienceFocus,
    ).toBe('autorite et strategie')
    expect(
      humanDesignBlock.find(
        (entry) =>
          entry.canonicalName ===
          '497772727-SDH-systeme-du-design-humain-Les-CroixdIncarnation.pdf',
      )?.subscienceFocus,
    ).toBe('croix d incarnation')
  })

  it('uses human design registry patterns for profile, centers, channels, gates and incarnation cross', () => {
    const profileEntry = lookupDocumentRegistry('Guide_Human_Design_Profil_5_1.pdf')
    const centersEntry = lookupDocumentRegistry('Atlas_des_centres_ouverts_et_definis.pdf')
    const channelsEntry = lookupDocumentRegistry('Cartographie_des_canaux_HD.pdf')
    const gatesEntry = lookupDocumentRegistry('Guide_des_portes_13_49.pdf')
    const authorityEntry = lookupDocumentRegistry('Autorite_interieure_et_strategie.pdf')
    const incarnationCrossEntry = lookupDocumentRegistry('Les_croix_d_incarnation_en_pratique.pdf')

    expect(profileEntry?.scienceTag).toBe('human_design')
    expect(profileEntry?.subscienceFocus).toBe('profil')
    expect(centersEntry?.subscienceFocus).toBe('centres')
    expect(channelsEntry?.subscienceFocus).toBe('canaux')
    expect(gatesEntry?.subscienceFocus).toBe('portes')
    expect(authorityEntry?.subscienceFocus).toBe('autorite et strategie')
    expect(incarnationCrossEntry?.subscienceFocus).toBe('croix d incarnation')
  })

  it('uses enneagram registry patterns for type, wing, instinct, stress, traps and growth levers', () => {
    const typeEntry = lookupDocumentRegistry('Guide_Enneagramme_Type_6.pdf')
    const wingEntry = lookupDocumentRegistry('Enneagramme_Wing_5w6.pdf')
    const instinctEntry = lookupDocumentRegistry('Enneagramme_Instinct_social_et_sexuel.pdf')
    const stressEntry = lookupDocumentRegistry('Enneagramme_stress_et_securite.pdf')
    const trapsEntry = lookupDocumentRegistry('Pieges_automatiques_Enneagramme.pdf')
    const leverEntry = lookupDocumentRegistry('Levier_evolutif_Enneagramme.pdf')

    expect(typeEntry?.subscienceFocus).toBe('type')
    expect(wingEntry?.subscienceFocus).toBe('aile')
    expect(instinctEntry?.subscienceFocus).toBe('instinct')
    expect(stressEntry?.subscienceFocus).toBe('stress ou securite')
    expect(trapsEntry?.subscienceFocus).toBe('pieges')
    expect(leverEntry?.subscienceFocus).toBe('levier evolutif')
  })

  it('orders the neurokua block by priority and keeps neurokua subfocuses explicit', () => {
    const blocks = getDocumentRegistryBlocks()
    const neurokuaBlock = blocks.neurokua

    expect(neurokuaBlock[0]?.canonicalName).toBe('9 - prompt_Neurokua_system.txt')
    expect(
      neurokuaBlock.find((entry) => entry.canonicalName === 'PROMPT_NEUROSOMA.txt')?.subscienceFocus,
    ).toBe('recalibration sensorielle')
    expect(
      neurokuaBlock.find((entry) => entry.canonicalName.includes('Hypoth'))?.subscienceFocus,
    ).toBe('modele neurokua')
    expect(
      neurokuaBlock.find(
        (entry) => entry.canonicalName === 'KS.NeuroKua.Synesthesia.V1 Architecture officielle.pdf',
      )?.subscienceFocus,
    ).toBe('synesthesie')
    expect(
      neurokuaBlock.find((entry) => entry.canonicalName.includes('MANIFESTE'))?.subscienceFocus,
    ).toBe('fondamentaux neurokua')
  })

  it('uses neurokua registry patterns for baseline, balance, timing, overload, recalibration and synesthesia', () => {
    const baselineEntry = lookupDocumentRegistry('Guide_NeuroKua_Baseline_etat_du_jour.pdf')
    const balanceEntry = lookupDocumentRegistry('NeuroKua_Balance_axe_correctif.pdf')
    const timingEntry = lookupDocumentRegistry('NeuroKua_Timing_agir_ou_recuperer.pdf')
    const overloadEntry = lookupDocumentRegistry('NeuroKua_Overload_surcharge_et_epuisement.pdf')
    const recalibrationEntry = lookupDocumentRegistry('NeuroKua_Recalibration_sensorielle.pdf')
    const synesthesiaEntry = lookupDocumentRegistry('NeuroKua_Synesthesia_espace_et_couleurs.pdf')

    expect(baselineEntry?.scienceTag).toBe('neurokua')
    expect(baselineEntry?.subscienceFocus).toBe('baseline')
    expect(balanceEntry?.subscienceFocus).toBe('balance')
    expect(timingEntry?.subscienceFocus).toBe('timing')
    expect(overloadEntry?.subscienceFocus).toBe('overload')
    expect(recalibrationEntry?.subscienceFocus).toBe('recalibration')
    expect(synesthesiaEntry?.subscienceFocus).toBe('synesthesie')
  })

  it('orders the numerologie block by priority and keeps numerology subfocuses explicit', () => {
    const blocks = getDocumentRegistryBlocks()
    const numerologyBlock = blocks.numerologie

    expect(numerologyBlock[0]?.canonicalName).toBe('7 - Prompt_DÉTECTION_DU_MOMENT_CLÉ_(TIMING INTELLIGENT).txt')
    expect(
      numerologyBlock.find((entry) => entry.canonicalName === 'The_Complete_Book_of_Numerology.pdf')
        ?.subscienceFocus,
    ).toBe('lecture numerologie generale')
    expect(
      numerologyBlock.find(
        (entry) => entry.canonicalName === '628462363-Numerology-and-the-Divine-Triangle.pdf',
      )?.subscienceFocus,
    ).toBe('triangle et vibration')
  })

  it('uses numerologie registry patterns for cycle annuel, mois personnel, chemin de vie, defis and vibration', () => {
    const cycleEntry = lookupDocumentRegistry('Numerologie_Cycle_annuel_2026.pdf')
    const monthEntry = lookupDocumentRegistry('Numerologie_Mois_personnel_9.pdf')
    const lifePathEntry = lookupDocumentRegistry('Guide_Numerologie_Chemin_de_vie_7.pdf')
    const challengeEntry = lookupDocumentRegistry('Numerologie_Defis_de_vie.pdf')
    const vibrationEntry = lookupDocumentRegistry('Numerologie_Vibration_dominante.pdf')
    const transitionEntry = lookupDocumentRegistry('Numerologie_Transition_de_cycle.pdf')

    expect(cycleEntry?.scienceTag).toBe('numerologie')
    expect(cycleEntry?.subscienceFocus).toBe('cycle annuel')
    expect(monthEntry?.subscienceFocus).toBe('mois personnel')
    expect(lifePathEntry?.subscienceFocus).toBe('chemin de vie')
    expect(challengeEntry?.subscienceFocus).toBe('defis')
    expect(vibrationEntry?.subscienceFocus).toBe('vibration')
    expect(transitionEntry?.subscienceFocus).toBe('transition')
  })

  it('orders the kua block by priority and keeps kua subfocuses explicit', () => {
    const blocks = getDocumentRegistryBlocks()
    const kuaBlock = blocks.kua

    expect(kuaBlock[0]?.canonicalName).toBe('PROMPT_GPS.txt')
    expect(kuaBlock[0]?.subscienceFocus).toBe('orientation generale')
  })

  it('uses kua registry patterns for directions, sensitive zones, living space, decision and environment', () => {
    const directionsEntry = lookupDocumentRegistry('Kua_Directions_favorables_du_moment.pdf')
    const zonesEntry = lookupDocumentRegistry('Kua_Zones_sensibles_a_corriger.pdf')
    const spaceEntry = lookupDocumentRegistry('Feng_Shui_espace_de_vie_et_orientation.pdf')
    const decisionEntry = lookupDocumentRegistry('Kua_Decision_et_orientation_juste.pdf')
    const environmentEntry = lookupDocumentRegistry('Kua_Equilibre_environnemental_maison.pdf')
    const adjustmentsEntry = lookupDocumentRegistry('Kua_Ajustement_espace_travail.pdf')

    expect(directionsEntry?.scienceTag).toBe('kua')
    expect(directionsEntry?.subscienceFocus).toBe('directions favorables')
    expect(zonesEntry?.subscienceFocus).toBe('zones sensibles')
    expect(spaceEntry?.subscienceFocus).toBe('espace de vie')
    expect(decisionEntry?.subscienceFocus).toBe('decision')
    expect(environmentEntry?.subscienceFocus).toBe('equilibre environnemental')
    expect(adjustmentsEntry?.subscienceFocus).toBe('ajustements espace')
  })

  it('prioritizes master prompt and reading structure when present', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'PROMPT_INSTRUCTION.txt',
        fileId: '1',
        text: 'Prompt instruction HexAstra coach. Priorites, ton, garde-fous, logique centrale.',
        score: 0.92,
      },
      {
        source: 'knowledge',
        filename: 'STRUCTURE_DES_LECTURES_HEXASTRA.txt',
        fileId: '2',
        text: 'Structure lecture HexAstra. Reconnaissance, dynamique, mise en perspective, levier, synthese.',
        score: 0.89,
      },
      {
        source: 'domain',
        filename: 'prompt_Neurokua_system.txt',
        fileId: '3',
        text: 'NeuroKua mon etat du jour. Axes, equilibre, ajustement, action utile.',
        score: 0.85,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'neurokua',
      selectedMenuLabel: 'NeuroKua',
      selectedSubmenuLabel: 'Mon état du jour',
      latestUserMessage: 'Je veux mon bilan NeuroKua du jour',
    })

    expect(packet?.masterPrompt?.filename).toBe('PROMPT_INSTRUCTION.txt')
    expect(packet?.readingStructure?.filename).toBe('STRUCTURE_DES_LECTURES_HEXASTRA.txt')
    expect(packet?.sciencePrompt[0]?.filename).toBe('prompt_Neurokua_system.txt')
    expect(packet?.focus.scienceFocus).toBe('neurokua')
    expect(packet?.focus.subscienceFocus).toBe('etat du jour')
  })

  it('falls back to supporting knowledge when no specialized prompt is detected', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Livre_symbolique_01.pdf',
        fileId: '10',
        text: 'Chapitre sur les cycles, les transitions et les dynamiques interieures.',
        score: 0.75,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'general',
      selectedMenuLabel: null,
      selectedSubmenuLabel: null,
      latestUserMessage: 'Je veux une lecture generale',
    })

    expect(packet?.masterPrompt).toBeNull()
    expect(packet?.readingStructure).toBeNull()
    expect(packet?.supportingKnowledge).toHaveLength(1)
    expect(packet?.supportingKnowledge[0]?.filename).toBe('Livre_symbolique_01.pdf')
  })

  it('ignores noisy files like README and module manifests', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'README.md',
        fileId: '20',
        text: 'Repository readme and setup notes.',
        score: 0.99,
      },
      {
        source: 'knowledge',
        filename: 'module.json',
        fileId: '21',
        text: 'Module descriptor.',
        score: 0.98,
      },
      {
        source: 'knowledge',
        filename: 'prompt_maitre_ks_fusion_v13_et_v13a12.txt',
        fileId: '22',
        text: 'Prompt maitre KS Fusion V13 et V13A12.',
        score: 0.9,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Astrologie',
      selectedSubmenuLabel: null,
      latestUserMessage: 'Analyse par science',
    })

    expect(packet?.masterPrompt?.filename).toBe('prompt_maitre_ks_fusion_v13_et_v13a12.txt')
    expect(packet?.ignoredSources).toHaveLength(2)
    expect(packet?.ignoredSources[0]?.filename).toBe('README.md')
  })

  it('promotes curated master and science prompt documents in the hierarchy', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'PROMPT_INSTRUCTION.txt',
        fileId: '30',
        text: 'Prompt instruction general avec ton, cadre et garde-fous.',
        score: 0.98,
      },
      {
        source: 'knowledge',
        filename: 'PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt',
        fileId: '31',
        text: 'Version ultra compacte de la lecture HexAstra.',
        score: 0.83,
      },
      {
        source: 'knowledge',
        filename: 'PROMPT SOUS MODULE KS FUSION V13.pdf',
        fileId: '32',
        text: 'Sous-modules, sous-sciences et logiques d exploitation.',
        score: 0.81,
      },
      {
        source: 'domain',
        filename: 'prompt_Neurokua_system.txt',
        fileId: '33',
        text: 'Prompt NeuroKua systeme, etat du jour et axes de lecture.',
        score: 0.9,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'neurokua',
      selectedMenuLabel: 'NeuroKua',
      selectedSubmenuLabel: 'Mon etat du jour',
      latestUserMessage: 'Je veux une lecture NeuroKua detaillee',
    })

    expect(packet?.masterPrompt?.filename).toBe('PROMPT SYSTème KS ULTRA COMPACT LECTURE HEXASTRA.txt')
    expect(packet?.sciencePrompt.map((entry) => entry.filename)).toContain('PROMPT SOUS MODULE KS FUSION V13.pdf')
  })

  it('treats the official KS prompt bundle as a master prompt source', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'KS_FUSION_V13_PROMPTS_OFFICIELS.docx',
        fileId: '40',
        text: 'Recueil officiel des prompts KS Fusion V13.',
        score: 0.76,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Astrologie',
      selectedSubmenuLabel: null,
      latestUserMessage: 'Analyse par science',
    })

    expect(packet?.masterPrompt?.filename).toBe('KS_FUSION_V13_PROMPTS_OFFICIELS.docx')
  })

  it('prioritizes science-aligned reference books before generic support', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'The_Complete_Book_of_Numerology.pdf',
        fileId: '50',
        text: 'Reference numerology book about cycles, life path and monthly influences.',
        score: 0.7,
      },
      {
        source: 'knowledge',
        filename: 'Kybalion.pdf',
        fileId: '51',
        text: 'Transverse symbolic reference.',
        score: 0.91,
      },
      {
        source: 'knowledge',
        filename: 'HexAstra_Knowledge_RAG.json',
        fileId: '52',
        text: 'Knowledge support block with generic retrieval chunks.',
        score: 0.95,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Numerologie',
      selectedSubmenuLabel: 'Cycle annuel',
      latestUserMessage: 'Je veux une lecture de numerologie sur mon cycle annuel',
    })

    expect(packet?.focus.scienceFocus).toBe('numerologie')
    expect(packet?.focus.subscienceFocus).toBe('cycle annuel')
    expect(packet?.referenceBook[0]?.filename).toBe('The_Complete_Book_of_Numerology.pdf')
    expect(packet?.referenceBook[0]?.scienceTag).toBe('numerologie')
    expect(packet?.referenceBook[1]?.filename).toBe('Kybalion.pdf')
    expect(packet?.fusionGuide).toContain('fusion')
    const numerologyBookIndex = packet?.orderedSources.findIndex(
      (entry) => entry?.filename === 'The_Complete_Book_of_Numerology.pdf',
    )
    const supportIndex = packet?.orderedSources.findIndex(
      (entry) => entry?.filename === 'HexAstra_Knowledge_RAG.json',
    )

    expect(numerologyBookIndex).toBeGreaterThanOrEqual(0)
    expect(supportIndex).toBeGreaterThanOrEqual(0)
    expect(numerologyBookIndex).toBeLessThan(supportIndex as number)
  })

  it('recognizes enneagram focus in the knowledge packet', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Guide_Enneagramme_Type_6.pdf',
        fileId: '60',
        text: 'Enneagram stress, defense patterns and growth resources.',
        score: 0.78,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'science',
      selectedMenuLabel: 'Enneagramme',
      selectedSubmenuLabel: 'Stress',
      latestUserMessage: 'Je veux une lecture Enneagramme sur mon fonctionnement sous stress',
    })

    expect(packet?.focus.scienceFocus).toBe('enneagramme')
  })

  it('prioritizes registered supporting knowledge above generic support', () => {
    const results: LayerResult[] = [
      {
        source: 'knowledge',
        filename: 'Livre_symbolique_01.pdf',
        fileId: '70',
        text: 'Generic symbolic support.',
        score: 0.97,
      },
      {
        source: 'knowledge',
        filename: 'HEXASTRA – KNOWLEDGE CORE.pdf',
        fileId: '71',
        text: 'Core HexAstra knowledge base.',
        score: 0.7,
      },
    ]

    const packet = buildKnowledgePacket({
      results,
      domainRoute: 'general',
      selectedMenuLabel: null,
      selectedSubmenuLabel: null,
      latestUserMessage: 'Je veux une lecture generale',
    })

    expect(packet?.supportingKnowledge[0]?.filename).toBe('HEXASTRA – KNOWLEDGE CORE.pdf')
  })
})
