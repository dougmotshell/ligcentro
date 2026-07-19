# SPEC-004 — Analytics de Views e Cliques

- **Status:** Aceito
- **Data:** 2026-07-19
- **Componente C4:** [Analytics Pipeline](../c4/05-component-analytics.md)
- **ADRs:** [0005](../adr/0005-persistencia-poliglota.md), [0006](../adr/0006-pipeline-analytics-eventos.md)

## 1. Contexto e objetivo

Cada visualização de perfil e clique em link gera um evento. O sistema deve
capturar esses eventos sem impactar a experiência do visitante, agregá-los em
contadores near-real-time para o dashboard do criador e persistir o histórico no
warehouse para relatórios — tudo respeitando privacidade.

## 2. User stories

- **US-1** — Como **criador**, quero ver quantas visualizações e cliques minha
  página teve, para medir alcance.
- **US-2** — Como **criador**, quero ver o CTR por link e por período, para saber
  o que engaja.
- **US-3** — Como **visitante**, quero que o rastreamento não me atrase nem exponha
  meus dados pessoais.

## 3. Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Captura e exibição de analytics

  Cenário: AC-1 — Contagem de visualização
    Quando um visitante humano carrega o perfil "ana"
    Então um evento "ProfileViewed" com event_id único é publicado no EventBridge
    E o contador de views de "ana" é incrementado no DynamoDB (near-real-time)

  Cenário: AC-2 — Contagem de clique
    Quando um visitante clica no link "Loja" de "ana"
    Então um evento "LinkClicked" é publicado
    E o contador de cliques do link "Loja" é incrementado

  Cenário: AC-3 — Idempotência
    Dado que o mesmo evento (mesmo event_id) chega duas vezes (retry)
    Quando o Aggregator o processa
    Então o contador é incrementado apenas uma vez

  Cenário: AC-4 — Filtro de bots
    Quando o acesso é identificado como bot/crawler
    Então o evento é descartado e não conta como visualização

  Cenário: AC-5 — Dashboard do criador
    Dado um criador autenticado dono de "ana"
    Quando ele abre o dashboard
    Então vê views totais, cliques por link e CTR do período selecionado
    E os números vêm do serving layer (DynamoDB) via GraphQL

  Cenário: AC-6 — Histórico no warehouse
    Quando os eventos do dia são processados em batch
    Então os eventos brutos estão no S3 particionados por data
    E foram transformados via Glue e carregados no Snowflake

  Cenário: AC-7 — Resiliência (DLQ)
    Dado que o processamento de um evento falha após os retries
    Quando o evento é descartado do fluxo principal
    Então ele vai para a Dead Letter Queue
    E pode ser reprocessado a partir do S3

  Cenário: AC-8 — Privacidade
    Quando um evento é enriquecido com geo/device
    Então nenhum dado pessoal identificável (PII) é persistido
    E os dados são armazenados de forma agregada/anonimizada
```

## 4. Contrato de eventos

```jsonc
// Envelope publicado no EventBridge
{
  "type": "ProfileViewed" | "LinkClicked",
  "eventId": "uuid",              // idempotência (AC-3)
  "profileId": "...",
  "linkId": "...",                // apenas em LinkClicked
  "ts": 1737000000,
  "context": {                    // anonimizado (AC-8)
    "country": "BR",
    "device": "mobile",
    "referrerHost": "instagram.com"
  }
}
```

**Leitura (dashboard):**
```graphql
query ProfileAnalytics($profileId: ID!, $range: DateRange!) {
  analytics(profileId: $profileId, range: $range) {
    views
    clicks
    ctr
    perLink { linkId title clicks ctr }
  }
}
```

## 5. Casos de borda e erros

| Caso | Comportamento |
|------|---------------|
| Beacon falha no cliente | Redirecionamento não é afetado (ver [SPEC-001](./SPEC-001-perfil-publico.md) AC-6) |
| Pico de tráfego (link viral) | Ingestão desacoplada absorve; contadores atualizam com atraso aceitável |
| Relógio do cliente incorreto | Timestamp autoritativo é atribuído na ingestão |
| Divergência serving × warehouse | Snowflake é a verdade histórica; DynamoDB é aproximado/near-real-time |

## 6. Requisitos não-funcionais

- **RNF-1 (Latência de ingestão):** o Tracking Endpoint responde sem bloquear a
  navegação; publica e retorna.
- **RNF-2 (Consistência):** contadores in-app são **eventualmente consistentes**;
  documentar a janela esperada.
- **RNF-3 (Privacidade/LGPD):** sem PII; anonimização no Enricher; retenção
  definida por política.
- **RNF-4 (Confiabilidade):** sem perda silenciosa — DLQ + replay a partir do S3.
- **RNF-5 (Escala):** absorver picos de perfis virais sem degradar o perfil público.

## 7. Fora de escopo

Exibição do perfil (ver [SPEC-001](./SPEC-001-perfil-publico.md)); BI avançado e
exportações (camada Snowflake, tratada em specs futuras).

## 8. Rastreabilidade

- Componentes: Tracking Endpoint (Validator/Enricher/Publisher), EventBridge,
  Aggregator, DynamoDB, S3, Glue, Snowflake, DLQ —
  [C4-C3 Analytics](../c4/05-component-analytics.md).
- Decisões: pipeline de eventos
  ([ADR-0006](../adr/0006-pipeline-analytics-eventos.md)), persistência poliglota
  ([ADR-0005](../adr/0005-persistencia-poliglota.md)).
