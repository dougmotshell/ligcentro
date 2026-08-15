# Log — TCK-0023: Auditoria da squad de segurança

> Append-only.

## [1] ACTION — 2026-08-15 — devsecops-engineer

- Ação: Defini o escopo autorizado conforme a regra 1 do protocolo: código,
  ambiente local e leitura de superfície pública em produção. **Sem** pentest
  ativo contra produção com dados reais — isso exige janela e autorização
  explícitas do Douglas, e fica registrado como fora de escopo.
- Handoff: red-team e security-researcher em paralelo, blue-team no reteste.

## [2] ACTION — 2026-08-15 — security-researcher

- Ação: `npm audit`. 5 vulnerabilidades (4 high, 1 moderate) em
  `brace-expansion`, `js-yaml`, `nanoid` e `postcss` — todas em cadeia de
  build/dev, nenhuma chega ao bundle servido.
- Achado agravante: o `override` do `package.json` fixava
  `brace-expansion: 5.0.8`, **dentro** da faixa vulnerável do
  GHSA-rgw5-rvv9-x895 (4.0.0–5.0.8). Era uma mitigação que não mitigava — o tipo
  de coisa que passa por "já tratado" numa revisão apressada.
- Correção: overrides para 5.0.9 (ramo 5) e 1.1.18 (ramo 1, via `minimatch`) +
  `npm audit fix`. Resultado: **0 vulnerabilidades**. Lint e typecheck seguem
  limpos após a atualização.

## [3] ACTION — 2026-08-15 — red-team

Testes ofensivos contra o app em modo de produção (build real, porta dedicada).

**Achado [Alta] — clickjacking, sem cabeçalho nenhum.** A única proteção era o
HSTS que a Vercel injeta sozinha. Sem `frame-ancestors`/`X-Frame-Options`,
qualquer site podia embutir o dashboard e induzir cliques — inclusive no botão de
excluir conta, que é irreversível. Faltavam também CSP, `nosniff`,
`Referrer-Policy` (o handle visitado vazava no `Referer` para cada site de
destino, o que contradiz a promessa de privacidade) e `Permissions-Policy`.

**Achado [Média] — cookie mock forjado.** Com `NODE_ENV=production` e sem
`ALLOW_MOCK_AUTH`, enviei `Cookie: mock-auth=true`. **Nenhum dado foi devolvido**
— não há bypass de autorização. Mas o middleware tratava o cookie como sessão
válida, então o pedido seguia até a camada de dados e morria com **500**. Defesa
em profundidade quebrada e erro opaco.

**Verificado sem defeito:**
- falsificação de atribuição de clique (`profileId` de outro perfil) → 404;
- bloco inexistente → 404;
- `blockId = "' OR 1=1 --"` → 400, barrado pela validação de UUID antes de
  qualquer consulta;
- limite de taxa: 300 eventos/min por bloco, conforme configurado.

## [4] ACTION — 2026-08-15 — security-auditor

Revisão das superfícies sensíveis:

- **RLS multi-tenant**: 11 testes de acesso cruzado rodam contra o Postgres de
  verdade e passam — A não lê, altera nem apaga dados de B; anônimo não vê
  rascunho nem escreve. É a evidência mais forte do repositório.
- **LGPD/analytics**: `page_views` e `block_clicks` guardam apenas `profile_id`,
  `day`, `country`, `referrer_host` e `count`. Sem IP, sem user agent, sem
  cookie de rastreamento. Conforme o plano.
- **Cookies**: `httpOnly`, `sameSite=lax`, `secure` em produção, `path=/`.
- **CSRF**: toda mutação é POST; `sameSite=lax` bloqueia POST cross-site.
- **Upload**: tipo e tamanho validados; caminho derivado do tipo declarado, nunca
  do nome enviado.
- **URL de bloco**: só http/https/mailto/tel — `javascript:` e `data:` recusados.

## [5] ACTION — 2026-08-15 — devsecops-engineer (correções)

- Cabeçalhos de segurança em `next.config.ts`, com contrato exercitado por
  `e2e/security-headers.spec.ts` em 4 rotas. Limitação assumida e documentada:
  `script-src` mantém `'unsafe-inline'` porque o tema é aplicado por script
  inline antes da primeira pintura e o Next injeta o bootstrap de hidratação
  inline; migrar para nonce é mudança de arquitetura e virou recomendação, não
  algo feito às pressas dentro de uma auditoria.
- Regra do mock movida para `lib/auth/mock-allowed.ts` (módulo sem dependências,
  porque o middleware roda no Edge) e aplicada nos dois lugares. Duas cópias da
  mesma regra é como uma delas fica para trás.
- `resolveSession()` passou a devolver `null` e **registrar a causa** quando não
  há provedor de auth, em vez de propagar 500 mudo — mesmo padrão da correção do
  TCK-0025.

## [6] ACTION — 2026-08-15 — red-team (reteste)

| Achado | Reteste | Resultado |
|---|---|---|
| Cabeçalhos | `e2e/security-headers.spec.ts` | 4/4 rotas com todos os cabeçalhos |
| Cookie forjado | Mesmo cenário de produção | 401 nas APIs, 307 → login no dashboard |
| Dependências | `npm audit --audit-level=low` | 0 vulnerabilidades |
| Conexões | Captura do manual, 80 páginas × 2 execuções | Sem esgotamento |

## [7] ACTION — 2026-08-15 — security-researcher (achado de produção)

- Ação: Verificação da superfície pública após a correção do schema (TCK-0025).
- **Achado [Alta] — `DATABASE_URL` ausente na Vercel.** Toda rota que consulta o
  banco responde 500 em produção. Cheguei a interpretar
  `check-handle?handle=demo → 200` como prova de que o banco voltara; estava
  errado — `demo` é **handle reservado** e retorna antes de tocar no banco.
  Qualquer handle que realmente consulta (`teste123`, `outro-handle-livre`)
  devolve 500.
- Verificação decisiva: durante uma rajada de requisições à produção,
  `pg_stat_activity` no Supabase não registrou **nenhuma** conexão vinda da
  Vercel. O app não chega a tentar conectar.
- Por que o site parece no ar: o perfil público é SSG e existe caminho de
  fallback embutido, então `/en-US/demo` responde 200 sem banco algum.
- **Ação necessária (Douglas)**: definir `DATABASE_URL` no projeto da Vercel,
  escopo Production, com a string do pooler do Supabase. Sem isso, cadastro,
  login e editor seguem fora do ar — e o login com Google continuará falhando
  mesmo com o schema já aplicado.
- Rede de segurança já instalada: o portão de migração do TCK-0025 faz o build de
  produção **falhar** quando `DATABASE_URL` não existe, em vez de publicar.

## [8] ACTION — 2026-08-15 — devsecops-engineer

- Ação: Relatório consolidado em `security/reports/2026-08-15-squad.md`, com
  severidade, evidência reproduzível e recomendação por achado, além dos itens
  aceitos conscientemente (limite de taxa por instância, avatar de host externo,
  cookie mock não assinado) e das recomendações que viram ticket.
- Veredito: critérios 1, 2, 3, 4 e 6 atendidos. Critério 5 atendido pelos itens
  aceitos com justificativa. **Um achado de severidade alta permanece aberto por
  depender de acesso ao painel da Vercel** (achado 2) — está escalado ao Douglas,
  não silenciado.
- Lição: L-020 (registrada).
