# ADR-0001: RLS efetiva por role de aplicação com `SET LOCAL ROLE`

- **Data:** 2026-08-01 · **Ticket:** TCK-0011 · **Status:** aceito

## Contexto

As políticas RLS existiam desde o TCK-0003, mas nunca eram exercidas: o app
conecta com a role dona das tabelas (superusuária no compose local, `postgres` no
Supabase), que bypassa RLS, e nada definia `app.current_user_id`. O isolamento
multi-tenant dependia inteiramente de o `WHERE` de cada consulta estar correto —
um esquecimento vazaria dados de outro titular. A regra 6 do `AGENTS.md` exige
"RLS em 100% das tabelas".

## Decisão

Uma role `ligcentro_app` (`NOLOGIN NOSUPERUSER NOBYPASSRLS`), da qual a role da
conexão é membro. Toda consulta em nome de um usuário passa por
`withUserSession`, que dentro da transação faz
`set_config('app.current_user_id', <id>, true)` e `SET LOCAL ROLE ligcentro_app`.
O caminho público usa `withPublicSession` (mesma role, sem contexto de usuário).
A role da conexão continua sendo a "de serviço" e é usada **só** onde a operação
é deliberadamente cross-tenant: disponibilidade de handle e provisionamento de
perfil, cada uma com o motivo escrito no código.

## Consequências

- `SET ROLE` troca a role **efetiva**, e é ela que a RLS avalia: até uma conexão
  superusuária passa a ser barrada.
- Não exige credencial nova, segundo pool nem segredo em commit.
- Toda função da camada de dados que age por um usuário recebe o `userId`.
- **O código passa a depender da migração 0006.** Deploy sem migrar antes
  responde `app_role_missing` em toda requisição autenticada; a ordem
  "migrar antes de subir" está documentada em `docs/setup/external-services.md`.

## Alternativas descartadas

- **`FORCE ROW LEVEL SECURITY`**: aplicaria RLS ao dono das tabelas, o que
  quebraria a checagem de disponibilidade de handle (precisa ver todos os
  tenants) e continuaria sem efeito para superusuário.
- **Role com LOGIN e senha própria**: exigiria um segundo `DATABASE_URL` e um
  segredo novo, contra a regra de segredos mínimos.
