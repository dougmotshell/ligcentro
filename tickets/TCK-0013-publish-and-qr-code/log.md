# Log — TCK-0013: Controle de publicação e QR code do perfil

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
  - Objetivo imediato: adicionar o controle de publicação no dashboard; só o onboarding publica hoje.
  - Contexto essencial: O QR code está marcado como entregue no roadmap sem existir no código. Gerar sem serviço externo e sem dependência paga (regra 4 do AGENTS.md).
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 15:40 — frontend-developer
- Ação: `SharePanel` no dashboard com estado de publicação, botão publicar/despublicar, cópia do link e QR code; `lib/qr/generate.ts` gerando SVG no servidor com o pacote `qrcode` (MIT, free); textos em pt-BR/en-US.
- Motivo: Critérios 1 a 6.
- Resultado: ok — SVG presente no HTML do dashboard, estado "Publicada" exibido, botão de download presente; en-US idem.

## [4] REJECT — 2026-08-01 15:45
- De: code-reviewer → Para: frontend-developer · Loop nº: 1/3
- Defeitos (numerados):
  1. `SharePanel.tsx:51` — `navigator.clipboard?.writeText(...).catch(...)` mostrava "Link copiado!" mesmo sem clipboard disponível (contexto http) ou em falha de permissão. Confirmação falsa é pior que erro visível.
- O que já está bom (não refazer): QR gerado no servidor (o cliente não baixa gerador nenhum); `role="img"` + `aria-label` no QR; download por data URI, sem rota nova; revalidação já vinha da rota `PUT /api/profile`.

## [5] ACTION — 2026-08-01 15:50 — frontend-developer
- Ação: `copyUrl` passou a checar a disponibilidade do clipboard e o resultado da escrita, sinalizando erro em vez de confirmar falsamente. Documentado no código que o SVG do QR só contém `<svg>`/`<path>` — verificado que o texto codificado não aparece literalmente no markup, então o `dangerouslySetInnerHTML` não é vetor pelo handle.
- Motivo: Defeito 1 do loop 1.
- Resultado: ok — build, typecheck e lint limpos.
- Lição: n/a — defeito pontual.

## [6] ACTION — 2026-08-01 15:55 — qa-validator
- Ação: Validação dos critérios com o app rodando.
- Resultado: C1 estado exibido e `PUT` 200 nos dois sentidos. C2 despublicar → `/pt-BR/demo` 404; publicar → 200. C3 `<svg>` inline e link "Baixar QR code" presentes. C4 geração local verificada (`fetch` não é chamado no teste, pacote MIT, `npm audit --omit=dev` → 0 vulnerabilidades). C5 textos resolvidos nos dois locales, nenhuma string hardcoded. C6 controles são `<button>`/`<a>` reais com `focus-visible` e o QR tem `role="img"` + `aria-label`. C7 build, lint (0 erros), typecheck, 63 testes.
- Veredito: **aprovado**.
