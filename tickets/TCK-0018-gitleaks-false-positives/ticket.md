# TCK-0018: Auditoria de segredos falhando por falso positivo no histórico

- **status:** done
- **owner:** devops-engineer
- **created:** 2026-08-01 · **by:** Douglas
- **type:** infra
- **size:** P
- **phase:** transversal

## Pedido original (verbatim)

> em paralelo identifique e resolva o erro no pipeline https://github.com/dougmotshell/ligcentro/actions/runs/30690942623

## Requisito refinado

- User story: como mantenedor, o portão de segurança só fica vermelho quando há
  problema de verdade — alarme falso recorrente treina o time a ignorar o alarme.
- Fora de escopo: reescrever histórico do repositório.

## Diagnóstico

O run `30690942623` (workflow `security-audit`, job **Segredos (gitleaks)**)
falhou com `leaks found: 2`. Os dois achados são `generic-api-key` nas linhas 9 e
10 do `.env.example` **do commit `2a5fe01`** (2026-07-27, TCK-0007).

Os valores são fictícios: os payloads dos JWTs decodificam em base64 para
`{"_exemple_anon_key_ficticia` e `{"_exemple_service_role_key_ficticia`.
**Nenhuma credencial real foi exposta — não há o que rotacionar.**

Causa raiz: o TCK-0007 corrigiu o `.env.example` na árvore de trabalho (commit
`413d25a`), mas ambos os jobs de gitleaks varrem o **histórico completo**
(`fetch-depth: 0`). O commit antigo é imutável, então o achado se repete em toda
execução — a auditoria quinzenal ficaria vermelha para sempre.

## Critérios de aceite

- [x] 1. Confirmado, com evidência, se os achados são segredo real ou falso positivo.
- [x] 2. A varredura de segredos volta a passar sem alterar o histórico.
- [x] 3. A allowlist é estreita: uma chave de formato real no mesmo arquivo continua sendo detectada (evidência executável).
- [x] 4. A exceção fica documentada no próprio arquivo de configuração, com motivo e data.

## Referências

- Run: https://github.com/dougmotshell/ligcentro/actions/runs/30690942623 · Arquivos-alvo: `.gitleaks.toml`, `.github/workflows/{ci,security-audit}.yml`

## Resolução (preenchido ao fechar)

- Commits: `TCK-0018: corrigir auditoria de segredos travada em falso positivo`
- Evidência final: log entrada [2]
- Docs atualizados: `.gitleaks.toml` (justificativa e data da exceção)
