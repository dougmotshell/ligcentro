# ADR-0004: E2E contra build de produção, não `next dev`

- **Data:** 2026-08-01 · **Ticket:** TCK-0016 · **Status:** aceito

## Contexto

O primeiro e2e do repositório não conseguia interagir com nada: o cliente não
hidratava e nenhum efeito rodava, com o console mostrando apenas falhas de
WebSocket do HMR. O servidor de desenvolvimento do Next 16 **bloqueia recursos
`/_next/`** vindos de origem diferente da que o iniciou (`127.0.0.1` vs
`localhost`), então o bundle do cliente não carrega — e o HTML renderiza
normalmente, o que torna a falha silenciosa.

## Decisão

O `webServer` do Playwright roda `npm run build && next start`. O `baseURL` usa
`localhost`. O app sobe no caminho de sessão mock (`ALLOW_MOCK_AUTH=true`, Supabase
vazio) contra o Postgres do `docker compose` — o mesmo ambiente de validação do QA.

## Consequências

- O e2e exercita o **mesmo artefato** que vai a produção, incluindo SSG e
  revalidação, que `next dev` trata de outra forma.
- Cada execução limpa paga o build (~10 s local). Aceitável: é o preço de o verde
  significar algo.
- O job de E2E no CI depende do job de build e sobe o Postgres como serviço.

## Alternativas descartadas

- **`allowedDevOrigins` + `next dev`**: mais rápido, mas testaria um modo que o
  usuário nunca usa e mantém o HMR como fonte de instabilidade.
