# TCK-0009: Correções bloqueantes de autenticação e sessão

- **status:** in_review
- **owner:** backend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** bug
- **size:** G
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte deste ticket: os defeitos bloqueantes de autenticação levantados na
análise do repositório em 2026-08-01.)

## Requisito refinado

- User story: como pessoa que se cadastra no ligcentro, consigo entrar por OAuth
  ou e-mail/senha e permanecer autenticada enquanto uso o produto, sem perder a
  sessão nem cair em erro genérico.
- Fora de escopo: RLS efetiva (TCK-0011), storage de avatar (TCK-0010),
  exclusão de conta (TCK-0015).

## Critérios de aceite (máx. 7, verificáveis)

- [ ] 1. `profiles.user_id` tem constraint UNIQUE; o `ON CONFLICT (user_id)` do callback OAuth executa sem erro de Postgres (evidência: SQL no Postgres local).
- [ ] 2. A sessão Supabase é renovada por refresh token: o cookie de acesso expirado é trocado automaticamente e o usuário permanece logado.
- [ ] 3. O middleware não considera sessão válida um cookie ausente/vazio, e o dashboard redireciona para login quando a sessão não pode ser renovada.
- [ ] 4. Cadastro por e-mail com confirmação pendente reserva o handle, cria o perfil `draft` e há rota de callback que conclui a sessão ao confirmar.
- [ ] 5. Cookies de sessão usam `secure` fora de desenvolvimento; o adaptador mock é recusado quando `NODE_ENV=production` (falha explícita, sem fallback silencioso).
- [ ] 6. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/02-architecture.md` · Fase do roadmap: Fase 2 · ADRs: — · Arquivos-alvo: `adapters/auth/*`, `app/api/auth/**`, `middleware.ts`, `db/migrations/`

## Resolução (preenchido ao fechar)

- Commits: · Evidência final: · Docs atualizados:
