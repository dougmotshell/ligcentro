# Engenharia Reversa dos Concorrentes

> Análise **em profundidade** de como cada concorrente é construído (stack,
> arquitetura, modelo de produto e monetização) e onde tem brechas. Enquanto
> [`../competitors/`](../competitors/) faz a comparação **em largura**, esta pasta
> disseca **um concorrente por documento**. É a matéria-prima do plano de superação
> em [`../../implementation-plan/07-competitive-edge.md`](../../implementation-plan/07-competitive-edge.md).

> **Método:** cada documento combina fatos públicos (headers, páginas de preço,
> vagas de engenharia, código aberto quando existe) com **inferências
> fundamentadas**, sempre sinalizadas. Afirmações sensíveis trazem fonte. Pesquisa
> de julho de 2026.

## Documentos

| Concorrente | Arquétipo | Documento |
|---|---|---|
| **Linktree** | Incumbente generalista | [`linktree/`](./linktree/) (C4 + ADRs + specs — análise mais funda, era a referência) |
| **Beacons** | Suíte de criador + IA | [`beacons.md`](./beacons.md) |
| **Bento** | Página em grade (estética) | [`bento.md`](./bento.md) |
| **Carrd** | Site-builder de 1 página | [`carrd.md`](./carrd.md) |
| **Stan Store** | Comércio de criador | [`stan-store.md`](./stan-store.md) |
| **LinkStack** | Open source / self-hosted | [`linkstack.md`](./linkstack.md) |

## Síntese — força × brecha × jogada do ligcentro

| Concorrente | Maior força | Brecha explorável | Jogada do ligcentro |
|---|---|---|---|
| **Linktree** | Onipresença, integrações, marketplace | Grátis capado: branding forçado, **12% de taxa**, analytics raso | Grátis honesto, **analytics por link no free**, 0% de taxa |
| **Beacons** | All-in-one de monetização + IA "Beam" | **SEO fraco** (SPA sem SSR), **9% de taxa**, IA racionada, sem LATAM | **SSR/SSG grátis** (SEO), taxa 0–5%, **Pix/BRL** |
| **Bento** | Estética em grade, "bonito por padrão" | **Produto morto** (comprado pelo Linktree, desligado fev/2026); grade quebra no mobile; setup lento | Grade **mobile-first**, **importador "vindo do Bento"**, export sempre |
| **Carrd** | Preço simbólico (US$9/ano), edge estático, foco | Link-in-bio improvisado; **analytics terceirizado** | Foco estreito em link-in-bio + **analytics de cliques nativo** |
| **Stan Store** | **0% de taxa** + venda direta | **Sem plano grátis** (US$29/mês), SEO fraco, complexo | **Free-first** + SEO + 0% via assinatura (sem virar LMS) |
| **LinkStack** | Dados próprios, 0% taxa, transparência (OSS) | Exige **operar servidor**; UX aquém; sem monetização/descoberta | "Sensação open source" num **SaaS gerenciado que funciona** |

## Três padrões que atravessam todos

1. **Onde há dinheiro, há pedágio** — os que monetizam venda cobram taxa (Linktree 12%, Beacons 9%). Os que ganham amor de comunidade cobram **0%** (Stan por assinatura, LinkStack por doação). → O ligcentro escolhe o lado do 0% (monetização por assinatura/feature, **nunca take-rate**).
2. **SEO é a fraqueza recorrente dos SaaS de criador** — Beacons e Stan renderizam client-side e indexam mal. → O ligcentro faz **perfil público SSR/SSG**, transformando descoberta orgânica em vantagem estrutural.
3. **Escopo estreito vence** — Carrd (1 página) e Stan (venda) provam que restrição é feature. → O ligcentro é o **melhor link-in-bio**, não um site-builder/LMS/marketplace.
