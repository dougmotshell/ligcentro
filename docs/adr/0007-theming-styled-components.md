# ADR-0007 — Theming com styled-components e design tokens

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Contêiner *Public Profile Web* e *Editor* (C4-C2)

## Contexto e problema

Personalização visual é uma feature central do produto: cada criador escolhe
tema, cores, fontes, formato de botão e fundo. O tema precisa ser:

- aplicado tanto no **SSR** (perfil já vem estilizado) quanto no **editor** (preview
  ao vivo);
- **dinâmico por perfil** (valores vindos do banco, não classes estáticas);
- consistente com um design system reutilizável.

## Alternativas consideradas

1. **CSS/Sass estático + classes utilitárias** — performático, mas temas dinâmicos
   por usuário viram um mar de overrides e variáveis geradas.
2. **CSS Modules** — bom isolamento, mas theming dinâmico em runtime é desajeitado.
3. **CSS-in-JS (styled-components)** — tema como objeto injetado via `ThemeProvider`;
   estilos dinâmicos derivados de props; funciona em SSR com extração de estilos
   críticos.

## Decisão

Usar **styled-components** com um `ThemeProvider` alimentado por **design tokens**
(cores, tipografia, espaçamento, raio de borda). O tema do criador é um objeto de
tokens persistido no PostgreSQL e resolvido via GraphQL; o mesmo objeto alimenta o
SSR do perfil e o preview do editor. Componentes de UI documentados em **Storybook**.

## Consequências

- **Positivas:** temas dinâmicos por perfil sem CSS gerado manualmente; um design
  system único; preview do editor idêntico ao SSR (mesma engine de tema).
- **Negativas / custos:** custo de runtime do CSS-in-JS; necessidade de extração de
  estilos críticos no SSR para não perder desempenho.
- **Riscos e mitigação:** overhead em páginas de alto tráfego → extrair CSS crítico
  no SSR e minimizar hidratação; avaliar migração para zero-runtime CSS-in-JS caso
  o custo de runtime pese.

## Referência ao Linktree (engenharia reversa)

Confirmados **styled-components** e **Storybook** na stack do Linktree, coerentes
com um catálogo de temas altamente personalizável servido via SSR.
