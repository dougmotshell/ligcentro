# ADR-0002 — React com renderização no servidor (SSR) para perfis públicos

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Contêiner *Public Profile Web* (C4-C2)

## Contexto e problema

A página de perfil público (`likhub.com/<username>`) é o coração do produto: é a
URL que o criador divulga. Ela precisa de:

- **Time-to-first-byte baixo** e conteúdo visível imediatamente (o visitante veio
  de uma bio no Instagram/TikTok e desiste rápido).
- **SEO e previews sociais** perfeitos (Open Graph / Twitter Cards) — o link é
  compartilhado massivamente.
- **Interatividade** para rastrear cliques e renderizar temas dinâmicos.

## Alternativas consideradas

1. **SPA pura (CSR)** — React renderizado só no cliente. Simples de hospedar,
   mas ruim para SEO/preview e com tela em branco inicial.
2. **SSR com React** (Next.js ou renderer próprio em Lambda) — HTML pronto no
   servidor, hidratado no cliente. Ótimo para SEO e first paint.
3. **SSG (geração estática)** — pré-render de todos os perfis. Inviável: milhões
   de perfis que mudam a qualquer momento; invalidação cara.

## Decisão

Usar **React com SSR** para o perfil público, hidratando no cliente apenas o
necessário (tracking de clique, animações de tema). A camada de UI usa
**TypeScript** e **styled-components** (ver [ADR-0007](./0007-theming-styled-components.md)).
Cache de borda (CDN) na frente do HTML renderizado, com invalidação por perfil na
publicação de mudanças.

O painel autenticado do criador (editor) permanece uma **SPA** — SEO ali é
irrelevante e a riqueza de interação favorece client-side.

## Consequências

- **Positivas:** first paint rápido; SEO e previews sociais corretos; um só
  ecossistema (React) para perfil e editor.
- **Negativas / custos:** infra de SSR (renderização em Lambda/edge) mais complexa
  que servir estáticos; necessidade de estratégia de cache/invalidação.
- **Riscos e mitigação:** custo de render sob pico → cache agressivo na CDN por
  `username` + `versão do perfil`; degradação graciosa se o serviço de dados cair
  (servir última versão em cache).

## Referência ao Linktree (engenharia reversa)

Confirmado que o Linktree usa **React + TypeScript + styled-components** e serve
os perfis com HTML pré-renderizado (indexável, com `robots.txt` e sitemaps de
perfis dedicados). O site inclusive negocia conteúdo em `text/markdown` e expõe
`llms.txt`, sinalizando forte investimento em descoberta/SEO — o que reforça a
escolha por SSR em vez de SPA pura.
