# ADR-0008 — Marketing desacoplado com CMS (Contentful/Webflow)

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Sites de marketing / conteúdo (fora do produto core)

## Contexto e problema

O produto (perfis + editor) e o site institucional (landing pages, pricing, blog,
glossário, help center) têm ciclos de vida e donos diferentes. Time de marketing
precisa publicar e iterar páginas **sem depender de deploy de engenharia**.

## Alternativas consideradas

1. **Tudo no mesmo app** — marketing dentro do produto. Simples no início, mas
   acopla o time de conteúdo ao ciclo de release de engenharia.
2. **CMS headless + geração estática (Contentful + Gatsby)** — conteúdo editado no
   CMS, build estático, publicação independente.
3. **No-code (Webflow)** para páginas de campanha — autonomia total do marketing
   para landing pages, sem código.

## Decisão

**Desacoplar o marketing do produto.** Conteúdo editorial (blog, glossário, docs)
gerido em **Contentful** (headless) e publicado como site estático (**Gatsby**).
Landing pages de campanha em **Webflow**. Sitemaps segmentados por tipo de página
(perfis, marketing, marketplace, Webflow) sob um `robots.txt` comum.

O produto core (perfil SSR + editor SPA + API) permanece um domínio de engenharia
separado, com seu próprio pipeline de deploy.

## Consequências

- **Positivas:** marketing publica sem engenharia; produto e conteúdo evoluem em
  ritmos próprios; sites estáticos são baratos e rápidos.
- **Negativas / custos:** múltiplas ferramentas e domínios de conteúdo; SEO e
  navegação precisam de coordenação entre superfícies distintas.
- **Riscos e mitigação:** inconsistência de marca entre superfícies → design
  tokens compartilhados; sitemaps e `robots.txt` centralizando a descoberta.

## Referência ao Linktree (engenharia reversa)

Confirmados **Contentful**, **Gatsby** e **Webflow** na stack do Linktree. O
`llms.txt` e os múltiplos sitemaps (perfis, marketing, marketplace, Webflow)
observados evidenciam exatamente essa separação entre produto e conteúdo.
