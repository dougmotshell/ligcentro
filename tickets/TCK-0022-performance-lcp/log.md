# Log — TCK-0022: Medir e comprovar o LCP mobile p75 < 1,2 s

> Append-only.

## [1] ACTION — 2026-08-15 — devops-engineer

- Ação: Escrevi `scripts/measure-performance.mjs` (`npm run perf`). Sobe o build
  de produção numa porta própria, mede N visitas frias com emulação de celular
  (Pixel 5), CPU 4× mais lenta e rede Slow 4G — as condições do preset "mobile"
  do Lighthouse, aplicadas via CDP — e reporta **p75** de LCP, FCP, TTFB, CLS,
  TBT e bytes.
- Decisão de método: percentil por *nearest-rank*, para não inventar um valor que
  nenhuma execução produziu; contexto novo a cada amostra (cache, storage e
  conexões limpos), porque é a primeira visita que dói; observador registrado
  antes da navegação, senão o LCP acontece antes de o teste conseguir observá-lo.
- Motivo: Critérios 1, 2 e 4. O script **sai com código ≠ 0** quando o p75 passa
  do orçamento, então serve de portão e não só de relatório.

## [2] ACTION — 2026-08-15 — devops-engineer

- Ação: Medição. Dois alvos, arquivos separados (`docs/performance/local.json` e
  `ligcentro-vercel-app.json`) — medir a Vercel não pode apagar a medição local,
  senão o relatório mistura laboratório com produção sem avisar (critério 6).
- Resultado:

  | p75                | Laboratório | Produção (Vercel) | Orçamento |
  | ------------------ | ----------- | ----------------- | --------- |
  | **LCP**            | **436 ms**  | **564 ms**        | 1200 ms   |
  | FCP                | 436 ms      | 564 ms            | —         |
  | TTFB               | 91 ms       | 77 ms             | —         |
  | CLS                | 0           | 0                 | 0,1       |
  | TBT                | 270 ms      | 264 ms            | —         |
  | Bytes              | 168 KB      | 171 KB            | —         |

- Veredito: **a regra 5 do AGENTS.md é cumprida com folga** — 47% do orçamento em
  produção. Nenhuma otimização foi necessária, então o critério 5 não se aplicou.
  O CLS zerado não é sorte: o avatar tem dimensões declaradas e a fonte é pilha
  do sistema, sem webfont para trocar depois da primeira pintura.
- Observação registrada no relatório: a primeira amostra contra produção costuma
  marcar 2 s (cache frio do CDN + cold start). O p75 de várias execuções é o
  número honesto, mas essa primeira visita é real para quem a recebe.

## [3] ACTION — 2026-08-15 — docs-writer

- Ação: `docs/performance/README.md` com a tabela, as condições exatas, como
  repetir e — explicitamente — o que a medição **não** é: laboratório não é
  campo. O p75 real de usuários exigiria RUM, que tem custo de privacidade
  incompatível com o plano de analytics sem PII; fica registrado como decisão
  consciente, não como esquecimento.
- Motivo: Critérios 3 e 6.

## [4] ACTION — 2026-08-15 — qa-validator

- Ação: Validação.
- Resultado: `npm run perf` reproduz os números e falha quando o orçamento é
  estourado (verificado baixando o orçamento). Relatórios versionados.
- Veredito: **aprovado**. Critérios 1, 2, 3, 4 e 6 atendidos; o 5 não se aplicou.
