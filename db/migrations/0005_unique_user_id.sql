-- Migração 0005: unicidade de user_id em profiles
-- Um usuário de auth tem no máximo um perfil no MVP. Sem esta unicidade o
-- `ON CONFLICT (user_id)` do callback OAuth não tem constraint para inferir e o
-- Postgres aborta a inserção — todo primeiro login OAuth falhava por isso.

-- Recusa aplicar a constraint em cima de dados inconsistentes, em vez de
-- apagar perfil de alguém silenciosamente.
DO $$
DECLARE
  duplicated INT;
BEGIN
  SELECT COUNT(*) INTO duplicated
  FROM (
    SELECT user_id
    FROM profiles
    WHERE user_id IS NOT NULL
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) AS d;

  IF duplicated > 0 THEN
    RAISE EXCEPTION 'profiles tem % user_id duplicado(s); resolva os duplicados antes de aplicar 0005', duplicated;
  END IF;
END $$;

-- Índice único (aceita múltiplos NULL) — serve de destino para o ON CONFLICT.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_user_id_key ON profiles(user_id);

-- O índice não-único de 0003 virou redundante.
DROP INDEX IF EXISTS profiles_user_id_idx;
