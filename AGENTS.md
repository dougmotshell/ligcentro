# AGENTS.md — Guia para Agentes de IA

> Arquivo canônico de instruções para agentes (Codex, GPT, Claude, Gemini, Copilot e outros).
> `CLAUDE.md`, `GEMINI.md` e `.github/copilot-instructions.md` apontam para cá — edite **somente este arquivo**.

## O que é este repositório

**ligcentro** (esperanto *ligo* = "vínculo/link" + *centro*) é um produto
**link-in-bio**: uma única URL (`ligcentro.vercel.app/usuario`) que reúne todos os links,
redes, conteúdos e formas de contato de um criador em uma página pública rápida,
bonita e mensurável — o mesmo espaço de produto do Linktree, Beacons e Bento.

O repositório contém a **pesquisa de mercado** que fundamenta o produto, os
**planos de implementação** e (à medida que a construção avança) o **código** do
ligcentro. Mantenedor: **Douglas Matos da Silva**.

## Idioma e convenções

- Todo o **conteúdo textual** (docs, comentários de código, textos de UI) em **português brasileiro**. Termos técnicos consagrados em inglês podem aparecer com tradução na primeira ocorrência.
- **Nomes de arquivos, pastas, variáveis, funções, tabelas, branches e commits em inglês en-US** — sempre (inclusive os diretórios de documentação). O **conteúdo** dos docs e os comentários ficam em pt-BR; só a nomenclatura é en-US.
- **String de UI hardcoded é defeito** — tudo passa por i18n (pt-BR + en-US).
- Afirmações sobre o mercado/concorrentes **exigem fonte** (link em `docs/market-research/`).
- Datas no formato `AAAA-MM-DD`.

## Mapa do repositório

| Caminho | Conteúdo | Quando consultar |
|---|---|---|
| `docs/market-research/` | Análise de mercado: concorrentes, análise competitiva, open source, engenharia reversa do Linktree | Para entender o espaço de produto e o posicionamento |
| `docs/implementation-plan/` | Visão, escopo de MVP, arquitetura, roadmap, modelo de dados, analytics, monetização | **Antes de qualquer decisão de produto ou técnica** |
| `agents/` | Definições canônicas dos agentes de desenvolvimento | Para saber quem faz o quê e como o fluxo funciona |
| `tickets/` | Unidade de trabalho (fluxo de agentes) | Ao iniciar/retomar uma tarefa de desenvolvimento |
| `.claude/skills/` | Skills `/ticket`, `/handoff`, `/dev-loop`, `/user-manual` | Para operar o fluxo de desenvolvimento |

> **Ainda não há código** neste repositório — só pesquisa e planos. A primeira fase
> de construção (Fase 0 do [roadmap](docs/implementation-plan/03-mvp-roadmap.md))
> monta a fundação técnica.

## Regras para agentes

1. **Decisões seguem os planos**: pedido de produto/feature deve ser coerente com [`docs/implementation-plan/01-vision-and-scope.md`](docs/implementation-plan/01-vision-and-scope.md) e o [roadmap](docs/implementation-plan/03-mvp-roadmap.md). Pedido fora do plano volta ao Douglas com recomendação (aceitar/adaptar/recusar), **nunca** é implementado silenciosamente.
2. **Escopo disciplinado (MVP)**: nada do backlog "além do MVP" entra antes de a Fase 4 estar `done`. O ligcentro faz *link-in-bio* excepcionalmente bem — não é marketplace, plataforma de cursos nem site-builder genérico.
3. **Grátis honesto, sem dark patterns**: o plano grátis é um produto de verdade (sem branding forçado, com analytics por link). Nada de dark pattern no funil de upgrade — ver [`06-monetization.md`](docs/implementation-plan/06-monetization.md).
4. **Custo de operação baixo**: o MVP roda em **free tier** (Vercel + Supabase). Nenhuma dependência paga é requisito de v1 — ver [`02-architecture.md`](docs/implementation-plan/02-architecture.md).
5. **Performance é feature**: o perfil público carrega em sub-segundo (SSR/SSG + CDN, LCP mobile p75 < 1,2 s). Não é ajuste tardio.
6. **Segurança multi-tenant**: **RLS em 100% das tabelas**; toda migração acompanha teste de acesso cruzado (dois usuários fake). Segredos só em env vars, nunca em commit.
7. **Privacidade do visitante (LGPD)**: analytics é **agregado e sem PII de visitante** (sem IP, sem fingerprint, sem cookie de rastreamento) — ver [`05-analytics-privacy.md`](docs/implementation-plan/05-analytics-privacy.md). Jamais commitar segredos ou dados pessoais.
8. **Portabilidade**: o específico de plataforma fica isolado em `adapters/`; a meta é subir o app em `docker compose` local sem serviço pago.

## Sistema de agentes de desenvolvimento (`agents/` + `tickets/` + skills)

- **`agents/`** contém as definições canônicas de cada agente especializado (tech-lead, product-analyst, frontend/backend-developer, code-reviewer, qa-validator, devops-engineer, ui-ux-designer, security-auditor, docs-writer) — markdown com frontmatter, utilizável por qualquer ferramenta de IA. Claude Code: `.claude/agents` → symlink. Outras ferramentas: carregar o arquivo como instructions da sessão.
- **Fluxo de trabalho**: todo desenvolvimento passa por tickets (`tickets/TCK-NNNN-*/`), com handoffs e loops de validação definidos em [`agents/handoff-protocol.md`](agents/handoff-protocol.md). **Auditoria é obrigatória**: toda ação de agente vira entrada append-only no `log.md` do ticket; commits usam prefixo `TCK-NNNN:`. Nenhum agente marca o próprio trabalho como validado — só o qa-validator fecha tickets, contra os critérios de aceite.
- **Skills disponíveis** (`.claude/skills/`): `/ticket` (criar ticket + triagem), `/handoff` (transição formal com log), `/dev-loop` (ciclo completo implementação→review→QA até done), `/user-manual` (regenerar manual via Playwright).
- Agentes respeitam **escopo exclusivo** (não mexer na área de outro; handoff) e as regras globais de [`agents/README.md`](agents/README.md). Agente ocupado com um ticket **não enfileira** os novos da sua área: spawna **subagentes** (`<agente>#N`) para assumi-los ou para paralelizar subtarefas — regras e formato de log `SPAWN` na seção "Subagentes" de [`agents/handoff-protocol.md`](agents/handoff-protocol.md).
- **Memória persistente** (`agents/memory/`): sessões são efêmeras, o repositório lembra — [lessons.md](agents/memory/lessons.md) (lições `L-NNN`, append-only: erro → causa raiz → como evitar) e [context/](agents/memory/context/) (contexto operacional vivo por área). Todo agente **lê antes de trabalhar** e registra lição ao resolver erro generalizável; repetir erro com lição registrada é defeito bloqueante — seção "Memória persistente" do [`agents/handoff-protocol.md`](agents/handoff-protocol.md).
- **Squad de segurança** (`agents/security/`): auditorias periódicas (devsecops, red-team, blue-team, security-researcher) sobre RLS, LGPD, segredos e dependências.

## Estado atual

- **Pesquisa de mercado concluída** em `docs/market-research/` (concorrentes + engenharia reversa do Linktree).
- **Planos de implementação escritos** em `docs/implementation-plan/` (visão, arquitetura, roadmap, dados, analytics, monetização).
- **Construção**: ainda não iniciada — a Fase 0 do roadmap é o próximo passo. Quando começar, cada decisão dura vira um **ADR** e cada comportamento vira uma **spec**, criados sob `docs/`.
