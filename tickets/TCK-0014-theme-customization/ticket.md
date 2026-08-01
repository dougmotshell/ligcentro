# TCK-0014: Customização de tema e catálogo de botões de marca

- **status:** done
- **owner:** frontend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: a Fase 2 pede "temas prontos + customização básica (cor de fundo,
fonte, formato de botão)" — hoje só existem 4 presets fixos e nada é editável.
A Fase 1 pede catálogo de marca com cor oficial — hoje só há ícone.)

## Requisito refinado

- User story: como criador, escolho um tema pronto e ajusto cor de fundo, fonte
  e formato de botão para a minha página parecer minha.
- Fora de escopo: marketplace de temas, CSS livre, imagem de fundo.

## Critérios de aceite (máx. 7, verificáveis)

- [x] 1. O editor permite escolher cor de fundo, cor de botão, fonte e formato de botão, com validação server-side dos valores.
- [x] 2. O perfil público aplica as quatro escolhas, com fonte carregada sem bloquear a pintura.
- [x] 3. Blocos sociais usam a cor oficial da marca quando o tema estiver em modo "marca", e o estilo do tema quando não.
- [x] 4. Temas antigos (sem os campos novos) continuam renderizando via normalização, sem migração destrutiva.
- [x] 5. Textos novos em i18n pt-BR + en-US; contraste AA verificado nos dois temas.
- [x] 6. Testes unitários cobrem a normalização e a validação do tema.
- [x] 7. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md` (Fases 1 e 2) · Arquivos-alvo: `lib/theme/presets.ts`, `lib/db/types.ts`, `components/blocks/*`, `app/[locale]/dashboard/_components/ThemeSelector.tsx`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0014: customização de tema e catálogo de cores de marca`
- Evidência final: log entradas [3], [5] e [6]
- Docs atualizados: — (roadmap em TCK-0017)
