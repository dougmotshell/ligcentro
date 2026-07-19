# Tickets — Fluxo de Desenvolvimento

> Unidade de trabalho do sistema de agentes ([agents/README.md](../agents/README.md)). Criados pela skill `/ticket`; movidos pelo [protocolo de handoff](../agents/handoff-protocol.md); auditáveis pelo `log.md` de cada um.

## Estrutura

```
tickets/
  TICKET-TEMPLATE.md      # modelo (não editar; copiar)
  TCK-0001-<slug>/
    ticket.md             # pedido, requisito refinado, critérios de aceite, status atual
    log.md                # auditoria append-only: ACTIONs, HANDOFFs, REJECTs (com [SEQ])
    assets/               # screenshots, evidências, diagramas (opcional)
```

## Regras

1. **Numeração** sequencial `TCK-NNNN` (4 dígitos); slug curto en-US (`TCK-0003-login-screen`).
2. **Status vive no `ticket.md`** (campo `status:`) e só muda junto com uma entrada de handoff no `log.md`.
3. **`log.md` é append-only** — a trilha de auditoria completa de quem fez o quê, quando e por quê. Corrigir = entrada `CORRECTION`, nunca edição.
4. Commits do ticket usam o prefixo `TCK-NNNN:`.
5. Ticket `done` nunca reabre — regressão vira ticket novo referenciando o original.
6. Um agente por vez é o **dono** (campo `owner:`); trabalho paralelo exige tickets separados.

## Ciclo (resumo)

`new` → tech-lead → `triaged` → dev → `in_review` (code-reviewer) → `in_validation` (qa-validator) → `done` → docs-writer. Reprovações voltam ao autor (máx. 3 loops → tech-lead). Detalhes: [handoff-protocol](../agents/handoff-protocol.md).
