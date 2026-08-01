# TCK-0007: Integração de autenticação Supabase em produção

- **status:** done
- **owner:** backend-developer
- **created:** 2026-07-27 · **by:** Douglas
- **type:** feature
- **size:** G
- **phase:** Fase 2 — Contas e editor

## Pedido

Com Supabase, Google OAuth, GitHub OAuth e Vercel configurados, retirar o mock
do caminho de produção e documentar a configuração necessária.

## Critérios de aceite

- [ ] 1. Login e cadastro usam Supabase Auth quando as variáveis do Supabase existem.
- [ ] 2. Sessão Supabase é armazenada em cookie httpOnly e dashboard/proteção reconhecem-na.
- [ ] 3. Mock continua disponível apenas quando Supabase não está configurado.
- [ ] 4. Logout encerra e remove ambas as formas de sessão.
- [ ] 5. Variáveis e procedimento de configuração estão documentados sem segredos.
- [ ] 6. Build, lint e typecheck passam.

## Fora de escopo

Storage de avatar, testes e2e completos, auditoria de performance e manual do
usuário serão tickets posteriores; não devem bloquear esta integração.
