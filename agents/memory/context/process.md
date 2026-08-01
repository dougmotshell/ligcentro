# Contexto operacional — Processo (tickets, agentes)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está no protocolo/README dos agentes não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — **Projeto no início**: existe pesquisa de mercado (`docs/market-research/`) e planos de implementação (`docs/implementation-plan/`); **não há código** — o próximo marco é a Fase 0 do [roadmap](../../../docs/implementation-plan/03-mvp-roadmap.md).
- 2026-07-19 — Sistema de agentes/tickets, subagentes (`<agente>#N`) e memória persistente ativos (herdados e adaptados do projeto irmão *lernema*). Review/QA sempre de cadeia distinta da do autor.

- 2026-08-01 — Existe código, e bastante: `AGENTS.md` → "Estado atual" é a referência do que está pronto, e o roadmap aponta o ticket de cada item aberto. Decisões duras deste ciclo estão em `docs/adr/`.
- 2026-08-01 — Tickets TCK-0009 a TCK-0019 fecharam o ciclo de correções do MVP. Padrão adotado para o que não dá para provar localmente: o ticket fecha com uma seção **"Validação em produção pendente (Douglas)"** listando os passos, em vez de ficar `in_progress` para sempre — foi o que aconteceu com TCK-0007/0008 e travou a leitura do estado real por semanas.

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `process`.
