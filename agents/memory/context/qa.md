# Contexto operacional — QA (validação, e2e Playwright, ambientes)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/qa-validator.md` não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Critérios de aceite se validam com **evidência executável** (saída de comando, teste, screenshot), nunca "por leitura de código". Fluxos críticos a cobrir por e2e Playwright quando existirem: cadastro, editar perfil, ver perfil público, registrar clique. Ambiente de validação: `docker compose up` local — se não sobe, é o primeiro defeito a resolver.

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `qa`.
