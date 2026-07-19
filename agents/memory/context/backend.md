# Contexto operacional — Backend (Supabase/RLS, API, ingestão de analytics)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/backend-developer.md`, nos planos de implementação e nas specs não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Stack alvo (ainda não instalada): **Supabase — Postgres + Auth + Storage**, com **RLS em 100% das tabelas** (toda migração acompanha teste de acesso cruzado com dois usuários fake). API via Route Handlers tipados do Next. Analytics **agregado por dia, sem PII de visitante** (LGPD). Banco único (Postgres) no MVP — sem persistência poliglota. Ver [`02-architecture.md`](../../../docs/implementation-plan/02-architecture.md) e [`04-data-model.md`](../../../docs/implementation-plan/04-data-model.md).

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `backend`.
