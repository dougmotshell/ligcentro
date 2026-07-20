-- Migração 0003: user_id em profiles + RLS local compatível com Postgres puro

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);

UPDATE profiles
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE handle = 'demo'
  AND user_id IS NULL;

DROP POLICY IF EXISTS profiles_owner_all ON profiles;
DROP POLICY IF EXISTS profiles_owner_write ON profiles;
CREATE POLICY profiles_owner_write ON profiles
  FOR ALL USING (user_id = current_setting('app.current_user_id', true)::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

DROP POLICY IF EXISTS blocks_owner_all ON blocks;
DROP POLICY IF EXISTS blocks_owner_write ON blocks;
CREATE POLICY blocks_owner_write ON blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = blocks.profile_id
        AND p.user_id = current_setting('app.current_user_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = blocks.profile_id
        AND p.user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

COMMENT ON TABLE profiles IS 'handles_reserved: admin,api,login,signup,dashboard,settings,me,help,terms,privacy,about,pricing,blog';

-- TESTE CRUZADO (com row_security = on):
--   SET app.current_user_id = '11111111-1111-1111-1111-111111111111';
--   SELECT * FROM profiles; -- deve retornar 0 linhas para outro usuário
