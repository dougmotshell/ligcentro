---
name: dev-loop
description: Executa o ciclo completo de desenvolvimento de um ticket — triagem → implementação → code review → validação de QA — com handoffs e logs a cada etapa, em loop até todos os critérios de aceite passarem (ou escalar ao Douglas). Use com "/dev-loop TCK-NNNN".
---

# Skill: /dev-loop

Orquestra os agentes de [agents/](../../../agents/README.md) sobre um ticket até `done`, `blocked` ou limite de loops.

> **Execução automática:** este ciclo é disparado automaticamente ao final do `/ticket` (pós-triagem) e pela continuação do `/handoff` — o Douglas não precisa invocá-lo. A invocação manual (`/dev-loop TCK-NNNN`) serve para **retomar** um ticket parado (desbloqueado, sessão interrompida, escalada resolvida).

## Passos

1. Ler o ticket; se `new`, rodar a triagem do tech-lead primeiro (como em `/ticket` passo 5). Em seguida, **carregar a memória persistente**: [lições](../../../agents/memory/lessons.md) e o contexto da área ([agents/memory/context/](../../../agents/memory/context/)) relevantes ao ticket — lição aplicável muda a abordagem e é citada no log.
2. **Loop principal** (cada etapa registra ACTION/HANDOFF no log via o formato do protocolo):
   a. **Implementação** — assumir (ou invocar como subagente) o dev responsável ([frontend](../../../agents/frontend-developer.md)/[backend](../../../agents/backend-developer.md)/[devops](../../../agents/devops-engineer.md)); commits `TCK-NNNN:`.
   b. **Code review** — papel do [code-reviewer](../../../agents/code-reviewer.md) sobre o diff completo; REJECT numerado devolve ao passo (a).
   c. **Validação** — papel do [qa-validator](../../../agents/qa-validator.md): executar de verdade (compose/testes/Playwright), checklist de critérios com evidência; REJECT devolve ao passo (a).
   d. Todos os critérios ✓ → status `done`; acionar [docs-writer](../../../agents/docs-writer.md) se a entrega muda UI/comportamento/docs.
3. **Limites**: 3 REJECTs no mesmo par → parar e escalar (resumo do impasse + opções para o Douglas). Falta decisão de produto → `blocked: human-input` com perguntas objetivas.
4. **Relatório final ao Douglas**: o que foi entregue, commits, evidências da validação, o que ficou pendente (se algo), e link do log para auditoria.

## Regras

- Papéis distintos são exercidos de verdade: o "reviewer" critica o diff como terceiro, sem defender a implementação; ideal usar subagentes separados quando a ferramenta permitir.
- **Paralelismo**: tickets independentes podem rodar `/dev-loop` simultaneamente. Se o agente responsável já estiver ocupado em outro ticket, spawnar um subagente do mesmo tipo (`<agente>#N`) para assumir — entrada `SPAWN` no log, conforme o [protocolo](../../../agents/handoff-protocol.md#subagentes-delegação-e-paralelismo). Review/QA sempre de cadeia distinta da do autor.
- Nunca marcar critério como atendido sem evidência executável.
- **Memória**: a ACTION que resolve um REJECT termina com `Lição: L-NNN` (registrada em [lessons.md](../../../agents/memory/lessons.md)) ou `Lição: n/a — erro pontual`; erro que já tem lição registrada é defeito bloqueante. Ao fechar o ticket, se o conhecimento operacional da área mudou, atualizar `agents/memory/context/<área>.md` ([protocolo](../../../agents/handoff-protocol.md#memória-persistente-lições-e-contexto)).
- Se o ambiente local não sobe (`docker compose up` falha), isso é o primeiro defeito a resolver — nada de validar "por leitura de código".
