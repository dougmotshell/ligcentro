# Log — TCK-0010: Storage de avatar em produção (Supabase Storage)

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
  - Objetivo imediato: implementar `adapters/storage/supabase.ts` por REST, espelhando o padrão de `adapters/auth/supabase.ts`.
  - Contexto essencial: O adaptador atual lança erro sempre que há Supabase; o fallback local grava em `public/`, que é read-only na Vercel.
  - Onde olhar: `ticket.md` (Referências → Arquivos-alvo), depois os arquivos citados.
  - Memória aplicável: L-001 (build antes do typecheck), L-002 (SSL só em banco gerenciado), L-003 (limpar `.next-app` em falha de manifesto), L-004 (`distDir` dedicado).
  - Armadilhas: não importar SDK `@supabase/*` fora de `adapters/`; string de UI hardcoded é defeito; nada de segredo em commit.

## [3] ACTION — 2026-08-01 12:30 — backend-developer
- Ação: `adapters/storage/supabase.ts` por REST (bucket `avatars`, service role key só no servidor, `x-upsert`), validação compartilhada em `lib/storage/validate.ts`, `local.ts` alinhado à mesma validação, rota devolvendo erro nomeado (400/502) e `AvatarUpload` exibindo o motivo traduzido.
- Motivo: Critérios 1 a 5.
- Resultado: ok — upload válido 200 com `avatar_url` gravada; `text/plain` → 400 `invalid_file_type`; 3 MB → 400 `file_too_large`. 43 testes no total.

## [4] REJECT — 2026-08-01 12:35
- De: code-reviewer → Para: backend-developer · Loop nº: 1/3
- Defeitos (numerados, cada um com evidência e critério violado):
  1. `public/uploads/` não está no `.gitignore` — o storage local grava avatar de quem usa o app dentro da árvore versionada, e um `git add -A` mandaria imagem de pessoa real para o repositório. Viola a regra 7 do AGENTS.md (jamais commitar dado pessoal).
  2. `adapters/storage/supabase.ts:36` — o caminho do objeto inclui um UUID novo a cada envio, então `x-upsert` nunca substitui nada: cada troca de avatar deixa o arquivo anterior órfão no bucket, para sempre. Viola a regra 4 (custo de operação baixo, free tier) e cresce sem limite.
- O que já está bom (não refazer): validação única compartilhada pelos dois adaptadores; extensão derivada do tipo declarado em vez do nome enviado; service role key confinada ao adaptador; erros nomeados chegando traduzidos na UI.

## [5] ACTION — 2026-08-01 12:50 — backend-developer
- Ação: Corrigidos os dois defeitos do REJECT [4]: `/public/uploads/` entrou no `.gitignore`; a interface do storage ganhou `deleteFileByUrl`, implementado nos dois adaptadores, e a rota remove o avatar anterior **depois** de gravar o novo (best-effort, com log em caso de falha).
- Motivo: Defeitos 1 e 2 do loop 1.
- Resultado: ok — segundo envio deixa 1 arquivo em disco (antes deixaria 2); `git check-ignore` confirma o caminho ignorado. `extractObjectPath` recusa URL de outra origem e caminho fora do prefixo de avatar, coberto por teste.
- Lição: n/a — defeitos pontuais deste ticket.

## [6] ACTION — 2026-08-01 12:55 — qa-validator
- Ação: Validação dos critérios com o app rodando.
- Resultado: C1 adaptador Supabase por REST, sem `@supabase/*` (grep confirma) e coberto por 4 testes que exercitam URL pública, ausência da chave de serviço, falha do provedor e recusa antes da rede. C2 `text/plain` → 400 `invalid_file_type`; 3 MB → 400 `file_too_large`; ambos com o motivo traduzido na UI. C3 fallback local grava e devolve URL. C4 falha de storage → 502 com motivo nomeado, não 500 anônimo. C5 45 testes. C6 build, lint (0 erros), typecheck.
- Veredito: **aprovado**. Ressalva: a gravação no bucket real depende de `SUPABASE_SERVICE_ROLE_KEY` e do bucket `avatars` existir — validação de produção listada no ticket.
