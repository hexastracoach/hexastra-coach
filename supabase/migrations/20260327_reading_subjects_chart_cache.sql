-- ============================================================================
-- reading_subjects + chart_cache — Hexastra Coach
-- 2026-03-27
--
-- Objectif :
--   Permettre à un utilisateur de gérer plusieurs sujets de lecture
--   (soi-même, un proche) et mettre en cache les réponses /chart/fusion
--   basées sur les données de naissance (indépendamment du user_id).
--
-- Architecture :
--   profiles (existant)     → données du compte utilisateur
--   reading_subjects (new)  → sujets pouvant être analysés
--   chart_cache (new)       → cache brut des réponses API par empreinte de naissance
-- ============================================================================

-- ── Table 1 : reading_subjects ─────────────────────────────────────────────

create table if not exists public.reading_subjects (
  id              uuid          primary key default gen_random_uuid(),
  user_id         uuid          not null references auth.users(id) on delete cascade,

  -- Identification du sujet
  label           text          not null default 'Moi',
  first_name      text          not null,

  -- Relation : 'self' | 'partner' | 'child' | 'friend' | 'colleague' | null
  relation_type   text,

  -- Données de naissance
  birth_date      date          not null,
  birth_time      time,
  birth_place     text          not null,
  birth_lat       double precision not null,
  birth_lng       double precision not null,

  -- Sujet par défaut du compte (un seul autorisé par utilisateur via index unique)
  is_default      boolean       not null default false,

  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- Un seul sujet par défaut par utilisateur
create unique index if not exists idx_reading_subjects_one_default
  on public.reading_subjects(user_id)
  where is_default = true;

-- Déduplication des proches :
--   Un même utilisateur ne peut pas avoir deux entrées avec le même
--   prénom + date + coordonnées exactes de naissance.
--   C'est la clé que le service TypeScript utilise pour l'upsert.
--   NOTE : lat/lng sont arrondis à 4 décimales côté TypeScript avant insertion,
--   donc la comparaison est stable.
create unique index if not exists idx_reading_subjects_proximate_dedup
  on public.reading_subjects(user_id, first_name, birth_date, birth_lat, birth_lng);

-- Recherche rapide par user
create index if not exists idx_reading_subjects_user_id
  on public.reading_subjects(user_id);

-- Trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_reading_subjects_updated_at on public.reading_subjects;
create trigger trg_reading_subjects_updated_at
  before update on public.reading_subjects
  for each row execute function public.set_updated_at();

-- ── RLS : reading_subjects ─────────────────────────────────────────────────

alter table public.reading_subjects enable row level security;

-- SELECT : un utilisateur ne voit que ses propres sujets
create policy "reading_subjects_select_own"
  on public.reading_subjects
  for select
  using (auth.uid() = user_id);

-- INSERT : un utilisateur ne peut insérer que pour lui-même
create policy "reading_subjects_insert_own"
  on public.reading_subjects
  for insert
  with check (auth.uid() = user_id);

-- UPDATE : un utilisateur ne peut modifier que ses propres sujets
create policy "reading_subjects_update_own"
  on public.reading_subjects
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE : un utilisateur ne peut supprimer que ses propres sujets
create policy "reading_subjects_delete_own"
  on public.reading_subjects
  for delete
  using (auth.uid() = user_id);

-- ── Table 2 : chart_cache ──────────────────────────────────────────────────
--
-- IMPORTANT : Cette table n'est pas liée à user_id.
-- Le cache est indexé sur subject_hash = empreinte déterministe des données
-- de naissance. Si deux utilisateurs ont exactement les mêmes données de
-- naissance, ils partagent le même cache (normal et attendu).

create table if not exists public.chart_cache (
  id              uuid          primary key default gen_random_uuid(),

  -- Clé de cache : SHA-256(birth_date|birth_time|lat.4d|lng.4d)
  subject_hash    text          unique not null,

  -- Données de naissance (dénormalisées pour faciliter debug/invalidation)
  birth_date      date          not null,
  birth_time      time,
  birth_place     text          not null,
  birth_lat       double precision not null,
  birth_lng       double precision not null,

  -- Réponse brute de /chart/fusion
  api_data        jsonb         not null,

  -- Version de l'API au moment du calcul (ex: 'v2.1.0')
  -- Permet d'invalider le cache si l'API Railway change de version
  api_version     text,

  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- Index principal sur le hash (clé de lookup)
create index if not exists idx_chart_cache_subject_hash
  on public.chart_cache(subject_hash);

-- Index secondaire sur la date (pour purge ou reporting)
create index if not exists idx_chart_cache_birth_date
  on public.chart_cache(birth_date);

-- Index sur updated_at pour purge des entrées périmées
create index if not exists idx_chart_cache_updated_at
  on public.chart_cache(updated_at desc);

-- Trigger updated_at
drop trigger if exists trg_chart_cache_updated_at on public.chart_cache;
create trigger trg_chart_cache_updated_at
  before update on public.chart_cache
  for each row execute function public.set_updated_at();

-- ── RLS : chart_cache ──────────────────────────────────────────────────────
--
-- chart_cache n'est jamais accédé directement depuis le client.
-- Toutes les opérations passent par les route handlers Next.js
-- qui utilisent le client service_role (createAdminClient).
-- → Aucune politique utilisateur = aucun accès depuis le navigateur.

alter table public.chart_cache enable row level security;

-- Aucune politique explicite = table fermée aux rôles anon/authenticated.
-- Le service_role contourne automatiquement le RLS.
