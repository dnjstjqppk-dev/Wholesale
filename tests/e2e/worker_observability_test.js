// tests/e2e/worker_observability_test.js
// Real metrics invariants + Sentry hook safety on the REAL worker.

const worker = (await import('../../apps/api-worker/src/index.ts')).default;
const obs = await import('../../apps/api-worker/src/observability.ts');

const ENV = {
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-jwt-secret-0123456789abcdef-SECURE-32B',
  PAYMENT_WEBHOOK_SECRET: 'test-webhook-secret-0123456789abcdef',
};

let passed = 0;
let total = 0;
function assert(condition, message) {
  total++;
  if (!condition) {
    console.error(`  FAIL [${total}]: ${message}`);
    throw new Error(`Observability assertion failed: ${message}`);
  }
  console.log(`  PASS [${total}]: ${message}`);
  passed++;
}

async function call(path, { method = 'GET', ip = '10.9.0.1' } = {}) {
  const res = await worker.fetch(
    new Request(`http://worker.local${path}`, { method, headers: { 'X-Forwarded-For': ip } }),
    ENV
  );
  const requestId = res.headers.get('X-Request-Id');
  const body = method === 'OPTIONS' ? null : JSON.parse(await res.text());
  return { status: res.status, json: body, requestId };
}

obs.resetMetrics();

// 1. Fresh isolate: all zeros (no fake baselines).
let m = (await call('/v1/metrics')).json;
assert(m.requests_total === 0, 'fresh isolate reports zero requests');
assert(m.errors_total === 0 && m.error_rate === 0, 'fresh isolate reports zero errors');
assert(m.latency_ms_p95 === 0 && m.latency_samples === 0, 'no latency samples before traffic');

// 2. Generate traffic: 5 health (200) + 1 unknown path (404).
for (let i = 0; i < 5; i++) {
  const r = await call('/v1/health');
  assert(r.status === 200, `health #${i + 1} returns 200`);
  assert(typeof r.requestId === 'string' && r.requestId.length > 0, `health #${i + 1} carries X-Request-Id`);
}
const pre = await call('/v1/health', { method: 'OPTIONS' });
assert(pre.status === 204, 'CORS preflight returns 204');
assert(typeof pre.requestId === 'string' && pre.requestId.length > 0, 'preflight carries X-Request-Id');
const nf = await call('/v1/nope');
assert(nf.status === 404, 'unknown path returns 404');

// Snapshot excludes the in-flight metrics call itself (recorded after respond).
m = (await call('/v1/metrics')).json;
assert(m.requests_total === 8, `requests_total counts all prior requests (got ${m.requests_total})`);
assert(m.latency_samples === 8, `latency sample per recorded request (got ${m.latency_samples})`);
assert(m.errors_total === 0, '4xx is client behavior, not counted as error');
assert(m.error_rate === 0, 'error_rate stays 0 with no 5xx');
assert(typeof m.latency_ms_p50 === 'number' && m.latency_ms_p50 >= 0, 'p50 latency present');
assert(m.latency_ms_p95 >= m.latency_ms_p50, 'p95 >= p50 ordering');
assert(m.latency_ms_p99 >= m.latency_ms_p95, 'p99 >= p95 ordering');

// 3. Structured JSON log per request.
let logged = null;
const origLog = console.log;
console.log = (s) => {
  try {
    const o = JSON.parse(s);
    if (o && o.service === 'wholesale-api') logged = o;
  } catch { /* not JSON: ignore */ }
};
await call('/v1/health');
console.log = origLog;
assert(
  logged && logged.level === 'info' && logged.status === 200 && typeof logged.latency_ms === 'number',
  'one structured JSON log line per request'
);

// 4. Sentry DSN parsing (fail-closed on garbage).
assert(obs.parseSentryDsn(undefined) === null, 'missing DSN -> null');
assert(obs.parseSentryDsn('') === null, 'empty DSN -> null');
assert(obs.parseSentryDsn('not-a-dsn') === null, 'garbage DSN -> null');
assert(obs.parseSentryDsn('http://key@host/1') === null, 'plain-http DSN rejected');
const parts = obs.parseSentryDsn('https://abc123@sentry.io/456');
assert(
  parts && parts.envelopeUrl === 'https://sentry.io/api/456/envelope/' && parts.publicKey === 'abc123',
  'valid DSN parses to envelope URL + key'
);

// 5. Sentry envelope shape.
const envelope = obs.buildSentryEnvelope(new Error('boom-x1'), {
  request_id: 'r1', method: 'GET', path: '/v1/x', environment: 'test',
});
assert(
  envelope.includes('"type":"event"') && envelope.includes('boom-x1') && envelope.includes('r1'),
  'envelope carries type + message + request_id'
);

// 6. reportError never throws; false without DSN or with unreachable DSN.
const ok = await obs.reportError(new Error('boom-x2'), {
  request_id: 'r2', method: 'GET', path: '/v1/x', environment: 'test',
});
assert(ok === false, 'reportError without DSN logs and returns false');
const ok2 = await obs.reportError(new Error('boom-x3'), {
  dsn: 'https://abc@127.0.0.1:9/1', request_id: 'r3', method: 'GET', path: '/v1/x', environment: 'test',
});
assert(ok2 === false, 'reportError with unreachable DSN returns false without throwing');

console.log(`\nObservability: ${passed}/${total} passed`);
if (passed !== total) process.exit(1);
