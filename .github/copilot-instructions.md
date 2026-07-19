# Instruções para o GitHub Copilot

Leia e siga integralmente o arquivo canônico de instruções para agentes na raiz do repositório: `AGENTS.md`.

Resumo mínimo (detalhes no AGENTS.md):
- **ligcentro** é um produto link-in-bio (agregador de links "na bio").
- Conteúdo de docs/comentários em **pt-BR**; nomes de arquivos/pastas/código em **en-US**.
- Decisões de produto/técnicas seguem `docs/implementation-plan/`; pedido fora do plano volta ao mantenedor.
- MVP roda em **free tier** (Vercel + Supabase); nenhuma dependência paga é requisito de v1.
- **RLS em 100% das tabelas**; segredos só em env vars; analytics sem PII de visitante (LGPD).
- Todo desenvolvimento passa por tickets (`tickets/`) com handoffs auditáveis (`agents/handoff-protocol.md`).
