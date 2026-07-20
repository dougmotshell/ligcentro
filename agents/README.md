# Agentes de IA do Projeto — Índice

> Definições **canônicas e agnósticas de ferramenta** dos agentes que trabalham no **ligcentro** (produto link-in-bio). Cada arquivo segue o padrão de mercado: markdown com frontmatter YAML (`name`, `description`) + corpo com papel, responsabilidades e regras — legível por Claude Code (subagents), Copilot, Codex, Gemini, GPT ou qualquer orquestrador.
>
> **Claude Code:** `.claude/agents/` aponta para esta pasta (symlink) — os agentes ficam invocáveis nativamente. **Outras ferramentas:** carregue o arquivo do agente como system prompt/instructions da sessão.

## Como o sistema funciona (visão de 1 minuto)

1. O mantenedor (Douglas) cria um **ticket** com a skill `/ticket` → nasce `tickets/TCK-NNNN/` com `ticket.md` (pedido + critérios de aceite) e `log.md` (auditoria append-only).
2. O **tech-lead** recebe todo ticket: analisa, refina critérios com o **product-analyst** se preciso, e faz **handoff** ao agente responsável.
3. Cada agente trabalha, **registra tudo no log** e faz handoff conforme o [protocolo](handoff-protocol.md) — implementação → **code-reviewer** → **qa-validator**. Reprovou? Volta ao agente anterior com defeitos listados (loop). Aprovou nos critérios de aceite? `done`. **A cadeia é automática**: handoff registrado = próximo agente executa na hora; o fluxo inteiro roda sem o Douglas invocar nada e só para em `done` ou `blocked: human-input`. Tickets independentes correm **em paralelo**: agente ocupado spawna um subagente de si mesmo (`<agente>#N`) para assumir o ticket novo — ver [protocolo, seção Subagentes](handoff-protocol.md#subagentes-delegação-e-paralelismo).
4. **Auditoria:** nenhuma ação sem registro no `log.md` do ticket; commits sempre referenciam o ticket (`TCK-NNNN:`); logs são append-only. O que é **generalizável** vira memória permanente: lições em [`agents/memory/lessons.md`](memory/lessons.md) e contexto operacional por área em [`agents/memory/context/`](memory/context/).
5. **Observação e controle:** o Douglas acompanha os markdowns dos tickets e toma as decisões humanas do protocolo diretamente no fluxo — criar ticket (`/ticket`), handoff (`/handoff`), reprovar e **parar** (entrada `STOP` no `log.md`).

## Agentes

| Agente | Área exclusiva | Recebe de | Entrega para |
|---|---|---|---|
| [tech-lead](tech-lead.md) | Triagem, orquestração, decisões técnicas, desbloqueio | Douglas (tickets), qualquer agente travado | Todos |
| [product-analyst](product-analyst.md) | Requisitos: refinar pedido vs. planos de implementação, critérios de aceite | tech-lead | tech-lead |
| [frontend-developer](frontend-developer.md) | App Next.js (App Router), perfil público SSR/SSG, editor, temas, i18n, landing | tech-lead | code-reviewer |
| [backend-developer](backend-developer.md) | Supabase (Postgres/RLS/Auth/Storage), Route Handlers/API, ingestão de analytics, integrações | tech-lead | code-reviewer |
| [code-reviewer](code-reviewer.md) | Revisão de código (correção, segurança, convenções) | devs | qa-validator ou devolve ao dev |
| [qa-validator](qa-validator.md) | Validação contra critérios de aceite; e2e Playwright | code-reviewer | done ou devolve (loop) |
| [devops-engineer](devops-engineer.md) | CI/CD, docker compose, deploy Vercel (hoje) / VPS (amanhã), monitoramento | tech-lead | code-reviewer |
| [ui-ux-designer](ui-ux-designer.md) | Design system, fluxos UX, acessibilidade, landing | tech-lead, product-analyst | frontend-developer |
| [security-auditor](security-auditor.md) | RLS, LGPD, segredos, dependências (revisão por ticket) | tech-lead | tech-lead |
| [docs-writer](docs-writer.md) | Docs do repo, manual do usuário (Playwright screenshots), changelog | qa-validator (pós-done), tech-lead | tech-lead |

### Squad de marketing (`agents/marketing/`) — crescimento, conteúdo e conversão

| Agente | Área exclusiva | Skills |
|---|---|---|
| [seo-specialist](marketing/seo-specialist.md) | SEO técnico, keywords LATAM, Core Web Vitals, schema.org, sitemap | [`/seo-audit`](../.claude/skills/seo-audit/SKILL.md) |
| [digital-marketer](marketing/digital-marketer.md) | Growth (AARRR), funis, e-mail marketing, CRO, campanhas | [`/campaign`](../.claude/skills/campaign/SKILL.md) |
| [copywriter](marketing/copywriter.md) | Todos os textos: UI microcopy, landing page, e-mails, ads, CTAs | [`/copy`](../.claude/skills/copy/SKILL.md) · [`/content-review`](../.claude/skills/content-review/SKILL.md) |
| [sales-specialist](marketing/sales-specialist.md) | Funil de upgrade free→Pro, pricing, checkout, retenção de pagantes | — |
| [content-marketer](marketing/content-marketer.md) | Blog, tutoriais, cases, newsletter — conteúdo médio/longo | — |
| [social-media-manager](marketing/social-media-manager.md) | Instagram, TikTok, LinkedIn, Twitter/X — estratégia, posts, comunidade | — |

Referências: [README da squad](marketing/README.md) · [Voz da marca](../docs/marketing/brand-voice.md) · [Personas](../docs/marketing/personas.md) · [Mensagens-chave](../docs/marketing/key-messages.md) · [Pilares de conteúdo](../docs/marketing/content-pillars.md) · [Contexto de memória](memory/context/marketing.md)

### Squad de segurança (`agents/security/`) — auditorias periódicas

| Agente | Área exclusiva | Papel no ciclo |
|---|---|---|
| [devsecops-engineer](security/devsecops-engineer.md) | Segurança no CI/CD, segredos, hardening, **coordenação** da squad | Orquestra auditorias, prioriza achados, abre issues/PRs |
| [red-team](security/red-team.md) | Ofensiva ética (em ambiente autorizado), PoC, modelagem de ameaças | Ataca e reporta |
| [blue-team](security/blue-team.md) | Detecção, logging, monitoramento, resposta a incidente | Valida se o ataque seria detectado; endurece |
| [security-researcher](security/security-researcher.md) | Hacker ético: CVEs, fuzzing, classes de ataque, disclosure | Pesquisa contínua e prospectiva |

Operação: [security-audit-protocol](security/security-audit-protocol.md) + [security-workflow](security/security-workflow.md) (achado → issue → PR → reteste). Agendamento automatizado no CI ([.github/workflows/security-audit.yml](../.github/workflows/security-audit.yml)).

## Regras globais (valem para todos os agentes)

1. **Log ou não aconteceu:** toda ação relevante → entrada no `log.md` do ticket (formato no [protocolo](handoff-protocol.md)). Append-only: nunca editar/apagar entradas anteriores.
2. **Escopo exclusivo:** agente não mexe na área de outro; se precisar, handoff.
3. **Critérios de aceite são a definição de pronto** — não a opinião do agente.
4. **Loop limitado:** 3 devoluções no mesmo par de agentes → escalar ao tech-lead; tech-lead travado → escalar ao Douglas (marcar `blocked: human-input`).
5. **Convenções do repo:** código/arquivos/commits en-US, textos/docs pt-BR; **custo baixo/free tier** e **portabilidade** são inegociáveis (ver [`docs/implementation-plan/02-architecture.md`](../docs/implementation-plan/02-architecture.md)). Os planos em `docs/implementation-plan/` e os ADRs do ligcentro (a serem criados) são a referência.
6. Commits: `TCK-NNNN: <descrição imperativa>`; um ticket pode ter N commits, mas nenhum commit sem ticket (exceto hotfix documentado a posteriori).
7. **Handoff executa, não espera:** registrado o handoff, o próximo agente assume imediatamente no mesmo fluxo. O Douglas só é acionado em `done` (relatório) ou `blocked: human-input` (perguntas).
8. **Agente ocupado não enfileira — spawna:** todo agente pode invocar **subagentes** ([protocolo](handoff-protocol.md#subagentes-delegação-e-paralelismo)) — instância do próprio tipo (`<agente>#N`) para assumir ticket novo da sua área enquanto trabalha, ou para paralelizar subtarefas. Subagente herda todas as regras; área de outro agente continua sendo handoff, nunca subagente. Spawn que altera artefatos → entrada `SPAWN` no log.
9. **Memória persistente — o mesmo erro não se comete duas vezes:** antes de trabalhar, ler [`agents/memory/`](memory/README.md) (lições + contexto da área); ao resolver erro generalizável, registrar lição `L-NNN`. Repetir erro com lição registrada é defeito **bloqueante** ([protocolo](handoff-protocol.md#memória-persistente-lições-e-contexto)).
