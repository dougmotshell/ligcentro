# AGENTS.md — Guia para Agentes de IA

> Arquivo canônico de instruções para agentes (Codex, GPT, Claude, Gemini, Copilot e outros).
> `CLAUDE.md`, `GEMINI.md` e `.github/copilot-instructions.md` apontam para cá — edite **somente este arquivo**.

## O que é este repositório

**ligcentro** (esperanto _ligo_ = "vínculo/link" + _centro_) é um produto
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

| Caminho                                    | Conteúdo                                                                                           | Quando consultar                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `docs/market-research/`                    | Análise de mercado: concorrentes, análise competitiva, open source, engenharia reversa do Linktree | Para entender o espaço de produto e o posicionamento     |
| `docs/implementation-plan/`                | Visão, escopo de MVP, arquitetura, roadmap, modelo de dados, analytics, monetização                | **Antes de qualquer decisão de produto ou técnica**      |
| `agents/`                                  | Definições canônicas dos agentes de desenvolvimento                                                | Para saber quem faz o quê e como o fluxo funciona        |
| `tickets/`                                 | Unidade de trabalho (fluxo de agentes)                                                             | Ao iniciar/retomar uma tarefa de desenvolvimento         |
| `.agents/skills/`                          | Skills canônicas (`/ticket`, `/handoff`, `/dev-loop`, `/campaign`…) no padrão aberto Agent Skills  | Para operar o fluxo de desenvolvimento                   |
| `scripts/`                                 | Runner de migrações (`migrate.mjs`), expurgo de analytics, gerador dos wrappers de agentes         | Ao migrar banco, operar retenção ou criar/renomear skill |
| `app/`, `components/`, `lib/`, `adapters/` | Código do produto: rotas do App Router, componentes, regras e o específico de plataforma isolado   | Ao implementar qualquer coisa                            |
| `db/migrations/`                           | Migrações SQL numeradas e versionadas (`schema_migrations`)                                        | Antes de qualquer mudança de schema                      |
| `e2e/`                                     | Fluxo crítico em Playwright                                                                        | Ao mexer em cadastro, editor, publicação ou analytics    |
| `docs/adr/`                                | Decisões arquiteturais registradas                                                                 | Antes de rediscutir uma decisão já tomada                |

## Regras para agentes

1. **Decisões seguem os planos**: pedido de produto/feature deve ser coerente com [`docs/implementation-plan/01-vision-and-scope.md`](docs/implementation-plan/01-vision-and-scope.md) e o [roadmap](docs/implementation-plan/03-mvp-roadmap.md). Pedido fora do plano volta ao Douglas com recomendação (aceitar/adaptar/recusar), **nunca** é implementado silenciosamente.
2. **Escopo disciplinado (MVP)**: nada do backlog "além do MVP" entra antes de a Fase 4 estar `done`. O ligcentro faz _link-in-bio_ excepcionalmente bem — não é marketplace, plataforma de cursos nem site-builder genérico.
3. **Grátis honesto, sem dark patterns**: o plano grátis é um produto de verdade (sem branding forçado, com analytics por link). Nada de dark pattern no funil de upgrade — ver [`06-monetization.md`](docs/implementation-plan/06-monetization.md).
4. **Custo de operação baixo**: o MVP roda em **free tier** (Vercel + Supabase). Nenhuma dependência paga é requisito de v1 — ver [`02-architecture.md`](docs/implementation-plan/02-architecture.md).
5. **Performance é feature**: o perfil público carrega em sub-segundo (SSR/SSG + CDN, LCP mobile p75 < 1,2 s). Não é ajuste tardio.
6. **Segurança multi-tenant**: **RLS em 100% das tabelas**; toda migração acompanha teste de acesso cruzado (dois usuários fake). Segredos só em env vars, nunca em commit.
7. **Privacidade do visitante (LGPD)**: analytics é **agregado e sem PII de visitante** (sem IP, sem fingerprint, sem cookie de rastreamento) — ver [`05-analytics-privacy.md`](docs/implementation-plan/05-analytics-privacy.md). Jamais commitar segredos ou dados pessoais.
8. **Portabilidade**: o específico de plataforma fica isolado em `adapters/`; a meta é subir o app em `docker compose` local sem serviço pago.

## Sistema de agentes de desenvolvimento (`agents/` + `tickets/` + skills)

- **`agents/`** contém as definições canônicas de cada agente especializado (tech-lead, product-analyst, frontend/backend-developer, code-reviewer, qa-validator, devops-engineer, ui-ux-designer, security-auditor, docs-writer) — markdown com frontmatter, utilizável por qualquer ferramenta de IA. Claude Code: `.claude/agents` → symlink. GitHub Copilot: `@<agente>` via wrappers gerados em `.github/agents/`. Outras ferramentas: carregar o arquivo como instructions da sessão.
- **Fluxo de trabalho**: todo desenvolvimento passa por tickets (`tickets/TCK-NNNN-*/`), com handoffs e loops de validação definidos em [`agents/handoff-protocol.md`](agents/handoff-protocol.md). **Todo handoff carrega um briefing para o próximo agente** (objetivo imediato, contexto essencial, onde olhar, lições aplicáveis, armadilhas) — handoff sem briefing é inválido. **Auditoria é obrigatória**: toda ação de agente vira entrada append-only no `log.md` do ticket; commits usam prefixo `TCK-NNNN:`. Nenhum agente marca o próprio trabalho como validado — só o qa-validator fecha tickets, contra os critérios de aceite. O fluxo roda em qualquer ferramenta de IA: com subagentes quando houver, ou em **modo solo** (papéis em sequência na mesma sessão) — ver "Modos de execução" no protocolo.
- **Skills disponíveis** (`.agents/skills/` — fonte canônica): `/ticket` (criar ticket + triagem), `/handoff` (transição formal com log), `/dev-loop` (ciclo completo implementação→review→QA até done), `/user-manual` (regenerar manual via Playwright), `/campaign`, `/copy`, `/content-review`, `/seo-audit` (marketing).

### Portabilidade das skills e slash commands (multi-ferramenta)

As skills seguem o **padrão aberto Agent Skills** (`SKILL.md` com frontmatter `name`/`description`) e vivem em `.agents/skills/<name>/SKILL.md` — **única fonte editável**. Cada ferramenta as consome assim:

| Ferramenta                   | Como consome                                                                  | Invocação                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Claude Code                  | `.claude/skills` → symlink para `.agents/skills`                              | `/<skill>`                                                      |
| OpenAI Codex                 | Lê `.agents/skills/` nativamente                                              | `$<skill>` ou menu `/skills`                                    |
| GitHub Copilot (VS Code/CLI) | Lê `.agents/skills/` nativamente + prompt files gerados em `.github/prompts/` | `/<skill>` no chat; agentes via `@<agente>` (`.github/agents/`) |
| Gemini CLI                   | Commands gerados em `.gemini/commands/*.toml`                                 | `/<skill>`                                                      |
| Google Antigravity           | Workflows gerados em `.agent/workflows/` (e lê `AGENTS.md`)                   | `/<skill>`                                                      |
| Windsurf                     | Workflows gerados em `.windsurf/workflows/`                                   | `/<skill>`                                                      |
| Cursor                       | Commands gerados em `.cursor/commands/` (e lê `AGENTS.md`)                    | `/<skill>`                                                      |

Os diretórios `.github/prompts/`, `.github/agents/`, `.gemini/commands/`, `.agent/workflows/`, `.windsurf/workflows/` e `.cursor/commands/` são **gerados** — nunca editar à mão. Após criar/renomear/remover uma skill ou agente, rode `npm run sync-agent-tools` para regenerá-los.

- Agentes respeitam **escopo exclusivo** (não mexer na área de outro; handoff) e as regras globais de [`agents/README.md`](agents/README.md). Agente ocupado com um ticket **não enfileira** os novos da sua área: spawna **subagentes** (`<agente>#N`) para assumi-los ou para paralelizar subtarefas — regras e formato de log `SPAWN` na seção "Subagentes" de [`agents/handoff-protocol.md`](agents/handoff-protocol.md).
- **Memória persistente** (`agents/memory/`): sessões são efêmeras, o repositório lembra — [lessons.md](agents/memory/lessons.md) (lições `L-NNN`, append-only, de **erro**: erro → causa raiz → como evitar, e de **acerto**: o que funcionou → por quê → como reaproveitar) e [context/](agents/memory/context/) (contexto operacional vivo por área). Todo agente **lê antes de trabalhar**; registra lição ao resolver erro generalizável **ou identificar acerto que vale repetir**; repetir erro com lição registrada é defeito bloqueante — seção "Memória persistente" do [`agents/handoff-protocol.md`](agents/handoff-protocol.md).
- **Squad de segurança** (`agents/security/`): auditorias periódicas (devsecops, red-team, blue-team, security-researcher) sobre RLS, LGPD, segredos e dependências.

## Estado atual

**Atualizado em 2026-08-01.**

- **Pesquisa de mercado concluída** em `docs/market-research/` (concorrentes + engenharia reversa do Linktree).
- **Planos de implementação escritos** em `docs/implementation-plan/`.
- **Construção em andamento.** O que existe e está exercitado por teste:
  - perfil público `/[handle]` com SSG + revalidação, blocos (link, social, contato), agendamento de link, Open Graph e QR code;
  - contas por e-mail/senha e OAuth (Google, GitHub) sobre Supabase Auth, com renovação de sessão por refresh token e sessão mock apenas fora de produção;
  - editor com avatar, título, bio, CRUD de blocos com reordenação, temas prontos + customização (cor, fonte, formato de botão, cores de marca) e controle de publicação;
  - analytics agregado sem PII, com ingestão validada no banco, limite de taxa e expurgo de retenção;
  - exportação e **exclusão** de dados (LGPD);
  - **RLS efetiva**: toda consulta em nome de um usuário roda sob role sem bypass, com teste de acesso cruzado automatizado;
  - CI com lint, typecheck, 84 testes unitários, 3 e2e e auditoria de segredos — o portão exige `success`, não aceita mais job pulado.
- **Pendente para o grátis ficar completo** (Fase 4): manual do usuário gerado por Playwright, auditoria da squad de segurança e revisão de performance (LCP p75 < 1,2 s ainda não medido). Ver o [roadmap](docs/implementation-plan/03-mvp-roadmap.md), que aponta o ticket de cada item aberto.
- **Decisões duras** deste ciclo estão em `docs/adr/`; comportamentos verificáveis estão nos testes, que são a spec executável.
