# Lições aprendidas (append-only)

> Registro permanente de erros cometidos e como evitá-los — a memória que impede o mesmo erro duas vezes. Formato e gatilhos na seção ["Memória persistente"](../handoff-protocol.md#memória-persistente-lições-e-contexto) do protocolo. **Append-only**: lição superada = nova lição referenciando a antiga, nunca edição.

> **Ainda não há lições registradas.** O ligcentro está no início (pré-Fase 0). A
> primeira lição nasce do primeiro REJECT com causa raiz generalizável, ou de um
> CI/build/deploy quebrado por comportamento não óbvio. Formato:

<!--
## [L-001] AAAA-MM-DD — <área> — <título curto>
- Contexto: <o que se tentava fazer; ticket TCK-NNNN>
- Erro: <o que deu errado, sintoma observável>
- Causa raiz: <o porquê de verdade, não o sintoma>
- Como evitar: <regra prática e verificável para o próximo agente>
- Refs: <arquivos, commits, entradas de log>
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
