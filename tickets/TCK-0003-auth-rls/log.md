# Log — TCK-0003: Fase 2a — Auth, contas e RLS

> Append-only.

---

## 2026-07-19 — OPEN | tech-lead | Ticket criado

Aguardando TCK-0002 (Fase 1) ser concluída antes de iniciar.


## [1] ACTION — 2026-07-19 22:35 — Copilot CLI
- Ação: Implementado auth mock local com migração de `user_id`, páginas de login/signup, APIs de auth, proteção do dashboard e middleware i18n protegido.
- Motivo: Entregar os critérios de aceite da Fase 2a (TCK-0003).
- Resultado: ok — `npm run build`, `npm run lint`, `npm run typecheck`; `curl /pt-BR/login` → 200; `curl /pt-BR/dashboard` sem cookie → 307 login; `curl /api/auth/check-handle?handle=demo` → `{"available":false}`; migração `0003_add_user_id.sql` aplicada no Postgres do compose.
- Artefato final: commit `3ae136d`.

