# Log — TCK-0016: Suíte de testes real e portão de CI honesto

> Append-only.

## [1] ACTION — 2026-08-01 10:00 — tech-lead
- Ação: Triagem do ticket, recortado da análise do repositório de 2026-08-01 (defeitos e lacunas contra o roadmap e as regras do AGENTS.md).
- Motivo: O pedido "implementar tudo" foi dividido em tickets com dono único e critérios verificáveis, conforme a regra 1 do tech-lead.
- Resultado: critérios de aceite definidos; status `triaged`. Memória lida: `agents/memory/context/` da área + `lessons.md` (L-001 a L-004).

## [2] HANDOFF — 2026-08-01 10:05 — tech-lead → devops-engineer
- De: tech-lead → Para: devops-engineer
- Status novo: in_progress
- O que foi feito: Triagem e definição dos critérios de aceite.
- Artefatos: `ticket.md`.
- Como validar: critérios de aceite do ticket, cada um com evidência executável.
- Pendências e riscos: nenhum insumo externo pendente; validação roda no Postgres do `docker compose`.
- Critérios de aceite: [ ] todos abertos.
- Briefing para o próximo agente:
  - Objetivo imediato: escrever os testes unitários dos módulos puros primeiro, depois o e2e com `webServer`.
  - Contexto essencial: Hoje o CI verde não prova nada: zero testes, `--passWithNoTests` e job E2E com `if: \${{ false }}`. O gate aceita `skipped`, o que precisa acabar junto.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 18:00 — devops-engineer
- Ação: `scripts/migrate.mjs` (runner com tabela `schema_migrations`, checksum, transação por migração, `--status` e `--baseline`); `0001` tornada idempotente; `test:unit` e `test:e2e` sem `--passWithNoTests`; `e2e/critical-flow.spec.ts` com o fluxo crítico, QR e 404; `playwright.config.ts` com `webServer`.
- Motivo: Critérios 1 a 5.
- Resultado: runner num banco vazio aplica 0000–0008 em ordem; segunda execução diz "Nenhuma migração pendente"; `--status` lista tudo; `--baseline 0008` adota o runner num banco já migrado à mão sem reexecutar nada.

## [4] ACTION — 2026-08-01 18:20 — devops-engineer
- Ação: Três defeitos encontrados ao fazer o e2e rodar de verdade. (1) O `next dev` do Next 16 bloqueia recursos `/_next/` de origem diferente da que o iniciou, o cliente não hidrata e nenhuma interação funciona — o `webServer` passou a rodar `npm run build && next start`. (2) Seletores por nome acessível casam por substring: `'Perfil'` também casava "Salvar perfil" e `'Publicada'` casava dois parágrafos; corrigidos com `exact: true` e com asserção no botão que muda de rótulo. (3) O vitest passou a encontrar os arquivos do Playwright e falhava só por isso — `e2e/**` excluído.
- Motivo: sem isso o critério 2 não teria evidência.
- Resultado: 3/3 no Playwright. **Achado de produto**: o e2e revelou que a verificação de disponibilidade de handle nunca rodava no navegador → TCK-0019, corrigido e fechado.
- Lição: L-016 (registrada).

## [5] ACTION — 2026-08-01 18:50 — devops-engineer
- Ação: CI reescrito: jobs `unit` e `e2e` ganharam serviço Postgres 16 e passo `npm run db:migrate`; o `if: ${{ false }}` do E2E foi removido; o portão `CI aprovado` deixou de aceitar `skipped` e passou a exigir `success` de todos os jobs obrigatórios, nomeando qual falhou.
- Motivo: Critérios 4 e 6.
- Resultado: YAML validado por parser (`jobs`, `needs` do portão e serviços conferidos). Sem `if: ${{ false }}` e sem `skipped` no portão.

## [6] ACTION — 2026-08-01 18:55 — qa-validator
- Ação: Suíte completa, na escala que os critérios pedem.
- Resultado: C1 84 testes unitários em 12 arquivos, cobrindo handle, tema, cores de marca, storage, analytics, RLS, conta e sessão — sem `--passWithNoTests`. C2/C3 `npx playwright test` → **3 passed**, com o app subindo sozinho pelo `webServer` contra o Postgres do compose. C4 `if: ${{ false }}` removido e o portão exigindo `success`. C5 runner idempotente com evidência em banco novo e em banco preexistente. C6 build ✓, lint 0 erros, typecheck ✓, unit 84/84, e2e 3/3.
- Veredito: **aprovado**. Observação: o `webServer` faz build a cada execução limpa, o que deixa o e2e em ~20 s locais mais o build; é o preço de rodar contra o mesmo artefato que vai a produção.
