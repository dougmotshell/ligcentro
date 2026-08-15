# Log — TCK-0020: Cadastro com e-mail/senha e social na mesma tela

> Append-only.

## [1] TRIAGE — 2026-08-15 — tech-lead

- Ação: Triagem do pedido. Verifiquei que o caminho OAuth já é agnóstico de
  "entrar vs. cadastrar": `/api/auth/oauth/[provider]` autoriza no Supabase e o
  callback chama `ensureDraftProfile`, que cria o perfil rascunho quando não
  existe. Logo, não é preciso endpoint novo — é trabalho de UI mais um ajuste de
  origem para o erro voltar à tela certa.
- Decisão: tamanho P, frontend-developer. Deve ser feito **antes** do TCK-0024
  (manual do usuário), para o manual não fotografar uma tela que já mudou.
- Handoff: frontend-developer.

## [2] ACTION — 2026-08-15 — frontend-developer

- Ação: Extraí o que login e cadastro passam a compartilhar, em vez de duplicar
  marcação:
  - `components/auth/SocialAuthButtons.tsx` — botões de Google e GitHub com
    ícone, parametrizados por `from: 'login' | 'signup'`, que muda a copy e a
    tela de origem;
  - `components/auth/AuthRedirectAlert.tsx` — aviso de erro vindo por `?error=`;
  - `lib/auth/redirect-errors.ts` — lista única de códigos aceitos (o valor vem
    da URL, então só código conhecido é traduzido e exibido).
  `SignupForm` e `LoginForm` passaram a usar os dois; `signup/page.tsx` agora lê
  `searchParams.error` no servidor, como o login já fazia.
- Copy: rótulos distintos por tela — "Cadastrar-se com Google" no cadastro,
  "Continuar com Google" no login. As chaves antigas `login.orContinueWith` e
  `login.continueWith.*` saíram do i18n, substituídas pelo bloco `Auth.social`
  nos dois idiomas. Zero string hardcoded.
- Acessibilidade: o rótulo do botão passou a ser completo ("Cadastrar-se com
  Google") em vez de só "Google" — o divisor que dava o contexto é decorativo
  para leitor de tela.
- Extra necessário: `/api/auth/oauth/[provider]` passou a aceitar `?from=` e
  gravar o cookie `oauth-origin`; o callback usa isso para devolver o erro à tela
  onde o fluxo começou. Sem isso, quem tentasse Google no cadastro e falhasse
  aterrissava no login sem entender por quê.
- Motivo: Critérios 1 a 7.
- Resultado: `npm run typecheck` limpo; lint 0 erros.

## [3] ACTION — 2026-08-15 — qa-validator

- Ação: Escrevi `e2e/auth-screens.spec.ts` cobrindo os dois locales: presença dos
  três campos e dos dois botões sociais na mesma tela, `href` com locale e
  origem, ausência de navegação (a URL continua em `/signup`), exibição do erro
  de OAuth no cadastro e rejeição de `?error=` arbitrário.
- Primeira execução: **3 falhas**, todas minhas, não do produto — o seletor
  `getByRole('alert')` casava também com o `<div role="alert">` vazio que o Next
  injeta como anunciador de rota. Corrigido filtrando por texto não vazio.
- Resultado: 8/8 testes das telas de auth passando (4 por locale).
- Veredito: **aprovado**. Critérios 1 a 7 atendidos.

## [4] ACTION — 2026-08-15 — docs-writer

- Ação: A tela nova entrou no manual do usuário pelo TCK-0024 — capítulo
  "Criar conta", com as capturas mostrando e-mail/senha e social juntos.
- Resultado: critério 6 do TCK-0024 satisfeito por consequência.
