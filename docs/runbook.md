# Runbook de produção

> O que precisa estar configurado para o ligcentro funcionar em produção, e como
> diagnosticar quando não funciona. Escrito em 2026-08-15, depois de um incidente
> em que o app esteve publicado e aparentemente no ar por semanas — com o banco
> vazio (TCK-0025).

## Pendências abertas

### 1. `DATABASE_URL` na Vercel aponta para a conexão direta (IPv6) — **bloqueia o produto inteiro**

Cadastro, login e editor respondem **500** em produção. Durante uma rajada de
requisições, o Supabase não registrou nenhuma conexão vinda da Vercel.

**Causa, com a evidência que faltou por 20 dias.** A variável existe desde o
início e o valor é uma string de conexão válida — só que aponta para a **conexão
direta** do Supabase, `db.<project-ref>.supabase.co:5432`, que resolve
**apenas em IPv6**. A Vercel não tem rede IPv6 de saída, no build nem nas
funções. O erro exato, do primeiro build em que o portão de schema realmente
rodou (2026-08-16):

```
[migrate-on-build] aplicando migrações pendentes em produção...
Falha na migração: connect ENETUNREACH 2600:1f1e:90b:a702:...:5432
[migrate-on-build] a migração falhou — build interrompido de propósito.
```

`ENETUNREACH` é o kernel dizendo que não existe rota para aquele endereço — o
pacote nunca sai da máquina. É por isso que o `pg_stat_activity` do lado do
Supabase ficava vazio: não havia o que registrar. O sintoma parecia "variável
ausente" e era, na verdade, "endereço inalcançável".

**O que fazer:** no painel da Vercel → projeto ligcentro → Settings →
Environment Variables, definir `DATABASE_URL` no escopo **Production** com a
string do **pooler** (Supavisor, modo Transaction), que atende em IPv4:

```
postgresql://postgres.<project-ref>:<senha>@aws-0-<região>.pooler.supabase.com:6543/postgres
```

Copie-a pronta em Supabase → Project Settings → Database → Connection string →
**Transaction pooler**. Depois, redeploy.

> Duas armadilhas nessa troca:
>
> 1. **O usuário muda.** Na conexão direta é `postgres`; no pooler é
>    `postgres.<project-ref>` (o ref colado por ponto). Com `postgres` puro o
>    Supavisor responde `Tenant or user not found`.
> 2. **A variável pode existir com valor errado** — foi exatamente o caso.
>    `vercel env ls production` mostra que ela existe, não que o valor conecta.
>    E um deploy só enxerga o valor vigente **no momento em que é criado**:
>    editar a variável não afeta o deploy que já está no ar — **redeploy é
>    obrigatório**.

Se a migração falhar no pooler em modo Transaction, use o **Session pooler**
(mesmo host, porta `5432`): o modo Transaction não mantém estado entre
statements, e há DDL que não sobrevive a isso.

Como conferir que resolveu (deve responder `{"available":true}`, não 500):

```sh
curl -s https://ligcentro.vercel.app/api/auth/check-handle?handle=umhandlelivre123
```

> Cuidado com o falso positivo: `?handle=demo` responde 200 **sem tocar no
> banco**, porque `demo` é handle reservado e a rota retorna antes da consulta.
> Sempre testar com um handle livre qualquer.

### 2. Confirmar o login social (depois do item 1)

Com o banco acessível, entrar em `https://ligcentro.vercel.app/en-US/signup` e
usar "Cadastrar-se com Google". O esperado é cair em `/onboarding?step=1`.

O schema já está aplicado e o OAuth já funcionava — os logs do Supabase mostram
`POST /auth/v1/token → 200` mesmo durante a falha. O que quebrava era a consulta
seguinte ao banco.

### 3. Itens que dependem de credencial (herdados)

- **TCK-0009** — cadastrar `/api/auth/confirm?locale=pt-BR` como Redirect URL no
  Supabase Auth; confirmar que a sessão sobrevive a mais de uma hora.
- **TCK-0010** — criar o bucket `avatars` (público para leitura) e definir
  `SUPABASE_SERVICE_ROLE_KEY` na Vercel.
- **TCK-0015** — com a service role key ativa, apagar uma conta de teste e
  conferir que o usuário sai de Authentication → Users.

## Variáveis de ambiente de produção

| Variável | Obrigatória | Para quê |
| --- | --- | --- |
| `DATABASE_URL` | **sim** | Postgres do Supabase (pooler, modo Transaction). Sem ela o build de produção falha, por desenho. |
| `SUPABASE_URL` | sim | Auth (também aceita `NEXT_PUBLIC_SUPABASE_URL`). |
| `SUPABASE_ANON_KEY` | sim | Auth. |
| `SUPABASE_SERVICE_ROLE_KEY` | sim | Storage de avatar e exclusão de conta (LGPD). Só server-side. |
| `NEXT_PUBLIC_APP_URL` | sim | Base das URLs públicas e do QR code. |
| `ALLOW_MOCK_AUTH` | **não** | Sessão mock. **Nunca definir em produção.** |

## Migrações

O schema acompanha o código: `npm run vercel-build` roda
`scripts/migrate-on-build.mjs` antes do `next build` e aplica as migrações
pendentes **no build de produção**. Se a migração falhar ou faltar
`DATABASE_URL`, o build falha em vez de publicar um app que conversa com um banco
que não existe.

- Preview **não** migra: compartilha o banco com produção, e migrar num preview
  seria migrar produção sem revisão.
- Build local e CI não migram.

Estado do schema, a qualquer momento:

```sh
DATABASE_URL=... npm run db:migrate -- --status
```

## Diagnóstico

**Sintoma: `?error=oauth_failed` ou `?error=oauth_profile_failed` no login.**
Os dois códigos são distintos de propósito. `oauth_failed` é falha na troca do
código com o provedor; `oauth_profile_failed` é falha ao preparar o perfil —
quase sempre banco. A causa real vai para o log do servidor com o prefixo
`[oauth-callback]`.

**Sintoma: 500 em rotas autenticadas.** Procurar `[auth]` no log. Auth sem
provedor configurado agora responde 401 e registra a causa, em vez de estourar.

**Sintoma: o site "parece no ar" mas nada funciona.** O perfil público é SSG e
tem caminho de fallback embutido — `/pt-BR/demo` responde 200 mesmo sem banco
algum. Nunca use a home ou o perfil de exemplo como prova de saúde; use o
`check-handle` com um handle livre.

**Sintoma: `sorry, too many clients already`.** Era o vazamento de conexões
corrigido em `lib/db/client.ts` (o pool passou a ser reaproveitado sempre). Se
voltar, verificar se alguém reintroduziu cache condicional de pool.

## Verificações periódicas

```sh
npm run test:unit      # 105 testes, inclui acesso cruzado de RLS
npm run test:e2e       # 20 testes, inclui fluxo crítico e cabeçalhos
npm run test:a11y      # acessibilidade AA nos dois temas
npm run perf           # LCP p75 do perfil público (portão de 1200 ms)
npm audit              # dependências
npm run manual:capture # regenera o manual do usuário
```
