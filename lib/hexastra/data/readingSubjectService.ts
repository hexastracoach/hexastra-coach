/**
 * readingSubjectService — Hexastra Coach
 *
 * Gère les sujets de lecture d'un utilisateur :
 *   - profil propre (is_default = true)
 *   - proche soumis via formulaire (relation_type != 'self')
 *
 * Règle fondamentale :
 *   La soumission d'un proche ne modifie JAMAIS le profil principal.
 *   Les données du sujet principal (is_default = true) ne sont touchées que
 *   par des actions explicites de l'utilisateur.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'
import { normalizeCoord } from './chartCacheService'
import type { SubjectBirthData, FusionCallParams } from './chartCacheService'

// ── Types ──────────────────────────────────────────────────────────────────────

export type RelationType = 'self' | 'partner' | 'child' | 'friend' | 'colleague' | string

export type ReadingSubjectRow = {
  id: string
  user_id: string
  label: string
  first_name: string
  relation_type: RelationType | null
  birth_date: string
  birth_time: string | null
  birth_place: string
  birth_lat: number
  birth_lng: number
  is_default: boolean
  created_at: string
  updated_at: string
}

/** Données soumises lors d'une lecture pour un proche */
export type ProximateSubjectInput = {
  firstName: string
  label?: string
  relationType?: RelationType
  birthDate: string
  birthTime?: string | null
  birthPlace: string
  birthLat: number
  birthLng: number
}

/** Résultat de la résolution du sujet de lecture */
export type ResolvedSubject = {
  /** Source de la résolution */
  source: 'default_profile' | 'reading_subject' | 'ephemeral'
  /** ID du sujet dans reading_subjects (null si éphémère) */
  subjectId: string | null
  firstName: string
  label: string
  relationType: RelationType | null
  birthData: SubjectBirthData
  /** Paramètres prêts à passer à getOrFetchChartData */
  fusionParams: FusionCallParams
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Convertit une ligne Supabase en SubjectBirthData */
function rowToBirthData(row: ReadingSubjectRow): SubjectBirthData {
  return {
    birthDate: row.birth_date,
    birthTime: row.birth_time ?? null,
    birthPlace: row.birth_place,
    birthLat: row.birth_lat,
    birthLng: row.birth_lng,
  }
}

/** Convertit une ligne Supabase en FusionCallParams */
function rowToFusionParams(row: ReadingSubjectRow): FusionCallParams {
  return {
    ...rowToBirthData(row),
    firstName: row.first_name,
  }
}

// ── Lecture du sujet par défaut ────────────────────────────────────────────────

/**
 * Récupère le sujet de lecture par défaut d'un utilisateur (is_default = true).
 *
 * Si aucun sujet par défaut n'existe dans reading_subjects, tente de construire
 * un sujet depuis la table profiles (migration douce).
 */
export async function getDefaultSubject(userId: string): Promise<ResolvedSubject | null> {
  const supabase = createAdminClient()

  // 1. Cherche dans reading_subjects
  const { data: subject, error } = await supabase
    .from('reading_subjects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_default', true)
    .maybeSingle<ReadingSubjectRow>()

  if (error) {
    logger.error('[readingSubjectService] getDefaultSubject error', {
      userId,
      error: error.message,
    })
    return null
  }

  if (subject) {
    return {
      source: 'reading_subject',
      subjectId: subject.id,
      firstName: subject.first_name,
      label: subject.label,
      relationType: subject.relation_type ?? 'self',
      birthData: rowToBirthData(subject),
      fusionParams: rowToFusionParams(subject),
    }
  }

  // 2. Fallback : construire depuis profiles (si champs de naissance présents)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select(
      'id, full_name, birth_date, birth_time, birth_location, birth_lat, birth_lng',
    )
    .eq('id', userId)
    .maybeSingle()

  if (profileError || !profile) return null

  // Vérifie que les données minimales sont disponibles
  if (!profile.birth_date || !profile.birth_lat || !profile.birth_lng) return null

  const firstName = (profile.full_name ?? '').split(' ')[0] || 'Utilisateur'

  const birthData: SubjectBirthData = {
    birthDate: profile.birth_date,
    birthTime: profile.birth_time ?? null,
    birthPlace: profile.birth_location ?? '',
    birthLat: normalizeCoord(Number(profile.birth_lat)),
    birthLng: normalizeCoord(Number(profile.birth_lng)),
  }

  return {
    source: 'default_profile',
    subjectId: null,
    firstName,
    label: 'Mon profil',
    relationType: 'self',
    birthData,
    fusionParams: { ...birthData, firstName },
  }
}

// ── Résolution d'un proche soumis via formulaire ───────────────────────────────

/**
 * Résout un sujet de lecture à partir de données soumises par l'utilisateur.
 *
 * RÈGLE : Ne modifie JAMAIS le profil principal (is_default = true).
 *
 * Options :
 *   - saveSubject = true  → enregistre le proche dans reading_subjects (persistant)
 *   - saveSubject = false → retourne un sujet éphémère (non stocké)
 */
export async function resolveProximate(
  userId: string,
  input: ProximateSubjectInput,
  options: { saveSubject?: boolean } = {},
): Promise<ResolvedSubject> {
  // normalizeCoord est la source de vérité partagée avec generateSubjectHash
  // → garantit la cohérence avec l'index UNIQUE idx_reading_subjects_proximate_dedup
  const normLat = normalizeCoord(input.birthLat)
  const normLng = normalizeCoord(input.birthLng)

  const birthData: SubjectBirthData = {
    birthDate: input.birthDate,
    birthTime: input.birthTime ?? null,
    birthPlace: input.birthPlace,
    birthLat: normLat,
    birthLng: normLng,
  }

  const fusionParams: FusionCallParams = {
    ...birthData,
    firstName: input.firstName,
  }

  // Mode éphémère : retour direct sans stockage
  if (!options.saveSubject) {
    return {
      source: 'ephemeral',
      subjectId: null,
      firstName: input.firstName,
      label: input.label ?? `Proche — ${input.firstName}`,
      relationType: input.relationType ?? null,
      birthData,
      fusionParams,
    }
  }

  // Mode persistant : upsert dans reading_subjects
  const supabase = createAdminClient()

  const { data: inserted, error } = await supabase
    .from('reading_subjects')
    .upsert(
      {
        user_id: userId,
        label: input.label ?? `Proche — ${input.firstName}`,
        first_name: input.firstName,
        relation_type: input.relationType ?? null,
        birth_date: input.birthDate,
        birth_time: input.birthTime ?? null,
        birth_place: input.birthPlace,
        birth_lat: input.birthLat,
        birth_lng: input.birthLng,
        is_default: false,   // JAMAIS default pour un proche
        updated_at: new Date().toISOString(),
      },
      // Clé de déduplication : même user + même naissance + même nom
      { onConflict: 'user_id,first_name,birth_date,birth_lat,birth_lng', ignoreDuplicates: false },
    )
    .select('*')
    .maybeSingle<ReadingSubjectRow>()

  if (error || !inserted) {
    logger.warn('[readingSubjectService] resolveProximate upsert failed, returning ephemeral', {
      userId,
      firstName: input.firstName,
      error: error?.message,
    })
    return {
      source: 'ephemeral',
      subjectId: null,
      firstName: input.firstName,
      label: input.label ?? `Proche — ${input.firstName}`,
      relationType: input.relationType ?? null,
      birthData,
      fusionParams,
    }
  }

  return {
    source: 'reading_subject',
    subjectId: inserted.id,
    firstName: inserted.first_name,
    label: inserted.label,
    relationType: inserted.relation_type,
    birthData: rowToBirthData(inserted),
    fusionParams: rowToFusionParams(inserted),
  }
}

// ── Sélecteur principal ────────────────────────────────────────────────────────

/**
 * Résout le sujet de lecture selon le contexte de la conversation.
 *
 * Logique :
 *   - Si un proche est soumis explicitement → utiliser ces données
 *   - Sinon → utiliser le sujet par défaut de l'utilisateur
 *   - Si rien n'est disponible → retourner null (l'orchestrateur gère le fallback)
 *
 * @param userId      ID de l'utilisateur authentifié
 * @param proximate   Données d'un proche (si soumis via formulaire)
 * @param saveSubject Persistance du proche dans reading_subjects
 */
export async function resolveReadingSubject(
  userId: string,
  proximate?: ProximateSubjectInput | null,
  options: { saveSubject?: boolean } = {},
): Promise<ResolvedSubject | null> {
  // Cas 1 : proche soumis explicitement
  if (proximate?.firstName && proximate?.birthDate) {
    return resolveProximate(userId, proximate, options)
  }

  // Cas 2 : profil par défaut de l'utilisateur
  return getDefaultSubject(userId)
}

// ── Liste des sujets d'un utilisateur ─────────────────────────────────────────

/**
 * Retourne tous les sujets de lecture d'un utilisateur, triés par date de création.
 * Utile pour une interface de sélection de sujet.
 */
export async function listReadingSubjects(userId: string): Promise<ReadingSubjectRow[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('reading_subjects')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    logger.error('[readingSubjectService] listReadingSubjects error', {
      userId,
      error: error.message,
    })
    return []
  }

  return (data ?? []) as ReadingSubjectRow[]
}
