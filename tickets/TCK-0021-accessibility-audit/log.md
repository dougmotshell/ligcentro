# Log — TCK-0021: Auditoria de acessibilidade AA da interface inteira

> Append-only.

## [1] ACTION — 2026-08-15 — ui-ux-designer

- Ação: Montei `e2e/accessibility.spec.ts` com axe-core sobre Playwright,
  varrendo landing, login, cadastro (pt-BR e en-US), onboarding, as quatro abas
  do dashboard, analytics e perfil público — **nos dois temas**, contra as regras
  `wcag2a`, `wcag2aa`, `wcag21a` e `wcag21aa`. Mais um teste de navegação por
  teclado que percorre o cadastro e exige indicação de foco em cada controle.
- Motivo: Critérios 1, 2, 4 e 6.
- Resultado: a primeira execução falhou nos 4 cenários — a auditoria encontrou
  defeitos reais, listados abaixo.

## [2] ACTION — 2026-08-15 — frontend-developer

Três defeitos reais, todos sistêmicos:

**(a) `<html>` sem `lang` em todo o site** (WCAG 3.1.1, nível A). O comentário do
`[locale]/layout.tsx` afirmava definir o atributo "para SEO correto", mas esse
layout nunca renderiza a tag `<html>` — quem renderiza é o layout raiz, e sem
`lang`. Resultado: leitor de tela pronuncia português com os fonemas do idioma
padrão do sistema. Corrigido lendo o locale resolvido (`getLocale()`) no layout
raiz; o comentário mentiroso do layout de locale foi trocado por um que explica
onde o atributo mora.

**(b) Cor primária reprovando AA por uma casa decimal.** `#6366f1` com texto
branco dá **4,46:1**, contra 4,5:1 exigido — e isso vale para todo botão e link
primário do produto. No tema escuro era pior: branco sobre `#818cf8` dá 2,98:1.
Corrigido no token, não no componente: claro passou a `#4f46e5` (6,29:1) e no
escuro o texto sobre a primária virou quase preto (6,67:1). Travado por
`app/theme-tokens.test.ts`, que lê o `globals.css` de verdade e verifica cada par
texto/fundo dos dois temas, mais o anel de foco (3:1, WCAG 1.4.11).

**(c) Gráfico de analytics mudo para leitor de tela.** As 30 barras eram `div`s
com `aria-label` e sem `role` — a especificação manda ignorar `aria-label` em
elemento genérico, então nenhum dos 30 rótulos era anunciado. Corrigido: o
gráfico virou uma imagem única com rótulo próprio (`role="img"`) e ganhou uma
tabela equivalente em `sr-only` com os mesmos números. Trinta "imagens" seguidas
também não seria leitura útil.

**(d) Perfil público misturava dois sistemas de tema.** O cartão usava
`bg-white/80 dark:bg-gray-900/80` — semitransparente e sensível à preferência do
**visitante** — sobre o fundo escolhido pelo **dono**. Visitante em modo escuro
num perfil de tema claro compunha `#414652` com texto `#9ca3af`: 3,72:1. A página
é do criador, então quem manda nas cores é o tema dele: criei
`lib/theme/surface.ts`, que deriva superfície e cores de texto do fundo do tema,
com AA garantido. `lib/theme/surface.test.ts` varre os presets e uma grade de 125
cores arbitrárias — a customização aceita hex livre, então o contraste precisa
valer para qualquer cor, não só para as do catálogo.

- Resultado: **zero violações A/AA** nas telas cobertas, nos dois temas.

## [3] CORRECTION — 2026-08-15 — qa-validator

- Ação: Uma das violações relatadas na segunda rodada era artefato do teste, não
  defeito: o axe media a aba do dashboard **durante a transição CSS** e acusava
  contraste de 1,63:1 entre dois estados intermediários de fade. Em repouso, a
  mesma aba dá 6,29:1.
- Correção: a auditoria passa a congelar transições e animações antes de medir.
  Registrado como correção porque tratar isso como defeito de cor teria levado a
  mudar um token que estava certo.

## [4] ACTION — 2026-08-15 — qa-validator

- Ação: Validação final.
- Resultado: `npm run test:a11y` → **5/5 verde** (2 temas × 2 grupos de telas +
  teclado); 105 testes unitários; suíte e2e completa verde, incluindo o fluxo
  crítico — as mudanças de cor e de superfície não alteraram comportamento.
- Veredito: **aprovado**. Critérios 1 a 6 atendidos.
- Lição: L-018 (registrada) — "acessibilidade verificada" sem teste executável
  significa verificada uma vez; três dos quatro defeitos existiam desde a
  primeira versão da tela e nenhum apareceu em revisão visual.
