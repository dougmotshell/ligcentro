# Log — TCK-0017: Sincronizar documentação com o estado real do código

> Append-only.

## [1] ACTION — 2026-08-01 10:00 — tech-lead
- Ação: Triagem do ticket, recortado da análise do repositório de 2026-08-01 (defeitos e lacunas contra o roadmap e as regras do AGENTS.md).
- Motivo: O pedido "implementar tudo" foi dividido em tickets com dono único e critérios verificáveis, conforme a regra 1 do tech-lead.
- Resultado: critérios de aceite definidos; status `triaged`. Memória lida: `agents/memory/context/` da área + `lessons.md` (L-001 a L-004).

## [2] HANDOFF — 2026-08-01 10:05 — tech-lead → docs-writer
- De: tech-lead → Para: docs-writer
- Status novo: in_progress
- O que foi feito: Triagem e definição dos critérios de aceite.
- Artefatos: `ticket.md`.
- Como validar: critérios de aceite do ticket, cada um com evidência executável.
- Pendências e riscos: nenhum insumo externo pendente; validação roda no Postgres do `docker compose`.
- Critérios de aceite: [ ] todos abertos.
- Briefing para o próximo agente:
  - Objetivo imediato: atualizar `AGENTS.md` e o roadmap por último, quando os tickets TCK-0009..TCK-0016 estiverem fechados.
  - Contexto essencial: A documentação afirma que não há código, e tickets `done` convivem com itens de roadmap abertos — quem assume um ticket é enganado por isso.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 19:20 — docs-writer
- Ação: `AGENTS.md` (mapa do repositório + "Estado atual" datado, com o que existe, o que está coberto por teste e o que continua aberto); roadmap revisado item por item, com o ticket de cada item aberto; `.env.example` reescrito contendo **só** variáveis lidas pelo código (conferido por `grep` de `process.env`); `docs/setup/local-development.md` com os comandos reais e o alerta de migrar antes de subir; contexto vivo das seis áreas em `agents/memory/context/`.
- Motivo: Critérios 1 a 3.
- Resultado: ok — nenhuma ocorrência de "ainda não há código" restou; roadmap com 26 itens fechados e 2 abertos, ambos nomeados (manual do usuário e auditoria de segurança/performance).

## [4] ACTION — 2026-08-01 19:35 — docs-writer
- Ação: Encerrados TCK-0007 e TCK-0008 com entrada que diz o que de fato ficou pronto e o que foi concluído depois no TCK-0009, incluindo a correção do diagnóstico errado (o `oauth_failed` era falta de constraint única, não SSL). Criados quatro ADRs em `docs/adr/`: RLS por role de aplicação, configuração de servidor fora de `NEXT_PUBLIC_*`, ingestão de analytics por função e e2e contra build de produção.
- Motivo: Critérios 4 e 5.
- Resultado: ok — nenhum ticket permanece `in_progress`.

## [5] ACTION — 2026-08-01 19:45 — qa-validator
- Ação: Validação dos critérios.
- Resultado: C1 e C2 conferidos por leitura contra o código e por contagem de itens. C3 as variáveis do `.env.example` batem exatamente com as lidas pelo código, mais as três de teste. C4 TCK-0007 e TCK-0008 `done` com entrada de encerramento honesta. C5 quatro ADRs com contexto, decisão, consequências e alternativas descartadas. C6 `npx prettier --check` limpo nos arquivos alterados.
- Suíte final do ciclo: build ✓, typecheck ✓, lint 0 erros (2 avisos preexistentes), 84 testes unitários, 3 e2e.
- Veredito: **aprovado**.
