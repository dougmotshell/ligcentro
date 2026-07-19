# Alternativas open source / self-hosted

> O nicho open source do mercado link-in-bio. Importante para o ligcentro por dois
> motivos: (1) define a **fronteira de expectativa** de quem valoriza privacidade e
> dados próprios; (2) há projetos maduros dos quais dá para **aprender ou reusar**
> (padrões de tema, catálogo de botões de marca, modelo de dados) em vez de
> reinventar. Levantamento de julho de 2026.

## Principais projetos

### LinkStack — a referência open source
Alternativa self-hosted mais bem avaliada ao Linktree. Plataforma de
compartilhamento de links altamente customizável, com UI intuitiva. Hospedável em
instâncias grátis, instâncias premium gerenciadas ou **self-hosted via web server /
Docker**. Suporta multiusuário (cada um cria seu perfil), rastreamento de
comportamento em tempo real e foco em privacidade. Baseado em PHP/Laravel.
- Site: [linkstack.org](https://linkstack.org/) · [openalternative.co/linkstack](https://openalternative.co/linkstack)

### LittleLink — minimalismo sem framework
Alternativa DIY open source com **100+ botões de marca** prontos, múltiplos temas e
performance otimizada — **sem frameworks e sem JavaScript**. É essencialmente
HTML/CSS. Excelente referência para o **catálogo de ícones/botões de redes** e para
o argumento de página ultraleve.

### Kytelink — simples e self-hostable
Alternativa simples, grátis e open source para criar landing pages personalizadas
com links clicáveis; self-hostável para controle total dos dados.

### BioLinks (plugin WordPress)
Plugin grátis e open source que cria uma página link-in-bio self-hosted dentro do
WordPress: 5 templates visuais, rastreamento de cliques e detecção automática de
Google Analytics. Relevante para o público que já vive no WordPress.

### Outros citados
- **Pinkary**, **Skarf** — alternativas open source emergentes citadas em
  agregadores.

> Fontes: [openalternative.co/alternatives/linktree](https://openalternative.co/alternatives/linktree) ·
> [medevel.com — 16 Free Self-hosted Link-in-bio Apps](https://medevel.com/linktree-alternatives/) ·
> [AlternativeTo — Open Source Linktree Alternatives](https://alternativeto.net/software/linktree/?license=opensource) ·
> [Symfolidity — BioLinks WordPress](https://symfolidity.com/en/articles/biolinks-wordpress-link-in-bio-plugin/).

## Self-hosted vs. gerenciado — o trade-off

| Dimensão | Self-hosted (LinkStack et al.) | Gerenciado (Linktree, Beacons…) |
|---|---|---|
| Controle de dados | Total | Do provedor |
| Custo | Só infra (pode ser ~zero) | Assinatura + taxas |
| Esforço de operação | Você mantém (updates, backup, uptime) | Zero |
| Escala / performance global | Sua responsabilidade | Resolvida pelo provedor (CDN, SSR) |
| Taxa sobre vendas | 0% | 9–12% no grátis |

> Fonte: [Linkero — Self-Hosted Link-in-bio: Is It Worth It in 2026?](https://linke.ro/blog/self-hosted-link-in-bio-vs-managed)

## O que o ligcentro aproveita

O ligcentro é um **produto gerenciado (SaaS) de baixo custo**, não um projeto
self-hosted — mas absorve a **cultura** do open source como diferencial contra os
incumbentes:

1. **Catálogo de botões de marca** — a abordagem do LittleLink (100+ marcas com
   ícone/cor oficiais) vira referência direta do nosso design system de blocos.
2. **Página ultraleve** — o argumento "sem JS pesado" do LittleLink reforça a meta
   de perfil público com SSR/SSG e payload mínimo (ver
   [arquitetura](../../implementation-plan/02-architecture.md)).
3. **Exportação de dados e portabilidade** — postura de "seus dados são seus",
   raramente oferecida pelos incumbentes, entra como feature de confiança.
4. **0% de taxa nas faixas iniciais** — o padrão do mundo self-hosted (sem
   intermediário cobrando venda) vira nosso diferencial comercial.
5. **Multiusuário com privacidade** — modelo de perfil por usuário + analytics que
   respeita o visitante (sem revender dados).

> Decisão registrada: o ligcentro **não** será apenas mais um clone self-hosted; a
> aposta é entregar a *sensação* open source (controle, transparência, 0% de taxa)
> em um produto gerenciado que "simplesmente funciona". Ver
> [visão e escopo](../../implementation-plan/01-vision-and-scope.md).

## Fontes

- [LinkStack](https://linkstack.org/)
- [openalternative.co — 3 Best Open Source LinkTree Alternatives 2026](https://openalternative.co/alternatives/linktree)
- [medevel.com — 16 Free Self-hosted Link-in-bio Apps](https://medevel.com/linktree-alternatives/)
- [medevel.com — 13 Free, Open-source Alternatives to Linktree](https://medevel.com/linktree-open-source-alternatives-1273/)
- [AlternativeTo — Open Source Linktree Alternatives](https://alternativeto.net/software/linktree/?license=opensource)
- [Linkero — Self-Hosted Link-in-bio: Is It Worth It in 2026?](https://linke.ro/blog/self-hosted-link-in-bio-vs-managed)
