# Skill: /seo-audit

Executa uma auditoria de SEO completa sobre uma URL ou conjunto de páginas do ligcentro, gerando relatório priorizado com issues e recomendações.

## Quando usar

- Após qualquer deploy que toque o perfil público (`/[handle]`) ou a landing page.
- Antes de um lançamento ou campanha de conteúdo.
- Periodicamente (1x/mês) para monitorar regressões.
- Quando o seo-specialist for invocado para analisar uma URL.

## Passos

1. **Leia o contexto** de SEO em `agents/memory/context/marketing.md` e as referências de produto em `docs/implementation-plan/`.

2. **Auditoria técnica** (checar para cada URL informada):
   - `<title>`: presente, < 60 chars, contém keyword primária?
   - `<meta name="description">`: presente, 120–160 chars, tem CTA implícito?
   - Open Graph: `og:title`, `og:description`, `og:image`, `og:url` presentes?
   - Twitter Card: `twitter:card`, `twitter:title`, `twitter:image`?
   - Schema.org: `ProfilePage` ou `Person` no perfil público? `WebSite` na landing?
   - Canonical URL: correto e sem conflito?
   - hreflang: `pt-BR` e `en-US` configurados?
   - `robots.txt`: indexa `/[handle]`, bloqueia `/dashboard`, `/api`, `/auth`?
   - Sitemap: `/sitemap.xml` existe e lista perfis publicados?

3. **Performance (Core Web Vitals)**:
   - LCP: é < 1,2 s? (meta do produto)
   - CLS: é < 0,1?
   - Verificar: imagens com `next/image`, fontes com `display: swap`, sem JS bloqueante no perfil público.

4. **Indexabilidade**:
   - O HTML do perfil público contém o conteúdo sem necessitar de JS? (SSR/SSG)
   - Testar com `curl` ou `fetch` sem JS habilitado: o conteúdo aparece?

5. **Keywords**:
   - A landing page cobre as keywords primárias: "link na bio grátis", "criar link na bio", "alternativa linktree"?
   - Verificar densidade e naturalidade (sem keyword stuffing).

6. **Gerar relatório** com:
   - Issues P0 (quebra indexabilidade ou ranking) — corrigir imediatamente
   - Issues P1 (impacto significativo) — corrigir próximo sprint
   - Issues P2 (melhorias) — backlog
   - Oportunidades (keywords, schema, links internos)

7. **Criar tickets** para os P0 e P1 via tech-lead se código precisar mudar.

## Output esperado

```markdown
## Relatório de SEO Audit — [URL] — [data]

### P0 — Crítico (corrigir imediatamente)
- [ ] 1. [issue] · Impacto: [o que quebra]

### P1 — Alta prioridade
- [ ] 2. [issue] · Sugestão: [como corrigir]

### P2 — Melhorias
- [ ] 3. [issue] · Sugestão: [como melhorar]

### Oportunidades
- [keyword / schema / link interno]

### Core Web Vitals
- LCP: [valor] · Meta: < 1.2s · Status: ✅/❌
- CLS: [valor] · Meta: < 0.1 · Status: ✅/❌
```
