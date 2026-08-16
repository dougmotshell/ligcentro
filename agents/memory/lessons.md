# Lições aprendidas (append-only)

> Registro permanente do que os agentes aprenderam — **erros** (para o mesmo erro nunca acontecer duas vezes) e **acertos** (para o que funcionou ser reaproveitado, não redescoberto). Formato e gatilhos na seção ["Memória persistente"](../handoff-protocol.md#memória-persistente-lições-e-contexto) do protocolo. **Append-only**: lição superada = nova lição referenciando a antiga, nunca edição.

<!-- Formato — lição de ERRO:
## [L-NNN] AAAA-MM-DD — <área> — <título curto> — erro
- Contexto: <o que se tentava fazer; ticket TCK-NNNN>
- Erro: <o que deu errado, sintoma observável>
- Causa raiz: <o porquê de verdade, não o sintoma>
- Como evitar: <regra prática e verificável para o próximo agente>
- Refs: <arquivos, commits, entradas de log>

Formato — lição de ACERTO:
## [L-NNN] AAAA-MM-DD — <área> — <título curto> — acerto
- Contexto: <o que se tentava fazer; ticket TCK-NNNN>
- O que funcionou: <a abordagem/decisão, observável no resultado>
- Por que funcionou: <o mecanismo, não a sorte>
- Como reaproveitar: <quando e como o próximo agente aplica isso>
- Refs: <arquivos, commits, entradas de log>

Lições L-001 a L-004 antecedem o campo de tipo — todas são do tipo "erro".
-->

## [L-001] 2026-07-19 — qa — Typecheck depende de .next/types gerado
- Contexto: validação do TCK-0003 com `npm run typecheck` antes do build.
- Erro: o TypeScript falhou com `TS6053` porque `.next/types/cache-life.d.ts` ainda não existia.
- Causa raiz: o `tsconfig.json` inclui `.next/types/**/*.ts`, então um build do Next precisa existir antes do typecheck em checkout limpo.
- Como evitar: em validações locais do ligcentro, rode `npm run build` antes de `npm run typecheck` (ou mantenha `.next` válido) sempre que o workspace estiver limpo.
- Refs: `tsconfig.json`, `tickets/TCK-0003-auth-rls/log.md`.

## [L-002] 2026-07-19 — backend — Postgres local não aceita SSL forçado no runtime
- Contexto: validação docker do TCK-0004 com o app Next em `NODE_ENV=production` apontando para o Postgres do compose.
- Erro: rotas autenticadas retornaram 500 com `ECONNRESET` ao abrir conexão com o banco.
- Causa raiz: `lib/db/client.ts` habilitava `ssl: "require"` só por estar em produção, mas o Postgres local do compose não expõe TLS.
- Como evitar: habilitar SSL apenas quando o `DATABASE_URL` ou uma env explícita indicar um banco gerenciado (ex.: Supabase), mantendo `ssl: false` no compose local.
- Refs: `lib/db/client.ts`, `tickets/TCK-0004-editor/log.md`.

## [L-003] 2026-07-20 — qa — Limpar `.next` evita falha intermitente do standalone
- Contexto: validação do TCK-0006 após vários builds sequenciais com `output: standalone`.
- Erro: o build falhou com `ENOENT` ao copiar `prerender-manifest.json` para a pasta standalone.
- Causa raiz: artefatos antigos em `.next` deixaram o estado do diretório inconsistente para um novo build standalone.
- Como evitar: antes do build final do ligcentro, rode `rm -rf .next` quando houver qualquer falha estranha relacionada a manifestos/standalone.
- Refs: `next.config.ts`, `tickets/TCK-0006-polish-launch/log.md`.

## [L-004] 2026-07-19 — frontend — isolar artefatos do Next em ambiente compartilhado
- Contexto: build standalone do Next para o TCK-0002 em ambiente local compartilhado.
- Erro: `npm run build` falhava de forma intermitente com `ENOENT` ao copiar `routes-manifest.json` para o diretório standalone.
- Causa raiz: múltiplos processos locais disputavam o diretório padrão `.next`, causando corrida entre geração e cópia dos artefatos.
- Como evitar: usar `distDir` dedicado quando o repositório rodar em ambiente compartilhado e alinhar Docker/TypeScript ao novo caminho de build.
- Refs: `next.config.ts`, `Dockerfile`, `tsconfig.json`, `tickets/TCK-0002-public-profile/log.md`

## [L-005] 2026-08-01 — backend — `ON CONFLICT DO NOTHING` esconde conflito de negócio — erro
- Contexto: rota de cadastro do TCK-0009, que insere o perfil junto com a criação do usuário de auth.
- Erro: com `ON CONFLICT (user_id) DO NOTHING` sem `RETURNING`, a rota respondia 201/202 ("handle reservado") mesmo quando nada era inserido porque o usuário já tinha perfil — o handle continuava livre para outra pessoa.
- Causa raiz: `DO NOTHING` é sucesso para o Postgres; sem `RETURNING` a aplicação não distingue "inseri" de "não fiz nada" e trata conflito como caminho felizardo.
- Como evitar: todo `ON CONFLICT ... DO NOTHING` cujo conflito tem significado de negócio leva `RETURNING` e a aplicação checa se veio linha; se não veio, responde o erro específico do conflito.
- Refs: `app/api/auth/signup/route.ts`, `tickets/TCK-0009-auth-session-fixes/log.md` entradas [6] e [7].

## [L-006] 2026-08-01 — backend — `NEXT_PUBLIC_*` congela decisão de servidor no build — erro
- Contexto: seleção do adaptador de auth (mock vs. Supabase) no TCK-0009.
- Erro: a escolha dependia de `process.env.NEXT_PUBLIC_SUPABASE_URL`, então o valor do momento do build ficava embutido no bundle e o ambiente não podia ser reconfigurado sem recompilar.
- Causa raiz: o Next substitui `NEXT_PUBLIC_*` por literal em tempo de compilação, inclusive no código de servidor — a variável não é lida em runtime.
- Como evitar: decisão de servidor lê variável **sem** o prefixo `NEXT_PUBLIC_` (mantendo o nome público apenas como fallback de compatibilidade); `NEXT_PUBLIC_*` só para valor que o cliente realmente precisa e que pode ser público.
- Refs: `lib/supabase/config.ts`, `tickets/TCK-0009-auth-session-fixes/log.md` entrada [4].

## [L-007] 2026-08-01 — backend — `current_setting(...,true)::uuid` estoura com string vazia — erro
- Contexto: TCK-0011, ao fazer a RLS valer de fato e rodar o primeiro teste de acesso cruzado.
- Erro: no caminho anônimo (sem usuário), as consultas falhavam com `invalid input syntax for type uuid: ""`.
- Causa raiz: uma vez que a GUC customizada existiu na conexão, `current_setting(nome, true)` devolve **string vazia** depois de um `SET LOCAL` revertido — não NULL. `''::uuid` é erro, não NULL.
- Como evitar: em política RLS, sempre `NULLIF(current_setting('app.x', true), '')::uuid`, de preferência encapsulado numa função `STABLE` para não repetir o cuidado em cada política.
- Refs: `db/migrations/0006_app_role_rls.sql`, `lib/db/rls.test.ts`, `tickets/TCK-0011-effective-rls/log.md` entrada [3].

## [L-008] 2026-08-01 — backend — RLS só vale se a role efetiva não bypassar — acerto
- Contexto: TCK-0011 — políticas existiam desde o TCK-0003 mas nunca eram exercidas.
- O que funcionou: criar uma role `NOLOGIN NOSUPERUSER NOBYPASSRLS`, dar `GRANT` dela à role da conexão e fazer `SET LOCAL ROLE` dentro da transação, junto com `set_config('app.current_user_id', ..., true)`.
- Por que funcionou: `SET ROLE` troca a role **efetiva**, e é ela que a RLS avalia — então até uma conexão superusuária passa a ser barrada, sem precisar de credencial nova, segundo pool ou segredo em commit.
- Como reaproveitar: toda consulta em nome de um usuário entra por `withUserSession`; caminho público por `withPublicSession`; só operações deliberadamente cross-tenant (disponibilidade de handle, provisionamento) ficam na role da conexão, com o motivo escrito no código.
- Refs: `lib/db/client.ts`, `db/migrations/0006_app_role_rls.sql`.

## [L-009] 2026-08-01 — backend — NULL em UNIQUE quebra ON CONFLICT silenciosamente — erro
- Contexto: TCK-0012 — o upsert diário de `page_views` deveria incrementar um contador.
- Erro: cada visita sem país/referrer inseria uma linha nova em vez de incrementar; os totais por `SUM` continuavam certos, então o defeito ficou invisível — só a tabela crescia.
- Causa raiz: em `UNIQUE(a, b, c)` o Postgres trata NULLs como **distintos** por padrão, então o `ON CONFLICT` nunca casa quando alguma coluna da chave é nula.
- Como evitar: chave de upsert com coluna nulável exige `UNIQUE NULLS NOT DISTINCT` (PG 15+) ou sentinela via `COALESCE`; e todo upsert de contador precisa de teste que rode a ingestão **duas vezes** e confira que sobrou uma linha só.
- Refs: `db/migrations/0007_analytics_integrity.sql`, `lib/db/analytics.ts`.

## [L-010] 2026-08-01 — backend — validar ingestão pública dentro do banco — acerto
- Contexto: TCK-0012 — endpoints de analytics aceitavam qualquer `profileId`/`blockId`, e o `profileId` está no HTML público.
- O que funcionou: mover a validação e o incremento para funções `SECURITY DEFINER` e **revogar** INSERT/UPDATE direto da role da aplicação, deixando só `GRANT EXECUTE`.
- Por que funcionou: a regra de negócio (perfil publicado, bloco pertence ao perfil) passa a ser inviolável mesmo se uma rota futura esquecer de checar — e a RLS não precisa de políticas amplas de escrita para tabela agregada.
- Como reaproveitar: sempre que uma borda anônima precisa escrever, dar EXECUTE de função validada em vez de permissão de tabela. Verificação: `SET LOCAL ROLE` + `INSERT` direto deve dar `permission denied`.
- Refs: `db/migrations/0007_analytics_integrity.sql`, `tickets/TCK-0012-analytics-integrity/log.md` entrada [4].

## [L-011] 2026-08-01 — frontend — coluna `date` do Postgres chega como `Date` — erro
- Contexto: painel `/dashboard/analytics` respondia 500 desde o TCK-0005 (descoberto ao validar o TCK-0011).
- Erro: `item.day.slice is not a function` e `INVALID_MESSAGE: chart.barAriaLabel didn't resolve to a string`.
- Causa raiz: o driver `postgres` devolve coluna `date` como objeto `Date`, mas o tipo declarado no código era `string`. O next-intl, ao receber objeto numa interpolação, entende como rich text e recusa.
- Como evitar: quando a data é usada como texto, converter na consulta (`to_char(day, 'YYYY-MM-DD')`) em vez de confiar no tipo declarado — anotação de tipo não converte nada em tempo de execução.
- Refs: `lib/db/analytics.ts`, `app/[locale]/dashboard/analytics/page.tsx`.

## [L-012] 2026-08-01 — qa — veredito antes da saída completa da suíte — erro
- Contexto: fechamento do TCK-0012; a entrada de QA foi escrita no mesmo comando que rodava build, typecheck, testes e commit.
- Erro: o veredito "aprovado, 55 testes" foi registrado e o commit feito enquanto 1 teste falhava; a falha apareceu na saída depois do commit.
- Causa raiz: encadear a validação e o commit no mesmo comando faz o registro deixar de depender do resultado — o log passa a afirmar o que se esperava, não o que aconteceu.
- Como evitar: rodar a suíte como comando **próprio**, ler a saída, e só então escrever o veredito e commitar. Nunca colocar `git commit` na mesma linha de `npm run test:*`.
- Refs: `tickets/TCK-0012-analytics-integrity/log.md` entradas [7] e [8].

## [L-013] 2026-08-01 — frontend — cor oficial de marca não passa AA sozinha — erro
- Contexto: TCK-0014, catálogo de botões de marca com a cor oficial de cada rede.
- Erro: com texto branco, o azul do Twitter (`#1d9bf0`) dava 3,00:1 e o do Facebook (`#1877f2`) 4,23:1 — reprovando o AA de texto normal (4,5:1).
- Causa raiz: usar a cor da marca como está assume que ela foi pensada para texto sobreposto; várias foram pensadas para logo, não para botão com rótulo.
- Como evitar: ao adicionar cor de marca, calcular o contraste e escurecer o mínimo necessário, deixando o motivo comentado. Teste que percorre o catálogo inteiro impede a próxima adição de passar batido.
- Refs: `components/blocks/brand-colors.ts`, `components/blocks/brand-colors.test.ts`.

## [L-014] 2026-08-01 — backend — `SECURITY DEFINER` com id por argumento anula a RLS — erro
- Contexto: TCK-0015, função de exclusão de conta criada como `delete_account(target_user_id UUID)`.
- Erro: por ser `SECURITY DEFINER`, a função ignora RLS e filtra só pelo argumento — atuando como o usuário A, chamar com o id de B apagava a conta de B. Descoberto por um teste de escopo escrito para "confirmar" o comportamento seguro.
- Causa raiz: `SECURITY DEFINER` transfere a autorização para dentro da função; quando o alvo vem por parâmetro, a autorização deixou de existir e passou a depender de todo chamador ser correto.
- Como evitar: função `SECURITY DEFINER` deriva o sujeito de `current_app_user_id()` (ou equivalente da sessão), nunca de argumento. Se um argumento de identidade parecer necessário, a função precisa validar que ele bate com a sessão. Remover a assinatura antiga com `DROP FUNCTION` — `CREATE OR REPLACE` não substitui uma sobrecarga.
- Refs: `db/migrations/0008_account_deletion.sql`, `lib/db/account.test.ts`, `tickets/TCK-0015-account-deletion-lgpd/log.md` entradas [4] e [5].

## [L-015] 2026-08-01 — frontend — `watch()` do react-hook-form não é reativo — erro
- Contexto: TCK-0019, verificação de disponibilidade de handle no cadastro, escrita no TCK-0003.
- Erro: a consulta a `/api/auth/check-handle` **nunca** era disparada no navegador (0 requisições, medido no e2e) e nenhum indicador aparecia. Passou meses sem ser notado porque não havia teste de interação.
- Causa raiz: `watch('nome')` lê o valor mas não garante nova renderização; usado como dependência de `useEffect`, a dependência nunca muda. A API reativa é `useWatch`. O aviso `react-hooks/incompatible-library` naquela linha era o sintoma, e estava sendo tolerado como ruído.
- Como evitar: dependência de efeito que vem de formulário usa `useWatch`; e estado derivável do valor (formato, reserva) é calculado na renderização, não espelhado por `setState` dentro do efeito — o que também evita o erro `Calling setState synchronously within an effect`.
- Refs: `app/[locale]/signup/SignupForm.tsx`, `e2e/critical-flow.spec.ts`.

## [L-016] 2026-08-01 — qa — e2e do Next 16 precisa de build, não de `next dev` — erro
- Contexto: TCK-0016, primeiro e2e Playwright do repositório.
- Erro: nenhuma interação funcionava — o cliente não hidratava e nenhum efeito rodava, com o console mostrando só falhas de WebSocket do HMR.
- Causa raiz: o servidor de desenvolvimento do Next 16 **bloqueia recursos `/_next/`** vindos de origem diferente da que o iniciou (`127.0.0.1` vs `localhost`), então o bundle do cliente não carrega. É silencioso: o HTML renderiza normalmente.
- Como evitar: `webServer` do Playwright roda `npm run build && next start` — além de não ter esse bloqueio, é o ambiente que o usuário recebe. Se precisar mesmo de `next dev`, usar exatamente o mesmo host do `baseURL` ou declarar `allowedDevOrigins`.
- Refs: `playwright.config.ts`, `tickets/TCK-0016-test-suite-ci/log.md`.

## [L-017] 2026-08-15 — devops — schema de produção nunca aplicado, e nada no pipeline aplicava — erro
- Contexto: TCK-0025. Login com Google falhava em produção com `?error=oauth_failed`.
- Erro: o banco de produção não tinha **nenhuma** tabela da aplicação. As 9 migrações jamais foram aplicadas, e o app foi publicado assim desde o primeiro deploy. O sintoma apareceu a três camadas de distância da causa: o OAuth funcionava (o Supabase emitiu o token, HTTP 200), mas o passo seguinte lia `profiles` e recebia `42P01: relation does not exist`.
- Causa raiz: o deploy de produção é a integração Git da Vercel e nenhuma etapa aplicava `db/migrations/`. Código e schema podiam divergir sem que nada avisasse — e divergiram desde o início. O `release.yml` roda a suíte e publica o release; não migra.
- Como evitar: o build de produção aplica as migrações pendentes e **falha** se não puder (`scripts/migrate-on-build.mjs`). Publicar código sem o schema correspondente deixa de ser possível. Preview não migra: compartilha o banco com produção. E desconfiar de "está no ar" como prova de saúde — o perfil público é SSG com fallback embutido, então respondia 200 sem banco algum.
- Refs: `scripts/migrate-on-build.mjs`, `tickets/TCK-0025-production-schema-gate/log.md`.

## [L-018] 2026-08-15 — frontend — "acessibilidade AA" sem teste executável é AA de uma vez só — erro
- Contexto: TCK-0021, primeira auditoria automatizada da interface inteira.
- Erro: quatro defeitos reais e sistêmicos, todos presentes desde a primeira versão das telas e nenhum percebido em revisão visual: `<html>` sem `lang` no site inteiro (o comentário do layout afirmava o contrário), cor primária reprovando por uma casa decimal (4,46:1 contra 4,5:1) em todo botão do produto, gráfico de analytics mudo (`aria-label` em `div` sem `role` é ignorado por especificação) e perfil público misturando o tema do dono com a preferência do visitante, produzindo 3,72:1.
- Causa raiz: acessibilidade estava sendo verificada por leitura de código e olho, o que não mede contraste nem detecta atributo ausente. Comentário afirmando que algo é feito não é evidência de que é feito.
- Como evitar: axe-core no Playwright sobre todas as telas e nos dois temas, falhando em violação A/AA; e travar o que é sistêmico no **token**, com teste unitário que lê o CSS de verdade. Contraste que depende de cor escolhida pelo usuário precisa de teste sobre uma grade de cores, não só sobre os presets.
- Refs: `e2e/accessibility.spec.ts`, `app/theme-tokens.test.ts`, `lib/theme/surface.ts`.

## [L-019] 2026-08-15 — backend — cache de pool invertido em produção vira DoS — erro
- Contexto: TCK-0024. A captura do manual (80 páginas) falhava sempre por volta da 70ª.
- Erro: `getDb()` guardava o pool em cache **apenas fora de produção**; em produção cada chamada abria um pool novo de até 10 conexões que nunca fechava. O Postgres chegava a `FATAL 53300: sorry, too many clients already` — negação de serviço alcançável por tráfego normal.
- Causa raiz: o padrão "cachear no global só em dev" existe para sobreviver ao hot reload, e foi copiado como se a produção não precisasse de cache. Inverteu exatamente o propósito de haver um pool.
- Como evitar: pool é sempre singleton do processo. E ler falha progressiva (funciona no começo, quebra depois de N operações) como esgotamento de recurso, não como flakiness — a primeira reação foi adicionar retry, que teria escondido o defeito.
- Refs: `lib/db/client.ts`, `lib/db/client.test.ts`.

## [L-020] 2026-08-15 — segurança — mitigação que não mitiga passa por "já tratado" — erro
- Contexto: TCK-0023, auditoria de dependências.
- Erro: o `package.json` tinha um `override` fixando `brace-expansion: 5.0.8` — dentro da faixa vulnerável do próprio aviso que pretendia mitigar (4.0.0–5.0.8). A presença do override fazia o item parecer resolvido.
- Causa raiz: fixar versão para "resolver" um aviso sem conferir a faixa corrigida. O `npm audit` continuava acusando, mas o ruído era lido como falso positivo já endereçado.
- Como evitar: ao fixar versão por segurança, comparar com a faixa do aviso e registrar no ticket qual versão corrige. Um `override` de segurança sem número de aviso e sem reteste é decoração.
- Refs: `package.json`, `security/reports/2026-08-15-squad.md`.

## [L-021] 2026-08-16 — devops — `buildCommand` no `vercel.json` desliga o `vercel-build` — erro
- Contexto: TCK-0025. O portão de migração foi criado como script `vercel-build` (`node scripts/migrate-on-build.mjs && next build`) e dado como ativo — o log do ticket chegou a afirmar que "o portão já cobre essa classe de falha".
- Erro: o `vercel.json` fixava `"buildCommand": "npm run build"` desde o TCK-0007, e um `buildCommand` explícito **tem precedência** sobre o script `vercel-build` do `package.json`. O portão nunca rodou em nenhum deploy: o log do build mostra `Running "npm run build"` → `next build`, sem uma única linha `[migrate-on-build]`. O deploy do merge da Fase 4 publicou com o portão inerte.
- Causa raiz: o ticket verificou o portão pelo script criado, não pelo comando que a plataforma executa. Havia duas fontes de verdade para o comando de build e só uma foi olhada.
- Como evitar: portão de deploy se verifica **no log do build da plataforma**, procurando a linha que o próprio portão imprime — não na existência do script. Ao adicionar um `vercel-build`, conferir se há `buildCommand` em `vercel.json` sobrescrevendo-o. Regra geral: "criei o mecanismo" nunca é evidência de "o mecanismo executa".
- Refs: `vercel.json`, `scripts/migrate-on-build.mjs`, `tickets/TCK-0025-production-schema-gate/log.md` entrada [5].

## [L-022] 2026-08-16 — devops — Supabase direto é só IPv6, e a Vercel não alcança — erro
- Contexto: TCK-0025. Cadastro, login e editor respondiam 500 em produção havia 20 dias. Duas rodadas de diagnóstico já haviam passado pelo problema: a primeira concluiu "schema não aplicado" (era verdade, e não era tudo), a segunda concluiu "`DATABASE_URL` não está definida na Vercel" (era falso — `vercel env ls production` mostra a variável criada 20 dias antes).
- Erro: a `DATABASE_URL` apontava para a **conexão direta** do Supabase, `db.<ref>.supabase.co:5432`, que resolve apenas em **IPv6**. A Vercel não tem rede IPv6 de saída. O build falhou com `connect ENETUNREACH 2600:1f1e:...:5432` assim que o portão de schema passou a rodar de fato.
- Causa raiz: a evidência disponível era **ausência** de sinal — nenhuma conexão em `pg_stat_activity`, nenhum log de erro no app. Ausência de sinal foi lida como "não tentou conectar por falta de configuração", quando também é o que se vê quando o pacote não tem rota e morre no kernel. As duas hipóteses produzem o mesmo silêncio dos dois lados; só o `errno` do lado que disca distingue.
- Como evitar: para produção na Vercel, usar sempre o **pooler** do Supabase (Supavisor, IPv4) — `postgres.<ref>@aws-0-<região>.pooler.supabase.com:6543` — e lembrar que o usuário muda de `postgres` para `postgres.<ref>`. No diagnóstico: quando o sintoma é silêncio nas duas pontas, obter o erro de conexão bruto antes de teorizar; `ENETUNREACH`/`EHOSTUNREACH` é rota, `ECONNREFUSED` é porta, timeout é firewall, e cada um leva a uma correção diferente. Um portão de build que falha alto foi o que finalmente produziu esse `errno` — 20 dias depois.
- Refs: `docs/runbook.md` seção 1, `scripts/migrate-on-build.mjs`, `tickets/TCK-0025-production-schema-gate/log.md` entrada [6], [[L-021]].
