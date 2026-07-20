# TCK-0003: Fase 2a — Auth, contas e RLS

- **status:** pending
- **owner:** backend-developer
- **depends-on:** TCK-0002
- **created:** 2026-07-19 · **by:** Douglas
- **type:** feature
- **size:** G
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como criador, quero me cadastrar com e-mail/senha ou OAuth (Google/GitHub), reivindicar um handle único e ter meus dados isolados dos outros usuários via RLS.
- Fora de escopo: editor de blocos (TCK-0004), analytics (TCK-0005).

## Critérios de aceite

- [ ] 1. Supabase Auth configurado: cadastro/login e-mail+senha + OAuth Google + OAuth GitHub.
- [ ] 2. Migração adiciona coluna `user_id` (FK para auth.users) em `profiles`; RLS atualizada: escrita apenas para `auth.uid() = user_id`.
- [ ] 3. Fluxo de claim de handle: ao cadastrar, usuário escolhe handle único (`[a-z0-9_-]`, 3–30 chars); handles reservados (admin, api, login, etc.) são rejeitados.
- [ ] 4. Página de cadastro `/[locale]/signup` e login `/[locale]/login` funcionando (formulários validados).
- [ ] 5. Rota protegida `/[locale]/dashboard` redireciona para login se não autenticado.
- [ ] 6. Teste de acesso cruzado: usuário A não consegue ler nem escrever dados de usuário B (verificado via SQL direto no compose).
- [ ] 7. `npm run build`, `npm run lint`, `npm run typecheck` passam; `docker compose up` + fluxo de cadastro funciona localmente.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md#fase-2`
- Modelo de dados: `docs/implementation-plan/04-data-model.md`
- Arquitetura: `docs/implementation-plan/02-architecture.md` (Supabase Auth isolado em `adapters/`)
- Arquivos-alvo: `app/[locale]/signup/`, `app/[locale]/login/`, `app/[locale]/dashboard/`, `lib/auth/`, `adapters/supabase/`, `db/migrations/`

## Resolução (preenchido ao fechar)

- Commits: ·
- Evidência final: ·
- Docs atualizados: ·
