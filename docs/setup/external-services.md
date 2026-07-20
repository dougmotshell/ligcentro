# Guia de configuração — Dependências externas

> Este documento explica como configurar cada serviço externo que o ligcentro usa em produção. Em desenvolvimento local, tudo funciona via `docker compose` sem nenhum serviço pago.

## Índice

1. [Supabase (banco + auth + storage)](#1-supabase)
2. [OAuth — Google](#2-oauth-google)
3. [OAuth — GitHub](#3-oauth-github)
4. [Vercel (deploy)](#4-vercel)
5. [Variáveis de ambiente — referência completa](#5-variáveis-de-ambiente)

---

## 1. Supabase

> **Dev local**: não precisa de Supabase. O `docker compose up` sobe Postgres direto. Configure apenas para staging/produção.

### 1.1 Criar projeto

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Nome: `ligcentro` (ou `ligcentro-staging`)
3. Database password: gere uma senha forte e guarde no gerenciador de senhas
4. Region: `South America (São Paulo)` — mais próximo dos usuários pt-BR
5. Aguarde o provisionamento (~2 min)

### 1.2 Obter as chaves

No dashboard do projeto: **Settings → API**

| Variável | Onde encontrar | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | URL pública do projeto |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` `public` key | Chave pública (usada no cliente) |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key | Chave secreta (somente server-side) |

> ⚠️ **A `service_role` key nunca vai para o cliente nem para o commit.** Ela bypassa o RLS — use só em Route Handlers server-side.

### 1.3 Rodar as migrações

```bash
# Instalar Supabase CLI (se não tiver)
npm install -g supabase

# Login
supabase login

# Linkar ao projeto
supabase link --project-ref <ref-do-projeto>
# O ref está na URL: https://app.supabase.com/project/<ref>

# Aplicar todas as migrações
supabase db push
# Ou manualmente via psql:
psql "$DATABASE_URL" -f db/migrations/0000_initial.sql
psql "$DATABASE_URL" -f db/migrations/0001_profiles_blocks.sql
# ... etc
```

### 1.4 Configurar Auth no Supabase

No dashboard: **Authentication → Settings**

- **Site URL**: `https://ligcentro.vercel.app` (produção) ou `http://localhost:3000` (local)
- **Redirect URLs**: adicionar:
  - `https://ligcentro.vercel.app/auth/callback`
  - `http://localhost:3000/auth/callback`
  - `https://*.vercel.app/auth/callback` (para previews)

### 1.5 Configurar Storage

No dashboard: **Storage → New bucket**

- Nome: `avatars`
- Public bucket: **sim** (avatares são públicos)
- Allowed MIME types: `image/jpeg, image/png, image/webp, image/gif`
- Max file size: `5 MB`

Política de Storage (executar no SQL Editor):
```sql
-- Qualquer um pode ler avatares
CREATE POLICY "avatars_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Só o dono pode fazer upload/delete
CREATE POLICY "avatars_owner_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars_owner_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 2. OAuth — Google

### 2.1 Criar projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. Menu → **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `ligcentro`
   - Support email: seu e-mail
   - Authorized domains: `supabase.co`, `ligcentro.vercel.app`
4. Menu → **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `ligcentro-web`
   - Authorized redirect URIs:
     - `https://<ref>.supabase.co/auth/v1/callback`
     - `http://localhost:54321/auth/v1/callback` (Supabase local se usar CLI)

### 2.2 Configurar no Supabase

Dashboard do projeto → **Authentication → Providers → Google**

- Enable: ✅
- Client ID: (do passo 2.1)
- Client Secret: (do passo 2.1)

---

## 3. OAuth — GitHub

### 3.1 Criar OAuth App no GitHub

1. Acesse [github.com/settings/developers](https://github.com/settings/developers)
2. **OAuth Apps → New OAuth App**
   - Application name: `ligcentro`
   - Homepage URL: `https://ligcentro.vercel.app`
   - Authorization callback URL: `https://<ref>.supabase.co/auth/v1/callback`
3. Gere um **Client secret**

### 3.2 Configurar no Supabase

Dashboard → **Authentication → Providers → GitHub**

- Enable: ✅
- Client ID: (do passo 3.1)
- Client Secret: (do passo 3.1)

---

## 4. Vercel

> O repositório já está conectado à Vercel (`ligcentro.vercel.app`). O deploy acontece automaticamente via integração Git — push na `main` = produção; PR = preview.

### 4.1 Configurar variáveis de ambiente na Vercel

Dashboard da Vercel → projeto → **Settings → Environment Variables**

Adicionar todas as variáveis da seção 5 abaixo com os valores reais.

- `DATABASE_URL`: string de conexão do Supabase Postgres
  - Disponível em: **Supabase → Settings → Database → Connection string → URI**
  - Usar a connection string com **pooler** (Transaction mode) para serverless: `postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`: ver seção 1.2

### 4.2 Deploy de produção

```bash
# Via CLI (opcional — o git push já faz automaticamente)
npx vercel --prod
```

---

## 5. Variáveis de ambiente — referência completa

Copie `.env.example` para `.env` e preencha:

```env
# ─── Banco de dados ───────────────────────────────────────────────────────────
# Dev local (docker compose): usar este valor sem alteração
DATABASE_URL=postgresql://ligcentro:ligcentro@localhost:5432/ligcentro

# Produção (Supabase pooler — Transaction mode):
# DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres

# ─── Supabase ─────────────────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>    # NUNCA expor no cliente

# ─── Auth ─────────────────────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000              # Em produção: https://ligcentro.vercel.app
NEXTAUTH_SECRET=<string-aleatória-32-chars>    # gerar: openssl rand -base64 32

# ─── App ──────────────────────────────────────────────────────────────────────
APP_PORT=3000                                  # Porta local (docker compose)
NEXT_PUBLIC_APP_URL=http://localhost:3000      # URL base pública

# ─── Analytics (interno) ──────────────────────────────────────────────────────
# Sem configuração externa — analytics é próprio (tabela Postgres)
# ANALYTICS_RETENTION_DAYS=730               # Retenção padrão: 2 anos
```

### Variáveis obrigatórias por ambiente

| Variável | Dev local | Staging/Prod |
|---|---|---|
| `DATABASE_URL` | ✅ (docker postgres) | ✅ (Supabase pooler) |
| `NEXT_PUBLIC_SUPABASE_URL` | ❌ (não necessário) | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ❌ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ | ✅ |
| `NEXTAUTH_SECRET` | ✅ (qualquer valor) | ✅ (valor forte) |
| `NEXT_PUBLIC_APP_URL` | ✅ | ✅ |

---

## Checklist de configuração para ir a produção

- [ ] Projeto Supabase criado e migrações aplicadas
- [ ] Bucket `avatars` criado com políticas de Storage
- [ ] OAuth Google configurado e ativo no Supabase
- [ ] OAuth GitHub configurado e ativo no Supabase
- [ ] Redirect URLs do Supabase Auth incluem domínio de produção e previews da Vercel
- [ ] Variáveis de ambiente configuradas na Vercel (todos os valores reais)
- [ ] `npm audit --audit-level=high` → 0 vulnerabilidades críticas
- [ ] `docker compose up` sobe localmente sem erros
