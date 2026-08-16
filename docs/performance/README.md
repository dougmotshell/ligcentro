# Performance do perfil público

> Medição de 2026-08-15 (TCK-0022). Números gerados por `npm run perf`; os
> arquivos JSON deste diretório são a saída bruta de cada execução.

A regra 5 do [AGENTS.md](../../AGENTS.md) e o critério de pronto da Fase 1 do
[roadmap](../implementation-plan/03-mvp-roadmap.md) afirmam **LCP mobile
p75 < 1,2 s** para o perfil público. Até este ticket o número nunca tinha sido
medido — era uma afirmação sem evidência. Agora é medido, e a medição falha o
comando quando o orçamento estoura.

## Resultado

| Métrica (p75)         | Laboratório local | Produção (Vercel) | Orçamento |
| --------------------- | ----------------- | ----------------- | --------- |
| **LCP**               | **436 ms**        | **564 ms**        | 1200 ms   |
| FCP                   | 436 ms            | 564 ms            | —         |
| TTFB                  | 91 ms             | 77 ms             | —         |
| CLS                   | 0                 | 0                 | 0,1       |
| TBT                   | 270 ms            | 264 ms            | —         |
| Bytes transferidos    | 168 KB            | 171 KB            | —         |

**A regra 5 é cumprida com folga**: o LCP p75 em produção fica em 47% do
orçamento. O CLS zerado é consequência do desenho — o avatar tem dimensões
declaradas e a fonte é pilha do sistema, sem webfont para trocar depois da
primeira pintura.

## O que essa medição é — e o que não é

**É** laboratório: uma máquina, uma rede simulada, cache limpo, 8 a 10 execuções
por alvo. Serve para comparar versões e barrar regressão.

**Não é** medição de campo (RUM). O p75 real de usuários depende de aparelho,
rede e distribuição geográfica que nenhuma simulação reproduz. A coluna
"Produção" mede o app publicado a partir desta máquina — é mais próxima do
usuário que o laboratório, mas continua sendo uma amostra de um único ponto.

Para o p75 de campo seria preciso coletar Web Vitals de visitantes reais. Isso
tem custo de privacidade (o plano de analytics é [agregado e sem PII de
visitante](../implementation-plan/05-analytics-privacy.md)) e não é requisito de
v1 — fica registrado como decisão consciente, não como esquecimento.

## Condições

- Dispositivo emulado: Pixel 5 (viewport 393×851, DPR 2,75)
- CPU: 4× mais lenta que a máquina
- Rede: Slow 4G — 1,6 Mbps de descida, 750 kbps de subida, 150 ms de latência
- Contexto novo a cada execução (cache, storage e conexões limpos)
- Página medida: `/pt-BR/demo` (perfil semeado com três blocos)

São as mesmas condições do preset "mobile" do Lighthouse, aplicadas via CDP.

## Como repetir

```sh
npm run perf                                   # laboratório local, 10 execuções
npm run perf -- --runs 20                      # mais amostras
node scripts/measure-performance.mjs \
  --url https://ligcentro.vercel.app --runs 8  # produção
```

O comando **sai com código ≠ 0** se o LCP p75 passar de 1200 ms, então serve como
portão. O orçamento é ajustável com `--budget <ms>`.

## Observação sobre a primeira execução

A execução inicial contra produção costuma marcar 2 s ou mais: é cache frio do
CDN e cold start da função. Por isso o relatório usa **p75 de várias execuções**,
não uma amostra única — mas o valor alto da primeira visita a uma região fria é
real para quem a recebe, e é o que uma medição de campo capturaria.
