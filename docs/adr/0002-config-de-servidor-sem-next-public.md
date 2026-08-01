# ADR-0002: Configuração de servidor fora de `NEXT_PUBLIC_*`

- **Data:** 2026-08-01 · **Ticket:** TCK-0009 · **Status:** aceito

## Contexto

A escolha entre Supabase Auth e a sessão mock era feita lendo
`process.env.NEXT_PUBLIC_SUPABASE_URL`. O Next substitui `NEXT_PUBLIC_*` por
valor literal em tempo de build, **inclusive no código de servidor**: a decisão
ficava congelada no bundle e o ambiente não podia ser reconfigurado sem
recompilar. Um deploy sem a variável cairia silenciosamente na sessão mock, que é
forjável.

## Decisão

`lib/supabase/config.ts` resolve a configuração preferindo `SUPABASE_URL` e
`SUPABASE_ANON_KEY` (sem prefixo público, lidas em tempo de execução), com os
nomes `NEXT_PUBLIC_*` mantidos apenas como fallback de compatibilidade com os
deploys já configurados. Junto: a sessão mock é **recusada** em produção, exigindo
`ALLOW_MOCK_AUTH=true` como opt-in explícito (usado só pelo `docker compose` de
QA, que roda com `NODE_ENV=production` sem Supabase).

## Consequências

- Reconfigurar o ambiente não exige rebuild.
- Falta de configuração em produção falha **alto**, com mensagem acionável, em
  vez de degradar para autenticação forjável.
- `NEXT_PUBLIC_*` fica reservado ao que o cliente realmente precisa e pode ser
  público.

## Alternativas descartadas

- **Renomear e remover o nome antigo**: quebraria o deploy atual até alguém
  atualizar as variáveis na Vercel.
