# Log — TCK-0024: Manual do usuário gerado por Playwright

> Append-only.

## [1] ACTION — 2026-08-15 — docs-writer

- Ação: Implementei o gerador descrito na skill `/user-manual`:
  - `e2e/manual/screens.ts` — lista canônica declarativa (id, caminho, título,
    propósito, ações, seletor de prontidão, cliques). Tela nova entra como
    entrada nova; o capturador não muda.
  - `e2e/manual/capture.ts` — builda, sobe `next start` em porta própria,
    fotografa 10 telas × 2 temas × 2 idiomas × mobile/desktop = **80 imagens**,
    escreve `docs/user-manual/` do zero e derruba o servidor.
  - `npm run manual:capture`; `testIgnore` no Playwright para o diretório não
    subir junto de `npx playwright test`.
- Decisão: o manual usa o perfil semeado `demo` e a sessão mock, em vez de criar
  conta a cada execução — assim nenhuma imagem carrega um handle aleatório e
  rodar duas vezes não gera diff. O script recusa rodar contra banco gerenciado:
  ele sobe o app com auth mock ligada, e apontar isso para produção seria abrir
  sessão administrativa falsa sobre dados reais.
- Motivo: Critérios 1 a 4.

## [2] ACTION — 2026-08-15 — docs-writer

Três defeitos apareceram até a captura ficar confiável; os dois primeiros eram do
gerador, o terceiro era **do produto**:

**(a) Servidor órfão.** `server.kill()` matava o `npx`, não o `next-server`
filho, que ficava segurando a porta e derrubava a execução seguinte com "o
servidor não respondeu". Corrigido com grupo de processos próprio (`detached`) e
`process.kill(-pid)` — no capturador e também no `measure-performance.mjs`, que
tinha o mesmo defeito.

**(b) Espera frágil.** `waitUntil: 'networkidle'` nunca era satisfeito no
dashboard, que mantém requisições em voo. Trocado por `load` + seletor de
prontidão. E o seletor de prontidão das telas de dashboard era `h1`, que **também
existe na tela de login** — uma sessão perdida produziria a foto errada em
silêncio. Trocado por `nav[aria-label]`.

**(c) Vazamento de conexões de banco — defeito de produção.** A captura falhava
sempre por volta da 70ª página servida. O diagnóstico melhorado (registrar onde o
navegador estava quando o seletor não apareceu) mostrou o dashboard respondendo
sem conteúdo, e o log do servidor deu a causa:
`FATAL 53300: sorry, too many clients already`. Causa raiz em
`lib/db/client.ts`: o pool era guardado em cache **apenas fora de produção**, de
modo que em produção cada `getDb()` abria um pool novo de até 10 conexões que
nunca fechava. Corrigido (o cache passa a valer sempre) com teste de regressão em
`lib/db/client.test.ts`. Escalado para a auditoria de segurança (TCK-0023) como
achado de disponibilidade — é negação de serviço alcançável por tráfego normal.

## [3] ACTION — 2026-08-15 — docs-writer

- Ação: Determinismo (critério 5). Duas execuções seguidas ainda diferiam em 4
  das 80 imagens, todas do perfil público em mobile. Duas causas:
  - **auto-interferência**: fotografar o perfil público disparava eventos de
    analytics, que apareciam no painel da execução seguinte. O manual não pode
    gerar dados — as chamadas a `/api/analytics/**` passaram a ser abortadas no
    contexto de captura;
  - **hover acidental**: o cursor ficava onde foi o último clique e caía sobre um
    bloco, disparando `hover:opacity-90`. A prova foi o pixel central do bloco
    valer exatamente `opacity 0.9` numa execução e ~0,925 na outra, com a
    transição a meio caminho. Corrigido movendo o ponteiro para fora antes da
    foto.
- Resultado: duas execuções consecutivas → **80/80 imagens byte a byte
  idênticas**. Critério 5 atendido.

## [4] ACTION — 2026-08-15 — qa-validator

- Ação: Validação. Conferi visualmente uma captura autenticada
  (`dashboard-blocks-light-pt-BR-desktop.png`): aba "Blocos" ativa, três blocos
  do perfil semeado, painel de publicação e QR code — a tela certa, não a de
  login.
- Resultado: 10 capítulos + índice, 80 imagens, nenhuma órfã (o diretório é
  recriado a cada execução) e nenhum capítulo sem imagem. O capítulo "Criar
  conta" mostra a tela unificada do TCK-0020 (critério 6).
- Veredito: **aprovado**. Critérios 1 a 6 atendidos.
- Nota: o gráfico de analytics acompanha a data da captura, então diff entre dias
  é legítimo — documentado no índice do manual.
