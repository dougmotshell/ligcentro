# Log — TCK-0008: OAuth Google e GitHub

> Append-only.

## [1] ACTION — 2026-07-27 — tech-lead
- Ação: Confirmado que login não oferece provedores OAuth e o adaptador só implementa senha.
- Resultado: ticket aberto para implementar Google/GitHub usando Supabase Auth e PKCE.

## [2] ACTION — 2026-07-27 — backend-developer + frontend-developer
- Ação: Implementados botões traduzidos, rotas de início/callback OAuth, PKCE/state, cookie httpOnly e perfil draft automático para usuários OAuth.
- Resultado: `npm run build`, `npm run lint`, `npm run typecheck` e `git diff --check` passaram; lint mantém apenas avisos preexistentes.

## [3] HANDOFF — 2026-07-27 — backend-developer + frontend-developer → code-reviewer
- Status novo: in_review
- Artefatos: `app/[locale]/login/LoginForm.tsx`, `app/api/auth/oauth/`, `adapters/auth/supabase.ts`, mensagens pt-BR/en-US.
- Como validar: revisar state/verifier em cookies httpOnly, allowlist de providers e que nenhum segredo server-side chega ao cliente; executar build/lint/typecheck.
- Pendências: validação ponta a ponta depende dos providers habilitados no Supabase e das redirect URLs cadastradas.
- Briefing: revisar segurança OAuth, escopo dos redirects, colisão de handle e compatibilidade com o onboarding existente.

## [4] ACTION — 2026-07-27 — code-reviewer
- Ação: Revisão independente do diff.
- Resultado: aprovado para QA; providers têm allowlist, state é comparado e verifier permanece httpOnly. Validação externa ainda pendente.

## [5] HANDOFF — 2026-07-27 — code-reviewer → qa-validator
- Status novo: in_validation
- Como validar: build, lint e typecheck; abrir `/pt-BR/login` e `/en-US/login` e confirmar os dois botões e URLs `/api/auth/oauth/google|github`.
- Critérios: [x] 1, [x] 2, [x] 3, [x] 4 em implementação; [ ] validação real com cada provider.
- Briefing: não simular sucesso OAuth sem credenciais; registrar que o callback real depende do Supabase/Vercel.
