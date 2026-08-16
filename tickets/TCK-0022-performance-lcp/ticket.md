# TCK-0022: Medir e comprovar o LCP mobile p75 < 1,2 s do perfil público

- **status:** done
- **owner:** devops-engineer
- **created:** 2026-08-15 · **by:** Douglas
- **type:** infra
- **size:** M
- **phase:** Fase 4 — Polimento e lançamento do grátis

## Pedido original (verbatim)

> implemente tudo e depois quero que na mesma tela ... (ver TCK-0020)

## Diagnóstico (tech-lead)

`AGENTS.md` regra 5 e o critério de pronto da Fase 1 afirmam **LCP mobile p75 <
1,2 s** para o perfil público. Esse número **nunca foi medido**: é uma afirmação
sem evidência, e o roadmap admite isso em `03-mvp-roadmap.md:70`. Enquanto não
houver medição reprodutível, "performance é feature" é slogan, não engenharia.

## Requisito refinado (product-analyst)

- User story: como mantenedor, quero um comando que meça o LCP do perfil público
  em condições de mobile e me diga se o alvo foi atingido, para que a regra 5
  seja verificável a cada mudança.
- Fora de escopo: RUM de campo (usuários reais) — exige tráfego real e serviço
  externo; fica como recomendação pós-lançamento.

## Critérios de aceite (verificáveis)

- [x] 1. Existe script reprodutível (`npm run perf`) que mede o perfil público com
      emulação mobile e rede/CPU throttled, sobre o build de produção.
- [x] 2. A medição roda N execuções e reporta p75 do LCP (não uma amostra única),
      além de FCP, CLS e TBT.
- [x] 3. O resultado é registrado com números reais no log do ticket e em um
      relatório versionado (`docs/performance/`).
- [x] 4. O script sai com código ≠ 0 quando o p75 de LCP ultrapassa o orçamento
      configurado (1200 ms), servindo de portão.
- [x] 5. Se o alvo não for atingido, as otimizações necessárias são implementadas
      e a medição repetida — ou o desvio é documentado com causa e plano.
- [x] 6. O relatório distingue explicitamente medição **local** (laboratório) de
      medição **em produção/Vercel**, sem apresentar uma como se fosse a outra.

## Referências

- Plano: `AGENTS.md` regra 5 · `docs/implementation-plan/02-architecture.md`
- Arquivos-alvo: `scripts/`, `docs/performance/`, `app/[locale]/[handle]/page.tsx`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0022: medir LCP p75 do perfil público`
- Evidência final: LCP p75 436 ms (laboratório) e 564 ms (produção), orçamento 1200 ms —
  `docs/performance/README.md` + JSON por alvo
- Docs atualizados: `docs/performance/`, roadmap, AGENTS.md
