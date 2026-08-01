# Contexto operacional — Backend (Supabase/RLS, API, ingestão de analytics)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/backend-developer.md`, nos planos de implementação e nas specs não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Stack alvo (ainda não instalada): **Supabase — Postgres + Auth + Storage**, com **RLS em 100% das tabelas** (toda migração acompanha teste de acesso cruzado com dois usuários fake). API via Route Handlers tipados do Next. Analytics **agregado por dia, sem PII de visitante** (LGPD). Banco único (Postgres) no MVP — sem persistência poliglota. Ver [`02-architecture.md`](../../../docs/implementation-plan/02-architecture.md) e [`04-data-model.md`](../../../docs/implementation-plan/04-data-model.md).
- 2026-07-27 — TCK-0007 implementou o adaptador Supabase Auth via REST e o cookie httpOnly `sb-access-token`; o mock continua selecionado quando `NEXT_PUBLIC_SUPABASE_URL` não existe. A validação contra Supabase real ainda depende das variáveis do ambiente de deploy.

- 2026-08-01 — **RLS agora é real** (TCK-0011, ADR-0001): toda consulta em nome de um usuário entra por `withUserSession` (transação com `set_config('app.current_user_id')` + `SET LOCAL ROLE ligcentro_app`); caminho público por `withPublicSession`. Só disponibilidade de handle e provisionamento de perfil ficam na role da conexão, e o motivo está escrito no código. **O código depende da migração 0006** — migrar antes de subir.
- 2026-08-01 — Escrita de analytics **só** por `record_page_view`/`record_block_click` (`SECURITY DEFINER`, ADR-0003); `INSERT`/`UPDATE` direto foi revogado da role da aplicação. Exclusão de conta por `delete_account()`, **sem parâmetro** — função `SECURITY DEFINER` que recebe identidade por argumento anula a RLS (L-014).
- 2026-08-01 — Configuração do Supabase lida por `lib/supabase/config.ts`, preferindo `SUPABASE_URL`/`SUPABASE_ANON_KEY` (ADR-0002). `NEXT_PUBLIC_*` só como fallback.

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `backend`.
