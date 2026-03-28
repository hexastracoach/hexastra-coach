-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRATION : Index de performance pour /api/chat sous charge
-- Date : 2026-03-28
-- Auteur : hexastra-coach
-- ─────────────────────────────────────────────────────────────────────────────
--
-- CONTEXTE :
-- La fonction enforceDailyQuota() exécute cette requête à CHAQUE appel /api/chat :
--   SELECT * FROM daily_usage WHERE usage_key = $1
--
-- Sans index, Postgres fait un SEQUENTIAL SCAN sur toute la table daily_usage.
-- Avec 10 000 utilisateurs/jour, la table grossit de 10 000 lignes/jour.
-- À J+30, un full scan prend 10-50ms vs <1ms avec index.
--
-- IMPACT ATTENDU : réduction de 30-50ms par requête sur le quota check.
-- ─────────────────────────────────────────────────────────────────────────────

-- Index sur la colonne de lookup principale du quota journalier.
-- IF NOT EXISTS : idempotent, peut être rejoué sans erreur.
CREATE INDEX IF NOT EXISTS idx_daily_usage_key
  ON daily_usage (usage_key);

-- ─────────────────────────────────────────────────────────────────────────────
-- OPTIONNEL : index composite si tu filtres aussi par date ou feature
-- CREATE INDEX IF NOT EXISTS idx_daily_usage_key_date
--   ON daily_usage (usage_key, created_at DESC);
-- ─────────────────────────────────────────────────────────────────────────────
--
-- VÉRIFICATION après migration :
--   EXPLAIN ANALYZE SELECT * FROM daily_usage WHERE usage_key = 'abc123';
--   → doit afficher "Index Scan using idx_daily_usage_key"
-- ─────────────────────────────────────────────────────────────────────────────
