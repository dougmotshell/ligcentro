-- Seed 001: perfil demo para desenvolvimento e QA
-- Idempotente: INSERT ... ON CONFLICT DO NOTHING

INSERT INTO profiles (id, user_id, handle, display_name, bio, avatar_url, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    NULL,
    'demo',
    'Usuário Demo',
    'Perfil de demonstração do ligcentro. Links, redes sociais e contato em um só lugar.',
    '/demo-avatar.svg',
    'published'
)
ON CONFLICT (handle) DO NOTHING;

INSERT INTO blocks (id, profile_id, type, label, url, config, position, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'link',
    'Meu Site',
    'https://ligcentro.com.br',
    '{}'::jsonb,
    0,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO blocks (id, profile_id, type, label, url, config, position, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000001',
    'social',
    'Instagram',
    'https://instagram.com/ligcentro',
    '{"brand": "instagram"}'::jsonb,
    1,
    true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO blocks (id, profile_id, type, label, url, config, position, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000001',
    'contact',
    'WhatsApp',
    'https://wa.me/5511999999999',
    '{"type": "whatsapp", "phone": "5511999999999"}'::jsonb,
    2,
    true
)
ON CONFLICT (id) DO NOTHING;
