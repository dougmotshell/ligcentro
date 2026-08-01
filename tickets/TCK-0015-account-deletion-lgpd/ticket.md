# TCK-0015: Exclusão de conta e dados (LGPD)

- **status:** triaged
- **owner:** backend-developer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** feature
- **size:** M
- **phase:** Fase 4 — Polimento e lançamento

## Pedido original (verbatim)

> use a skill dev-loop para implementar tudo, corrija o que for necessário

(Recorte: a exportação de dados existe, a exclusão não — direito de eliminação
da LGPD sem contrapartida no produto.)

## Requisito refinado

- User story: como titular dos meus dados, apago minha conta e tudo que é meu
  sai do produto, com confirmação explícita antes.
- Fora de escopo: período de retenção/undelete, exclusão em lote administrativa.

## Critérios de aceite (máx. 7, verificáveis)

- [ ] 1. Rota autenticada de exclusão remove perfil, blocos e analytics do titular (cascata verificada no Postgres local).
- [ ] 2. A exclusão encerra a sessão e remove o usuário no provedor de auth quando houver credencial de administração; sem ela, registra a pendência em log de aplicação e ainda apaga os dados de produto.
- [ ] 3. A UI exige confirmação digitando o handle antes de habilitar a exclusão (sem dark pattern, texto claro).
- [ ] 4. O handle volta a ficar disponível depois da exclusão.
- [ ] 5. Textos em i18n pt-BR + en-US.
- [ ] 6. Testes unitários cobrem a validação da confirmação e o efeito em cascata.
- [ ] 7. `npm run build`, `npm run lint`, `npm run typecheck` e `npm run test:unit` passam.

## Referências

- Plano: `docs/implementation-plan/05-analytics-privacy.md` · `AGENTS.md` regra 7 · Arquivos-alvo: `app/api/profile/**`, `app/[locale]/dashboard/**`, `lib/db/*`

## Resolução (preenchido ao fechar)

- Commits: · Evidência final: · Docs atualizados:
