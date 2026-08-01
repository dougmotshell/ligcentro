# TCK-0008: OAuth Google e GitHub

- **status:** done
- **owner:** backend-developer + frontend-developer
- **created:** 2026-07-27 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 2 — Contas e editor

## Critérios de aceite

- [ ] 1. Login exibe botões Google e GitHub em pt-BR/en-US.
- [ ] 2. Botões iniciam OAuth Supabase com PKCE e state.
- [ ] 3. Callback valida state, troca code por sessão e grava cookie httpOnly.
- [ ] 4. Usuário OAuth sem perfil recebe perfil draft e segue para onboarding.
- [ ] 5. Build, lint e typecheck passam.
