---
name: handoff
description: Registra um handoff formal entre agentes em um ticket (atualiza status no ticket.md + entrada padronizada no log.md append-only). Use ao concluir trabalho em um ticket e passar para o próximo agente, ou quando o Douglas pedir "/handoff TCK-NNNN <agente>".
---

# Skill: /handoff

Executa a transição de dono de um ticket seguindo o [handoff-protocol](../../../agents/handoff-protocol.md).

## Passos

1. Ler `tickets/TCK-NNNN-*/ticket.md` (status/owner atuais) e as últimas entradas do `log.md`.
2. Validar a transição contra o ciclo de vida (ex.: `in_progress → in_review` ok; `new → done` proibido). Transição inválida → explicar e abortar.
3. Determinar `[SEQ]` = último SEQ do log + 1 (se houver buraco na sequência, registrar `CORRECTION` apontando).
4. Append no `log.md` da entrada HANDOFF (ou REJECT, se for devolução) com **todos** os campos do protocolo: o que foi feito, artefatos (commits/arquivos/screenshots), como validar, pendências, checklist de critérios copiado do ticket.
5. Atualizar `status:` e `owner:` no `ticket.md` (única edição permitida fora de append).
6. Se for REJECT: incrementar o contador de loop; no 3º loop, o destino vira `tech-lead` automaticamente (regra do protocolo).
7. **Executar a continuação**: se o status novo não for `done` nem `blocked`, assumir (ou invocar como subagente) o papel do novo dono imediatamente e seguir o trabalho — o handoff é uma transição, não um ponto de parada. Registrar ao usuário apenas o resultado final da cadeia. Se o novo dono já estiver ocupado com outro ticket, spawnar um subagente dele (`<agente>#N`) para este ticket — entrada `SPAWN` no log, conforme o [protocolo](../../../agents/handoff-protocol.md#subagentes-delegação-e-paralelismo); o `Para:` do HANDOFF pode apontar direto para a instância (`<agente>#N`).
8. Se o status novo for `done` ou `blocked`: confirmar ao usuário a transição e o que destrava/segue (docs-writer pós-done, perguntas do blocked).

## Regras

- Handoff sem evidência de trabalho (commits/artefatos citados) é inválido — pedir ao agente que complete antes.
- Nunca editar entradas anteriores do log.
- Ao assumir como novo dono (passo 7), primeiro ler [lições](../../../agents/memory/lessons.md) + contexto da área em [agents/memory/context/](../../../agents/memory/context/) — [protocolo](../../../agents/handoff-protocol.md#memória-persistente-lições-e-contexto). Se for REJECT, a resolução termina com `Lição: L-NNN` ou `n/a` justificado.
