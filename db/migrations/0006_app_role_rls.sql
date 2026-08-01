-- Migração 0006: role de aplicação para que a RLS realmente valha
--
-- Até aqui as políticas existiam mas nunca eram exercidas: o app conecta com a
-- role dona das tabelas (superusuária no compose local, `postgres` no Supabase),
-- que bypassa RLS, e nada definia `app.current_user_id`. O isolamento
-- multi-tenant era 100% aplicação — um `WHERE` esquecido vazaria dados.
--
-- Modelo adotado (o mesmo do Supabase, com nomes próprios):
--   * a role da conexão é a "de serviço": bypassa RLS e serve às operações que
--     precisam ver todos os tenants (disponibilidade de handle, provisionamento
--     de perfil, migrações e seeds);
--   * tudo que roda **em nome de um usuário** faz `SET LOCAL ROLE ligcentro_app`
--     dentro da transação, e aí as políticas passam a valer — `SET ROLE` troca a
--     role efetiva, então até uma conexão superusuária fica sujeita à RLS.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ligcentro_app') THEN
    CREATE ROLE ligcentro_app NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END $$;

-- A role da conexão precisa ser membro para poder fazer SET ROLE.
DO $$
BEGIN
  EXECUTE format('GRANT ligcentro_app TO %I', current_user);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

GRANT USAGE ON SCHEMA public TO ligcentro_app;

-- Privilégios mínimos: a role da aplicação não cria nem altera estrutura.
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO ligcentro_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON blocks TO ligcentro_app;
GRANT SELECT ON page_views TO ligcentro_app;
GRANT SELECT ON block_clicks TO ligcentro_app;

-- ─── Políticas consolidadas ──────────────────────────────────────────────────
--
-- As políticas de 0003/0004 usavam `current_setting('app.current_user_id', true)::uuid`
-- direto. Depois de a variável ter existido uma vez na conexão, um `SET LOCAL`
-- revertido deixa **string vazia** (não NULL), e `''::uuid` estoura com
-- `invalid input syntax for type uuid`. No caminho anônimo — perfil público —
-- isso derrubava a consulta. `NULLIF` resolve na origem.
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid
$$;

GRANT EXECUTE ON FUNCTION public.current_app_user_id() TO ligcentro_app;

DROP POLICY IF EXISTS profiles_owner_write ON profiles;
CREATE POLICY profiles_owner_write ON profiles
  FOR ALL
  USING (user_id = public.current_app_user_id())
  WITH CHECK (user_id = public.current_app_user_id());

DROP POLICY IF EXISTS blocks_owner_write ON blocks;
CREATE POLICY blocks_owner_write ON blocks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = blocks.profile_id
        AND p.user_id = public.current_app_user_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = blocks.profile_id
        AND p.user_id = public.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS page_views_owner_read ON page_views;
CREATE POLICY page_views_owner_read ON page_views
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = page_views.profile_id
        AND p.user_id = public.current_app_user_id()
    )
  );

DROP POLICY IF EXISTS block_clicks_owner_read ON block_clicks;
CREATE POLICY block_clicks_owner_read ON block_clicks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = block_clicks.profile_id
        AND p.user_id = public.current_app_user_id()
    )
  );

-- Leitura pública anônima (perfil publicado) usa a mesma role, sem
-- `app.current_user_id` definido: `current_app_user_id()` devolve NULL, a
-- política de owner não casa e sobra apenas a de leitura de publicados.

-- TESTE DE ACESSO CRUZADO (automatizado em lib/db/rls.test.ts):
--   BEGIN;
--     SELECT set_config('app.current_user_id', '<usuário A>', true);
--     SET LOCAL ROLE ligcentro_app;
--     SELECT count(*) FROM profiles WHERE handle = '<perfil draft de B>'; -- 0
--     UPDATE profiles SET display_name = 'invadido' WHERE handle = '<de B>'; -- 0 linhas
--   ROLLBACK;
