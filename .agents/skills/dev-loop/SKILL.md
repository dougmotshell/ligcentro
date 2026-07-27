---
name: dev-loop
description: Executa o ciclo completo de desenvolvimento de um ticket — triagem → implementação → code review → validação de QA — com handoffs, briefings e logs a cada etapa, em loop até todos os critérios de aceite passarem (ou escalar ao Douglas). Funciona em qualquer ferramenta de IA (com ou sem subagentes) e segue regras de economia de recursos. Use com "/dev-loop TCK-NNNN".
---

# Skill: /dev-loop

Orquestra os agentes de [agents/](../../../agents/README.md) sobre um ticket até `done`, `blocked` ou limite de loops.

> **Execução automática:** este ciclo é disparado automaticamente ao final do `/ticket` (pós-triagem) e pela continuação do `/handoff` — o Douglas não precisa invocá-lo. A invocação manual (`/dev-loop TCK-NNNN`) serve para **retomar** um ticket parado (desbloqueado, sessão interrompida, escalada resolvida).

## Modo de execução (funciona em qualquer ferramenta)

Detectar a capacidade da ferramenta e seguir o [modo correspondente do protocolo](../../../agents/handoff-protocol.md#modos-de-execução-qualquer-ferramenta-de-ia):

- **Modo subagentes** (Claude Code e similares): cada papel roda em instância própria; review/QA sempre de cadeia distinta da do autor.
- **Modo solo** (Copilot, Codex, Gemini CLI, Cursor, Antigravity, Windsurf…): a mesma sessão exerce os papéis **em sequência**. A cada troca de papel: registrar o HANDOFF com briefing, "vestir" o novo papel (ler a definição em `agents/<papel>.md` se ainda não leu nesta sessão) e, como reviewer/QA, reler diff e critérios do zero, como terceiro.

O log resultante é idêntico nos dois modos — quem audita não distingue a ferramenta.

## Passos

1. Ler o ticket; se `new`, rodar a triagem do tech-lead primeiro (como em `/ticket` passo 5). Em seguida, **carregar a memória persistente**: [lições](../../../agents/memory/lessons.md) (erros a não repetir + acertos a reaproveitar) e o contexto da área ([agents/memory/context/](../../../agents/memory/context/)) relevantes ao ticket — lição aplicável muda a abordagem e é citada no log (`aplicada L-NNN`).
2. **Loop principal** (cada etapa registra ACTION/HANDOFF no log; todo HANDOFF leva o **briefing para o próximo agente** exigido pelo [protocolo](../../../agents/handoff-protocol.md#formato-do-handoff-append-em-ticketstck-nnnnlogmd)):
   a. **Implementação** — papel do dev responsável ([frontend](../../../agents/frontend-developer.md)/[backend](../../../agents/backend-developer.md)/[devops](../../../agents/devops-engineer.md)); commits `TCK-NNNN:`.
   b. **Code review** — papel do [code-reviewer](../../../agents/code-reviewer.md) sobre o diff completo, em **uma passada**: todos os defeitos numerados de uma vez (correção, segurança, convenções); REJECT devolve ao passo (a).
   c. **Validação** — papel do [qa-validator](../../../agents/qa-validator.md): executar de verdade, na **escala que os critérios exigem** (ver Eficiência), checklist de critérios com evidência; REJECT devolve ao passo (a).
   d. Todos os critérios ✓ → status `done`; acionar [docs-writer](../../../agents/docs-writer.md) se a entrega muda UI/comportamento/docs.
3. **Limites**: 3 REJECTs no mesmo par → parar e escalar (resumo do impasse + opções para o Douglas). Falta decisão de produto → `blocked: human-input` com perguntas objetivas.
4. **Fechamento com memória**: antes do relatório final, registrar as lições do ciclo — erro corrigido em REJECT (`Lição: L-NNN` ou `n/a` justificado) **e acerto generalizável**, se houve; atualizar `agents/memory/context/<área>.md` se o conhecimento operacional mudou.
5. **Relatório final ao Douglas**: o que foi entregue, commits, evidências da validação, lições registradas, o que ficou pendente (se algo), e link do log para auditoria.

## Eficiência (economia de recursos — regras duras)

O loop é **rápido por padrão**; rigor não é desperdício:

1. **Contexto mínimo**: ler apenas ticket + log + memória da área + arquivos-alvo. Não varrer o repositório nem reler planos inteiros — o briefing do handoff anterior diz onde olhar.
2. **Validação proporcional aos critérios**: `lint` + `typecheck` + testes dos arquivos afetados sempre; suíte completa **uma vez**, antes do parecer final do QA; `docker compose` + Playwright/e2e **somente** quando os critérios envolvem UI/fluxo real ou o ticket é M/G. Nunca marcar critério sem evidência executável — a economia está em não executar o que nenhum critério pede.
3. **Uma passada de review**: defeitos em lote numerado; proibido devolver por um defeito por rodada. Nit de estilo sem impacto não gera REJECT sozinho — vai como observação no mesmo lote.
4. **Correção re-testa só o afetado**: após resolver um REJECT, rodar os checks dos pontos corrigidos; a suíte completa só se a correção tocou área nova.
5. **Reaproveitar artefatos**: build/`.next` válidos entre etapas não são refeitos se nada mudou (exceção: falha estranha de manifesto/standalone → `rm -rf .next`, lição L-003).
6. **Logs e briefings enxutos**: 2–5 linhas por entrada, briefing de 3–8 linhas apontando para artefatos em vez de reproduzi-los.
7. **Paralelismo só entre tickets independentes** (modo subagentes); dentro de um ticket, sequencial por padrão — spawn de subtarefa exige ganho claro e vira entrada `SPAWN`.

## Regras

- Papéis distintos são exercidos de verdade: o "reviewer" critica o diff como terceiro, sem defender a implementação — nos dois modos.
- **Paralelismo** (modo subagentes): tickets independentes podem rodar `/dev-loop` simultaneamente. Se o agente responsável já estiver ocupado em outro ticket, spawnar um subagente do mesmo tipo (`<agente>#N`) — entrada `SPAWN` no log, conforme o [protocolo](../../../agents/handoff-protocol.md#subagentes-delegação-e-paralelismo). Review/QA sempre de cadeia distinta da do autor.
- **Memória**: a ACTION que resolve um REJECT termina com `Lição: L-NNN` (registrada em [lessons.md](../../../agents/memory/lessons.md)) ou `Lição: n/a — erro pontual`; erro que já tem lição registrada é defeito bloqueante. Acertos generalizáveis também viram lição (tipo `acerto`) no fechamento.
- **Tudo documentado**: nenhuma ação sem entrada no log; handoff sem briefing é inválido (quem recebe devolve).
- Se o ambiente local não sobe (`docker compose up` falha) **e a validação o exige**, isso é o primeiro defeito a resolver — nada de validar "por leitura de código".
