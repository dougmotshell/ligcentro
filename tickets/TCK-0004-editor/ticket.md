# TCK-0004: Fase 2b — Editor de perfil e blocos

- **status:** pending
- **owner:** frontend-developer + backend-developer
- **depends-on:** TCK-0003
- **created:** 2026-07-19 · **by:** Douglas
- **type:** feature
- **size:** G
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como criador autenticado, quero editar meu avatar, título, bio, adicionar/reordenar/remover blocos (links, redes sociais, contatos), escolher tema e agendar links — e ao salvar, meu perfil público é atualizado.
- Fora de escopo: analytics (TCK-0005), onboarding guiado (TCK-0006).

## Critérios de aceite

- [ ] 1. Dashboard `/[locale]/dashboard` exibe perfil atual do usuário autenticado.
- [ ] 2. Formulário de edição: avatar (upload para Supabase Storage), display_name, bio.
- [ ] 3. CRUD de blocos: criar, editar, remover blocos do tipo `link`, `social`, `contact`.
- [ ] 4. Reordenação drag-and-drop dos blocos (atualiza `position` no banco).
- [ ] 5. Seletor de tema: ao menos 2 temas prontos (claro/escuro) + customização de cor de fundo.
- [ ] 6. Agendamento de link: campos `visible_from` / `visible_until` por bloco.
- [ ] 7. Ao salvar, perfil público `/[handle]` reflete as mudanças (revalidação ISR).
- [ ] 8. `npm run build`, `npm run lint`, `npm run typecheck` passam; e2e Playwright cobre o fluxo: login → editar → verificar perfil público.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md#fase-2`
- Modelo de dados: `docs/implementation-plan/04-data-model.md`
- Arquivos-alvo: `app/[locale]/dashboard/`, `components/editor/`, `app/api/profile/`, `app/api/blocks/`

## Resolução (preenchido ao fechar)

- Commits: ·
- Evidência final: ·
- Docs atualizados: ·
