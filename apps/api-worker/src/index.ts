/// <reference lib="dom" />
// apps/api-worker/src/index.ts
// Cloudflare Workers Modular B2B API Engine & Production SRE Gateway

import { CORS_HEADERS, jsonResponse, problemResponse } from './response.ts';
import { configureRequest, DomainError } from './security.ts';
import { handleAuth } from './authSecure.ts';
import { handleCatalog } from './routesCatalog.ts';
import { handleSourcing } from './routesSourcing.ts';
import { handleTrade } from './routesTrade.ts';
import { handleGovernance } from './routesGovernance.ts';
import { handlePayment } from './routesPayment.ts';
import { handleStorage } from './routesStorage.ts';
import { handleRealtime } from './routesRealtime.ts';
import { handleVerification } from './routesVerification.ts';
import { recordMetrics, getMetricsSnapshot, logRequest, reportError } from './observability.ts';
import { orders, uploadedDocuments, virtualAccounts, verifiedTaxRegistries } from './store.ts';

export interface Env {
  CORE_API_URL?: string;
  ENVIRONMENT?: string;
  SENTRY_DSN?: string;
  JWT_SECRET?: string;
  PAYMENT_WEBHOOK_SECRET?: string;
}

const serverStartTime = Date.now();

async function handleRequest(request: Request, env: Env): Promise<Response> {
    const startTime = Date.now();
    const requestId = request.headers.get('x-request-id') || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
    const url = new URL(request.url);

    // Bind per-request runtime secrets (fail closed in production, dev fallback otherwise).
    configureRequest(request, {
      JWT_SECRET: resolveJwtSecret(env),
      PAYMENT_WEBHOOK_SECRET: env?.PAYMENT_WEBHOOK_SECRET,
    });

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return appendTracingHeaders(new Response(null, {
        status: 204,
        headers: { ...CORS_HEADERS },
      }), requestId, startTime);
    }

    // 1. Health Check
    if (url.pathname === '/' || url.pathname === '/v1/health') {
      return appendTracingHeaders(jsonResponse({
        status: 'healthy',
        service: 'wholesale-api',
        version: '1.2.0',
        environment: env?.ENVIRONMENT || 'production-edge',
        platform: 'Cloudflare Workers Global Edge Network',
        timestamp: new Date().toISOString(),
        auth_mode: 'HMAC-SHA256 JWT Signed Security',
        uptime_seconds: Math.floor((Date.now() - serverStartTime) / 1000),
        engines: {
          pricing: 'active (shopspring/decimal exact minor calculation)',
          ledger: 'active (double-entry immutable posting: sum(debit) == sum(credit))',
          governance: 'active (SHA-256 digital document hash contract verification)',
          inventory: 'active (atomic reservation & oversell prevention)',
          logistics: 'active (cumulative split-shipment bound validation)',
          payment_gateway: 'active (B2B Escrow Virtual Accounts, Toss Payments & Stripe Webhooks)',
          cloud_storage: 'active (Cloudflare R2 / AWS S3 Pre-signed URL Uploader)',
          realtime_sse: 'active (Server-Sent Events & In-App Notification Hub)',
          corporate_kyc: 'active (Korean NTS MOD-10 & Global D-U-N-S Validation)',
          core_proxy: env?.CORE_API_URL ? 'enabled (origin: ' + env.CORE_API_URL + ')' : 'edge-native mode',
        },
      }), requestId, startTime);
    }

    // 2. Real SRE Metrics: per-isolate measured snapshot (see observability.ts)
    if (url.pathname === '/v1/metrics' && request.method === 'GET') {
      const snap = getMetricsSnapshot();
      return appendTracingHeaders(jsonResponse({
        service: 'wholesale-api',
        version: '1.2.0',
        uptime_seconds: Math.floor((Date.now() - serverStartTime) / 1000),
        requests_total: snap.requests_total,
        errors_total: snap.errors_total,
        error_rate: snap.error_rate,
        latency_ms_p50: snap.latency_ms_p50,
        latency_ms_p95: snap.latency_ms_p95,
        latency_ms_p99: snap.latency_ms_p99,
        latency_samples: snap.latency_samples,
        active_orders_count: orders.size,
        escrow_virtual_accounts_count: virtualAccounts.size,
        cloud_stored_documents_count: uploadedDocuments.size,
        verified_tax_entities_count: verifiedTaxRegistries.size,
        status: 'OPERATIONAL',
      }), requestId, startTime);
    }

    // 2b. Edge rate limiting (per-client sliding window; health/metrics exempt above).
    const rateLimitHit = checkRateLimit(request, url);
    if (rateLimitHit) {
      return appendTracingHeaders(
        problemResponse(429, 'RATE_LIMITED', 'Too Many Requests', rateLimitHit),
        requestId,
        startTime
      );
    }

    // 3. Edge Gateway Proxy to Core Go Backend if configured
    if (env?.CORE_API_URL) {
      try {
        const upstreamUrl = new URL(url.pathname + url.search, env.CORE_API_URL);
        const proxyReq = new Request(upstreamUrl.toString(), request);
        return await fetch(proxyReq);
      } catch (err: any) {
        console.warn('Upstream Core API proxy attempt failed, delegating to edge domain engine:', err);
      }
    }

    try {
      // 4. Route Delegation across all Core & Commercial modules
      const paymentRes = await handlePayment(request, url);
      if (paymentRes) return appendTracingHeaders(paymentRes, requestId, startTime);

      const storageRes = await handleStorage(request, url);
      if (storageRes) return appendTracingHeaders(storageRes, requestId, startTime);

      const realtimeRes = await handleRealtime(request, url);
      if (realtimeRes) return appendTracingHeaders(realtimeRes, requestId, startTime);

      const verificationRes = await handleVerification(request, url);
      if (verificationRes) return appendTracingHeaders(verificationRes, requestId, startTime);

      const authRes = await handleAuth(request, url);
      if (authRes) return appendTracingHeaders(authRes, requestId, startTime);

      const catalogRes = await handleCatalog(request, url);
      if (catalogRes) return appendTracingHeaders(catalogRes, requestId, startTime);

      const sourcingRes = await handleSourcing(request, url);
      if (sourcingRes) return appendTracingHeaders(sourcingRes, requestId, startTime);

      const tradeRes = await handleTrade(request, url);
      if (tradeRes) return appendTracingHeaders(tradeRes, requestId, startTime);

      const governanceRes = await handleGovernance(request, url);
      if (governanceRes) return appendTracingHeaders(governanceRes, requestId, startTime);

      // 404 Fallback
      const notFoundRes = problemResponse(404, 'NOT_FOUND', 'Not Found', `Endpoint ${url.pathname} does not exist`);
      return appendTracingHeaders(notFoundRes, requestId, startTime);
    } catch (err: any) {
      // Global SRE Error Boundary
      if (err instanceof DomainError) {
        return appendTracingHeaders(problemResponse(err.status, err.code, err.code, err.message), requestId, startTime);
      }
      await reportError(err, { dsn: env?.SENTRY_DSN, request_id: requestId, method: request.method, path: url.pathname, environment: env?.ENVIRONMENT || 'production-edge' });
      const errRes = problemResponse(500, 'INTERNAL_SERVER_ERROR', 'Internal Server Error', err.message || 'An unexpected error occurred');
      return appendTracingHeaders(errRes, requestId, startTime);
    }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const start = Date.now();
    try {
      const res = await handleRequest(request, env);
      const latency = Date.now() - start;
      recordMetrics(res.status, latency);
      logRequest({ request_id: res.headers.get('X-Request-Id') || 'unknown', method: request.method, path: new URL(request.url).pathname, status: res.status, latency_ms: latency });
      return res;
    } catch (err) {
      recordMetrics(500, Date.now() - start);
      throw err;
    }
  },
};

function appendTracingHeaders(res: Response, requestId: string, startTime: number): Response {
  const duration = Date.now() - startTime;
  res.headers.set('X-Request-Id', requestId);
  res.headers.set('X-Response-Time-Ms', duration.toString());
  res.headers.set('X-Wholesale-Edge', 'Cloudflare-Worker-v1.2');
  return res;
}

// Dev-only JWT fallback (used only when ENVIRONMENT !== 'production' and JWT_SECRET is unset).
const DEV_JWT_FALLBACK = 'wholesale-dev-only-fallback-secret-32b-min!';
let devFallbackWarned = false;

function resolveJwtSecret(env: Env): string | undefined {
  if (env?.JWT_SECRET && env.JWT_SECRET.length >= 32) return env.JWT_SECRET;
  if (env?.ENVIRONMENT === 'production') return undefined;
  if (!devFallbackWarned) {
    devFallbackWarned = true;
    console.warn('[SECURITY] JWT_SECRET not configured; using dev-only fallback. Set JWT_SECRET in production.');
  }
  return DEV_JWT_FALLBACK;
}

// Per-client sliding-window rate limiter (edge-isolate memory; use Redis/Workers KV for global limits).
const rateBuckets = new Map<string, number[]>();
function checkRateLimit(request: Request, url: URL): string | null {
  const forwarded = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'unknown';
  const ip = forwarded.split(',')[0].trim() || 'unknown';
  const isAuth = url.pathname.startsWith('/v1/auth/');
  const limit = isAuth ? 30 : 600;
  const windowMs = 60_000;
  const now = Date.now();
  const key = `${isAuth ? 'auth' : 'api'}:${ip}`;
  const bucket = (rateBuckets.get(key) || []).filter(t => now - t < windowMs);
  if (bucket.length >= limit) {
    rateBuckets.set(key, bucket);
    return `Rate limit exceeded: ${limit} requests per minute for ${isAuth ? 'auth endpoints' : 'API endpoints'}.`;
  }
  bucket.push(now);
  if (rateBuckets.size > 5000) rateBuckets.clear();
  rateBuckets.set(key, bucket);
  return null;
}
