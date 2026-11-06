# wholesale-api (Cloudflare Workers edge API)

B2B trade full-cycle edge API: auth, catalog, sourcing, orders, escrow payments,
settlements, disputes, storage, realtime, verification, governance.

## Secrets (never commit values)

Set via Wrangler secrets (per environment):

```sh
npx wrangler secret put JWT_SECRET            # required, >= 32 chars (fail-closed in production)
npx wrangler secret put PAYMENT_WEBHOOK_SECRET # required for /v1/payments/webhook HMAC
npx wrangler secret put SENTRY_DSN             # optional; unset = structured console logs only
```

Plain vars (`ENVIRONMENT`, `CORE_API_URL`) live in `wrangler.jsonc` `[vars]`.

## Observability

- `GET /v1/health` — liveness + engine flags.
- `GET /v1/metrics` — real per-isolate snapshot: `requests_total`,
  `errors_total` (5xx only), `error_rate`, `latency_ms_p50/p95/p99`,
  `latency_samples`, plus live entity counts. No fake baselines.
- Every response carries `X-Request-Id` / `X-Response-Time-Ms`.
- Every request emits one structured JSON log line
  (`{ ts, level, service, request_id, method, path, status, latency_ms }`).
- Unexpected 5xx go through `reportError()` (`src/observability.ts`):
  always structured-logged, delivered to Sentry only when `SENTRY_DSN`
  is a valid `https://<key>@<host>/<project>` DSN. Delivery failures
  never throw.

Metrics are per-isolate memory (last 1024 latency samples). Aggregate
across instances via the Sentry/metrics pipeline for fleet-wide SLOs.

## Tests

```sh
node tests/e2e/worker_observability_test.js  # metrics + tracing + Sentry hook
node tests/e2e/worker_trade_cycle_test.js    # secured trade cycle
node tests/e2e/worker_pagination_test.js     # list pagination/search/filter
node tests/security/security_test.js         # security invariants
```
