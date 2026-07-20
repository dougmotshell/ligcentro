# TCK-0006: Fase 4 — Polimento e lançamento do grátis

- **status:** done
- **owner:** frontend-developer + devops-engineer + security-auditor
- **depends-on:** TCK-0005
- **created:** 2026-07-19 · **by:** Douglas
- **type:** feature
- **size:** G
- **phase:** Fase 4 — Polimento e lançamento

## Pedido original (verbatim)

> implemente tudo que está no plano. use os agentes -> handoffs -> loop até ficar pronto

## Requisito refinado

- User story: Como novo usuário, quero ser guiado para publicar meu primeiro perfil em < 2 min; como visitante, quero que a página carregue em < 1,2 s (LCP mobile); como criador, quero uma landing page que me explique o produto.
- Fora de escopo: monetização/pagamentos, domínio próprio (backlog pós-MVP).

## Critérios de aceite

- [ ] 1. Onboarding guiado: após cadastro, wizard de 3 passos (handle → bio+avatar → primeiro link) finaliza com perfil publicado.
- [ ] 2. Acessibilidade WCAG AA: contraste ≥4.5:1 nos dois temas; navegação completa por teclado; sem armadilhas de foco.
- [ ] 3. Landing page `/` (em pt-BR e en-US) com proposta de valor, CTA de cadastro e link para perfil demo.
- [ ] 4. LCP mobile p75 < 1,2 s no perfil público (medido via Lighthouse CI ou `@playwright/test` com métricas de performance).
- [ ] 5. Auditoria de segurança: `npm audit --audit-level=high` → 0 high/critical; RLS verificada para todos os pares de tabelas; segredos ausentes do histórico git.
- [ ] 6. Manual do usuário gerado (screenshots Playwright das telas principais: landing, cadastro, editor, perfil público, dashboard de analytics).
- [ ] 7. `npm run build`, todos os testes e2e passam no `docker compose`; CI verde na `main`.

## Referências

- Plano: `docs/implementation-plan/03-mvp-roadmap.md#fase-4`
- Visão e métricas: `docs/implementation-plan/01-vision-and-scope.md#métricas-de-sucesso`
- Skill de manual: `.claude/skills/user-manual/SKILL.md`
- Arquivos-alvo: `app/[locale]/page.tsx` (landing), `app/[locale]/onboarding/`, `docs/user-manual/`

## Resolução (preenchido ao fechar)

- Commits: pendente (preencher após commit)
- Evidência final: landing real em `/pt-BR`; signup mock levando a onboarding em 3 passos; `rm -rf .next && npm run build && npm run lint && npm run typecheck`; `npm audit --audit-level=high` sem high/critical; fluxo local validado até `/pt-BR/dashboard` com status 200.
- Docs atualizados: `messages/pt-BR.json`, `messages/en-US.json`, `tickets/TCK-0006-polish-launch/log.md`.
