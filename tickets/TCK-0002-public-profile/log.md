# Log — TCK-0002: Fase 1 — Perfil público (leitura)

> Append-only. Cada entrada: `TIPO | agente | AAAA-MM-DD HH:MM | descrição`.

---

## 2026-07-19 — OPEN | tech-lead | Ticket criado

TCK-0001 (Fase 0) concluída com todos os critérios verdes. Iniciando Fase 1.

Pré-condições confirmadas:
- Next.js 15 + Tailwind + next-intl funcionando.
- `docker compose up` sobe Postgres + app.
- `db/migrations/0000_initial.sql` existe (extensões apenas).

---

## 2026-07-19 — HANDOFF | tech-lead → backend-developer + frontend-developer

- **backend-developer**: migração SQL (profiles + blocks com RLS), seed do perfil demo, repositório de dados para leitura.
- **frontend-developer**: página `/[locale]/[handle]`, componentes de blocos, OG tags, 404 customizado.

