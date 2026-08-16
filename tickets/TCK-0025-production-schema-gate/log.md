# Log — TCK-0025: Banco de produção sem schema derruba todo login

> Append-only.

## [1] ACTION — 2026-08-15 — tech-lead (diagnóstico)

- Ação: Investigação do `?error=oauth_failed` relatado em produção. Descartei o
  OAuth por evidência, não por intuição:
  - `GET /auth/v1/settings` no projeto Supabase: `google: true`, `github: true`,
    `disable_signup: false` — provedores habilitados.
  - Simulei `/auth/v1/authorize` com o mesmo `redirect_to` e `code_challenge` que
    a rota monta: o GoTrue respondeu `302` para `accounts.google.com` com
    `redirect_uri` do projeto — o fluxo PKCE é aceito e o `redirect_to` com query
    string passa na allowlist.
  - Pelo log da Vercel, o callback recebeu `?code=` (senão o código de erro seria
    `oauth_state`, não `oauth_failed`), logo a falha é **depois** da troca.
- Resultado: Consultei o banco de produção (somente leitura de metadados):
  `information_schema.tables` não tinha **nenhuma** tabela em `public`;
  `schema_migrations` inexistente; role `ligcentro_app` ausente. As 9 migrações
  estavam todas PENDENTE segundo `npm run db:migrate -- --status`.
- Conclusão: o login inteiro estava quebrado (OAuth **e** e-mail/senha — ambos
  passam por `toSession`, que lê `profiles`). O `/en-US/demo` respondendo 200 é
  SSG do build, não prova de banco vivo.
- Handoff: devops-engineer, com autorização explícita do Douglas para escrever em
  produção (schema vazio ⇒ criação de tabelas, sem risco a dados).

## [2] ACTION — 2026-08-15 — devops-engineer

- Ação: (a) Apliquei as 9 migrações em produção com `npm run db:migrate`.
  (b) Criei `scripts/migrate-on-build.mjs` e o script `vercel-build` no
  `package.json`, que aplica migrações pendentes **apenas** no build de produção
  da Vercel e falha o build se a migração não puder ser aplicada. Fora da Vercel
  e em preview o script pula de propósito: preview compartilha o banco com
  produção, e migrar num preview seria migrar produção sem revisão.
  (c) Reescrevi o callback OAuth: `catch {}` mudo virou log com a causa real
  (`console.error` com a mensagem, sem `code`/verifier/tokens) e códigos de erro
  distintos — `oauth_failed` para falha de troca, `oauth_profile_failed` para
  falha de provisionamento.
  (d) A rota `/api/auth/oauth/[provider]` passou a gravar `oauth-origin`, para o
  erro voltar à tela onde o fluxo começou.
- Motivo: Critérios 1 a 6.
- Resultado (verificado após aplicar):
  - `schema_migrations`: 0000→0008, todas `aplicada`.
  - Tabelas em `public`: `block_clicks, blocks, page_views, profiles, schema_migrations`.
  - `rowsecurity = true` nas quatro tabelas de produto.
  - Role `ligcentro_app`: presente. Índice `profiles_user_id_key` (único) presente
    — é dele que depende o `ON CONFLICT (user_id)` do provisionamento.
  - Perfil semeado: `demo` (`published`).
- Lição: L-017 (registrada) — "schema aplicado" nunca foi verificado porque nada
  no pipeline o aplicava; o sintoma apareceu a três camadas de distância da causa.

## [3] ACTION — 2026-08-15 — qa-validator

- Ação: Validação dos critérios 1 a 6 (o 7 depende de deploy e é do Douglas).
- Resultado: registrado na entrada [2] e na suíte — `e2e/auth-screens.spec.ts`
  cobre a distinção dos códigos de erro e a rejeição de `?error=` arbitrário.
- Veredito: **aprovado com pendência de confirmação em produção** (critério 7).

## [4] ACTION — 2026-08-15 — security-researcher (achado subsequente)

- Ação: Verifiquei a superfície pública depois de aplicar o schema, para
  confirmar o critério 7 na parte que não depende de deploy.
- **Correção de uma conclusão minha**: cheguei a tratar
  `check-handle?handle=demo → 200` como prova de que produção voltara a ler o
  banco. Está errado — `demo` é **handle reservado** e a rota retorna antes de
  consultar. Qualquer handle livre (`teste123`, `outro-handle-livre`) devolve
  **500**.
- Resultado: a produção **ainda não fala com o banco**, por um motivo diferente e
  independente do schema: `DATABASE_URL` não está definida no projeto da Vercel.
  Verificação decisiva — durante uma rajada de requisições à produção,
  `pg_stat_activity` no Supabase não registrou nenhuma conexão vinda da Vercel.
- Consequência para o critério 7: aplicar as migrações era necessário, mas não
  suficiente. O login com Google só conclui depois que a variável for definida.
  Passos em `docs/runbook.md`.
- Nota: o portão criado neste ticket já cobre essa classe de falha — o build de
  produção passa a falhar quando `DATABASE_URL` não existe, em vez de publicar.

## [5] ACTION — 2026-08-16 — devops-engineer (portão inerte)

- Ação: Após o merge do PR #2 (`b2f3d8a`), acompanhei o deploy de produção para
  confirmar o critério 7. O deploy ficou `Ready` em 33s, mas
  `check-handle?handle=verificacaomerge0816` continuou respondendo **500** em 20
  tentativas ao longo de ~7 minutos.
- Resultado: o log de build da Vercel não tem **nenhuma** linha
  `[migrate-on-build]`. O que rodou foi `Running "npm run build"` → `next build`.
  Causa: `vercel.json` fixa `"buildCommand": "npm run build"` desde o TCK-0007, e
  um `buildCommand` explícito tem precedência sobre o script `vercel-build` do
  `package.json`. **O portão criado neste ticket nunca executou em deploy algum** —
  a nota final da entrada [4] ("o portão já cobre essa classe de falha") estava
  errada, e este é o registro da correção.
- Correção: `vercel.json` passa a apontar para `npm run vercel-build`.
- Segundo fato, independente: `DATABASE_URL` existe no projeto desde 20 dias atrás
  (`vercel env ls production`) — não estava ausente como a entrada [4] concluiu; o
  Douglas **atualizou o valor** em 2026-08-16, depois do build das 17:40:22Z. Um
  deploy só enxerga o valor vigente no momento em que é criado, então o deploy do
  merge subiu com o valor antigo. O deploy desta correção é o primeiro a rodar com
  o valor novo **e** com o portão ativo.
- Consequência esperada: se a string de conexão estiver correta, o build aplica as
  migrações pendentes (ou confirma que não há) e publica; se estiver errada, o
  build **falha** em vez de publicar — que é exatamente o comportamento pedido
  pelo critério 3, agora exercitado de verdade.
- Lição: L-021 (registrada).

## [6] ACTION — 2026-08-16 — devops-engineer (causa raiz real)

- Ação: Com o portão corrigido (entrada [5]) e mergeado, o deploy de produção do
  commit `a62b1c7` falhou em **4 segundos** — pela primeira vez com log útil.
- Resultado:

  ```
  [migrate-on-build] aplicando migrações pendentes em produção...
  Falha na migração: connect ENETUNREACH 2600:1f1e:90b:a702:...:5432
  ```

  `DATABASE_URL` aponta para a **conexão direta** do Supabase
  (`db.<ref>.supabase.co:5432`), que resolve **apenas em IPv6**; a Vercel não tem
  saída IPv6. `ENETUNREACH` é ausência de rota — o pacote morre no kernel, nunca
  chega à rede.
- Isto corrige o diagnóstico da entrada [4]: a variável **não estava ausente**
  (`vercel env ls production` mostra criação há 20 dias). Estava apontando para um
  endereço que a Vercel não alcança. O `pg_stat_activity` vazio, usado lá como
  prova de "variável ausente", é igualmente compatível com "endereço sem rota" —
  as duas hipóteses produzem o mesmo silêncio dos dois lados.
- Correção pendente (ação no painel, do Douglas): trocar o valor para a string do
  pooler (Supavisor, Transaction mode, IPv4), lembrando que o usuário passa de
  `postgres` para `postgres.<ref>`. Passos e armadilhas em `docs/runbook.md` §1.
- Observação sobre o próprio portão: ele funcionou como projetado — o build falhou
  **em vez de publicar**, e o deploy anterior seguiu no ar. Critério 3 exercitado
  de verdade; critério 4 confirmado no preview do PR #3
  (`[migrate-on-build] pulado: VERCEL_ENV=preview`).
- Lição: L-022 (registrada).
