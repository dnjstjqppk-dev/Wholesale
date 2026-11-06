/// <reference lib="dom" />
// Edge observability: real request metrics, structured logs, Sentry hook.
// Metrics live in isolate memory (per-instance); aggregate across instances
// in production via the Sentry/metrics pipeline, not this endpoint alone.

const MAX_SAMPLES = 1024;
let requestsTotal = 0;
let errorsTotal = 0; // status >= 500 only; 4xx is client behavior, not error
const latencies: number[] = [];

export function recordMetrics(status: number, latencyMs: number): void {
  requestsTotal++;
  if (status >= 500) errorsTotal++;
  latencies.push(latencyMs);
  if (latencies.length > MAX_SAMPLES) latencies.splice(0, latencies.length - MAX_SAMPLES);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

export interface MetricsSnapshot {
  requests_total: number;
  errors_total: number;
  error_rate: number;
  latency_ms_p50: number;
  latency_ms_p95: number;
  latency_ms_p99: number;
  latency_samples: number;
}

export function getMetricsSnapshot(): MetricsSnapshot {
  const sorted = [...latencies].sort((a, b) => a - b);
  return {
    requests_total: requestsTotal,
    errors_total: errorsTotal,
    error_rate: requestsTotal === 0 ? 0 : errorsTotal / requestsTotal,
    latency_ms_p50: percentile(sorted, 50),
    latency_ms_p95: percentile(sorted, 95),
    latency_ms_p99: percentile(sorted, 99),
    latency_samples: sorted.length,
  };
}

/** Tests only: isolate module state between suites. */
export function resetMetrics(): void {
  requestsTotal = 0;
  errorsTotal = 0;
  latencies.length = 0;
}

export function logRequest(info: {
  request_id: string;
  method: string;
  path: string;
  status: number;
  latency_ms: number;
}): void {
  const level = info.status >= 500 ? 'error' : info.status >= 400 ? 'warn' : 'info';
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, service: 'wholesale-api', ...info }));
}

export interface SentryDsnParts {
  envelopeUrl: string;
  publicKey: string;
}

export function parseSentryDsn(dsn: string | undefined): SentryDsnParts | null {
  if (!dsn) return null;
  const m = dsn.match(/^https:\/\/([0-9a-f]+)@([^/]+)\/(\d+)\/?$/i);
  if (!m) return null;
  return { publicKey: m[1], envelopeUrl: `https://${m[2]}/api/${m[3]}/envelope/` };
}

function hexId(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return [...buf].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function buildSentryEnvelope(
  err: unknown,
  ctx: { request_id: string; method: string; path: string; environment: string }
): string {
  const eventId = hexId(16);
  const errAny = err as any;
  const header = JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() });
  const itemHeader = JSON.stringify({ type: 'event' });
  const payload = JSON.stringify({
    event_id: eventId,
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level: 'error',
    server_name: 'wholesale-api-edge',
    environment: ctx.environment,
    request: { method: ctx.method, url: ctx.path },
    tags: { request_id: ctx.request_id },
    exception: { values: [{ type: errAny?.name || 'Error', value: String(errAny?.message || err) }] },
  });
  return `${header}\n${itemHeader}\n${payload}\n`;
}

/**
 * Report an unexpected error. Always structured-logs; delivers to Sentry only
 * when SENTRY_DSN is configured. Never throws — monitoring must not break
 * the error path it observes.
 */
export async function reportError(
  err: unknown,
  opts: { dsn?: string; request_id: string; method: string; path: string; environment: string }
): Promise<boolean> {
  console.error(`[SRE ERROR TRACE] Request ${opts.request_id} failed:`, err);
  const parts = parseSentryDsn(opts.dsn);
  if (!parts) return false;
  try {
    const res = await fetch(parts.envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${parts.publicKey}, sentry_client=wholesale-edge/1.2.0`,
      },
      body: buildSentryEnvelope(err, opts),
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
