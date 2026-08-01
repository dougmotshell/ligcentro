# TCK-0017: Sincronizar documentação com o estado real do código

- **status:** done
- **owner:** docs-writer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** docs
- **size:** M
- **phase:** transversal

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: `AGENTS.md` afirma que "ainda não há código"; tickets TCK-0003 a
TCK-0006 estão `done` com itens de roadmap em aberto; `.env.example` documenta
variáveis inexistentes no código.)

## Requisito refinado

- User story: como agente que assume um ticket, confio que a documentação
  descreve o repositório que realmente existe.
- Fora de escopo: reescrever a pesquisa de mercado.

## Critérios de aceite (máx. 7, verificáveis)

- [x] 1. `AGENTS.md` (mapa do repositório + "Estado atual") descreve o código existente e as fases de fato concluídas.
- [x] 2. `03-mvp-roadmap.md` reflete o estado real item por item, com o que ficou pendente identificado por ticket.
- [x] 3. `.env.example` e `docs/setup/external-services.md` listam só variáveis lidas pelo código, mais as novas introduzidas nos tickets TCK-0009..TCK-0016.
- [x] 4. Os tickets TCK-0007 e TCK-0008 têm entrada de encerramento coerente com o que passou a funcionar.
- [x] 5. Decisões duras deste ciclo viram ADR em `docs/adr/`.
- [x] 6. `npm run format:check` passa nos arquivos alterados.

## Referências

- `AGENTS.md` · `docs/implementation-plan/03-mvp-roadmap.md` · `.env.example` · `docs/setup/external-services.md`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0017: sincronizar documentação com o estado real`
- Evidência final: log entradas [3] a [5]
- Docs atualizados: `AGENTS.md`, `03-mvp-roadmap.md`, `.env.example`, `docs/setup/*`, `docs/adr/*`, `agents/memory/context/*`
