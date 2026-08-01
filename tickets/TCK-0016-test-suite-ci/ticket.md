# TCK-0016: Suíte de testes real e portão de CI honesto

- **status:** done
- **owner:** devops-engineer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** infra
- **size:** G
- **phase:** Fase 2 — Contas e editor (critério "fluxo e2e verde")

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: não existe um único teste no repositório; `e2e/` está vazio, os
scripts usam `--passWithNoTests` e o job E2E está desligado com
`if: ${{ false }}` — o CI verde não prova comportamento nenhum.)

## Requisito refinado

- User story: como mantenedor, confio que o CI verde significa que o produto
  funciona, não apenas que compila.
- Fora de escopo: cobertura mínima obrigatória, testes de carga.

## Critérios de aceite (máx. 7, verificáveis)

- [x] 1. Existem testes unitários dos módulos de regra de negócio (handle, blocos, tema, analytics, storage) e eles rodam sem `--passWithNoTests`.
- [x] 2. Existe e2e Playwright do fluxo crítico: cadastro → editar perfil → publicar → ver perfil público → registrar clique.
- [x] 3. `playwright.config.ts` sobe o app automaticamente (`webServer`) e o e2e roda contra o Postgres do compose.
- [x] 4. O job E2E do CI está reativado e o gate `CI aprovado` não aceita mais `skipped` para os jobs de teste.
- [x] 5. Existe runner de migração idempotente (`npm run db:migrate` aplica todas as migrações, com controle de versão aplicada).
- [x] 6. `npm run build`, `npm run lint`, `npm run typecheck`, `npm run test:unit` e `npm run test:e2e` passam localmente com evidência.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md` (Fase 2: fluxo e2e verde) · Arquivos-alvo: `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `.github/workflows/ci.yml`, `package.json`, `scripts/`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0016: suíte de testes real e portão de CI honesto`
- Evidência final: log entradas [3] a [6]; 84 unitários + 3 e2e
- Docs atualizados: `docs/setup/local-development.md` (em TCK-0017)
