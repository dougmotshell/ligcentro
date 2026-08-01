# TCK-0011: RLS efetiva e isolamento multi-tenant

- **status:** done
- **owner:** backend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** security
- **size:** G
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: as políticas RLS existem mas nunca são exercidas — nada no código
define `app.current_user_id` e a conexão usa o dono do schema, que bypassa RLS.
Viola a regra 6 do `AGENTS.md`.)

## Requisito refinado

- User story: como titular de uma conta, tenho certeza de que outro usuário não
  consegue ler nem escrever meus dados, com a garantia aplicada no banco e não
  apenas na aplicação.
- Fora de escopo: auditoria completa da squad de segurança (ticket próprio).

## Critérios de aceite (máx. 7, verificáveis)

- [x] 1. Toda consulta autenticada roda em transação com `app.current_user_id` definido via `set_config`, por uma role de aplicação **sem** `BYPASSRLS` e que não é dona das tabelas.
- [x] 2. `getDashboardProfile` deixa de casar perfil por `handle` sem verificar o dono.
- [x] 3. Migração consolida as políticas (owner por `app.current_user_id`, leitura pública só de `published`) e deixa de sobrescrever `auth.uid()` em banco gerenciado.
- [x] 4. Teste automatizado de acesso cruzado com dois usuários fake prova isolamento de leitura e de escrita em `profiles`, `blocks`, `page_views` e `block_clicks`.
- [x] 5. O perfil público continua sendo lido sem sessão (leitura anônima de `published`).
- [x] 6. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/04-data-model.md` · `AGENTS.md` regra 6 · Fase: 2 · Arquivos-alvo: `db/migrations/`, `lib/db/*`, `adapters/auth/*`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0011: fazer a RLS valer de fato`
- Evidência final: log entradas [3], [5] e [6]; `lib/db/rls.test.ts` 11/11
- Docs atualizados: `docs/setup/external-services.md` (ordem de migração e checklist)
