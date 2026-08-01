/**
 * Limite de taxa da ingestão de analytics.
 *
 * Contabiliza por **perfil**, nunca por visitante: a regra 7 do AGENTS.md proíbe
 * IP, fingerprint e cookie de rastreamento, então não existe identificador de
 * visitante para contar. O que se protege aqui é a integridade do número de um
 * perfil contra enxurrada — o `profileId` está no HTML público, e sem teto
 * qualquer pessoa infla a métrica de qualquer um.
 *
 * O estado é em memória do processo. Em ambiente serverless o teto vale por
 * instância, o que é uma proteção parcial e deliberada: um limite compartilhado
 * exigiria armazenamento externo (custo) ou registrar quem chamou (privacidade).
 */

export interface RateLimitResult {
  allowed: boolean;
  /** Quantos eventos já foram aceitos na janela corrente. */
  hits: number;
}

interface Window {
  startedAt: number;
  hits: number;
}

export const RATE_LIMIT_WINDOW_IN_MS = 60_000;
export const RATE_LIMIT_MAX_EVENTS_PER_WINDOW = 300;

/** Teto de perfis rastreados ao mesmo tempo, para o mapa não crescer sem fim. */
const MAX_TRACKED_KEYS = 5_000;

export class RateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly maxEvents: number = RATE_LIMIT_MAX_EVENTS_PER_WINDOW,
    private readonly windowInMs: number = RATE_LIMIT_WINDOW_IN_MS
  ) {}

  check(key: string, now: number = Date.now()): RateLimitResult {
    const current = this.windows.get(key);

    if (!current || now - current.startedAt >= this.windowInMs) {
      this.evictIfNeeded(now);
      this.windows.set(key, { startedAt: now, hits: 1 });

      return { allowed: true, hits: 1 };
    }

    if (current.hits >= this.maxEvents) {
      return { allowed: false, hits: current.hits };
    }

    current.hits += 1;

    return { allowed: true, hits: current.hits };
  }

  /** Descarta janelas vencidas; se ainda estiver cheio, limpa tudo. */
  private evictIfNeeded(now: number): void {
    if (this.windows.size < MAX_TRACKED_KEYS) {
      return;
    }

    for (const [key, window] of this.windows) {
      if (now - window.startedAt >= this.windowInMs) {
        this.windows.delete(key);
      }
    }

    if (this.windows.size >= MAX_TRACKED_KEYS) {
      this.windows.clear();
    }
  }
}

const globalForRateLimit = globalThis as typeof globalThis & {
  analyticsRateLimiter?: RateLimiter;
};

/** Instância compartilhada do processo (sobrevive ao hot reload em dev). */
export function getAnalyticsRateLimiter(): RateLimiter {
  globalForRateLimit.analyticsRateLimiter ??= new RateLimiter();

  return globalForRateLimit.analyticsRateLimiter;
}
