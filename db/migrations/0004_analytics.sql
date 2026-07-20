-- Migração 0004: analytics agregado sem PII de visitante

CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  country TEXT,
  referrer_host TEXT,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(profile_id, day, country, referrer_host)
);

CREATE TABLE IF NOT EXISTS block_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  block_id UUID NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL,
  day DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 1,
  UNIQUE(block_id, day)
);

CREATE INDEX IF NOT EXISTS page_views_profile_day_idx ON page_views(profile_id, day);
CREATE INDEX IF NOT EXISTS block_clicks_profile_day_idx ON block_clicks(profile_id, day);
CREATE INDEX IF NOT EXISTS block_clicks_block_day_idx ON block_clicks(block_id, day);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS page_views_owner_read ON page_views;
DROP POLICY IF EXISTS block_clicks_owner_read ON block_clicks;
DROP POLICY IF EXISTS page_views_public_insert ON page_views;
DROP POLICY IF EXISTS block_clicks_public_insert ON block_clicks;

CREATE POLICY page_views_owner_read ON page_views
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY block_clicks_owner_read ON block_clicks
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM profiles
      WHERE user_id = current_setting('app.current_user_id', true)::uuid
    )
  );

CREATE POLICY page_views_public_insert ON page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY block_clicks_public_insert ON block_clicks
  FOR INSERT WITH CHECK (true);
