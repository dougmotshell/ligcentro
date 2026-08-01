-- Migração 0008: exclusão de conta (direito de eliminação, LGPD)
--
-- `block_clicks.profile_id` não tinha chave estrangeira. Na prática as linhas
-- somem junto com o bloco (cascata por `block_id`), mas sem a FK nada garante
-- que o `profile_id` gravado exista — e a garantia de que "apagar a conta apaga
-- tudo que é meu" precisa estar no schema, não na confiança.

-- Limpa eventuais órfãos antes de impor a restrição.
DELETE FROM block_clicks
WHERE profile_id NOT IN (SELECT id FROM profiles);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'block_clicks'::regclass
      AND conname = 'block_clicks_profile_id_fkey'
  ) THEN
    ALTER TABLE block_clicks
      ADD CONSTRAINT block_clicks_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

/**
 * Apaga a conta **do titular da sessão** e tudo que depende dela.
 *
 * Sem parâmetro de propósito: o alcance vem de `current_app_user_id()`, a mesma
 * variável de sessão que as políticas RLS avaliam. Uma versão anterior recebia o
 * id como argumento — e como `SECURITY DEFINER` ignora RLS, qualquer chamador
 * apagaria a conta de quem indicasse. Aqui nem um chamador com defeito consegue.
 *
 * `SECURITY DEFINER` continua necessário porque o expurgo alcança as tabelas
 * agregadas, das quais a role da aplicação não tem DELETE (migração 0007).
 *
 * Devolve o handle liberado, ou NULL quando não havia perfil.
 */
DROP FUNCTION IF EXISTS public.delete_account(UUID);

CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller UUID := public.current_app_user_id();
  freed_handle TEXT;
BEGIN
  IF caller IS NULL THEN
    RAISE EXCEPTION 'delete_account exige app.current_user_id definido na sessão';
  END IF;

  -- blocks, page_views e block_clicks caem por cascata das chaves estrangeiras.
  DELETE FROM profiles
  WHERE user_id = caller
  RETURNING handle INTO freed_handle;

  RETURN freed_handle;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_account() TO ligcentro_app;
