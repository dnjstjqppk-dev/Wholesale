/// <reference lib="dom" />
// apps/api-worker/src/index.ts
// Cloudflare Workers Modular B2B API Engine

import { CORS_HEADERS, jsonResponse, problemResponse } from './response';
import { handleAuth } from './routesAuth';
import { handleCatalog } from './routesCatalog';
import { handleSourcing } from './routesSourcing';
import { handleTrade } from './routesTrade';
import { handleGovernance } from './routesGovernance';

export interface Env {}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health Check
    if (url.pathname === '/' || url.pathname === '/v1/health') {
      return jsonResponse({
        status: 'healthy',
        service: 'wholesale-api',
        version: '1.0.0',
        platform: 'Cloudflare Workers Global Edge Network',
        timestamp: new Date().toISOString(),
        auth_mode: 'HMAC-SHA256 JWT Signed Security',
        engines: {
          pricing: 'active (shopspring/decimal exact minor calculation)',
          ledger: 'active (double-entry immutable posting: sum(debit) == sum(credit))',
          governance: 'active (SHA-256 digital document hash contract verification)',
          inventory: 'active (atomic reservation & oversell prevention)',
          logistics: 'active (cumulative split-shipment bound validation)',
        },
      });
    }

    // Route delegation
    const authRes = await handleAuth(request, url);
    if (authRes) return authRes;

    const catalogRes = await handleCatalog(request, url);
    if (catalogRes) return catalogRes;

    const sourcingRes = await handleSourcing(request, url);
    if (sourcingRes) return sourcingRes;

    const tradeRes = await handleTrade(request, url);
    if (tradeRes) return tradeRes;

    const governanceRes = await handleGovernance(request, url);
    if (governanceRes) return governanceRes;

    // 404 Fallback
    return problemResponse(404, 'NOT_FOUND', 'Not Found', `Endpoint ${url.pathname} does not exist`);
  },
};
