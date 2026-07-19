# ADR-0001 — Registrar decisões de arquitetura

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Processo de engenharia

## Contexto e problema

O LikHub está sendo projetado a partir de uma engenharia reversa do Linktree. As
decisões arquiteturais precisam ser rastreáveis: por que escolhemos SSR, por que
serverless, por que um banco poliglota. Sem registro, o "porquê" se perde e cada
nova pessoa no time reabre discussões já resolvidas.

## Alternativas consideradas

1. **Não documentar** — decisões vivem em conversas e PRs. Rápido, mas volátil.
2. **Wiki livre** — flexível, mas sem estrutura nem histórico de status.
3. **ADRs versionados no repositório** (Michael Nygard) — arquivos markdown
   imutáveis, numerados, versionados junto ao código.

## Decisão

Adotamos **ADRs** no formato de Michael Nygard, versionados em `docs/adr/`.
Regras:

- Cada ADR é **imutável** após aceita. Mudança de rumo cria uma nova ADR que
  *substitui* a anterior (atualizando o status da antiga).
- Numeração sequencial e crescente (`NNNN`).
- Uma decisão por arquivo.
- Toda ADR relacionada a um produto de referência inclui a seção
  "Referência ao Linktree".

## Consequências

- **Positivas:** histórico de decisões auditável; onboarding mais rápido; menos
  rediscussão.
- **Negativas / custos:** disciplina de escrita; risco de ADRs desatualizadas se
  o status não for mantido.
- **Riscos e mitigação:** revisar ADRs em cada marco de arquitetura; linkar ADRs
  a partir das specs e dos diagramas C4.

## Referência ao Linktree (engenharia reversa)

O Linktree mantém um blog de engenharia público que expõe decisões (ex.: pipeline
de dados com EventBridge/Glue/Snowflake). Espelhamos essa cultura de decisões
explícitas internamente via ADRs.
