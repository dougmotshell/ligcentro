# TCK-0025: Banco de produção sem schema derruba todo login (OAuth e e-mail)

- **status:** in_review
- **owner:** devops-engineer
- **created:** 2026-08-15 · **by:** Douglas (relato de produção)
- **type:** bug
- **size:** M
- **phase:** Fase 2 — Contas e editor (defeito em produção)

## Pedido original (verbatim)

> está dando erro ao tentar fazer login com google
> https://ligcentro.vercel.app/en-US/login?error=oauth_failed vercel logs
> [...] GET 307 /api/auth/oauth/callback · GET 307 /api/auth/oauth/google
> [...] GET 200 /en-US/demo

## Diagnóstico

O erro **não está no OAuth**. O banco de produção do Supabase estava **sem
nenhuma tabela da aplicação**: `public` não continha `profiles`, `blocks`,
`page_views`, `block_clicks` nem `schema_migrations`, e a role `ligcentro_app`
(migração 0006) não existia. Nenhuma das 9 migrações de `db/migrations/` havia
sido aplicada em produção.

Caminho exato do defeito:

1. `/api/auth/oauth/google` monta o PKCE e redireciona — ok.
2. O Supabase autentica no Google e devolve `?code=` ao callback — ok
   (`/auth/v1/settings` confirma `google: true` e `github: true`).
3. `exchangeCodeForSession` troca o código com sucesso, e em seguida `toSession`
   executa `SELECT id, handle FROM profiles WHERE user_id = ...`.
4. O Postgres responde `relation "profiles" does not exist`.
5. O `catch {}` mudo do callback converte **qualquer** falha em
   `?error=oauth_failed` — a mensagem culpa o login social por um problema de
   schema, e nada é registrado no log da Vercel.

`GET /en-US/demo → 200` não contradiz o diagnóstico: o perfil público é SSG,
servido do cache gerado no build.

**Causa raiz da causa raiz:** o deploy de produção é a integração Git da Vercel,
e nenhuma etapa do pipeline aplica migrações. `release.yml` roda a suíte e publica
o GitHub Release; não migra. Ou seja: código e schema podiam divergir sem que
nada avisasse — e divergiram desde o primeiro deploy.

## Critérios de aceite

- [x] 1. As 9 migrações estão aplicadas no banco de produção, em ordem, com
      `schema_migrations` registrando cada uma.
- [x] 2. RLS ativa nas quatro tabelas de produto e role `ligcentro_app` presente.
- [x] 3. O build de produção passa a aplicar as migrações pendentes; se a migração
      falhar ou faltar `DATABASE_URL`, o build **falha** em vez de publicar.
- [x] 4. Preview e build local não migram (o banco é compartilhado com produção).
- [x] 5. O callback OAuth registra a causa real no log do servidor e distingue
      falha de troca de código (`oauth_failed`) de falha de provisionamento
      (`oauth_profile_failed`).
- [x] 6. Teste automatizado cobre a distinção dos códigos de erro e a validação do
      valor de `?error=` vindo da URL.
- [ ] 7. Douglas confirma em produção que o login com Google conclui e cai no
      onboarding (exige o deploy desta correção).

## Referências

- Arquivos-alvo: `scripts/migrate-on-build.mjs`, `package.json`,
  `app/api/auth/oauth/callback/route.ts`, `db/migrations/`
- Relacionado: TCK-0011 (RLS efetiva), TCK-0009 (sessão)

## Resolução (preenchido ao fechar)

- Commits: · Evidência final: log entradas [1] e [2] · Docs atualizados: `docs/runbook.md`
