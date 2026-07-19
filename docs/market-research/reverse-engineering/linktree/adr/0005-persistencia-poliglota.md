# ADR-0005 — Persistência poliglota: PostgreSQL + DynamoDB + Elasticsearch

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Contêineres de dados (C4-C2)

## Contexto e problema

O produto tem padrões de acesso muito diferentes:

- **Dados de conta/perfil/links:** relacionais, transacionais, consistência forte,
  volume moderado, leitura por `username`.
- **Analytics in-app (contadores de views/cliques):** escrita altíssima,
  leitura por chave, tolerante a consistência eventual, séries por tempo.
- **Busca/descoberta** (perfis, marketplace): full-text, filtros, ranking.
- **Análise histórica** (BI, relatórios): agregações pesadas sobre grandes volumes.

Um único banco não atende bem a todos.

## Alternativas consideradas

1. **Só PostgreSQL** — simples operacionalmente, mas contadores de analytics de
   alta escrita e busca full-text sofisticada o sobrecarregam.
2. **Só NoSQL (DynamoDB)** — escala escritas lindamente, mas modelagem relacional
   (joins, integridade) e relatórios ad-hoc ficam dolorosos.
3. **Persistência poliglota** — cada carga no armazenamento certo.

## Decisão

Adotar **persistência poliglota**, cada store para seu padrão de acesso:

| Store | Uso | Padrão de acesso |
|-------|-----|------------------|
| **PostgreSQL** | Contas, perfis, links, temas, assinaturas | Transacional, consistência forte |
| **DynamoDB** | Serving de analytics in-app (contadores, séries recentes) | Escrita massiva, leitura por chave |
| **Elasticsearch** | Busca de perfis e marketplace | Full-text, filtros, ranking |
| **Snowflake** | Data warehouse / BI | Agregações analíticas offline |

O warehouse é alimentado pelo pipeline de eventos (ver
[ADR-0006](./0006-pipeline-analytics-eventos.md)), não por acesso direto dos
clientes.

## Consequências

- **Positivas:** cada carga com desempenho e custo adequados; escala independente.
- **Negativas / custos:** mais tecnologias para operar; consistência entre stores
  precisa ser desenhada (o dado de analytics é eventual por design).
- **Riscos e mitigação:** duplicação/deriva de dados → PostgreSQL é a fonte da
  verdade transacional; DynamoDB/ES/Snowflake são *derivados* alimentados por
  eventos e reconstruíveis.

## Referência ao Linktree (engenharia reversa)

Confirmados **PostgreSQL**, **Elasticsearch** e **Snowflake** na stack. O blog de
engenharia do Linktree descreve **DynamoDB como camada de serving** entre o
warehouse e os analytics in-app — exatamente o papel atribuído aqui.
