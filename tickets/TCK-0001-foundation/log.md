# Log — TCK-0001: Fase 0 — Fundação

> Append-only. Cada entrada: `TIPO | agente | AAAA-MM-DD HH:MM | descrição`.

---

## 2026-07-19 20:14 — OPEN | tech-lead | Ticket criado

Sessão anterior (Claude CLI) iniciou a tarefa, verificou o ambiente (Node 24, npm 11, Docker, 23 GB livre) e criou o diretório `tickets/TCK-0001-foundation/` mas caiu no rate limit antes de scaffoldar. Sessão retomada pelo GitHub Copilot CLI.

- Ambiente: Node 24, npm 11, Docker disponível, 23 GB livres.
- Repo conectado à Vercel (`ligcentro.vercel.app`); CI (`.github/workflows/ci.yml`) já existe mas só valida lint de YAML e docs enquanto `package.json` não existir.
- Decisão arquitetural (tech-lead): Postgres local via `DATABASE_URL` para dev/QA; Supabase em produção. Sem credencial Supabase obrigatória para rodar localmente.

---

## 2026-07-19 — HANDOFF | tech-lead → devops-engineer + frontend-developer + backend-developer

Delegando implementação paralela:
- **devops-engineer**: `docker compose`, CI adequado com `package.json`, `.env.example`.
- **frontend-developer**: scaffold Next.js 15 + TS + Tailwind, design tokens, temas, i18n (next-intl).
- **backend-developer**: estrutura de migrações (`db/migrations/`), primeira migração vazia.

