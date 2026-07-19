# ADR-0004 — GraphQL como camada de API

- **Status:** Aceito
- **Data:** 2026-07-19
- **Decisores:** Time LikHub
- **Contexto técnico:** Contêiner *API Gateway / GraphQL* (C4-C2)

## Contexto e problema

Temos múltiplos clientes (perfil público SSR, editor SPA, futuros apps mobile) que
precisam de conjuntos de dados diferentes sobre as mesmas entidades (perfil, links,
tema, analytics). REST tende a gerar over/under-fetching e proliferação de
endpoints versionados.

## Alternativas consideradas

1. **REST** — simples e cacheável por HTTP, mas rígido; muitos endpoints e
   round-trips para telas ricas como o editor.
2. **GraphQL** — o cliente pede exatamente os campos que precisa; um schema
   tipado único; evolução sem versionamento de URL. Custo: caching e proteção
   contra queries abusivas.
3. **tRPC/RPC tipado** — ótimo DX em monólitos TypeScript, mas acopla cliente e
   servidor e é menos amigável a clientes heterogêneos.

## Decisão

Expor uma **API GraphQL** como contrato único entre clientes e backend, servida
por Lambda (ver [ADR-0003](./0003-backend-serverless-lambda.md)). Schema tipado
compartilhado com o frontend TypeScript. Persistência resolvida por *resolvers*
que falam com os data stores (ver [ADR-0005](./0005-persistencia-poliglota.md)).

Mitigações obrigatórias: *persisted queries* + limite de profundidade/complexidade
+ rate limiting no gateway.

## Consequências

- **Positivas:** um contrato para todos os clientes; sem versionamento de URL;
  o editor busca telas ricas em uma requisição.
- **Negativas / custos:** caching mais complexo que REST; risco de queries caras;
  necessidade de tooling (codegen, tracing por resolver).
- **Riscos e mitigação:** queries abusivas → persisted queries + análise de
  complexidade; N+1 → *dataloaders* por request.

## Referência ao Linktree (engenharia reversa)

**GraphQL** e **Node.js** constam na stack divulgada do Linktree, consistente com
uma API única servindo perfil público e o painel do criador.
