# Contexto operacional — Frontend (Next.js, perfil público SSR/SSG, temas, i18n)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está em `agents/frontend-developer.md`, nos planos de implementação e nas specs não se repete aqui. Toda entrada leva data.

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Build local do Next usa `distDir: .next-app` para evitar corrida de artefatos em ambiente compartilhado; ao tocar em Docker/TypeScript, manter `Dockerfile` e `tsconfig.json` apontando para o mesmo diretório.
- 2026-07-19 — Stack alvo (ainda não instalada): **Next.js 15 App Router + TypeScript + Tailwind**. Perfil público (`/[handle]`) é **SSR/SSG + CDN** (performance é feature: LCP mobile p75 < 1,2 s); editor/dashboard é app React autenticado. i18n pt-BR/en-US (string hardcoded é defeito); temas claro/escuro via CSS variables. Ver [`02-architecture.md`](../../../docs/implementation-plan/02-architecture.md).

- 2026-08-01 — Dependência de efeito que vem de formulário usa **`useWatch`**, nunca `watch()` (L-015): `watch` não garante nova renderização e a verificação de disponibilidade de handle ficou morta por isso. Estado derivável do valor é calculado na renderização, não espelhado com `setState` dentro do efeito.
- 2026-08-01 — O tema tem `font`, `buttonShape` e `useBrandColors`; `normalizeTheme` é o ponto único de saneamento (só aceita cor em hexadecimal) e de compatibilidade com perfis antigos. Fontes são pilhas do sistema — nenhuma webfont, por performance e privacidade.
- 2026-08-01 — Cor oficial de marca não passa AA sozinha (L-013): `components/blocks/brand-colors.test.ts` percorre o catálogo e falha abaixo de 4,5:1.

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `frontend`.
