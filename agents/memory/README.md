# Memória persistente dos agentes

> Sessões de agente são efêmeras; **o repositório é a memória**. Esta pasta guarda o que sobrevive entre sessões: erros já cometidos (para nunca repeti-los), acertos que valem repetir e o conhecimento operacional que torna qualquer agente efetivo desde o primeiro minuto. Regras completas na seção ["Memória persistente"](../handoff-protocol.md#memória-persistente-lições-e-contexto) do protocolo.

## O que tem aqui

| Arquivo | O que é | Disciplina |
|---|---|---|
| [`lessons.md`](lessons.md) | Lições aprendidas (`L-NNN`), de dois tipos — **erro**: erro → causa raiz → como evitar; **acerto**: o que funcionou → por quê → como reaproveitar | **Append-only** (como o log de ticket); lição superada = nova lição referenciando a antiga |
| [`context/<área>.md`](context/) | Contexto operacional **vivo** por área: pegadinhas, estado atual, decisões em vigor | Editável, mas toda entrada leva data; sem PII de visitante (LGPD) |

## Quem lê o quê (mapa agente → contexto)

| Contexto | Agentes |
|---|---|
| [`context/process.md`](context/process.md) | tech-lead, product-analyst, docs-writer, code-reviewer (+ todos, para o próprio sistema de tickets) |
| [`context/frontend.md`](context/frontend.md) | frontend-developer, ui-ux-designer |
| [`context/backend.md`](context/backend.md) | backend-developer |
| [`context/devops.md`](context/devops.md) | devops-engineer |
| [`context/qa.md`](context/qa.md) | qa-validator |
| [`context/security.md`](context/security.md) | security-auditor + squad de segurança |

## Ciclo de uso (resumo)

1. **Antes de trabalhar**: ler o contexto da sua área + varrer `lessons.md` pela área/palavras-chave do ticket. Lição que mudou sua abordagem → citar no log (`aplicada L-NNN`).
2. **Errou algo generalizável** (REJECT resolvido, CI quebrado por pegadinha, retrabalho por falta de contexto): registrar lição `L-NNN` de tipo **erro** — a ACTION que resolve o defeito termina com `Lição: L-NNN` ou `Lição: n/a — erro pontual` (justificado).
3. **Acertou algo generalizável** (abordagem que economizou tempo real, evitou uma classe de erro ou passou de primeira em review/QA — e que outro agente não descobriria sozinho): registrar lição `L-NNN` de tipo **acerto** no fechamento do ticket. Rotina que já está nos docs não é lição.
4. **Terminou um ticket que mudou o conhecimento da área** (nova ferramenta, novo comportamento, decisão operacional): atualizar o `context/<área>.md`, com data.
5. **Review/QA cobram**: repetir um erro que já tem lição registrada é defeito **bloqueante**; resolver REJECT sem a linha `Lição:` também.

## O que NÃO entra aqui

- Detalhe pontual de um ticket (fica no `log.md` do ticket).
- O que já está nos arquivos de agente, planos de implementação, specs ou READMEs (não duplicar — referencie).
- PII / dados pessoais de visitantes (LGPD — ver [`docs/implementation-plan/05-analytics-privacy.md`](../../docs/implementation-plan/05-analytics-privacy.md)) — jamais.
