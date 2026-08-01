# ADR-0003: Ingestão de analytics por função `SECURITY DEFINER`

- **Data:** 2026-08-01 · **Ticket:** TCK-0012 · **Status:** aceito

## Contexto

Os endpoints de ingestão aceitavam qualquer `profileId`/`blockId` de quem
chamasse — e o `profileId` está no HTML público. Qualquer pessoa podia inflar (ou
poluir) a métrica de qualquer perfil, justamente o diferencial do produto
("analytics por link no grátis"). Além disso, com a RLS valendo (ADR-0001), a
tabela agregada exigiria políticas amplas de INSERT/UPDATE para a role da
aplicação.

## Decisão

Escrita de analytics **só** por `record_page_view` e `record_block_click`,
funções `SECURITY DEFINER` que validam dentro do banco que o perfil existe e está
publicado e que o bloco pertence ao perfil. A role da aplicação recebe apenas
`GRANT EXECUTE`; `INSERT`, `UPDATE` e `DELETE` diretos foram revogados. As rotas
acrescentam limite de taxa por perfil, sem persistir qualquer identificador de
visitante (regra 7 do `AGENTS.md`).

## Consequências

- A regra de negócio é inviolável mesmo se uma rota futura esquecer de checar —
  verificável: `SET LOCAL ROLE ligcentro_app` + `INSERT` direto dá
  `permission denied`.
- O limite de taxa é por processo; em serverless vale por instância. É proteção
  parcial e deliberada: um limite compartilhado exigiria armazenamento externo
  (custo) ou registrar quem chamou (privacidade).

## Alternativas descartadas

- **Política RLS de INSERT/UPDATE aberta na tabela agregada**: daria à role da
  aplicação escrita livre, sem validar vínculo.
- **Validar só na aplicação**: é o que existia; um endpoint novo repetiria o erro.
