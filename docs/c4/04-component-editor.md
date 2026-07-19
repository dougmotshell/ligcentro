# C4 — Nível 3: Componentes — Creator Editor (SPA)

> **Escopo:** decomposição interna do contêiner **Creator Editor**, o painel
> autenticado onde o criador monta e gerencia sua página.

## Diagrama

```mermaid
flowchart TB
    api["⚙️ API GraphQL"]
    oauth["🔐 OAuth"]

    subgraph editor["Contêiner: Creator Editor (SPA React)"]
        auth["🔐 Auth Module<br/>Login OAuth + sessão/token"]
        linkmgr["🔗 Link Manager<br/>CRUD e reordenação de links"]
        appearance["🎨 Appearance Editor<br/>Tema, cores, fontes, botões, fundo"]
        preview["👁️ Live Preview<br/>Renderiza o perfil em tempo real"]
        dashboard["📊 Analytics Dashboard<br/>Views, cliques, CTR por link"]
        settings["⚙️ Account/Billing<br/>Plano, domínio, conta"]
        gqlclient["🔌 GraphQL Client<br/>Cache normalizado + mutations"]
        designsys["🧱 Design System<br/>Componentes (Storybook)"]
    end

    auth -->|"login"| oauth
    linkmgr --> gqlclient
    appearance --> gqlclient
    dashboard --> gqlclient
    settings --> gqlclient
    gqlclient <-->|"queries/mutations"| api
    appearance -->|"tokens de tema"| preview
    linkmgr -->|"lista de links"| preview
    linkmgr --> designsys
    appearance --> designsys
    preview --> designsys
```

## Componentes

| Componente | Responsabilidade | Notas de design |
|-----------|------------------|-----------------|
| **Auth Module** | Login social (OAuth), sessão e renovação de token | Ver [SPEC-002](../specs/SPEC-002-gestao-de-links.md) para autorização por perfil |
| **Link Manager** | Criar, editar, remover, ativar/desativar e **reordenar** links (drag-and-drop) | Ordem persistida; otimista na UI, confirmada por mutation |
| **Appearance Editor** | Editar design tokens do tema (cores, fontes, botões, fundo) | Alimenta o `ThemeProvider` compartilhado ([ADR-0007](../adr/0007-theming-styled-components.md)) |
| **Live Preview** | Renderizar o perfil como o visitante verá, em tempo real | Usa a **mesma engine de tema** do SSR — WYSIWYG fiel |
| **Analytics Dashboard** | Exibir views, cliques e CTR por link e por período | Lê contadores do DynamoDB via GraphQL ([SPEC-004](../specs/SPEC-004-analytics.md)) |
| **Account/Billing** | Gerir plano, domínio personalizado e dados da conta | Integra com gateway de pagamentos |
| **GraphQL Client** | Cache normalizado, atualizações otimistas, dedupe de queries | Um único ponto de acesso à API |
| **Design System** | Biblioteca de componentes documentada em Storybook | Reutilizada entre editor e perfil |

## Decisões locais

- **Preview = produção.** O Live Preview reaproveita a engine de tema do SSR, então
  o que o criador vê no editor é exatamente o que o visitante recebe.
- **Atualizações otimistas.** Reordenar links e trocar cores refletem na hora na UI;
  a mutation confirma em segundo plano e reverte em caso de erro.
- **Publicação invalida cache.** Salvar mudanças dispara invalidação do HTML do
  perfil na CDN e reindexação no Elasticsearch (ver [C2](./02-container.md)).
