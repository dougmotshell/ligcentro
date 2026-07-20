# Mensagens-chave — ligcentro

> As afirmações centrais do ligcentro que toda comunicação reforça. Cada mensagem tem: a afirmação, o suporte (por que podemos dizer isso), e como usar por canal. Use este documento como base de briefing para qualquer peça de comunicação.

---

## M1 — Grátis de verdade (sem pegadinha)

**Afirmação:** O plano grátis do ligcentro é um produto completo — não uma isca para você pagar.

**Suporte:**
- Links ilimitados (o Linktree free não tem limite, mas analytics é raso)
- Analytics por link no grátis (o Linktree free não tem — ver `docs/market-research/competitors/competitive-analysis.md`)
- Sem branding forçado (o Linktree exige marca até no Starter US$8/mês)
- 0% de taxa sobre vendas (o Linktree cobra 12% no free)

**Por canal:**
- Landing page hero: "Grátis de verdade. Sem pegadinha."
- E-mail onboarding: "Você acabou de criar sua conta. Tudo que você precisa está no plano grátis."
- Contra-argumento em comparativos: tabela mostrando o que o free inclui vs. concorrentes

---

## M2 — Analytics por link, de graça

**Afirmação:** Você sabe quais links seu público clica — sem pagar nada.

**Suporte:**
- `page_views` e `block_clicks` agregados por dia, sem PII (LGPD)
- No Linktree free, analytics é só visitas totais — sem saber qual link foi clicado
- O ligcentro mostra CTR por link desde o grátis

**Por canal:**
- Feature highlight na landing page
- Tutorial de conteúdo: "Como saber quais links seus seguidores clicam"
- Onboarding: após primeira visita no perfil, mostrar dado de analytics

---

## M3 — 0% de taxa

**Afirmação:** Quando você vender pelo ligcentro, fica com o que é seu. Zero por cento de taxa da nossa parte.

**Suporte:**
- Linktree cobra 12% no free, 9% nos planos pagos até US$35/mês
- Beacons cobra 9% no free
- Stan Store é 0% mas custa US$29/mês mínimo
- ligcentro: 0% desde o plano grátis (ver `docs/implementation-plan/06-monetization.md`)

**Nota:** Esta mensagem é mais relevante quando a feature de monetização estiver na Fase 4+. Mas a promessa pode ser comunicada antes como posicionamento.

**Por canal:**
- Comparativo com Linktree: tabela de taxas
- Creator que monetiza: destaque em copy de conversão

---

## M4 — Seus dados são seus

**Afirmação:** Você pode exportar seus dados, mudar de ferramenta e nenhum shutdown vai apagar seus links.

**Suporte:**
- Exportação JSON do perfil completo (Fase 3 do MVP)
- Referência ao shutdown do Bento (fev/2026, dados apagados) — `docs/implementation-plan/07-competitive-edge.md`
- Portabilidade como princípio de arquitetura (`docs/implementation-plan/02-architecture.md`)
- Privacidade do visitante: sem cookie de rastreamento, sem PII de visitante (LGPD)

**Por canal:**
- Creator experiente que já migrou de ferramenta: argumento de confiança
- Comparativo com Linktree e Bento: "Lembra o Bento? Eles apagaram tudo. Aqui você exporta quando quiser."
- Privacy-conscious user: política de privacidade em linguagem humana

---

## M5 — Feito para o Brasil (LATAM-first)

**Afirmação:** O ligcentro é feito para o criador brasileiro, em português, com pagamentos em Reais.

**Suporte:**
- Interface em pt-BR (não tradução de inglês — escrito em português nativo)
- Pix como método de pagamento (fase futura, mas posicionamento agora)
- Suporte e conteúdo em pt-BR
- Servidores em São Paulo (Supabase region: sa-east-1)

**Por canal:**
- Diferenciação vs. Linktree/Beacons (feitos para mercado americano)
- Comunidade: "A ferramenta que entende o creator do Brasil"

---

## M6 — Rápido como deve ser

**Afirmação:** Seu perfil carrega em menos de 1 segundo. No celular. Sempre.

**Suporte:**
- LCP mobile p75 < 1,2 s (meta técnica do produto)
- SSR/SSG + CDN (Vercel Edge) — HTML renderizado antes do JS
- Sem frameworks pesados no perfil público
- Contraposição: Beacons e Stan renderizam no cliente → lento, sem SEO

**Por canal:**
- Feature de performance na landing page (demonstrar com número real após launch)
- SEO: argumento de Core Web Vitals
- Creator preocupado com UX do seguidor: "Ninguém vai esperar 5s para ver seus links."

---

## Hierarquia de mensagens por persona

| Persona | M1 (grátis) | M2 (analytics) | M3 (0% taxa) | M4 (dados) | M5 (Brasil) | M6 (rápido) |
|---|---|---|---|---|---|---|
| Camila (creator iniciante) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐ | ⭐ | ⭐⭐ | ⭐⭐ |
| Rafael (profissional) | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Dona Márcia (negócio local) | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐ |
| Thiago (monetiza) | ⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐ |

⭐⭐⭐ = mensagem primária · ⭐⭐ = relevante · ⭐ = secundária
