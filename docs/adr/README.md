# ADRs — decisões arquiteturais registradas

Uma decisão dura vira um ADR para não ser rediscutida do zero nem revertida por
desconhecimento. Formato curto: contexto, decisão, consequências, alternativas
descartadas. ADR não se edita quando muda de ideia — cria-se um novo que
substitui (`Substitui: ADR-NNNN`).

| ADR                                                  | Título                                                 | Data       |
| ---------------------------------------------------- | ------------------------------------------------------ | ---------- |
| [0001](./0001-rls-por-role-de-aplicacao.md)          | RLS efetiva por role de aplicação com `SET LOCAL ROLE` | 2026-08-01 |
| [0002](./0002-config-de-servidor-sem-next-public.md) | Configuração de servidor fora de `NEXT_PUBLIC_*`       | 2026-08-01 |
| [0003](./0003-ingestao-de-analytics-por-funcao.md)   | Ingestão de analytics por função `SECURITY DEFINER`    | 2026-08-01 |
| [0004](./0004-e2e-contra-build-de-producao.md)       | E2E contra build de produção, não `next dev`           | 2026-08-01 |
