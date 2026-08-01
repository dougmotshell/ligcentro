# Log — TCK-0015: Exclusão de conta e dados (LGPD)

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
  - Objetivo imediato: conferir as cascatas de FK antes de escrever a rota — `block_clicks.profile_id` não tem FK.
  - Contexto essencial: Exportação existe, exclusão não; a regra 7 do AGENTS.md e a LGPD exigem o par completo. Sem dark pattern na confirmação (regra 3).
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 17:00 — backend-developer
- Ação: Migração 0008 (FK de `block_clicks.profile_id` com cascata, função `delete_account`), `lib/db/account.ts`, rota `POST /api/profile/delete` exigindo o handle como confirmação, remoção do usuário no provedor via Admin API, painel "Meus dados" com exportação e exclusão, textos pt-BR/en-US.
- Motivo: Critérios 1 a 5.
- Resultado: build e typecheck limpos; testes de cascata escritos.

## [4] REJECT — 2026-08-01 17:10
- De: code-reviewer → Para: backend-developer · Loop nº: 1/3
- Defeitos (numerados, cada um com evidência e critério violado):
  1. `db/migrations/0008_account_deletion.sql` — `delete_account(target_user_id)` é `SECURITY DEFINER` e filtra **só pelo argumento**, então ignora a RLS e apaga a conta de quem o chamador indicar. Evidência: atuando como o usuário A, `SELECT public.delete_account('<id de B>')` devolveu `del-other`, isto é, **apagou a conta de B**. Hoje a rota só passa `session.id`, então não é explorável, mas é uma função de exclusão total exposta à role da aplicação por um argumento — o alcance tem de vir da sessão, não do parâmetro. Viola a regra 6 do AGENTS.md (isolamento garantido pelo banco).
  2. `lib/db/account.test.ts:136` — o caso "libera o handle" reaproveita um `user_id` que já tem perfil e falha por violar o índice único de `profiles.user_id` (criado no TCK-0009). O teste está errado, não o código.
- O que já está bom (não refazer): FK que faltava em `block_clicks`; confirmação pelo handle; exclusão dos dados de produto seguir mesmo quando falta a chave de administração, com a pendência registrada em log.

## [5] ACTION — 2026-08-01 17:25 — backend-developer
- Ação: `delete_account` perdeu o parâmetro: o alcance passou a vir de `current_app_user_id()`, a mesma variável que as políticas RLS avaliam, e a assinatura antiga foi removida com `DROP FUNCTION`. Corrigido também o caso de teste do handle, que reaproveitava um `user_id` já com perfil.
- Motivo: Defeitos 1 e 2 do loop 1.
- Resultado: ok — chamar `delete_account('<id de outro>')` agora falha com `function ... does not exist` e os dados do outro titular permanecem intactos; sem `app.current_user_id` na sessão a função recusa. 6/6 nos testes de conta.
- Lição: L-014 (registrada).

## [6] ACTION — 2026-08-01 17:35 — qa-validator
- Ação: Fluxo real de exclusão com um usuário de teste, do cadastro ao handle liberado.
- Resultado: cadastro 201 → publicado 200 → perfil público 200; confirmação errada → 400 `confirmation_mismatch`; confirmação certa → 200 `{deleted:true, freedHandle:"vai-apagar"}`; `/api/profile` → 401 (sessão encerrada); perfil público → 404; `check-handle` → `{"available":true}`. Cascata provada por teste: perfil, blocos, visitas e cliques do titular zerados e os do outro titular intactos. 84 testes, lint 0 erros, build e typecheck limpos.
- Veredito: **aprovado**. Ressalva: a remoção do usuário no provedor de auth só se comprova com Supabase real e `SUPABASE_SERVICE_ROLE_KEY`; no caminho mock não há provedor. A rota já trata a ausência da chave apagando os dados e registrando a pendência.
