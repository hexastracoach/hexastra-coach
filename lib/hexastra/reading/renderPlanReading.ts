/**
 * renderPlanReading — Renderer multi-plan Hexastra
 *
 * UN SEUL MOTEUR — DES FENÊTRES DE RENDU DIFFÉRENTES.
 *
 * Source : CompactReadingCore + HexastraSpheres (générées par mapCompactCoreToSpheres)
 * Sortie : texte final prêt à être injecté comme contexte LLM ou affiché directement.
 *
 * STRUCTURE PAR PLAN :
 *
 * free         → 4 blocs (CE QUI SE PASSE / POURQUOI / ACTION / CLÉ)
 * essential    → 4 blocs + 6 sphères visibles (émotionnelle, schémas, extérieure,
 *                timing, énergétique, blocage)
 * premium      → 4 blocs + 12 sphères complètes
 * practitioner → 12 sphères + approfondissement (dynamiques, levier, vision)
 *
 * RÈGLES DE TON :
 * - Jamais de jargon
 * - Jamais de science citée
 * - Titres en majuscules pour les 4 blocs
 * - ◆ pour les sphères
 * - ────────── séparateur obligatoire entre les 4 blocs et les sphères
 * - Praticien : ═══════════ séparateur d'approfondissement
 */

import type { PlanKey } from '@/lib/plans'
import type { CompactReadingCore } from '@/lib/hexastra/orchestrator/compactReadingCore'
import type { HexastraSpheres } from '@/lib/hexastra/reading/mapCompactCoreToSpheres'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RenderPlanInput = {
  /** CompactReadingCore — source de vérité */
  compactCore: CompactReadingCore
  /** 12 sphères générées par mapCompactCoreToSpheres */
  spheres: HexastraSpheres
  /** Plan utilisateur — contrôle la fenêtre de rendu */
  plan: PlanKey
  /** Intent détecté — utilisé pour adapter le ton des 4 blocs */
  intent?: string | null
  /** Prénom de l'utilisateur (optionnel) */
  firstName?: string | null
  /** Langue : 'fr' (défaut) | 'en' */
  lang?: string
}

// ── Labels des 4 blocs de base ────────────────────────────────────────────────

const BLOCK_LABELS_FR = {
  happening:  'CE QUI SE PASSE',
  why:        'POURQUOI ÇA BLOQUE',
  action:     'CE QUE TU DOIS FAIRE',
  key:        'CLÉ À RETENIR',
}

const BLOCK_LABELS_EN = {
  happening:  'WHAT IS HAPPENING',
  why:        'WHY IT IS BLOCKING',
  action:     'WHAT YOU NEED TO DO',
  key:        'KEY TAKEAWAY',
}

// ── Séparateurs visuels ───────────────────────────────────────────────────────

const SEP_STANDARD   = '──────────'
const SEP_PRACTITIONER = '══════════'

// ── Helpers de formatage ──────────────────────────────────────────────────────

function section(label: string, content: string): string {
  return `${label}\n${content}`
}

function sphere(s: { title: string; content: string }): string {
  return `◆ ${s.title}\n${s.content}`
}

// ── Construction des 4 blocs de base ─────────────────────────────────────────

/**
 * CE QUI SE PASSE — Ancre dans la réalité dominante.
 * Source : sphère 1 (Centrale) = dominantDynamic
 */
function buildBlock1(spheres: HexastraSpheres, firstName: string | null | undefined): string {
  const content = spheres.spheres[0]?.content ?? ''
  return firstName ? `${firstName}, ${content.charAt(0).toLowerCase() + content.slice(1)}` : content
}

/**
 * POURQUOI ÇA BLOQUE — Le mécanisme + la tension.
 * Source : sphère 2 (Mécanisme) + sphère 3 (Tension)
 * Si trop longs, tronquer à la première clause.
 */
function buildBlock2(spheres: HexastraSpheres): string {
  const s2 = spheres.spheres[1]?.content ?? ''
  const s3 = spheres.spheres[2]?.content ?? ''

  if (!s3 || s3 === s2) return s2

  // Combiner si les deux apportent quelque chose de différent
  return `${s2} — ${s3.charAt(0).toLowerCase() + s3.slice(1)}`
}

/**
 * CE QUE TU DOIS FAIRE — Le mouvement juste.
 * Source : sphère 11 (Mouvement juste) = rightMovement + decisionSignal
 */
function buildBlock3(spheres: HexastraSpheres): string {
  return spheres.spheres[10]?.content ?? ''
}

/**
 * CLÉ À RETENIR — La synthèse mémorable.
 * Source : summary ou sphère 12 (Synthèse) = leveragePoint
 */
function buildBlock4(spheres: HexastraSpheres): string {
  const s12 = spheres.spheres[11]?.content ?? ''
  const summary = spheres.summary

  // Préférer le summary (plus concis) si disponible et différent de S12
  if (summary && summary !== s12 && summary.length < 150) return summary
  return s12
}

// ── Constructeurs par plan ─────────────────────────────────────────────────────

function renderFourBlocks(
  spheres: HexastraSpheres,
  labels: typeof BLOCK_LABELS_FR,
  firstName: string | null | undefined,
): string[] {
  return [
    section(labels.happening, buildBlock1(spheres, firstName)),
    section(labels.why,       buildBlock2(spheres)),
    section(labels.action,    buildBlock3(spheres)),
    section(labels.key,       buildBlock4(spheres)),
  ]
}

/**
 * plan = free : 4 blocs essentiels, compressés.
 * Basés sur les 12 sphères, mais seul le noyau est rendu.
 */
function renderFree(input: RenderPlanInput, isFr: boolean): string {
  const labels = isFr ? BLOCK_LABELS_FR : BLOCK_LABELS_EN
  const blocks = renderFourBlocks(input.spheres, labels, input.firstName)
  return blocks.join('\n\n')
}

/**
 * plan = essential : 4 blocs + 6 sphères clés.
 * Sphères visibles : émotionnelle (5), schémas (6), extérieure (7),
 * timing (8), énergétique (9), blocage (10).
 */
function renderEssential(input: RenderPlanInput, isFr: boolean): string {
  const labels = isFr ? BLOCK_LABELS_FR : BLOCK_LABELS_EN
  const blocks = renderFourBlocks(input.spheres, labels, input.firstName)

  const ESSENTIAL_SPHERE_IDS = [5, 6, 7, 8, 9, 10]
  const selectedSpheres = input.spheres.spheres
    .filter((s) => ESSENTIAL_SPHERE_IDS.includes(s.id))
    .map(sphere)

  return [
    blocks.join('\n\n'),
    SEP_STANDARD,
    selectedSpheres.join('\n\n'),
  ].join('\n\n')
}

/**
 * plan = premium : 4 blocs + 12 sphères complètes.
 */
function renderPremium(input: RenderPlanInput, isFr: boolean): string {
  const labels = isFr ? BLOCK_LABELS_FR : BLOCK_LABELS_EN
  const blocks = renderFourBlocks(input.spheres, labels, input.firstName)

  const allSpheres = input.spheres.spheres.map(sphere)

  return [
    blocks.join('\n\n'),
    SEP_STANDARD,
    allSpheres.join('\n\n'),
  ].join('\n\n')
}

/**
 * plan = practitioner : 12 sphères + approfondissement.
 * Approfondissement :
 * - Dynamiques dominantes (liens entre sphères)
 * - Levier stratégique
 * - Vision d'ensemble
 */
function renderPractitioner(input: RenderPlanInput, isFr: boolean): string {
  const allSpheres = input.spheres.spheres.map(sphere)

  // Approfondissement : liens entre sphères-clés
  const dynamics = isFr
    ? buildPractitionerDynamics(input, isFr)
    : buildPractitionerDynamics(input, isFr)

  const sections = [
    allSpheres.join('\n\n'),
    SEP_PRACTITIONER,
  ]

  if (isFr) {
    sections.push(
      `◆ Dynamiques dominantes\n${dynamics.dominant}`,
      `◆ Levier stratégique\n${dynamics.lever}`,
      `◆ Vision d'ensemble\n${dynamics.overview}`,
    )
  } else {
    sections.push(
      `◆ Dominant dynamics\n${dynamics.dominant}`,
      `◆ Strategic lever\n${dynamics.lever}`,
      `◆ Overview\n${dynamics.overview}`,
    )
  }

  return sections.join('\n\n')
}

/**
 * Construit le bloc d'approfondissement pour le plan praticien.
 * - Dynamiques dominantes : connexion entre sphères centrales (1, 2, 3) et blocage (10, 11)
 * - Levier : leveragePoint
 * - Vision d'ensemble : ce que les 12 sphères révèlent collectivement
 */
function buildPractitionerDynamics(
  input: RenderPlanInput,
  isFr: boolean,
): { dominant: string; lever: string; overview: string } {
  const { compactCore, spheres } = input

  const s1 = spheres.spheres[0]?.content ?? ''  // Centrale
  const s10 = spheres.spheres[9]?.content ?? '' // Blocage
  const s11 = spheres.spheres[10]?.content ?? '' // Mouvement

  if (isFr) {
    const dominant = `${s1} — ce qui génère directement ${s10.charAt(0).toLowerCase() + s10.slice(1)}`
    const lever = compactCore.leveragePoint
    const overview = `La lecture complète montre que ${s1.charAt(0).toLowerCase() + s1.slice(1)} est à la fois la source et la clé : aligner ${compactCore.rightMovement} résout l'essentiel.`

    return { dominant, lever, overview }
  }

  const dominant = `${s1} — which directly generates ${s10.charAt(0).toLowerCase() + s10.slice(1)}`
  const lever = compactCore.leveragePoint
  const overview = `The complete reading shows that ${s1.charAt(0).toLowerCase() + s1.slice(1)} is both the source and the key: aligning ${compactCore.rightMovement} resolves the essential.`

  // Keep s11 in scope (used for future extensions)
  void s11

  return { dominant, lever, overview }
}

// ── API publique ───────────────────────────────────────────────────────────────

/**
 * Rend la lecture complète selon le plan utilisateur.
 *
 * UN SEUL MOTEUR — DES FENÊTRES DIFFÉRENTES :
 * - free         → 4 blocs
 * - essential    → 4 blocs + 6 sphères clés
 * - premium      → 4 blocs + 12 sphères
 * - practitioner → 12 sphères + approfondissement
 *
 * @param input  RenderPlanInput : core + spheres + plan + ctx
 * @returns      Texte final formaté, prêt à être injecté comme contexte LLM
 *
 * @example
 * const spheres = mapCompactCoreToSpheres(core, { intent: 'blocage' })
 * renderPlanReading({ compactCore: core, spheres, plan: 'premium', lang: 'fr' })
 */
export function renderPlanReading(input: RenderPlanInput): string {
  const isFr = (input.lang ?? 'fr').slice(0, 2).toLowerCase() !== 'en'

  switch (input.plan) {
    case 'practitioner':
      return renderPractitioner(input, isFr)
    case 'premium':
      return renderPremium(input, isFr)
    case 'essential':
      return renderEssential(input, isFr)
    default:
      return renderFree(input, isFr)
  }
}
