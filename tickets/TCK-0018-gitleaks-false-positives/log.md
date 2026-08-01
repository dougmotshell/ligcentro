# Log — TCK-0018: Auditoria de segredos falhando por falso positivo no histórico

> Append-only.

## [1] ACTION — 2026-08-01 13:45 — devops-engineer
- Ação: Diagnóstico do run `30690942623`. Job `Segredos (gitleaks)` falhou com `leaks found: 2`, ambos `generic-api-key` no `.env.example` do commit `2a5fe01` (linhas 9 e 10).
- Motivo: Antes de tratar como falso positivo, verificar se era credencial real — decodificado o payload base64 dos dois JWTs.
- Resultado: **falso positivo confirmado**: os payloads decodificam para `{"_exemple_anon_key_ficticia` e `{"_exemple_service_role_key_ficticia`. Nenhuma credencial real exposta; nada a rotacionar. A causa da recorrência é o commit histórico imutável — o TCK-0007 corrigiu só a árvore de trabalho (`413d25a`), e os jobs varrem o histórico completo.

## [2] ACTION — 2026-08-01 13:58 — devops-engineer
- Ação: Criado `.gitleaks.toml` com allowlist por regex ancorada no prefixo `eyJfZXhlbXBsZ` (que é literalmente `{"_exemple` em base64), e `GITLEAKS_CONFIG` apontado nos dois workflows.
- Motivo: Critérios 2, 3 e 4. Optei por regex do conteúdo em vez de isentar o arquivo ou fixar `fingerprint` por linha: isenção de arquivo cegaria o `.env.example` para sempre, e fingerprint por linha quebra se o histórico for reindexado.
- Resultado: ok, verificado localmente com a mesma varredura do CI (`gitleaks git` sobre o histórico, imagem `zricethezav/gitleaks:latest`):
  - sem a config: `leaks found: 2` (reproduz a falha do CI);
  - com a config: `no leaks found`, ainda com `34 commits scanned` — não houve redução de escopo.
  - estreiteza da allowlist: num diretório isolado com dois arquivos, o placeholder fictício passa e um JWT de header real (`eyJhbGciOi...`) **continua sendo detectado** (`achados: 1 | arquivo: com-chave-real.env | regra: jwt`).

## [3] ACTION — 2026-08-01 14:00 — qa-validator
- Ação: Conferência dos critérios contra as evidências do item [2].
- Resultado: critérios 1 a 4 atendidos com evidência executável.
- Veredito: **aprovado**. Ressalva de operação: a correção está na branch `tck-0009-0017-mvp-hardening`; a auditoria agendada só volta ao verde quando este commit chegar à `main`.
