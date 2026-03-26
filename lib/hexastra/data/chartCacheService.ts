/**
 * chartCacheService — Hexastra Coach
 *
 * Cache des réponses /chart/fusion basé sur les données de naissance.
 *
 * Principe :
 *   - Le cache est indexé par subject_hash = SHA-256(naissance normalisée)
 *   - Il est totalement indépendant du user_id
 *   - Si les mêmes données de naissance ont déjà été calculées → retour immédiat
 *   - Sinon → appel /chart/fusion → stockage → retour
 *
 * Toutes les opérations Supabase utilisent le client service_role (admin)
 * qui contourne le RLS. Ce service ne doit jamais être appelé côté client.
 */

import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

// ── Types ──────────────────────────────────────────────────────────────────────

export type SubjectBirthData = {
  /** Date de naissance normalisée ISO : YYYY-MM-DD */
  birthDate: string
  /** Heure de naissance HH:MM, optionnelle */
  birthTime?: string | null
  /** Nom de la ville de naissance */
  birthPlace: string
  /** Latitude (précision 4 décimales ≈ 11m) */
  birthLat: number
  /** Longitude (précision 4 décimales ≈ 11m) */
  birthLng: number
}

/** Paramètres complets pour l'appel /chart/fusion */
export type FusionCallParams = SubjectBirthData & {
  firstName?: string | null
  gender?: string | null
  question?: string | null
  practitionerUsage?: boolean
}

export type ChartCacheRow = {
  id: string
  subject_hash: string
  birth_date: string
  birth_time: string | null
  birth_place: string
  birth_lat: number
  birth_lng: number
  api_data: Record<string, unknown>
  api_version: string | null
  created_at: string
  updated_at: string
}

export type GetOrFetchResult = {
  data: Record<string, unknown>
  fromCache: boolean
  subjectHash: string
}

// ── Erreurs métier ─────────────────────────────────────────────────────────────

export class ChartCacheError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'INCOMPLETE_BIRTH_DATA'
      | 'API_UNAVAILABLE'
      | 'CACHE_READ_ERROR'
      | 'CACHE_WRITE_ERROR'
      | 'INVALID_API_RESPONSE',
  ) {
    super(message)
    this.name = 'ChartCacheError'
  }
}

// ── Normalisation partagée ────────────────────────────────────────────────────
//
// Ces fonctions sont la SOURCE DE VÉRITÉ unique pour la normalisation des
// données de naissance. Elles doivent être importées par tout code qui
// stocke ou compare des coordonnées / heures de naissance.

/**
 * Normalise une coordonnée géographique à 4 décimales (précision ≈ 11m).
 * Utilisé aussi bien pour générer le hash que pour stocker en base.
 * L'uniformité entre les deux usages garantit la stabilité de l'index UNIQUE.
 */
export function normalizeCoord(n: number): number {
  return parseFloat(n.toFixed(4))
}

/**
 * Normalise une heure de naissance pour le hash.
 *
 * Règle explicite :
 *   - null | undefined | '' | 'unknown' | 'inconnu' → '' (heure absente)
 *   - '00:00' → '00:00'  (minuit est une heure valide, pas un marqueur d'absence)
 *   - 'HH:MM:SS' → 'HH:MM' (secondes ignorées pour la comparaison)
 *   - Toute valeur non reconnue → '' (traitée comme absente)
 *
 * IMPORTANT : heure inconnue ≠ 00:00 — deux naissances distinctes dans le hash.
 */
function normalizeBirthTime(birthTime: string | null | undefined): string {
  if (!birthTime) return ''
  const t = birthTime.trim().toLowerCase()
  if (t === '' || t === 'unknown' || t === 'inconnu') return ''
  // Normalise HH:MM:SS → HH:MM (on ne conserve que les minutes)
  const match = t.match(/^(\d{2}:\d{2})/)
  return match ? match[1] : ''
}

// ── Hash déterministe ──────────────────────────────────────────────────────────

/**
 * Génère une empreinte SHA-256 déterministe à partir des données de naissance.
 *
 * Format de la chaîne hashée : "YYYY-MM-DD|HH:MM|lat.4d|lng.4d"
 * Exemples :
 *   heure connue   → "1990-06-15|14:30|48.8566|2.3522"
 *   heure inconnue → "1990-06-15||48.8566|2.3522"
 *   minuit         → "1990-06-15|00:00|48.8566|2.3522"  ← distinct de l'inconnu
 *
 * Cette fonction est la seule source de vérité pour le hash.
 * Ne pas recalculer le hash ailleurs — importer et appeler generateSubjectHash.
 */
export function generateSubjectHash(data: SubjectBirthData): string {
  const normalized = [
    data.birthDate.trim(),
    normalizeBirthTime(data.birthTime),
    normalizeCoord(data.birthLat).toFixed(4),
    normalizeCoord(data.birthLng).toFixed(4),
  ].join('|')

  return createHash('sha256').update(normalized, 'utf8').digest('hex')
}

// ── Validation des données de naissance ───────────────────────────────────────

function validateBirthData(data: SubjectBirthData): void {
  if (!data.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate)) {
    throw new ChartCacheError(
      `birthDate invalide : "${data.birthDate}" — format attendu YYYY-MM-DD`,
      'INCOMPLETE_BIRTH_DATA',
    )
  }
  if (!Number.isFinite(data.birthLat) || !Number.isFinite(data.birthLng)) {
    throw new ChartCacheError(
      `Coordonnées invalides : lat=${data.birthLat} lng=${data.birthLng}`,
      'INCOMPLETE_BIRTH_DATA',
    )
  }
  if (!data.birthPlace?.trim()) {
    throw new ChartCacheError('birthPlace manquant', 'INCOMPLETE_BIRTH_DATA')
  }
}

// ── Lecture cache ──────────────────────────────────────────────────────────────

async function readFromCache(hash: string): Promise<Record<string, unknown> | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('chart_cache')
    .select('api_data')
    .eq('subject_hash', hash)
    .maybeSingle<Pick<ChartCacheRow, 'api_data'>>()

  if (error) {
    logger.error('CACHE_READ_ERROR', { h: hash.slice(0, 8), err: error.message })
    throw new ChartCacheError(
      `Erreur lecture cache : ${error.message}`,
      'CACHE_READ_ERROR',
    )
  }

  return data?.api_data ?? null
}

// ── Écriture cache ─────────────────────────────────────────────────────────────
//
// Comportement concurrent :
//   Si deux requêtes identiques arrivent simultanément sans cache existant :
//   1. Les deux appelleront /chart/fusion (double appel Railway — acceptable)
//   2. La première upsert insère la ligne
//   3. La seconde upsert rencontre le conflit sur subject_hash → DO UPDATE
//      (met à jour updated_at uniquement) → idempotent, aucune perte de données
//   Ce comportement est intentionnel. Un verrou distribué serait disproportionné
//   pour ce cas d'usage. La double facturation Railway reste le seul coût.

async function writeToCache(
  hash: string,
  birthData: SubjectBirthData,
  apiData: Record<string, unknown>,
  apiVersion?: string,
): Promise<void> {
  const supabase = createAdminClient()

  // On stocke les coordonnées normalisées pour cohérence avec l'index UNIQUE
  const { error } = await supabase.from('chart_cache').upsert(
    {
      subject_hash: hash,
      birth_date: birthData.birthDate,
      // Stocke null si heure inconnue — ne jamais stocker 'unknown' en base
      birth_time: normalizeBirthTime(birthData.birthTime) || null,
      birth_place: birthData.birthPlace,
      birth_lat: normalizeCoord(birthData.birthLat),
      birth_lng: normalizeCoord(birthData.birthLng),
      api_data: apiData,
      api_version: apiVersion ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'subject_hash' },
  )

  if (error) {
    logger.error('CACHE_WRITE_ERROR', { h: hash.slice(0, 8), err: error.message })
    throw new ChartCacheError(
      `Erreur écriture cache : ${error.message}`,
      'CACHE_WRITE_ERROR',
    )
  }
}

// ── Appel API /chart/fusion ────────────────────────────────────────────────────

type RailwayCallFn = (
  endpoint: string,
  payload: Record<string, unknown>,
) => Promise<Record<string, unknown>>

async function callFusionApi(
  params: FusionCallParams,
  callRailway: RailwayCallFn,
): Promise<Record<string, unknown>> {
  // normalizeBirthTime retourne '' si inconnu → on substitue '00:00' pour l'ISO
  const timeForISO = normalizeBirthTime(params.birthTime) || '00:00'
  const birthDateISO = `${params.birthDate}T${timeForISO}:00Z`
  // L'API Railway reçoit 'unknown' quand l'heure n'est pas connue (comportement conservé)
  const birthTimeForApi = normalizeBirthTime(params.birthTime) || 'unknown'

  const payload: Record<string, unknown> = {
    first_name: params.firstName ?? '',
    birth_date: params.birthDate,
    birth_time: birthTimeForApi,
    birthDateISO,
    birth_city: params.birthPlace,
    lat: params.birthLat,
    lon: params.birthLng,
    gender: params.gender ?? 'M',
    question: params.question ?? '',
    practitioner_usage: params.practitionerUsage ?? false,
  }

  logger.info('FUSION_API_CALLED', { date: params.birthDate, place: params.birthPlace })
  const result = await callRailway('/chart/fusion', payload)

  if (!result || typeof result !== 'object') {
    throw new ChartCacheError(
      'Réponse /chart/fusion invalide ou vide',
      'INVALID_API_RESPONSE',
    )
  }

  return result as Record<string, unknown>
}

// ── Point d'entrée principal ───────────────────────────────────────────────────

/**
 * Récupère les données de fusion depuis le cache ou en appelant /chart/fusion.
 *
 * Flow :
 *   1. Valide les données de naissance
 *   2. Génère le subject_hash déterministe
 *   3. Cherche dans chart_cache
 *   4. Si trouvé → retour immédiat (fromCache: true)
 *   5. Sinon → appel /chart/fusion → stockage en cache → retour
 *
 * @param params      Données de naissance + paramètres optionnels
 * @param callRailway Fonction d'appel Railway injectée depuis runHexastraFlow
 * @param apiVersion  Version de l'API pour le suivi (optionnel)
 */
export async function getOrFetchChartData(
  params: FusionCallParams,
  callRailway: RailwayCallFn,
  apiVersion?: string,
): Promise<GetOrFetchResult> {
  // 1. Validation
  validateBirthData(params)

  // 2. Hash déterministe
  const subjectHash = generateSubjectHash(params)

  // 3. Lecture cache
  let cached: Record<string, unknown> | null = null
  try {
    cached = await readFromCache(subjectHash)
  } catch (err) {
    logger.warn('CACHE_READ_FAIL', {
      h: subjectHash.slice(0, 8),
      err: err instanceof Error ? err.message : String(err),
    })
  }

  if (cached) {
    logger.info('CACHE_HIT', { h: subjectHash.slice(0, 8), date: params.birthDate })
    return { data: cached, fromCache: true, subjectHash }
  }

  // 4. Appel API
  logger.info('CACHE_MISS', { h: subjectHash.slice(0, 8), date: params.birthDate, place: params.birthPlace })

  let apiData: Record<string, unknown>
  try {
    apiData = await callFusionApi(params, callRailway)
  } catch (err) {
    if (err instanceof ChartCacheError) throw err
    throw new ChartCacheError(
      `/chart/fusion indisponible : ${err instanceof Error ? err.message : String(err)}`,
      'API_UNAVAILABLE',
    )
  }

  // 5. Écriture cache (non-bloquante sur erreur)
  try {
    await writeToCache(subjectHash, params, apiData, apiVersion)
    logger.info('CACHE_WRITE', { h: subjectHash.slice(0, 8), date: params.birthDate })
  } catch (err) {
    logger.warn('CACHE_WRITE_FAIL', {
      h: subjectHash.slice(0, 8),
      err: err instanceof Error ? err.message : String(err),
    })
  }

  return { data: apiData, fromCache: false, subjectHash }
}

// ── Invalidation manuelle ─────────────────────────────────────────────────────

/**
 * Invalide (supprime) une entrée du cache.
 * Utilisé si l'API Railway change de version ou si les données sont obsolètes.
 */
export async function invalidateChartCache(subjectHash: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('chart_cache')
    .delete()
    .eq('subject_hash', subjectHash)

  if (error) {
    logger.error('CACHE_INVALIDATION_ERROR', { h: subjectHash.slice(0, 8), err: error.message })
  }
}
