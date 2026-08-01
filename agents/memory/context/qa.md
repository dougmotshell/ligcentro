# Contexto operacional — QA (validação, e2e Playwright, ambientes)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/qa-validator.md` não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Critérios de aceite se validam com **evidência executável** (saída de comando, teste, screenshot), nunca "por leitura de código". Fluxos críticos a cobrir por e2e Playwright quando existirem: cadastro, editar perfil, ver perfil público, registrar clique. Ambiente de validação: `docker compose up` local — se não sobe, é o primeiro defeito a resolver.

- 2026-08-01 — Existe suíte: 84 testes unitários (`npm run test:unit`, sem `--passWithNoTests`) e 3 e2e (`npm run test:e2e`, o Playwright sobe o app sozinho). Os testes que exercitam RLS, ingestão e exclusão precisam do Postgres do compose; sem banco eles se pulam, então **validação sem banco não é validação**.
- 2026-08-01 — E2E roda contra `build + next start`, não `next dev` (L-016, ADR-0004): o dev server do Next 16 bloqueia recursos `/_next/` de outra origem, o cliente não hidrata e a falha é silenciosa.
- 2026-08-01 — Seletor por nome acessível casa por **substring**: `'Perfil'` também casa "Salvar perfil". Usar `exact: true` para aba/rótulo curto.
- 2026-08-01 — Veredito de QA nunca é escrito no mesmo comando que roda a suíte (L-012).

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `qa`.
