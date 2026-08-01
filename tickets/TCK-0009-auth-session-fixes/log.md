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

## [6] REJECT — 2026-08-01 10:40
- De: code-reviewer → Para: backend-developer · Loop nº: 1/3
- Defeitos (numerados, cada um com evidência e critério violado):
  1. `app/api/auth/signup/route.ts:60-73` — o `ON CONFLICT (user_id) DO NOTHING` engole o caso de o usuário já ter perfil: nada é inserido e a rota responde 201/202 afirmando que o handle foi reservado. O Supabase devolve objeto de usuário também para e-mail já cadastrado, então o cadastro repetido mente para quem chamou. Viola o critério 4 ("reserva o handle"). Detectar 0 linhas inseridas e responder erro específico.
  2. `app/api/auth/confirm/route.ts:38-40` — sem perfil, redireciona para `/signup` **com a sessão já gravada**; ali o único caminho é POST `/api/auth/signup`, que tentaria criar o usuário de novo no Supabase e falharia com `user_already_exists`. Beco sem saída. Viola o critério 4 (o callback deve concluir a sessão em estado utilizável).
  3. `app/api/profile/route.ts:78-83` — reemitir a sessão inteira na troca de handle reescreve `sb-access-token` com validade de uma semana enquanto `sb-expires-at` guarda o instante antigo. Para Supabase o handle não está no token: a reemissão só faz sentido no caminho mock. Risco de reintroduzir a divergência de validade que o critério 2 corrige.
- O que já está bom (não refazer): migração 0005 e a evidência SQL; centralização dos cookies em `lib/auth/cookies.ts`; recusa do mock em produção com opt-in explícito; remoção do token do corpo das respostas; `lib/supabase/config.ts` resolvendo a configuração fora do build.

## [7] ACTION — 2026-08-01 10:52 — backend-developer
- Ação: Corrigidos os três defeitos do REJECT [6]. (1) O `INSERT` do cadastro passou a usar `RETURNING id` e a rota responde 409 `account_already_exists` quando nada é inserido, com mensagem em pt-BR/en-US. (2) Criado `lib/db/provisioning.ts` com `ensureDraftProfile`, usado pelos callbacks de OAuth e de confirmação de e-mail — quem chega sem perfil recebe um `draft` e escolhe o handle no onboarding, em vez de ser jogado no cadastro. (3) A reemissão de sessão na troca de handle passou a acontecer só no caminho mock (`isMockAuthActive`).
- Motivo: Defeitos 1, 2 e 3 do loop 1.
- Resultado: ok. Cadastro no caminho mock → 201 com perfil criado; handle repetido → 409 `handle_taken`; segundo perfil para o mesmo `user_id` → `INSERT 0 0` / `(0 rows)`, que é o caminho do 409 `account_already_exists`. Build, typecheck e 16 testes passam.
- Lição: L-005 (registrada) — `ON CONFLICT DO NOTHING` sem `RETURNING` transforma conflito em sucesso silencioso.

## [8] HANDOFF — 2026-08-01 10:55 — backend-developer → qa-validator
- De: backend-developer → Para: qa-validator
- Status novo: in_validation
- O que foi feito: Correção dos defeitos do loop 1, com provisionamento de perfil compartilhado pelos dois callbacks.
- Artefatos: `lib/db/provisioning.ts`, `app/api/auth/{signup,confirm,oauth/callback}/route.ts`, `app/api/profile/route.ts`, `app/[locale]/signup/SignupForm.tsx`, `messages/*.json`.
- Como validar: `npm run build && npm run typecheck && npm run test:unit && npm run lint`; com `docker compose up -d db`, subir `next dev` no caminho mock (Supabase vazio, `DATABASE_URL` local) e exercitar dashboard sem/com sessão, login, cadastro, handle repetido e logout.
- Pendências e riscos: renovação de token e confirmação de e-mail reais dependem de credenciais Supabase; não marcar como comprovado sem elas.
- Critérios de aceite: [x] 1, [x] 3, [x] 5, [x] 6; [x] 2 e [x] 4 implementados e cobertos por teste/SQL, com a ressalva da validação externa.
- Briefing para o próximo agente:
  - Objetivo imediato: rodar a suíte inteira uma vez e reproduzir o fluxo mock ponta a ponta, registrando as saídas.
  - Contexto essencial: o `docker compose` de QA precisa de `ALLOW_MOCK_AUTH=true` (já commitado) — sem isso o app recusa autenticar, e isso é intencional.
  - Onde olhar: entradas [3], [4] e [7] deste log para os comandos já usados como evidência.
  - Memória aplicável: L-001 (build antes do typecheck), L-005 (nova).
  - Armadilhas: `.env`/`.env.local` locais têm Supabase real — para exercitar o caminho mock, sobrescreva as variáveis na linha de comando, como nas evidências acima.

## [9] ACTION — 2026-08-01 11:05 — qa-validator
- Ação: Suíte completa uma vez + fluxo mock ponta a ponta contra o Postgres do compose.
- Resultado: `npm run lint` 0 erros (4 avisos preexistentes), `npm run typecheck` limpo, `npm run test:unit` 16/16. Fluxo: dashboard sem sessão 307 → login 200 com corpo contendo só `id/email/handle/profileId` (sem `accessToken`) e cookie `mock-auth` HttpOnly → dashboard 200 → logout limpa os 4 cookies → dashboard 307 e `/api/profile` 401.
- Observação de método: a primeira medição pós-logout deu 200 por eu ter reenviado um cookie jar desatualizado (`-b` sem `-c`); repetida com o jar atualizado, deu 307. Registro para o próximo QA não se enganar igual.

## [10] ACTION — 2026-08-01 11:08 — qa-validator
- Ação: Veredito sobre os critérios.
- Resultado: critérios 1, 3, 5 e 6 **aprovados com evidência executável** (SQL do índice único, redirecionamentos, cookies, suíte). Critérios 2 e 4 **aprovados no que o ambiente permite**: lógica de renovação coberta por teste unitário, rotas e cookies verificados, mas a troca real de refresh token e o link de confirmação de e-mail exigem um projeto Supabase — não há provedor no ambiente local.
- Veredito: ticket `done` no escopo implementável e verificável localmente. A validação de produção fica listada no ticket como pendência nomeada do Douglas, em vez de o ticket ficar aberto indefinidamente (foi o que aconteceu com TCK-0007/0008).
