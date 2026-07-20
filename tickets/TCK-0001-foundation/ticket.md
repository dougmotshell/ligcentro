# TCK-0001: Fase 0 — Fundação (scaffold do projeto)

- **status:** in_progress
- **owner:** devops-engineer + frontend-developer + backend-developer
- **created:** 2026-07-19 · **by:** Douglas
- **type:** infra
- **size:** G
- **phase:** Fase 0 — Fundação

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como dev/agente, quero um esqueleto funcional do ligcentro para que todos os agentes consigam trabalhar e a Fase 1 possa começar.
- Fora de escopo: qualquer feature de produto (perfil público, auth, analytics, editor).

## Critérios de aceite

- [ ] 1. `npm run build` termina sem erros (Next.js 15 + TypeScript + Tailwind).
- [ ] 2. `npm run lint` e `npm run typecheck` passam sem erros.
- [ ] 3. `docker compose up` sobe Postgres + app localmente; `curl localhost:3000` retorna 200.
- [ ] 4. Página raiz (`/`) exibe "Hello, ligcentro" nos dois idiomas (pt-BR / en-US) via next-intl.
- [ ] 5. Temas claro/escuro funcionam via CSS variables (design tokens básicos).
- [ ] 6. Primeira migração SQL vazia versionada em `supabase/migrations/` (ou `db/migrations/`).
- [ ] 7. CI (GitHub Actions) passa: lint + typecheck + build verde no PR.

## Referências

- Plano: `docs/implementation-plan/02-architecture.md` · `docs/implementation-plan/03-mvp-roadmap.md#fase-0`
- Fase do roadmap: Fase 0
- Arquivos-alvo: `/` (raiz do projeto — arquivos novos)
- Decisão de portabilidade: Supabase em produção; Postgres puro via `DATABASE_URL` em dev/QA (sem credencial Supabase obrigatória para rodar localmente)

## Resolução (preenchido ao fechar)

- Commits: ·
- Evidência final: ·
- Docs atualizados: ·
