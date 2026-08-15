# TCK-0023: Auditoria da squad de segurança (devsecops + red/blue team)

- **status:** in_validation
- **owner:** devsecops-engineer
- **created:** 2026-08-15 · **by:** Douglas
- **type:** security
- **size:** M
- **phase:** Fase 4 — Polimento e lançamento do grátis

## Pedido original (verbatim)

> implemente tudo e depois quero que na mesma tela ... (ver TCK-0020)

## Diagnóstico (tech-lead)

Os agentes de `agents/security/` existem e o workflow `security-audit.yml` está
agendado, mas **nenhuma auditoria formal foi executada e registrada**. RLS e
segredos têm teste automatizado (TCK-0011, TCK-0016), o que cobre regressão —
não cobre superfície nova nem raciocínio adversarial.

## Requisito refinado (product-analyst)

- User story: como mantenedor, quero saber quais vulnerabilidades reais existem
  antes de abrir o grátis para usuários, com PoC e severidade, não com opinião.
- Fora de escopo: pentest contra a instância de produção da Vercel (exige janela
  autorizada e ambiente dedicado); vira recomendação com passos.

## Critérios de aceite (verificáveis)

- [x] 1. Relatório versionado em `security/reports/` seguindo
      `agents/security/security-audit-protocol.md`, com escopo, método e data.
- [x] 2. Cobertura mínima: autenticação/sessão, RLS multi-tenant, ingestão de
      analytics (LGPD/PII), upload de avatar, SSRF/URL de bloco, segredos e
      dependências.
- [x] 3. Cada achado traz severidade, evidência reproduzível (comando/teste) e
      recomendação — sem achado especulativo não verificado.
- [x] 4. Todo achado de severidade alta ou crítica é **corrigido neste ticket** e
      a correção é coberta por teste automatizado.
- [x] 5. Achados médios/baixos aceitos conscientemente ficam registrados com
      justificativa e ticket de acompanhamento quando couber.
- [x] 6. `npm audit` e a suíte de testes passam ao final.

## Referências

- Protocolo: `agents/security/security-audit-protocol.md` · Workflow: `.github/workflows/security-audit.yml`
- Plano: `docs/implementation-plan/05-analytics-privacy.md`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0023: auditoria de segurança e correções`
- Evidência final: `security/reports/2026-08-15-squad.md`; `npm audit` 0 vulnerabilidades;
  `e2e/security-headers.spec.ts` verde
- Pendência: achado 2 (DATABASE_URL na Vercel) depende do Douglas — ver runbook
- Docs atualizados: `docs/runbook.md`
