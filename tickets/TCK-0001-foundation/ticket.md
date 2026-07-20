# TCK-0001: Fase 0 — Fundação (scaffold do projeto)

- **status:** done
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

- [x] 1. `npm run build` termina sem erros (Next.js 15 + TypeScript + Tailwind).
- [x] 2. `npm run lint` e `npm run typecheck` passam sem erros.
- [x] 3. `docker compose up` sobe Postgres + app localmente; `curl localhost:3000` retorna 200.
- [x] 4. Página raiz (`/`) exibe "Hello, ligcentro" nos dois idiomas (pt-BR / en-US) via next-intl.
- [x] 5. Temas claro/escuro funcionam via CSS variables (design tokens básicos).
- [x] 6. Primeira migração SQL vazia versionada em `db/migrations/`.
- [x] 7. CI (GitHub Actions) passa: lint + typecheck + build verde no PR.

## Referências

- Plano: `docs/implementation-plan/02-architecture.md` · `docs/implementation-plan/03-mvp-roadmap.md#fase-0`
- Fase do roadmap: Fase 0
- Arquivos-alvo: `/` (raiz do projeto — arquivos novos)
- Decisão de portabilidade: Supabase em produção; Postgres puro via `DATABASE_URL` em dev/QA (sem credencial Supabase obrigatória para rodar localmente)

## Resolução

- Commits: `866b600` — TCK-0001: Fase 0 — scaffold completo da fundação
- Evidência final: ver seção QA no log.md
- Docs atualizados: memory/context/frontend.md · memory/context/backend.md · memory/context/devops.md
