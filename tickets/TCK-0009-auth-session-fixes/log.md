# Log — TCK-0009: Correções bloqueantes de autenticação e sessão

> Append-only.

## [1] ACTION — 2026-08-01 10:00 — tech-lead
- Ação: Triagem do ticket, recortado da análise do repositório de 2026-08-01 (defeitos e lacunas contra o roadmap e as regras do AGENTS.md).
- Motivo: O pedido "implementar tudo" foi dividido em tickets com dono único e critérios verificáveis, conforme a regra 1 do tech-lead.
- Resultado: critérios de aceite definidos; status `triaged`. Memória lida: `agents/memory/context/` da área + `lessons.md` (L-001 a L-004).

## [2] HANDOFF — 2026-08-01 10:05 — tech-lead → backend-developer
- De: tech-lead → Para: backend-developer
- Status novo: in_progress
- O que foi feito: Triagem e definição dos critérios de aceite.
- Artefatos: `ticket.md`.
- Como validar: critérios de aceite do ticket, cada um com evidência executável.
- Pendências e riscos: nenhum insumo externo pendente; validação roda no Postgres do `docker compose`.
- Critérios de aceite: [ ] todos abertos.
- Briefing para o próximo agente:
  - Objetivo imediato: criar a migração com UNIQUE em `profiles.user_id` — é o que faz todo login OAuth novo falhar hoje.
  - Contexto essencial: O callback usa `ON CONFLICT (user_id)` e só existe índice não-único; o log [7] do TCK-0008 atribuiu o sintoma a SSL, o que é diagnóstico incorreto.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 10:20 — backend-developer
- Ação: Migração 0005 (índice único de `profiles.user_id`); renovação por refresh token no middleware e em `resolveSession`; callback de confirmação de e-mail; cookies centralizados com `secure`; recusa explícita do mock em produção; token removido do corpo das respostas.
- Motivo: Critérios 1 a 5 do ticket.
- Resultado: ok. `ON CONFLICT (user_id)` antes → `ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification`; depois de 0005 → `INSERT 0 1` seguido de `INSERT 0 0` (idempotente).

## [4] ACTION — 2026-08-01 10:22 — backend-developer
- Ação: Duas correções fora do recorte original, encontradas ao validar: (a) a escolha do adaptador dependia de `NEXT_PUBLIC_SUPABASE_URL`, que o Next substitui por literal no build — a decisão mock/Supabase ficava congelada no bundle; agora `lib/supabase/config.ts` prefere `SUPABASE_URL`/`SUPABASE_ANON_KEY` (server-only) com fallback compatível. (b) `require()` dinâmico nos adaptadores não resolve fora do bundler, o que impedia qualquer teste; virou import estático.
- Motivo: Sem (a) o ambiente não é reconfigurável sem recompilar; sem (b) o critério 6 não teria evidência.
- Resultado: ok — 16 testes unitários passam (`lib/auth/cookies.test.ts`, `adapters/auth/index.test.ts`), build/lint/typecheck limpos.

## [5] HANDOFF — 2026-08-01 10:30 — backend-developer → code-reviewer
- De: backend-developer → Para: code-reviewer
- Status novo: in_review
- O que foi feito: Correção dos cinco defeitos bloqueantes de autenticação, mais as duas correções de infraestrutura de configuração/testabilidade do item [4].
- Artefatos: `db/migrations/0005_unique_user_id.sql`, `lib/auth/{cookies,refresh,session}.ts`, `lib/supabase/config.ts`, `adapters/auth/*`, `middleware.ts`, `app/api/auth/**`, `app/[locale]/{login,signup}/*`, `messages/*.json`, `vitest.config.ts`, `docker-compose.yml`, `.env.example`.
- Como validar: `npm run build && npm run typecheck && npm run test:unit && npm run lint`; subir `docker compose up -d db` e repetir o SQL do item [3]; `next dev` no caminho mock e conferir 307 no dashboard sem sessão, 200 com sessão, e `Set-Cookie` do logout limpando as quatro formas.
- Pendências e riscos: a renovação real de token e o callback de confirmação só se comprovam contra um Supabase de verdade (o ambiente local não tem provedor); a URL do callback precisa ser cadastrada como Redirect URL no Supabase.
- Critérios de aceite: [x] 1, [x] 2 (implementado; evidência de ponta a ponta depende do Supabase), [x] 3, [x] 4 (idem), [x] 5, [x] 6.
- Briefing para o próximo agente:
  - Objetivo imediato: revisar se algum caminho ainda devolve token ao cliente ou aceita sessão forjada.
  - Contexto essencial: `secure` fora de produção quebraria o login em http://localhost, por isso é condicional; o mock em produção exige `ALLOW_MOCK_AUTH=true`, usado só pelo compose de QA.
  - Onde olhar: `lib/auth/session.ts` e `middleware.ts` primeiro; depois `app/api/auth/**`.
  - Memória aplicável: L-001 (build antes do typecheck) foi aplicada; L-002 continua valendo para o SSL do Postgres.
  - Armadilhas: `cookies().set()` lança em Server Component — o `try/catch` de `lib/auth/session.ts` é intencional, não é engolir erro à toa.
