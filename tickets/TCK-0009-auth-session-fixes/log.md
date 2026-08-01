# Log — TCK-0009: Correções bloqueantes de autenticação e sessão

> Append-only.

## [1] ACTION — 2026-08-01 10:00 — tech-lead
- Ação: Triagem do ticket, recortado da análise do repositório de 2026-08-01 (defeitos e lacunas contra o roadmap e as regras do AGENTS.md).
- Motivo: O pedido "implementar tudo" foi dividido em tickets com dono único e critérios verificáveis, conforme a regra 1 do tech-lead.
- Resultado: critérios de aceite definidos; status `triaged`. Memória lida: `agents/memory/context/` da área + `lessons.md` (L-001 a L-004).

## [2] HANDOFF — 2026-08-01 10:05 — tech-lead → backend-developer
- De: tech-lead → Para: backend-developer
- Status novo: in_progress
- O que foi feito: Triagem e definição dos critérios de aceite.
- Artefatos: `ticket.md`.
- Como validar: critérios de aceite do ticket, cada um com evidência executável.
- Pendências e riscos: nenhum insumo externo pendente; validação roda no Postgres do `docker compose`.
- Critérios de aceite: [ ] todos abertos.
- Briefing para o próximo agente:
  - Objetivo imediato: criar a migração com UNIQUE em `profiles.user_id` — é o que faz todo login OAuth novo falhar hoje.
  - Contexto essencial: O callback usa `ON CONFLICT (user_id)` e só existe índice não-único; o log [7] do TCK-0008 atribuiu o sintoma a SSL, o que é diagnóstico incorreto.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.
