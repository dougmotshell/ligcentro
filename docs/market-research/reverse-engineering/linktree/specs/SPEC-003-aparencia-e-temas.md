# SPEC-003 — Aparência e Temas

- **Status:** Aceito
- **Data:** 2026-07-19
- **Componente C4:** [Creator Editor](../c4/04-component-editor.md) / [Public Profile Web](../c4/03-component-profile.md)
- **ADRs:** [0007](../adr/0007-theming-styled-components.md)

## 1. Contexto e objetivo

O criador personaliza a aparência do perfil: tema base, cores, tipografia, estilo
de botão, fundo e avatar. O tema é um conjunto de **design tokens** aplicado de
forma idêntica no preview do editor e no SSR do perfil público.

## 2. User stories

- **US-1** — Como **criador**, quero escolher um tema pronto, para começar rápido.
- **US-2** — Como **criador**, quero ajustar cores, fonte e formato de botão, para
  refletir minha marca.
- **US-3** — Como **criador**, quero ver o resultado em tempo real antes de publicar,
  para ter confiança no que vou mostrar.

## 3. Critérios de aceitação (Gherkin)

```gherkin
Funcionalidade: Personalização de aparência

  Cenário: AC-1 — Aplicar tema pronto
    Dado um criador no editor de aparência
    Quando ele seleciona o tema "Midnight"
    Então os tokens do perfil passam a ser os do tema "Midnight"
    E o preview atualiza imediatamente

  Cenário: AC-2 — Customizar cor de botão
    Quando o criador altera a cor do botão para "#FF5A5F"
    Então o token de cor de botão é atualizado
    E o preview reflete a nova cor sem recarregar

  Cenário: AC-3 — Preview fiel ao público
    Dado um tema customizado no editor
    Quando o criador compara o preview com o perfil público publicado
    Então ambos usam a mesma engine de tema e renderizam identicamente

  Cenário: AC-4 — Contraste acessível
    Quando o criador escolhe cores de texto e fundo com contraste abaixo de WCAG AA
    Então o editor exibe um aviso de acessibilidade
    E sugere um ajuste

  Cenário: AC-5 — Publicar tema
    Quando o criador publica o novo tema
    Então os tokens são persistidos no PostgreSQL
    E o cache do perfil é invalidado (ver SPEC-002 AC-7)
```

## 4. Contrato de dados (design tokens)

```jsonc
// theme.tokens — persistido no PostgreSQL, servido via GraphQL (SPEC-001)
{
  "base": "midnight",
  "color": { "background": "#0B0B1A", "text": "#FFFFFF", "button": "#FF5A5F", "buttonText": "#FFFFFF" },
  "font":  { "family": "Inter", "scale": 1.0 },
  "button": { "shape": "rounded", "fill": "solid", "shadow": "soft" },
  "background": { "type": "solid" }   // solid | gradient | image
}
```

O mesmo objeto alimenta o `ThemeProvider` (styled-components) no **editor** e no
**SSR** ([ADR-0007](../adr/0007-theming-styled-components.md)).

## 5. Casos de borda e erros

| Caso | Comportamento |
|------|---------------|
| Token com valor inválido (cor malformada) | Rejeitar na validação; manter valor anterior |
| Fonte não suportada | Fallback para fonte segura da mesma família |
| Imagem de fundo muito pesada | Otimizar/limitar tamanho; avisar o criador |
| Temas premium em plano free | Bloquear seleção; sugerir upgrade |

## 6. Requisitos não-funcionais

- **RNF-1 (Desempenho):** aplicar tema no SSR com **extração de CSS crítico** para
  não regredir o first-paint (ver [C4-C3 Profile](../c4/03-component-profile.md)).
- **RNF-2 (Acessibilidade):** validar contraste (WCAG AA) e avisar o criador.
- **RNF-3 (Consistência):** editor e público compartilham a mesma engine e os
  mesmos tokens — sem divergência de renderização.

## 7. Fora de escopo

CRUD de links (ver [SPEC-002](./SPEC-002-gestao-de-links.md)); catálogo comercial de
temas premium (billing).

## 8. Rastreabilidade

- Componentes: Appearance Editor, Live Preview, Theme Engine, Critical CSS Extractor.
- Decisão: theming com styled-components + tokens
  ([ADR-0007](../adr/0007-theming-styled-components.md)).
