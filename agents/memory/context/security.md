# Contexto operacional — Segurança (auditoria, red/blue team, pesquisa)

> Documento **vivo** ([regras](../README.md)). Só conhecimento **não óbvio** — o que já está nos arquivos da squad (`agents/security/`) e no security-audit-protocol não se repete aqui. Toda entrada leva data. Achados em si vão para `security/reports/` — aqui fica o conhecimento operacional (ferramentas, escopos, falsos positivos recorrentes).

## Pegadinhas conhecidas

<!-- - AAAA-MM-DD — <fato não óbvio que custou tempo> (ref: TCK-NNNN/arquivo) -->
- _Nenhuma registrada ainda (pré-Fase 0)._

## Estado atual e decisões em vigor

- 2026-07-19 — Superfícies de segurança prioritárias do ligcentro: **RLS multi-tenant** (isolamento por `user_id` em 100% das tabelas — teste de acesso cruzado obrigatório), **LGPD** (analytics sem PII de visitante — ver [`05-analytics-privacy.md`](../../../docs/implementation-plan/05-analytics-privacy.md)), **segredos** (só em env vars, nunca em commit) e **dependências** (SCA). Auditoria automatizada em [`.github/workflows/security-audit.yml`](../../../.github/workflows/security-audit.yml).

- 2026-08-01 — Superfícies revisadas neste ciclo: RLS efetiva com teste de acesso cruzado (TCK-0011), ingestão de analytics validada no banco (TCK-0012), exclusão de conta (TCK-0015), mock de auth recusado em produção (TCK-0009). **Ainda em aberto:** auditoria da squad sobre a interface inteira e revisão de performance — o LCP mobile p75 < 1,2 s da regra 5 nunca foi medido.
- 2026-08-01 — Padrão a repetir: função `SECURITY DEFINER` deriva o sujeito da sessão (`current_app_user_id()`), nunca de argumento (L-014). Falso positivo de segredo só entra na allowlist com o valor **verificado** como fictício e a justificativa datada.

## Lições da área

- Ver [lessons.md](../lessons.md) filtrando por `security`.
