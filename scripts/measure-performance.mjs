#!/usr/bin/env node
/**
 * Medição de performance do perfil público (TCK-0022).
 *
 * `AGENTS.md` regra 5 e a Fase 1 do roadmap afirmam **LCP mobile p75 < 1,2 s**.
 * Esse número nunca tinha sido medido — era uma promessa sem evidência. Este
 * script transforma a promessa em portão: mede, calcula o p75 e sai com código
 * ≠ 0 quando o orçamento estoura.
 *
 * Condições de laboratório equivalentes ao preset "mobile" do Lighthouse:
 *   * viewport e user agent de celular;
 *   * CPU 4× mais lenta;
 *   * rede Slow 4G (1,6 Mbps down / 750 kbps up / 150 ms RTT);
 *   * cache limpo a cada execução — é sempre a primeira visita que dói.
 *
 * Isto é **laboratório**, não campo: mede a entrega do app numa máquina só, sem
 * a variância de rede e aparelho de usuários reais. Vale como portão de
 * regressão, não como prova do p75 de produção (ver docs/performance/README.md).
 *
 * Uso:
 *   npm run perf                     mede o padrão (/pt-BR/demo), 10 execuções
 *   npm run perf -- --runs 20        mais amostras
 *   npm run perf -- --url http://…   mede um alvo já no ar (ex.: a Vercel)
 *   npm run perf -- --budget 1500    outro orçamento de LCP, em ms
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, devices } from '@playwright/test';

const args = process.argv.slice(2);

function argValue(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

const RUNS = Number(argValue('runs', 10));
const BUDGET_MS = Number(argValue('budget', 1200));
const TARGET_PATH = argValue('path', '/pt-BR/demo');
const EXTERNAL_URL = argValue('url', null);
const PORT = Number(argValue('port', 3311));
const REPORT_DIR = join(process.cwd(), 'docs', 'performance');

/** Preset "Slow 4G" — o mesmo que o Lighthouse usa no perfil mobile. */
const SLOW_4G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 150,
};

const CPU_THROTTLE = 4;

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  // Método do percentil mais próximo (nearest-rank): com poucas amostras é o
  // que não inventa um valor que nenhuma execução produziu.
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(rank - 1, sorted.length - 1)];
}

function round(value) {
  return value === null || value === undefined ? null : Math.round(value * 10) / 10;
}

/** Encerra o grupo — `npx` e o `next-server` filho, que de outro modo fica órfão. */
function stopServer(server) {
  if (!server?.pid) return;

  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
}

async function startServer() {
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  const baseUrl = `http://localhost:${PORT}`;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { cache: 'no-store' });
      if (response.status < 500) return { server, baseUrl };
    } catch {
      // ainda subindo
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  stopServer(server);
  throw new Error('o servidor não respondeu em 120 s — rode `npm run build` antes.');
}

/**
 * Coleta as métricas de uma visita fria.
 *
 * O observador é registrado no documento **antes** da navegação (`addInitScript`):
 * registrar depois perderia o LCP, que costuma acontecer antes de o teste
 * conseguir rodar qualquer coisa.
 */
async function measureOnce(context, url) {
  const page = await context.newPage();
  const client = await context.newCDPSession(page);

  await client.send('Network.emulateNetworkConditions', SLOW_4G);
  await client.send('Emulation.setCPUThrottlingRate', { rate: CPU_THROTTLE });

  await page.addInitScript(() => {
    window.__perf = { lcp: 0, cls: 0, longTasks: [] };

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.lcp = Math.max(window.__perf.lcp, entry.startTime + entry.duration);
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__perf.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__perf.longTasks.push(entry.duration);
      }
    }).observe({ type: 'longtask', buffered: true });
  });

  await page.goto(url, { waitUntil: 'load' });
  // Janela curta de quietude: o LCP pode ser substituído por um elemento que
  // pinta logo depois do `load`.
  await page.waitForTimeout(1500);

  const metrics = await page.evaluate(() => {
    const paint = performance.getEntriesByType('paint');
    const navigation = performance.getEntriesByType('navigation')[0];
    const fcp = paint.find((entry) => entry.name === 'first-contentful-paint');

    return {
      lcp: window.__perf.lcp,
      cls: window.__perf.cls,
      // TBT: soma do que passa de 50 ms em cada tarefa longa.
      tbt: window.__perf.longTasks.reduce((total, d) => total + Math.max(0, d - 50), 0),
      fcp: fcp ? fcp.startTime : null,
      ttfb: navigation ? navigation.responseStart : null,
      transferredBytes: performance
        .getEntriesByType('resource')
        .reduce((total, entry) => total + (entry.transferSize || 0), 0),
    };
  });

  await client.detach();
  await page.close();

  return metrics;
}

let server = null;
let exitCode = 0;

try {
  let baseUrl = EXTERNAL_URL;

  if (!baseUrl) {
    console.log(`Subindo o app em produção na porta ${PORT}...`);
    const started = await startServer();
    server = started.server;
    baseUrl = started.baseUrl;
  }

  const url = new URL(TARGET_PATH, baseUrl).toString();
  console.log(`Medindo ${url} — ${RUNS} execuções, mobile, CPU ${CPU_THROTTLE}×, Slow 4G.\n`);

  const browser = await chromium.launch();
  const samples = [];

  for (let run = 1; run <= RUNS; run += 1) {
    // Contexto novo a cada execução = cache, storage e conexões limpos.
    const context = await browser.newContext({ ...devices['Pixel 5'] });
    const metrics = await measureOnce(context, url);
    await context.close();

    samples.push(metrics);
    console.log(
      `  execução ${String(run).padStart(2)}: LCP ${round(metrics.lcp)} ms · FCP ${round(metrics.fcp)} ms · TTFB ${round(metrics.ttfb)} ms · CLS ${round(metrics.cls)}`
    );
  }

  await browser.close();

  const lcp = samples.map((sample) => sample.lcp);
  const result = {
    measuredAt: new Date().toISOString(),
    url,
    runs: RUNS,
    conditions: { device: 'Pixel 5', cpuThrottling: `${CPU_THROTTLE}x`, network: 'Slow 4G' },
    budgetMs: BUDGET_MS,
    lcp: {
      p75: round(percentile(lcp, 75)),
      p50: round(percentile(lcp, 50)),
      min: round(Math.min(...lcp)),
      max: round(Math.max(...lcp)),
    },
    fcpP75: round(
      percentile(
        samples.map((s) => s.fcp).filter((v) => v !== null),
        75
      )
    ),
    ttfbP75: round(
      percentile(
        samples.map((s) => s.ttfb).filter((v) => v !== null),
        75
      )
    ),
    clsP75: round(
      percentile(
        samples.map((s) => s.cls),
        75
      )
    ),
    tbtP75: round(
      percentile(
        samples.map((s) => s.tbt),
        75
      )
    ),
    transferredBytesP75: round(
      percentile(
        samples.map((s) => s.transferredBytes),
        75
      )
    ),
  };

  const passed = result.lcp.p75 <= BUDGET_MS;

  console.log('\n─── Resultado ───────────────────────────────────────────────');
  console.log(`  LCP p75 : ${result.lcp.p75} ms   (orçamento ${BUDGET_MS} ms)`);
  console.log(
    `  LCP p50 : ${result.lcp.p50} ms   ·  min ${result.lcp.min} / max ${result.lcp.max}`
  );
  console.log(`  FCP p75 : ${result.fcpP75} ms`);
  console.log(`  TTFB p75: ${result.ttfbP75} ms`);
  console.log(`  CLS p75 : ${result.clsP75}`);
  console.log(`  TBT p75 : ${result.tbtP75} ms`);
  console.log(`  Bytes   : ${Math.round((result.transferredBytesP75 ?? 0) / 1024)} KB`);
  console.log(`  Veredito: ${passed ? 'DENTRO do orçamento' : 'ACIMA do orçamento'}`);
  console.log('─────────────────────────────────────────────────────────────');

  // Um arquivo por alvo: medir a Vercel não pode apagar a medição local, senão
  // o relatório passa a misturar laboratório com produção sem avisar.
  const environment = EXTERNAL_URL ? new URL(baseUrl).hostname.replace(/\./g, '-') : 'local';
  const reportFile = `${environment}.json`;

  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(
    join(REPORT_DIR, reportFile),
    `${JSON.stringify({ ...result, environment: EXTERNAL_URL ? 'produção' : 'laboratório local', passed }, null, 2)}\n`,
    'utf8'
  );
  console.log(`\nRelatório: docs/performance/${reportFile}`);

  if (!passed) {
    console.error(
      `\nLCP p75 (${result.lcp.p75} ms) acima do orçamento (${BUDGET_MS} ms). ` +
        'A regra 5 do AGENTS.md não está sendo cumprida.'
    );
    exitCode = 1;
  }
} catch (error) {
  console.error('Falha na medição:', error.message);
  exitCode = 1;
} finally {
  stopServer(server);
}

process.exit(exitCode);
