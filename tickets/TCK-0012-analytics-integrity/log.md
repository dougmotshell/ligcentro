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
