# SPEC-002 — Gestão de Links

- **Status:** Aceito
- **Data:** 2026-07-19
- **Componente C4:** [Creator Editor](../c4/04-component-editor.md)
- **ADRs:** [0003](../adr/0003-backend-serverless-lambda.md), [0004](../adr/0004-api-graphql.md), [0005](../adr/0005-persistencia-poliglota.md)

## 1. Contexto e objetivo

O criador precisa adicionar, editar, remover, ativar/desativar e **reordenar** os
links da sua página, com feedback imediato e persistência confiável. Esta é a
principal ação de escrita do produto.

## 2. User stories

- **US-1** — Como **criador**, quero adicionar um link com título e URL, para
  divulgá-lo na minha página.
- **US-2** — Como **criador**, quero reordenar meus links por arrastar-e-soltar,
  para destacar o mais importante.
- **US-3** — Como **criador**, quero ativar/desativar um link sem apagá-lo, para
  reutilizá-lo depois.
- **US-4** — Como **criador**, quero que minhas mudanças reflitam na página pública
  rapidamente após publicar.

## 3. Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Gestão de links do criador

  Cenário: AC-1 — Adicionar link válido
    Dado um criador autenticado dono do perfil "ana"
    Quando ele adiciona um link título "Loja" e URL "https://loja.com"
    Então o link é criado com posição no fim da lista
    E aparece imediatamente no editor (atualização otimista)
    E é persistido no PostgreSQL

  Cenário: AC-2 — URL inválida é rejeitada
    Quando o criador tenta salvar um link com URL "javascript:alert(1)"
    Então a operação é rejeitada com erro de validação
    E nenhum link é criado

  Cenário: AC-3 — Reordenar links
    Dado os links ["A"(0), "B"(1), "C"(2)]
    Quando o criador move "C" para o topo
    Então a nova ordem persistida é ["C"(0), "A"(1), "B"(2)]
    E a UI reflete a ordem antes da confirmação do servidor

  Cenário: AC-4 — Desativar sem apagar
    Quando o criador desativa o link "B"
    Então "B" continua existindo com active=false
    E deixa de aparecer no perfil público (ver SPEC-001 AC-2)

  Cenário: AC-5 — Autorização por dono
    Dado um criador autenticado que NÃO é dono do perfil "ana"
    Quando ele tenta editar um link de "ana"
    Então a operação é negada com HTTP 403 / erro de autorização

  Cenário: AC-6 — Falha de rede reverte otimismo
    Dado que a mutation de reordenação falha no servidor
    Quando o erro é recebido
    Então a UI reverte para a ordem anterior
    E exibe uma mensagem de erro ao criador

  Cenário: AC-7 — Publicar invalida cache
    Quando o criador publica alterações
    Então o cache do perfil na CDN é invalidado
    E o perfil é reindexado no Elasticsearch
```

## 4. Contrato de API

```graphql
type Link { id: ID!, title: String!, url: String!, active: Boolean!, position: Int! }

mutation CreateLink($input: CreateLinkInput!) { createLink(input: $input) { id position } }
mutation UpdateLink($id: ID!, $input: UpdateLinkInput!) { updateLink(id: $id, input: $input) { id } }
mutation DeleteLink($id: ID!) { deleteLink(id: $id) { id } }
mutation ReorderLinks($profileId: ID!, $orderedIds: [ID!]!) { reorderLinks(profileId: $profileId, orderedIds: $orderedIds) { id position } }
mutation SetLinkActive($id: ID!, $active: Boolean!) { setLinkActive(id: $id, active: $active) { id active } }
```

## 5. Casos de borda e erros

| Caso | Comportamento |
|------|---------------|
| URL sem esquema (`loja.com`) | Normalizar para `https://` antes de salvar |
| Esquemas perigosos (`javascript:`, `data:`) | Rejeitar (segurança) |
| Título vazio | Rejeitar; título é obrigatório |
| Limite de links por plano | Bloquear criação acima do limite do plano; sugerir upgrade |
| Reordenação concorrente (duas abas) | Última escrita vence; refletir estado do servidor |
| Exclusão de link com histórico de cliques | Soft-delete; analytics histórico preservado |

## 6. Requisitos não-funcionais

- **RNF-1 (Segurança):** validar/sanitizar URLs; bloquear XSS via esquema de link.
- **RNF-2 (Autorização):** toda mutation valida que o solicitante é dono do perfil.
- **RNF-3 (UX):** operações refletem em < 100 ms na UI (otimista) com confirmação
  assíncrona.
- **RNF-4 (Consistência):** PostgreSQL é a fonte da verdade; derivados atualizados
  após publicação.

## 7. Fora de escopo

Aparência dos links/botões (ver [SPEC-003](./SPEC-003-aparencia-e-temas.md));
métricas de clique (ver [SPEC-004](./SPEC-004-analytics.md)).

## 8. Rastreabilidade

- Componentes: Link Manager, GraphQL Client — [C4-C3 Editor](../c4/04-component-editor.md).
- Persistência: PostgreSQL como fonte da verdade
  ([ADR-0005](../adr/0005-persistencia-poliglota.md)).
