# TCK-0013: Controle de publicação e QR code do perfil

- **status:** triaged
- **owner:** frontend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 1 — Perfil público / Fase 2 — Editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: só o onboarding publica o perfil — quem o abandona fica com página
invisível e sem saída; e o QR code está marcado como entregue no roadmap sem
existir no código.)

## Requisito refinado

- User story: como criador, publico e despublico minha página quando quiser e
  compartilho um QR code dela.
- Fora de escopo: personalização visual do QR code, download em SVG vetorial
  com logo.

## Critérios de aceite (máx. 7, verificáveis)

- [ ] 1. O dashboard mostra o estado de publicação e permite publicar/despublicar, com revalidação do perfil público.
- [ ] 2. Despublicar faz `/[handle]` responder 404; publicar volta a servir a página.
- [ ] 3. O dashboard exibe o QR code da URL pública e permite baixá-lo (PNG ou SVG).
- [ ] 4. O QR code é gerado sem dependência paga e sem chamar serviço externo.
- [ ] 5. Todos os textos novos passam por i18n (pt-BR + en-US); nada hardcoded.
- [ ] 6. Controles acessíveis por teclado com rótulo, nos dois temas.
- [ ] 7. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md` (Fase 1: QR code) · `06-monetization.md` (QR no plano grátis) · Arquivos-alvo: `app/[locale]/dashboard/**`, `lib/`, `messages/*.json`

## Resolução (preenchido ao fechar)

- Commits: · Evidência final: · Docs atualizados:
