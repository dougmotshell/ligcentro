# Workflow de Correção de Segurança (issues & PRs)

> Como um achado de segurança vira código corrigido e verificado, com rastreabilidade total. Usado por [devsecops](devsecops-engineer.md), [red-team](red-team.md), [blue-team](blue-team.md) e [security-researcher](security-researcher.md).

## Da descoberta ao fechamento

1. **Achado** → relatório em `security/reports/` + **issue** no repo do app com:
   - Título: `[sec] <resumo>` · Labels: `security`, `sev:<critical|high|medium|low>`
   - Corpo: vetor, reprodução, impacto, CVSS, recomendação, link do relatório. **Sem PoC explorável em issue pública** (referência ao relatório privado).
2. **Triagem (devsecops)**: prioriza por CVSS + exposição; converte em ticket `TCK-NNNN` (tipo `security`) se exigir mudança de produto.
3. **Correção (dev via [dev-loop](../../.claude/skills/dev-loop/SKILL.md))**: branch `security/TCK-NNNN-<slug>`; **PR referencia a issue** (`Fixes #N`).
4. **Revisão**: code-reviewer + devsecops obrigatórios em PR de segurança.
5. **Reteste (red-team ou researcher)**: reproduz o vetor original; só fecha se não reproduzir mais.
6. **Blue-team**: confirma que o vetor agora é detectável/logado (se aplicável).
7. **Merge**: só com CI verde (inclui jobs de segurança) — regra de branch protection configurada pelo [devops-engineer](../devops-engineer.md).

## SLA por severidade (metas, projeto pessoal)

| Severidade | Ação | Bloqueia release? |
|---|---|---|
| Crítica | mitigar/corrigir imediatamente | **Sim** |
| Alta | corrigir no ciclo atual | Sim, se tocar dados de usuário |
| Média | próximo ciclo | Não |
| Baixa | backlog | Não |

## Rastreabilidade

Relatório (`security/reports/`) ↔ issue (`#N`) ↔ ticket (`TCK-NNNN`) ↔ PR (`Fixes #N`) ↔ commit ↔ reteste no log. Qualquer auditor reconstrói a história completa de um achado por qualquer um desses pontos.
