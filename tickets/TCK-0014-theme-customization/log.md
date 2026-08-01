# Log — TCK-0014: Customização de tema e catálogo de botões de marca

> Append-only.

## [1] ACTION — 2026-08-01 10:00 — tech-lead
- Ação: Triagem do ticket, recortado da análise do repositório de 2026-08-01 (defeitos e lacunas contra o roadmap e as regras do AGENTS.md).
- Motivo: O pedido "implementar tudo" foi dividido em tickets com dono único e critérios verificáveis, conforme a regra 1 do tech-lead.
- Resultado: critérios de aceite definidos; status `triaged`. Memória lida: `agents/memory/context/` da área + `lessons.md` (L-001 a L-004).

## [2] HANDOFF — 2026-08-01 10:05 — tech-lead → frontend-developer
- De: tech-lead → Para: frontend-developer
- Status novo: in_progress
- O que foi feito: Triagem e definição dos critérios de aceite.
- Artefatos: `ticket.md`.
- Como validar: critérios de aceite do ticket, cada um com evidência executável.
- Pendências e riscos: nenhum insumo externo pendente; validação roda no Postgres do `docker compose`.
- Critérios de aceite: [ ] todos abertos.
- Briefing para o próximo agente:
  - Objetivo imediato: estender `ThemeConfig` e a normalização antes de mexer na UI — perfis existentes têm tema sem os campos novos.
  - Contexto essencial: `normalizeTheme` já é o ponto único de saneamento; manter a compatibilidade por ali evita migração destrutiva.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 16:20 — frontend-developer
- Ação: `ThemeConfig` ganhou `font`, `buttonShape` e `useBrandColors`; `normalizeTheme` valida cor em hexadecimal e preenche campos ausentes pelo preset; `getButtonStyle` centraliza o estilo dos três tipos de bloco; catálogo `brand-colors.ts`; perfil público aplica a fonte; `ThemeSelector` com seletor de cor + hexadecimal digitado, fonte, formato e opção de cores de marca; textos em pt-BR/en-US.
- Motivo: Critérios 1 a 6.
- Resultado: ok — `PUT` com `bg` malicioso (`red; background-image:url(...)`) volta com o valor do preset; fonte serifada, `border-radius:9999px` e `#c13584` (Instagram) presentes no HTML público.

## [4] REJECT — 2026-08-01 16:30
- De: code-reviewer → Para: frontend-developer · Loop nº: 1/3
- Defeitos (numerados):
  1. `components/blocks/brand-colors.ts` — duas cores reprovam AA para texto normal com texto branco: Twitter `#1d9bf0` dá **3,00:1** e Facebook `#1877f2` dá **4,23:1**, contra os 4,5:1 exigidos. O rótulo do bloco é texto de tamanho normal, então o limiar de texto grande (3:1) não se aplica. Viola o critério 5.
- O que já está bom (não refazer): validação de cor em hexadecimal no ponto único de normalização (fecha a porta de valor arbitrário de CSS); fontes como pilha do sistema, sem webfont; compatibilidade de tema antigo sem migração.

## [5] ACTION — 2026-08-01 16:40 — frontend-developer
- Ação: Twitter escurecido 21% (`#167abd`, 4,61:1) e Facebook 4% (`#1772e8`, 4,56:1), com o motivo comentado no arquivo; criado `brand-colors.test.ts` que calcula o contraste WCAG de **todo** par do catálogo e falha abaixo de 4,5:1.
- Motivo: Defeito 1 do loop 1.
- Resultado: ok — 8 marcas passam em AA; 78 testes.
- Lição: L-013 (registrada).

## [6] ACTION — 2026-08-01 16:45 — qa-validator
- Ação: Validação dos critérios.
- Resultado: C1 quatro escolhas no editor, com validação server-side comprovada (cor inválida cai no preset). C2 perfil público aplica fonte (`ui-serif, Georgia...`), formato (`border-radius:9999px`) e as cores; nenhuma requisição de webfont. C3 `#c13584` no botão do Instagram com `useBrandColors`, cor do tema sem. C4 tema antigo sem os campos novos normaliza para o preset (teste dedicado), sem migração. C5 textos nos dois locales; contraste AA verificado por teste em todo o catálogo. C6 78 testes. C7 build, lint (0 erros), typecheck.
- Veredito: **aprovado**.
