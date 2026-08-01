# TCK-0010: Storage de avatar em produção (Supabase Storage)

- **status:** done
- **owner:** backend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 2 — Contas e editor

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: `adapters/storage/index.ts` lança erro quando o Supabase está
configurado, e o fallback local escreve em `public/`, inviável em produção.)

## Requisito refinado

- User story: como criador, envio meu avatar e ele aparece no perfil público,
  tanto no ambiente local quanto em produção.
- Fora de escopo: recorte/redimensionamento de imagem, CDN próprio.

## Critérios de aceite (máx. 7, verificáveis)

- [x] 1. Adaptador `adapters/storage/supabase.ts` implementado por REST (sem SDK `@supabase/*`), gravando no bucket `avatars` e devolvendo URL pública.
- [x] 2. O upload valida tipo MIME (imagem) e tamanho máximo, recusando o resto com erro tipado.
- [x] 3. O fallback local continua funcionando sem Supabase configurado.
- [x] 4. A rota de avatar responde erro tratado (não 500 genérico) quando o storage falha.
- [x] 5. Testes unitários cobrem validação de arquivo e seleção de adaptador.
- [x] 6. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/02-architecture.md` (portabilidade) · Fase: 2 · Arquivos-alvo: `adapters/storage/*`, `app/api/profile/avatar/route.ts`, `docs/setup/external-services.md`

## Validação em produção pendente (Douglas)

1. Criar o bucket `avatars` no Supabase Storage como **público para leitura**.
2. Definir `SUPABASE_SERVICE_ROLE_KEY` na Vercel (só server-side).
3. Enviar um avatar e conferir que a URL pública abre e que o arquivo anterior
   desaparece do bucket.

## Resolução (preenchido ao fechar)

- Commits: `TCK-0010: implementar storage de avatar no Supabase`
- Evidência final: log entradas [3], [5] e [6]
- Docs atualizados: `.gitignore`, `.env.example` (bucket configurável)
