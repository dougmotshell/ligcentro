# TCK-0012: Integridade e proteção da ingestão de analytics

- **status:** triaged
- **owner:** backend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** bug
- **size:** M
- **phase:** Fase 3 — Analytics honesto

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: o upsert de `page_views` nunca casa quando país/referrer são nulos —
NULLs são distintos no Postgres — e a ingestão aceita qualquer `profileId`/
`blockId` de quem chamar.)

## Requisito refinado

- User story: como criador, confio nos números do meu painel — eles contam o que
  realmente aconteceu e não podem ser inflados por terceiros.
- Fora de escopo: detecção de bot avançada, geolocalização própria.

## Critérios de aceite (máx. 7, verificáveis)

- [ ] 1. O upsert de `page_views` incrementa a mesma linha quando país e referrer são nulos (evidência: SQL no Postgres local).
- [ ] 2. A ingestão de clique recusa `blockId` que não pertence ao `profileId` informado.
- [ ] 3. A ingestão recusa perfil inexistente ou não publicado.
- [ ] 4. Há limite de taxa na ingestão **sem** persistir qualquer identificador de visitante (LGPD: sem IP, sem fingerprint, sem cookie).
- [ ] 5. `ANALYTICS_RETENTION_DAYS` é aplicado por uma rotina de expurgo, ou removido da documentação se não for implementado.
- [ ] 6. Testes unitários cobrem upsert, validação de vínculo e limite de taxa.
- [ ] 7. O painel de analytics abre sem erro (dois defeitos herdados do TCK-0005, encontrados na validação do TCK-0011: `item.day.slice is not a function`, porque coluna `date` chega como `Date` do driver, e `INVALID_MESSAGE: chart.barAriaLabel`).
- [ ] 8. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/05-analytics-privacy.md` · Fase: 3 · Arquivos-alvo: `db/migrations/`, `lib/db/analytics.ts`, `app/api/analytics/**`

## Resolução (preenchido ao fechar)

- Commits: · Evidência final: · Docs atualizados:
