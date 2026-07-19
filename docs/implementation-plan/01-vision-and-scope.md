# 01 — Visão e Escopo

## Visão

> **ligcentro** dá a qualquer pessoa uma página link-in-bio rápida, bonita e
> honesta em menos de dois minutos — com o grátis que os incumbentes não entregam:
> sem branding forçado, com analytics por link e sem taxa predatória sobre o que
> você ganha.

*ligcentro* = esperanto *ligo* ("vínculo/link") + *centro* — o **centro dos seus
links**. Uma URL (`ligcentro.vercel.app/usuario`) que concentra tudo que hoje não cabe na
bio de uma rede social.

## Problema

Quem cria conteúdo, vende, ou só quer ser encontrado tem **um link** na bio e
**muitos destinos**. As ferramentas atuais resolvem isso, mas cobram o básico caro:
o grátis do líder tem analytics raso, marca embutida, domínio próprio pago e
**12% de taxa sobre vendas** (ver [panorama de
mercado](../market-research/competitors/market-overview.md)). Sobra espaço para
um produto que trate o plano grátis como produto de verdade.

## Público-alvo (personas)

| Persona | Quem é | Dor principal | O que valoriza no ligcentro |
|---|---|---|---|
| **Creator iniciante** | Começando no Instagram/TikTok, sem orçamento | Quer presença decente de graça | Grátis sem marca embutida, bonito por padrão, rápido |
| **Profissional / freela** | Designer, dev, consultor, músico | Quer um "cartão de visita" com portfólio + contato | Domínio próprio, controle de aparência, analytics honesto |
| **Pequeno negócio local** | Loja, restaurante, prestador | Quer cardápio/WhatsApp/mapa num lugar só | Blocos de contato, QR code, simplicidade |
| **Creator que monetiza** (fase futura) | Já vende algo | Não quer perder 9–12% em taxa | 0% de taxa nas faixas iniciais |

Persona primária do MVP: **creator iniciante** e **profissional/freela** —
o público que mais sofre com as limitações do grátis dos concorrentes.

## Proposta de valor (por que trocar)

1. **Grátis honesto** — sem branding forçado; **analytics por link** já no free.
2. **Rápido** — perfil público sub-segundo, mobile-first, com bom compartilhamento (Open Graph, QR).
3. **Bonito sem esforço** — temas prontos claro/escuro + customização básica.
4. **Sem pedágio** — domínio próprio sem cobrança abusiva; **0% de taxa** nas faixas iniciais de monetização.
5. **Seus dados são seus** — exportação e privacidade do visitante (LGPD).

## Escopo do MVP (v1)

O MVP entrega a **paridade mínima** do mercado + os diferenciais de grátis honesto.
Detalhe de features derivado da [análise
competitiva](../market-research/competitors/competitive-analysis.md#paridade-mínima-mesa-de-entrada--sem-isso-não-competimos).

**Dentro do MVP:**
- Cadastro/login (e-mail + OAuth social) e claim de handle (`/usuario`).
- Editor de perfil: avatar, título, bio, links ilimitados com reordenação drag-and-drop.
- Blocos além do link simples: ícones sociais, embed de vídeo (YouTube), botão de contato (WhatsApp/e-mail).
- Catálogo de botões de marca (inspirado no LittleLink) com ícone/cor oficiais.
- Temas prontos (claro/escuro) + customização básica (cor de fundo, fonte, formato de botão).
- Página pública SSR/SSG rápida, com Open Graph e QR code.
- **Analytics por link e por página** (visitas, cliques, CTR) — no grátis.
- Agendamento de links (mostrar/esconder por data).
- Exportação de dados do perfil (JSON).

**Fora do MVP (fases futuras):**
- Monetização/pagamentos e produtos digitais (fase 2 — ver [monetização](./06-monetization.md)).
- Domínio próprio personalizado (fase 2).
- Media kit, marketplace, afiliados (território Beacons — reavaliar depois).
- Cursos/memberships (território Stan Store — provavelmente nunca).
- Site-builder livre estilo Carrd (fora da tese; ligcentro é link-in-bio, não page-builder).
- App mobile nativo (a PWA cobre o MVP).

## Métricas de sucesso

| Objetivo | Métrica | Alvo inicial |
|---|---|---|
| Ativação | % de cadastros que publicam um perfil com ≥3 links | > 60% |
| Time-to-value | Tempo do cadastro ao perfil publicado | < 2 min |
| Performance | LCP do perfil público (mobile, p75) | < 1,2 s |
| Retenção | % de perfis ainda editados após 30 dias | > 30% |
| Custo | Custo de infra por perfil ativo/mês | ~ R$ 0 (free tier) |

## Restrições e premissas

- **Custo zero/baixo:** o MVP roda em free tier (ver [arquitetura](./02-architecture.md)); nenhuma dependência paga é requisito de v1.
- **LGPD desde o dia 1:** analytics do visitante é agregado e sem PII de terceiros (ver [analytics e privacidade](./05-analytics-privacy.md)).
- **Idioma:** conteúdo/UI em pt-BR e en-US (i18n); identificadores de código em en-US.
- **Um builder, escopo estreito:** melhor fazer link-in-bio excepcionalmente bem do que fazer tudo mediano.

## Próximo documento

→ [02 — Arquitetura](./02-architecture.md)
