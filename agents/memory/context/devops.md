# Contexto operacional — DevOps (CI/CD, compose, deploy, monitoramento)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/devops-engineer.md` e nos planos não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- 2026-07-19 — **CI é tolerante à ausência de código**: o `ci.yml` só roda lint/typecheck/testes/build quando existe `package.json` (job `detect`). Enquanto o repo é só docs, o CI fica verde sem rodar nada de Node. Ao adicionar `package.json` na Fase 0, o CI completo passa a valer automaticamente.

## Estado atual e decisões em vigor

- 2026-07-19 — **Deploy pela Vercel via integração Git** (o repositório já está conectado a `ligcentro.vercel.app`): push na `main` → deploy de produção; PR → deploy de preview. Os workflows de GitHub Actions são **portões de qualidade** (CI, auditoria de segurança) e **release semver**, **não** duplicam o deploy da Vercel — evita deploy dobrado/conflito.
- 2026-07-19 — **Caminho de portabilidade**: alvo é subir o app em `docker compose` local (Postgres + app) e, no futuro, num VPS, sem serviço pago. O específico de Vercel fica isolado em `adapters/`. Ver [`02-architecture.md`](../../../docs/implementation-plan/02-architecture.md).

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `devops`.
