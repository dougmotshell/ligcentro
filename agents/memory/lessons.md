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
