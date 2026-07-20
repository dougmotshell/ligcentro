# TCK-0005: Fase 3 — Analytics honesto

- **status:** done
- **owner:** backend-developer + frontend-developer
- **depends-on:** TCK-0004
- **created:** 2026-07-19 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 3 — Analytics honesto

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como criador, quero ver quantas visitas e cliques meu perfil recebeu por dia, por link — de forma honesta, sem PII de visitantes, dentro do grátis.
- Fora de escopo: analytics pago/avançado, fingerprinting, cookies de rastreamento.

## Critérios de aceite

- [ ] 1. Rota `POST /api/analytics/view` registra visita: upsert em `page_views` (profile_id, day, country grosso, referrer_host) — **sem IP, sem identificador do visitante**.
- [ ] 2. Rota `POST /api/analytics/click` registra clique: upsert em `block_clicks` (block_id, profile_id, day) — **sem PII**.
- [ ] 3. Página pública dispara `sendBeacon` (view ao carregar, click ao clicar em bloco) — **fire-and-forget, não bloqueia render**.
- [ ] 4. Painel `/[locale]/dashboard/analytics` exibe: visitas totais, cliques totais, CTR, série temporal (últimos 30 dias), top 5 links.
- [ ] 5. RLS: criador A não vê analytics de B; escrita de analytics é apenas server-side (service role).
- [ ] 6. Exportação JSON: rota `GET /api/profile/export` retorna perfil completo (blocos + analytics agregado) do usuário autenticado.
- [ ] 7. `npm run build`, `npm run lint`, `npm run typecheck` passam; e2e Playwright cobre: clique no perfil → contador incrementa no painel.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md#fase-3`
- Analytics e privacidade: `docs/implementation-plan/05-analytics-privacy.md`
- Modelo de dados: `docs/implementation-plan/04-data-model.md` (page_views, block_clicks)
- Arquivos-alvo: `app/api/analytics/`, `app/[locale]/dashboard/analytics/`, `lib/analytics/`

## Resolução (preenchido ao fechar)

- Commits: pendente (preencher após commit)
- Evidência final: `docker compose exec -T db psql -f /docker-entrypoint-initdb.d/0004_analytics.sql`; `rm -rf .next && npm run build && npm run lint && npm run typecheck`; `POST /api/analytics/view` → 200; `POST /api/analytics/click` → 200; `GET /api/profile/export` retornando totais; `/pt-BR/dashboard/analytics` exibindo o painel.
- Docs atualizados: `messages/pt-BR.json`, `messages/en-US.json`, `tickets/TCK-0005-analytics/log.md`.
