-- Migração 0001: tabelas profiles e blocks com RLS
-- Fase 1 — Perfil público (leitura)

-- Compatibilidade local com políticas que dependem de auth.uid().
-- No ambiente local, a claim pode não existir e a função retorna NULL.
CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID
LANGUAGE SQL
STABLE
AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

-- Tabela profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    handle TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    theme JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT profiles_handle_format CHECK (handle ~ '^[a-z0-9_-]+$')
);

CREATE INDEX IF NOT EXISTS idx_profiles_handle ON profiles(handle);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Tabela blocks
CREATE TABLE IF NOT EXISTS blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('link', 'social', 'contact', 'video', 'header')),
    label TEXT,
    url TEXT,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    position INT NOT NULL DEFAULT 0,
    visible_from TIMESTAMPTZ,
    visible_until TIMESTAMPTZ,
    is_active BOOL NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT blocks_url_scheme CHECK (
        url IS NULL OR url ~* '^(https?://|mailto:|tel:)'
    )
);

CREATE INDEX IF NOT EXISTS idx_blocks_profile_position ON blocks(profile_id, position);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_public_read" ON profiles
    FOR SELECT USING (status = 'published');

CREATE POLICY "profiles_owner_all" ON profiles
    FOR ALL USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "blocks_public_read" ON blocks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = blocks.profile_id
              AND p.status = 'published'
        )
        AND is_active = TRUE
        AND (visible_from IS NULL OR visible_from <= NOW())
        AND (visible_until IS NULL OR visible_until >= NOW())
    );

CREATE POLICY "blocks_owner_all" ON blocks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = blocks.profile_id
              AND auth.uid() = p.user_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = blocks.profile_id
              AND auth.uid() = p.user_id
        )
    );

-- Teste de acesso cruzado (comentário):
-- Para verificar que RLS está ativa:
--   SET ROLE anon;
--   SELECT * FROM profiles WHERE status = 'draft'; -- deve retornar 0 linhas
--   SELECT * FROM profiles WHERE status = 'published'; -- retorna apenas publicados
-- Usuário A nunca lê dados de usuário B via políticas acima.
-- Em produção (Supabase), auth.uid() isola dados por owner.
-- Localmente, acesso via service role (DATABASE_URL direto) bypassa RLS — uso apenas em seeds/migrations.
