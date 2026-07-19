# SPEC-001 — Página de Perfil Público

- **Status:** Aceito
- **Data:** 2026-07-19
- **Componente C4:** [Public Profile Web](../c4/03-component-profile.md)
- **ADRs:** [0002](../adr/0002-frontend-react-ssr.md), [0007](../adr/0007-theming-styled-components.md)

## 1. Contexto e objetivo

A página `likhub.com/<username>` é a URL que o criador coloca na bio. Ela deve
carregar quase instantaneamente, exibir os links ativos na ordem definida, aplicar
o tema do criador e registrar visualizações e cliques — tudo sem exigir login do
visitante.

## 2. User stories

- **US-1** — Como **visitante**, quero abrir a página de um criador e ver seus links
  imediatamente, para acessar o destino que procuro.
- **US-2** — Como **visitante**, quero que ao compartilhar a URL apareça um preview
  bonito (imagem, título, descrição), para dar contexto.
- **US-3** — Como **criador**, quero que apenas meus links **ativos** apareçam, na
  ordem que defini, para controlar minha página.

## 3. Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Exibição do perfil público

  Cenário: AC-1 — Perfil existente e ativo
    Dado um criador com username "ana" e perfil publicado
    E os links ativos ["Loja", "YouTube", "Contato"] nessa ordem
    Quando um visitante acessa "likhub.com/ana"
    Então a página responde com HTTP 200
    E o HTML já contém os 3 links na ordem definida (renderizado no servidor)
    E o tema do criador está aplicado no HTML inicial

  Cenário: AC-2 — Links inativos não aparecem
    Dado que o link "Contato" está marcado como inativo
    Quando um visitante acessa "likhub.com/ana"
    Então "Contato" não aparece na página
    E apenas os links ativos são renderizados

  Cenário: AC-3 — Username inexistente
    Quando um visitante acessa "likhub.com/naoexiste"
    Então a página responde com HTTP 404
    E exibe uma página de "perfil não encontrado" indexável como 404

  Cenário: AC-4 — Preview social
    Quando um crawler acessa "likhub.com/ana"
    Então o HTML contém meta tags Open Graph (og:title, og:image, og:description)
    E contém Twitter Card
    E contém dados estruturados JSON-LD

  Cenário: AC-5 — Registro de visualização
    Quando um visitante humano carrega "likhub.com/ana"
    Então um evento "ProfileViewed" é enviado ao Tracking Endpoint
    E o carregamento da página não é bloqueado por esse envio

  Cenário: AC-6 — Clique em link
    Dado que o visitante está na página de "ana"
    Quando ele clica no link "Loja"
    Então ele é redirecionado ao destino imediatamente
    E um evento "LinkClicked" é enviado via beacon em paralelo
    E uma falha no envio do beacon não impede o redirecionamento

  Cenário: AC-7 — Degradação graciosa
    Dado que o serviço de analytics está indisponível
    Quando um visitante acessa "likhub.com/ana"
    Então a página ainda carrega e os links funcionam normalmente
```

## 4. Contrato de API

**Query (SSR / leitura):**
```graphql
query PublicProfile($username: String!) {
  profile(username: $username) {
    displayName
    avatarUrl
    bio
    theme { tokens }          # design tokens (ver SPEC-003)
    links(activeOnly: true) { # já ordenados
      id
      title
      url
      position
    }
  }
}
```

**Evento (tracking):**
```jsonc
// POST /track  (sendBeacon)
{ "type": "LinkClicked", "profileId": "...", "linkId": "...", "eventId": "uuid", "ts": 1737000000 }
```

## 5. Casos de borda e erros

| Caso | Comportamento esperado |
|------|------------------------|
| Perfil desativado/suspenso | HTTP 404 (ou página de indisponível), sem vazar dados |
| Username com maiúsculas/acentos | Normalizar para o slug canônico e redirecionar 301 |
| Colisão com rota de sistema (`/templates`) | Rota de sistema tem precedência; nunca tratada como username |
| Link com URL malformada | Não renderizar como clicável; logar para o criador |
| Cache stale após edição | Publicação invalida o cache do perfil (ver [C2](../c4/02-container.md)) |

## 6. Requisitos não-funcionais

- **RNF-1 (Desempenho):** First Contentful Paint < 1,5 s em 4G; HTML servido por
  CDN em cache hit.
- **RNF-2 (SEO):** página indexável, com meta tags e sitemap de perfis.
- **RNF-3 (Acessibilidade):** WCAG 2.1 AA; navegação por teclado; contraste do tema
  validado.
- **RNF-4 (Privacidade):** tracking sem PII; respeitar sinais de não-rastreamento.
- **RNF-5 (Resiliência):** perfil funciona mesmo com analytics/derivados fora do ar.

## 7. Fora de escopo

Edição de links (ver [SPEC-002](./SPEC-002-gestao-de-links.md)); configuração de
tema (ver [SPEC-003](./SPEC-003-aparencia-e-temas.md)); dashboard de métricas
(ver [SPEC-004](./SPEC-004-analytics.md)).

## 8. Rastreabilidade

- Componentes: Route Handler, Profile Data Loader, SSR Renderer, SEO/Meta Builder,
  Click Tracker — em [C4-C3 Profile](../c4/03-component-profile.md).
- Decisões: SSR ([ADR-0002](../adr/0002-frontend-react-ssr.md)), tema
  ([ADR-0007](../adr/0007-theming-styled-components.md)).
