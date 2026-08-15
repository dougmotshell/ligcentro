# TCK-0021: Auditoria de acessibilidade AA da interface inteira

- **status:** done
- **owner:** frontend-developer
- **created:** 2026-08-15 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 4 — Polimento e lançamento do grátis

## Pedido original (verbatim)

> implemente tudo e depois quero que na mesma tela ... (ver TCK-0020)

("implemente tudo" = os itens abertos da Fase 4 do roadmap. Este ticket cobre o
item marcado `[~]` em `03-mvp-roadmap.md:67`.)

## Diagnóstico (tech-lead)

O roadmap marca acessibilidade como parcial: só o catálogo de cores de marca tem
contraste AA verificado por teste (TCK-0014). Não existe auditoria automatizada
da interface, então qualquer regressão de contraste, rótulo ou foco passa sem
ninguém notar — e "auditei uma vez à mão" não é evidência que sobrevive ao
próximo commit.

## Requisito refinado (product-analyst)

- User story: como pessoa que navega por teclado ou leitor de tela, quero usar o
  ligcentro inteiro sem barreiras, nos temas claro e escuro.
- Fora de escopo: certificação AAA; auditoria manual com leitor de tela real
  (fica registrada como recomendação).

## Critérios de aceite (verificáveis)

- [x] 1. Existe verificação automatizada de acessibilidade (axe-core) rodando via
      Playwright sobre todas as telas principais: landing, login, cadastro,
      onboarding, dashboard (perfil/blocos/tema/compartilhar), analytics e perfil público.
- [x] 2. A verificação roda nos dois temas (claro e escuro) e falha o teste quando
      há violação de nível A ou AA.
- [x] 3. Zero violações A/AA nas telas cobertas — ou, para cada exceção, causa e
      justificativa registradas no log com correção acordada.
- [x] 4. Navegação por teclado verificada nos fluxos críticos: foco visível em todo
      controle interativo e nenhuma armadilha de foco.
- [x] 5. As correções não alteram o comportamento coberto pelo e2e do fluxo crítico
      (suíte continua verde).
- [x] 6. `npm run test:a11y` (ou equivalente documentado) executa a auditoria.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md:67` · AGENTS.md regra de i18n/UI
- Arquivos-alvo: `e2e/`, `app/`, `components/`, `app/globals.css`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0021: auditoria de acessibilidade AA e correções`
- Evidência final: `npm run test:a11y` 5/5 verde, zero violações A/AA nos dois temas;
  `app/theme-tokens.test.ts` e `lib/theme/surface.test.ts` travam o contraste no token
- Docs atualizados: roadmap (item deixou de ser parcial)
