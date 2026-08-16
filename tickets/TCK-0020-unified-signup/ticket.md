# TCK-0020: Cadastro com e-mail/senha e social na mesma tela

- **status:** done
- **owner:** frontend-developer
- **created:** 2026-08-15 · **by:** Douglas
- **type:** feature
- **size:** P
- **phase:** Fase 2 — Contas e editor (dívida de UX do MVP)

## Pedido original (verbatim)

> implemente tudo e depois quero que na mesma tela
> https://ligcentro.vercel.app/en-US/signup já tenha as opções de login com email
> e senha e google e github sem precisar navegar para outra tela

## Diagnóstico (tech-lead)

`/[locale]/signup` só oferece o formulário de e-mail + senha + handle. Os botões
de Google e GitHub existem apenas em `/[locale]/login`, então quem chega na tela
de cadastro precisa navegar para outra página para usar login social — exatamente
o atrito que o pedido aponta.

O caminho OAuth já é agnóstico de "entrar vs. cadastrar": `/api/auth/oauth/[provider]`
autoriza no Supabase e o callback chama `ensureDraftProfile`, que cria o perfil
rascunho quando ainda não existe. Ou seja, o mesmo endpoint serve para quem já tem
conta e para quem está criando a primeira — não é preciso endpoint novo.

## Requisito refinado (product-analyst)

- User story: como visitante em `/signup`, quero criar conta por e-mail/senha **ou**
  por Google/GitHub sem sair da tela, para não ter que descobrir que a opção social
  mora em outra página.
- Fora de escopo: novos provedores (Apple, X), vincular provedor a conta existente,
  redesenho da tela de login.

## Critérios de aceite (verificáveis)

- [x] 1. `/[locale]/signup` mostra, na mesma tela e sem navegação, o formulário de
      e-mail/senha/handle e os botões de Google e GitHub.
- [x] 2. Os botões apontam para `/api/auth/oauth/<provider>?locale=<locale>`,
      preservando o locale da página (pt-BR e en-US).
- [x] 3. Erros de redirecionamento OAuth (`?error=oauth_state|oauth_failed|...`)
      aparecem na própria tela de cadastro, como já acontece no login.
- [x] 4. Nenhuma string nova hardcoded: tudo em `messages/pt-BR.json` e `messages/en-US.json`.
- [x] 5. A separação visual e os rótulos são únicos por tela (cadastro fala em
      "cadastrar-se com", login fala em "continuar com") — sem reaproveitar copy errada.
- [x] 6. Teste e2e cobre a presença dos dois botões na tela de cadastro, nos dois locales.
- [x] 7. O bloco compartilhado entre login e cadastro não duplica marcação (um só componente).

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md` (Fase 2) · ADRs: —
- Arquivos-alvo: `app/[locale]/signup/SignupForm.tsx`, `app/[locale]/signup/page.tsx`,
  `app/[locale]/login/LoginForm.tsx`, `messages/*.json`, `e2e/`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0020: cadastro com e-mail/senha e social na mesma tela`
- Evidência final: `e2e/auth-screens.spec.ts` (8 testes, 2 locales) — log entrada [3]
- Docs atualizados: manual do usuário, capítulo "Criar conta" (TCK-0024)
