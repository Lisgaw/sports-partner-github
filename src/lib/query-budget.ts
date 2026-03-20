/**
 * Endpoint Query Budget — API endpoint performans disiplini
 *
 * Her kritik endpoint için max query sayısı ve p95 hedefi tanımlar.
 * Budget aşımlarını loglar → sistem tekrar şişmeden erken uyarı verir.
 *
 * Kullanım:
 *   const budget = startBudget("listings:GET");
 *   // ... handler kodu ...
 *   budget.end(); // loglar: durationMs, overBudget uyarısı
 *
 * AsyncLocalStorage ile Prisma middleware entegrasyonu:
 *   Otomatik query sayma (prisma.ts'de $use hook)
 */
import { AsyncLocalStorage } from "node:async_hooks";
import { createLogger } from "@/lib/logger";

const log = createLogger("query-budget");

// ─── Budget Tanımları ────────────────────────────────────────────────────────
// maxQueries: endpoint başına izin verilen max DB sorgusu
// p95TargetMs: beklenen p95 latency hedefi (ms)

export const ENDPOINT_BUDGETS: Record<string, { maxQueries: number; p95TargetMs: number }> = {
  "profile:GET":        { maxQueries: 12, p95TargetMs: 800 },
  "profile:PUT":        { maxQueries: 6,  p95TargetMs: 600 },
  "listings:GET":       { maxQueries: 4,  p95TargetMs: 500 },
  "listings:POST":      { maxQueries: 6,  p95TargetMs: 600 },
  "search:GET":         { maxQueries: 6,  p95TargetMs: 500 },
  "posts:GET":          { maxQueries: 3,  p95TargetMs: 400 },
  "posts:POST":         { maxQueries: 5,  p95TargetMs: 500 },
  "notifications:GET":  { maxQueries: 2,  p95TargetMs: 300 },
  "feed:GET":           { maxQueries: 5,  p95TargetMs: 500 },
  "messages:GET":       { maxQueries: 3,  p95TargetMs: 400 },
  "messages:POST":      { maxQueries: 5,  p95TargetMs: 400 },
};

const DEFAULT_BUDGET = { maxQueries: 8, p95TargetMs: 600 };

// ─── Tracker ─────────────────────────────────────────────────────────────────

class BudgetTracker {
  public queries = 0;
  private startMs: number;
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
    this.startMs = Date.now();
  }

  trackQuery(): void {
    this.queries++;
  }

  end(): { queries: number; durationMs: number; overBudget: boolean; overP95: boolean } {
    const durationMs = Date.now() - this.startMs;
    const budget = ENDPOINT_BUDGETS[this.endpoint] ?? DEFAULT_BUDGET;
    const overBudget = this.queries > budget.maxQueries;
    const overP95 = durationMs > budget.p95TargetMs;

    if (overBudget) {
      log.warn(`QUERY BUDGET EXCEEDED [${this.endpoint}]`, {
        queries: this.queries,
        limit: budget.maxQueries,
        durationMs,
      });
    }

    if (overP95) {
      log.warn(`P95 TARGET EXCEEDED [${this.endpoint}]`, {
        durationMs,
        target: budget.p95TargetMs,
        queries: this.queries,
      });
    }

    return { queries: this.queries, durationMs, overBudget, overP95 };
  }
}

// ─── AsyncLocalStorage — per-request query tracking ──────────────────────────

const budgetStore = new AsyncLocalStorage<BudgetTracker>();

/**
 * Endpoint budget başlat. Dönüş değeri ile `end()` çağrılır.
 */
export function startBudget(endpoint: string): BudgetTracker {
  const tracker = new BudgetTracker(endpoint);
  return tracker;
}

/**
 * Bir handler'ı budget context'i içinde çalıştır.
 * Prisma middleware otomatik olarak query'leri sayar.
 */
export async function withBudget<T>(endpoint: string, fn: () => Promise<T>): Promise<T> {
  const tracker = new BudgetTracker(endpoint);
  return budgetStore.run(tracker, async () => {
    try {
      return await fn();
    } finally {
      tracker.end();
    }
  });
}

/**
 * Prisma middleware'den çağrılır: aktif budget varsa query sayacını artır.
 */
export function trackQueryInBudget(): void {
  const tracker = budgetStore.getStore();
  if (tracker) tracker.trackQuery();
}
