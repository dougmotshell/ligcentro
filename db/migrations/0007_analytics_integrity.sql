-- Migração 0007: integridade da ingestão de analytics
--
-- Três problemas resolvidos aqui:
--
-- 1. `UNIQUE(profile_id, day, country, referrer_host)` com colunas nuláveis: no
--    Postgres NULLs são distintos por padrão, então o `ON CONFLICT` do upsert
--    nunca casava quando país/referrer eram nulos e cada visita inseria uma
--    linha nova em vez de incrementar. `NULLS NOT DISTINCT` (PG 15+) corrige.
-- 2. A ingestão aceitava qualquer `profile_id`/`block_id` de quem chamasse — e o
--    `profileId` está no HTML público. As funções abaixo validam vínculo e
--    estado do perfil **dentro do banco**.
-- 3. A tabela agregada precisava de INSERT/UPDATE amplos para a role da
--    aplicação. Com `SECURITY DEFINER` a role só recebe EXECUTE da função, que
--    é o único caminho de escrita.

-- ─── 1. Upsert que realmente casa ────────────────────────────────────────────
-- Consolida as linhas duplicadas acumuladas antes da correção.
-- `PARTITION BY` trata NULLs como iguais, que é exatamente o agrupamento que a
-- constraint antiga não conseguia fazer. (Não dá para usar `MIN(id)`: não existe
-- `min(uuid)` no Postgres — daí a função de janela.)
WITH ranked AS (
  SELECT
    id,
    count,
    SUM(count) OVER w AS total,
    ROW_NUMBER() OVER (PARTITION BY profile_id, day, country, referrer_host ORDER BY id) AS position
  FROM page_views
  WINDOW w AS (PARTITION BY profile_id, day, country, referrer_host)
)
UPDATE page_views pv
SET count = r.total
FROM ranked r
WHERE pv.id = r.id
  AND r.position = 1
  AND r.total <> pv.count;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY profile_id, day, country, referrer_host ORDER BY id) AS position
  FROM page_views
)
DELETE FROM page_views pv
USING ranked r
WHERE pv.id = r.id
  AND r.position > 1;

-- Descobre o nome real da constraint em vez de adivinhar o gerado pelo Postgres:
-- se o nome não bater, o DROP seria no-op e a tabela ficaria com duas uniques
-- sobre as mesmas colunas — o ON CONFLICT poderia inferir a antiga
-- (NULLS DISTINCT) e o defeito voltaria sem aviso.
DO $$
DECLARE
  existing RECORD;
BEGIN
  FOR existing IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'page_views'::regclass
      AND contype = 'u'
      AND conname <> 'page_views_daily_key'
  LOOP
    EXECUTE format('ALTER TABLE page_views DROP CONSTRAINT %I', existing.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'page_views'::regclass AND conname = 'page_views_daily_key'
  ) THEN
    ALTER TABLE page_views
      ADD CONSTRAINT page_views_daily_key
      UNIQUE NULLS NOT DISTINCT (profile_id, day, country, referrer_host);
  END IF;
END $$;

-- ─── 2 e 3. Ingestão validada, por função ────────────────────────────────────

/**
 * Registra uma visita agregada.
 * Devolve FALSE (sem erro) quando o perfil não existe ou não está publicado —
 * a ingestão nunca deve quebrar a página pública.
 */
CREATE OR REPLACE FUNCTION public.record_page_view(
  target_profile_id UUID,
  visitor_country TEXT,
  referrer TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = target_profile_id AND status = 'published'
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO page_views (profile_id, day, country, referrer_host, count)
  VALUES (target_profile_id, CURRENT_DATE, visitor_country, referrer, 1)
  ON CONFLICT (profile_id, day, country, referrer_host)
  DO UPDATE SET count = page_views.count + 1;

  RETURN TRUE;
END;
$$;

/**
 * Registra um clique agregado.
 * Exige que o bloco pertença ao perfil informado e que o perfil esteja
 * publicado — sem isso qualquer um infla a métrica de qualquer bloco.
 */
CREATE OR REPLACE FUNCTION public.record_block_click(
  target_block_id UUID,
  target_profile_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM blocks b
    JOIN profiles p ON p.id = b.profile_id
    WHERE b.id = target_block_id
      AND b.profile_id = target_profile_id
      AND p.status = 'published'
  ) THEN
    RETURN FALSE;
  END IF;

  INSERT INTO block_clicks (block_id, profile_id, day, count)
  VALUES (target_block_id, target_profile_id, CURRENT_DATE, 1)
  ON CONFLICT (block_id, day)
  DO UPDATE SET count = block_clicks.count + 1;

  RETURN TRUE;
END;
$$;

/** Expurgo da retenção (ANALYTICS_RETENTION_DAYS). Devolve as linhas apagadas. */
CREATE OR REPLACE FUNCTION public.purge_old_analytics(retention_days INT)
RETURNS TABLE (deleted_page_views BIGINT, deleted_block_clicks BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cutoff DATE := CURRENT_DATE - retention_days;
  views_removed BIGINT;
  clicks_removed BIGINT;
BEGIN
  IF retention_days IS NULL OR retention_days < 1 THEN
    RAISE EXCEPTION 'retention_days precisa ser >= 1 (recebido: %)', retention_days;
  END IF;

  WITH removed AS (DELETE FROM page_views WHERE day < cutoff RETURNING 1)
  SELECT COUNT(*) INTO views_removed FROM removed;

  WITH removed AS (DELETE FROM block_clicks WHERE day < cutoff RETURNING 1)
  SELECT COUNT(*) INTO clicks_removed FROM removed;

  RETURN QUERY SELECT views_removed, clicks_removed;
END;
$$;

-- A role da aplicação escreve analytics **só** por estas funções.
REVOKE INSERT, UPDATE, DELETE ON page_views FROM ligcentro_app;
REVOKE INSERT, UPDATE, DELETE ON block_clicks FROM ligcentro_app;
GRANT EXECUTE ON FUNCTION public.record_page_view(UUID, TEXT, TEXT) TO ligcentro_app;
GRANT EXECUTE ON FUNCTION public.record_block_click(UUID, UUID) TO ligcentro_app;

-- O expurgo é operação administrativa: fica fora da role da aplicação.
REVOKE ALL ON FUNCTION public.purge_old_analytics(INT) FROM PUBLIC;
