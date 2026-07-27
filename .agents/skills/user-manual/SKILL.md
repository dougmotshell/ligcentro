---
name: user-manual
description: Gera/atualiza o manual do usuário do ligcentro — roda o script Playwright que navega todas as telas (2 temas × 2 idiomas × mobile/desktop), tira screenshots padronizados e monta docs/user-manual/ com um capítulo por tela. Use após mudanças de UI ou antes de um release.
---

# Skill: /user-manual

Automatiza a "documentação viva" descrita em [02-architecture.md](../../../docs/implementation-plan/02-architecture.md) (seção Qualidade e entrega / Playwright). Papel executor: [docs-writer](../../../agents/docs-writer.md). O gerador é implementado quando a UI existir (previsto na Fase 4 do [roadmap](../../../docs/implementation-plan/03-mvp-roadmap.md)).

## Pré-requisitos (a partir de um checkout limpo)

```sh
npm ci
npx playwright install chromium
```

## Passos

1. Rodar `npm run manual:capture` (script `e2e/manual/capture.ts`, via tsx). O comando é autossuficiente: builda o app (`next build`), sobe `next start` numa porta dedicada, captura tudo e derruba o servidor — **não** exigir docker compose nem `npm run dev`. As telas que precisam de dados (perfil público, editor, analytics) usam um perfil semeado; o seed padrão entra no próprio script.
2. O script navega a lista canônica de telas (`e2e/manual/screens.ts`) — perfil público, editor de perfil, dashboard/analytics, telas de auth — × {light, dark} × {pt-BR, en-US} × viewports mobile (360px) e desktop (1280px), salvando em `docs/user-manual/assets/<screen>-<theme>-<locale>-<viewport>.png`. Screenshots são determinísticos: tema/idioma persistidos antes do load, `reducedMotion: 'reduce'` (zera transições CSS), fontes/imagens aguardadas — rodar duas vezes não gera diff.
3. Se uma tela nova existir no app e não estiver na lista canônica → adicionar uma entrada em `e2e/manual/screens.ts` (id, path, título, propósito, ações e seletor de prontidão — tudo declarativo, sem mudar o script) e recapturar. Tela fora da lista é defeito de cobertura.
4. Os capítulos markdown (`docs/user-manual/<nn>-<screen>.md`) e o índice (`README.md`) são **gerados pelo próprio script** a partir de `screens.ts`: o que a tela faz + o que o usuário pode fazer (pt-BR), imagem light/pt-BR/mobile como principal, demais como variantes. Revisão de texto se edita em `screens.ts` e se regenera — nunca editar os arquivos gerados à mão.
5. Verificar: o script já garante nenhuma imagem órfã e nenhum capítulo sem imagem (o diretório é recriado a cada execução e a saída é conferida); comparar screenshots com a versão anterior (`git diff --stat docs/user-manual/`) e listar no changelog o que mudou visualmente.
6. Commit `TCK-NNNN: docs regenerate user manual` (ou ticket próprio se rodada avulsa) + ACTION no log correspondente.

## Regras

- Screenshots **somente** via script — captura manual quebra a reprodutibilidade.
- O manual descreve o que o app FAZ (validado nas telas), nunca o que o roadmap promete.
- `e2e/manual/` não é suíte de teste: o Playwright a ignora (`testIgnore` em `playwright.config.ts`) e `npm run manual:capture` não roda junto de `npx playwright test`.
- Diff esperado entre releases: a versão no rodapé (fonte: `package.json`) aparece nos screenshots — mudança de versão gera diff legítimo.
