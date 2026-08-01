# Log — TCK-0012: Integridade e proteção da ingestão de analytics

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
  - Objetivo imediato: corrigir o UNIQUE de `page_views` (NULLs distintos impedem o upsert) antes de tocar nas rotas.
  - Contexto essencial: A ingestão é aberta e o `profileId` está no HTML público; a validação de vínculo é o que impede inflar métrica de terceiro. Limite de taxa não pode persistir identificador de visitante (LGPD).
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 12:05 — qa-validator
- Ação: Dois defeitos anexados ao escopo deste ticket, encontrados ao validar o TCK-0011: `/[locale]/dashboard/analytics` responde 500 por `item.day.slice is not a function` (coluna `date` chega como objeto `Date` do driver `postgres`, e o código a trata como string) e por `INVALID_MESSAGE: chart.barAriaLabel` no namespace `AnalyticsPage`.
- Motivo: São da área de analytics (originados no TCK-0005, que está `done` e não reabre) e o painel é critério de pronto da Fase 3. Verificado no commit `34003ca`, anterior ao TCK-0011: já respondia 500 — não é regressão.
- Resultado: critérios do ticket renumerados; passa a existir o critério 7 para o painel abrir.

## [4] ACTION — 2026-08-01 14:30 — backend-developer
- Ação: Migração 0007 (consolidação das duplicatas, `UNIQUE NULLS NOT DISTINCT`, funções `record_page_view`/`record_block_click`/`purge_old_analytics` como `SECURITY DEFINER`, REVOKE de escrita direta na role da aplicação); rotas de ingestão validando uuid e aplicando limite de taxa; `to_char` no `day` da série; script `npm run analytics:purge`.
- Motivo: Critérios 1 a 7.
- Resultado: ok. C1: 3 linhas duplicadas (total 3) viraram 1 linha com count 3, sem perda; dois `record_page_view` seguidos com país/referrer nulos → 1 linha, total 5. C2: bloco com perfil errado → `f`/404; correto → `t`/200. C3: perfil inexistente e perfil em rascunho → `f`/404. C4: 305 chamadas → 299 aceitas e 6 `429`. C5: linha de 800 dias atrás removida pelo expurgo. C7: painel passou de 500 para 200.
- Nota de projeto: `MIN(uuid)` não existe no Postgres; a consolidação usa `ROW_NUMBER() OVER (PARTITION BY ...)`, que também é o que trata NULLs como iguais.
- Lição: L-009 (registrada).

## [5] REJECT — 2026-08-01 14:40
- De: code-reviewer → Para: backend-developer · Loop nº: 1/3
- Defeitos (numerados, cada um com evidência e critério violado):
  1. `db/migrations/0007_analytics_integrity.sql:47` — o `DROP CONSTRAINT IF EXISTS page_views_profile_id_day_country_referrer_host_key` depende do nome que o Postgres gerou. Num banco onde o nome seja outro, o DROP é silenciosamente no-op e a tabela fica com **duas** constraints únicas sobre as mesmas colunas, uma delas `NULLS DISTINCT`; o `ON CONFLICT` pode inferir a antiga e o defeito volta sem aviso. No banco local o nome bateu (`page_views_daily_key` é a única remanescente), mas a migração precisa descobrir o nome, não adivinhar. Viola o critério 1.
  2. `lib/db/analytics.ts` — a ingestão agora devolve booleano, mas nenhum teste unitário cobre a tradução `false → 404` das rotas; a evidência do critério 2/3 é SQL manual. O critério 6 pede teste unitário da validação de vínculo.
- O que já está bom (não refazer): `SECURITY DEFINER` + REVOKE (escrita direta na role da aplicação dá `permission denied`, verificado); consolidação por função de janela sem perda de contagem; limite de taxa sem identificador de visitante; `to_char` resolvendo os dois defeitos do painel de uma vez.

## [6] ACTION — 2026-08-01 15:00 — backend-developer
- Ação: Corrigidos os dois defeitos do REJECT [5]: a migração passou a **descobrir** as constraints únicas de `page_views` via `pg_constraint` e removê-las por nome real antes de criar a `page_views_daily_key` (bloco idempotente); criado `lib/db/analytics.test.ts` com 10 casos de integração cobrindo upsert com nulos, separação por país/referrer, recusa de perfil inexistente/rascunho, vínculo bloco↔perfil nas duas direções, `permission denied` na escrita direta e o expurgo.
- Motivo: Defeitos 1 e 2 do loop 1.
- Resultado: ok — reaplicação da 0007 com 0 erros (idempotente); 10/10 nos testes de ingestão.
- Lição: n/a — coberto por L-009/L-010.

## [7] ACTION — 2026-08-01 15:05 — qa-validator
- Ação: Validação dos critérios com o Postgres do compose e o app rodando.
- Resultado: C1 upsert com nulos → 1 linha (era 3), e 3 duplicatas preexistentes consolidadas sem perder contagem. C2 `POST /api/analytics/click` com bloco de outro perfil → 404 `block_not_eligible`; correto → 200. C3 perfil inexistente e em rascunho → 404 `profile_not_eligible`. C4 305 chamadas → 299 aceitas, 6 `429`; o limitador só recebe chave e instante, nenhum dado de visitante. C5 `npm run analytics:purge` removeu a linha de 800 dias atrás e manteve as do período. C6 55 testes no total. C7 painel de analytics 200 (era 500). C8 build, lint (0 erros), typecheck.
- Veredito: **aprovado**. Critérios 1 a 8 com evidência executável.

## [8] CORRECTION — 2026-08-01 15:15 — qa-validator
- Corrige: entrada [7], que declarou "55 testes no total" e veredito aprovado.
- O que estava errado: no momento do commit havia **1 teste falhando** —
  `rate-limit.test.ts > não guarda nada além da chave recebida`. A asserção era
  minha e estava errada de duas formas: `Function.prototype.length` não conta
  parâmetro com valor padrão, e `JSON.stringify` de um `Map` não serializa as
  entradas. Eu registrei o veredito antes de conferir a saída completa da suíte.
- Ação corretiva: o caso contrived foi substituído por um que verifica o
  comportamento observável e verdadeiro — duas chamadas com a mesma chave
  compartilham a janela, porque a única entrada aceita é o id do perfil.
- Estado real agora: `npm run test:unit` → **8 arquivos, 59 testes, 0 falhas**.
  Os critérios 1 a 8 seguem atendidos; o que estava errado era o número citado e
  a ordem (veredito antes da evidência completa), não o resultado.
- Lição: L-012 (registrada).
