# Log — TCK-0011: RLS efetiva e isolamento multi-tenant

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
  - Objetivo imediato: introduzir a role de aplicação e o wrapper de transação que faz `set_config('app.current_user_id', ...)`.
  - Contexto essencial: As políticas existem desde o TCK-0003 mas nunca foram exercidas: nada define a variável de sessão e a conexão usa o dono das tabelas, que bypassa RLS.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 11:30 — backend-developer
- Ação: Migração 0006 (role `ligcentro_app` sem bypass, grants mínimos, políticas consolidadas via `public.current_app_user_id()`); `withUserSession`/`withPublicSession` em `lib/db/client.ts`; `lib/db/dashboard.ts`, `profiles.ts` e `analytics.ts` passando a rodar sob RLS; `getDashboardProfile` deixou de casar por handle; teste de acesso cruzado em `lib/db/rls.test.ts`.
- Motivo: Critérios 1 a 5.
- Resultado: ok — 11 testes de acesso cruzado passam; 27 testes no total. O teste revelou um defeito nas políticas de 0003/0004: `current_setting('app.current_user_id', true)::uuid` estoura com `invalid input syntax for type uuid: ""` no caminho anônimo (a variável revertida vira string vazia, não NULL). Corrigido com `NULLIF` dentro de `current_app_user_id()`.
- Lição: L-007 (registrada).

## [4] REJECT — 2026-08-01 11:40
- De: code-reviewer → Para: backend-developer · Loop nº: 1/3
- Defeitos (numerados, cada um com evidência e critério violado):
  1. `lib/db/client.ts:56` — `SET LOCAL ROLE ligcentro_app` numa base sem a migração 0006 falha com `role "ligcentro_app" does not exist`, e **toda** requisição autenticada passa a dar 500 sem indicar a causa. O deploy é automático no push para a `main` e não há runner de migração (TCK-0016), então a ordem "migrar antes de subir o código" é obrigatória e hoje está apenas implícita. Precisa de erro acionável e da ordem documentada.
  2. `lib/db/client.ts:50` — `withUserSession` aceita qualquer string como `userId` e a joga em `set_config`. Um id malformado faz o `::uuid` da política estourar em toda consulta (500 em vez de resultado vazio); no caminho mock esse id vem de cookie que o usuário controla. Validar formato antes de abrir a transação.
- O que já está bom (não refazer): o modelo de role de serviço + `SET LOCAL ROLE` (não exige credencial nova nem segundo pool); `current_app_user_id()` com `NULLIF`; o teste de acesso cruzado, que já provou seu valor achando o defeito das políticas; `isHandleAvailable` documentado como exceção consciente.

## [5] ACTION — 2026-08-01 12:00 — backend-developer
- Ação: Corrigidos os dois defeitos do REJECT [4]: `assumeAppRole` traduz `role does not exist` em `app_role_missing` com instrução, e a ordem "migrar antes de subir" ficou escrita em `docs/setup/external-services.md`; `isUuid` foi para `lib/uuid.ts` (sem dependências) e é aplicada tanto em `withUserSession` quanto na decodificação do cookie mock.
- Motivo: Defeitos 1 e 2 do loop 1.
- Resultado: ok. Sessão com id malformado agora dá 401 na API e 307 no dashboard, em vez de 500. Suíte 30/30.
- Lição: n/a — as duas causas já estão cobertas por L-007/L-008.

## [6] ACTION — 2026-08-01 12:10 — qa-validator
- Ação: Validação dos critérios com o app rodando contra o Postgres do compose.
- Resultado: C1 dashboard 200, export 200, escrita de perfil e criação de bloco 200 — tudo sob `SET LOCAL ROLE ligcentro_app`. C2: cookie forjado com o `user_id` de outro usuário apontando para o `profileId` alheio devolve `profile_not_found` (a RLS barra, não o `WHERE`). C3/C4: `lib/db/rls.test.ts` 11/11, incluindo leitura, UPDATE, DELETE e INSERT cruzados em `profiles`/`blocks`, leitura de `page_views` e o caminho anônimo. C5: `/pt-BR/demo` 200 sem sessão. C6: build, lint (0 erros), typecheck e 30 testes.
- Achado fora do escopo: o painel `/dashboard/analytics` responde 500 por defeitos herdados do TCK-0005 — anexados ao TCK-0012 (entrada [3] daquele log), com evidência de que já ocorriam antes deste ticket.
- Veredito: **aprovado**. Critérios 1 a 6 atendidos com evidência executável.
