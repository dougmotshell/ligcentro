# TCK-0002: Fase 1 — Perfil público (leitura)

- **status:** done
- **owner:** frontend-developer + backend-developer
- **created:** 2026-07-19 · **by:** Douglas
- **type:** feature
- **size:** G
- **phase:** Fase 1 — Perfil público (leitura)

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como visitante, quero acessar `/<handle>` e ver o perfil link-in-bio de um criador de forma rápida, bonita e compartilhável — mesmo antes do editor existir.
- Fora de escopo: auth, editor, analytics de clique real (apenas estrutura de dados).

## Critérios de aceite

- [ ] 1. Migração SQL cria tabelas `profiles` e `blocks` com RLS ligada (política: leitura pública só de `published`; escrita só do dono).
- [ ] 2. Seed popula um perfil de exemplo (`/demo`) com ≥3 blocos (link, social, contact).
- [ ] 3. Página `/[locale]/[handle]` renderiza SSG + revalidação; `curl /<handle>` retorna 200.
- [ ] 4. Blocos renderizados: `link` (botão com URL), `social` (ícone de marca + link), `contact` (WhatsApp/e-mail).
- [ ] 5. Open Graph correto: `<title>`, `og:title`, `og:description`, `og:image` (avatar).
- [ ] 6. Página 404 customizada para handle inexistente.
- [ ] 7. `npm run build` e `npm run lint` passam; `docker compose up` + `curl /demo` retorna 200 com conteúdo do perfil seed.

## Referências

- Plano: `docs/implementation-plan/04-data-model.md` · `docs/implementation-plan/03-mvp-roadmap.md#fase-1`
- Modelo de dados: tabelas `profiles`, `blocks` (ver doc 04)
- Arquivos-alvo: `app/[locale]/[handle]/`, `db/migrations/`, `db/seeds/`, `components/blocks/`

## Resolução (preenchido ao fechar)

- Commits: 5ea6511, 0a9b8a6, 7f329fa (fundação Fase 0 + Fase 1)
- Evidência final: `curl http://localhost:3002/pt-BR/demo` → 200, título "Usuário Demo"; `curl /pt-BR/inexistente` → 404; `npm run build` ✓; `npm run lint` ✓; `npm run typecheck` ✓; `docker compose up` ✓
- Docs atualizados: —
