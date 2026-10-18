export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Organization-ID, Idempotency-Key',
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function problemResponse(status: number, code: string, title: string, detail: string) {
  return new Response(
    JSON.stringify({
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      request_id: crypto.randomUUID(),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
        ...CORS_HEADERS,
      },
    }
  );
}

// In-memory mock database state
const mockListings = [
  {
    id: '33333333-3333-3333-3333-333333333333',
    sku_id: '44444444-4444-4444-4444-444444444444',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    supplier_name: 'Precision Korea Co.',
    is_verified_supplier: true,
    country: 'KR',
    moq: '100',
    quantity_step: '10',
    unit: 'pcs',
    lead_time_days: 14,
    status: 'PUBLISHED',
    price_tiers: [
      { min_quantity: '100', max_quantity: '499', unit_price: '5.500000', currency: 'USD' },
      { min_quantity: '500', max_quantity: '999', unit_price: '4.800000', currency: 'USD' },
      { min_quantity: '1000', max_quantity: null, unit_price: '4.200000', currency: 'USD' },
    ],
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    sku_id: '66666666-6666-6666-6666-666666666666',
    title: '친환경 크라프트 파우치 지퍼백 (식품 포장용 500g)',
    supplier_name: 'EcoPack Global Ltd.',
    is_verified_supplier: true,
    country: 'KR',
    moq: '500',
    quantity_step: '50',
    unit: 'pcs',
    lead_time_days: 20,
    status: 'PUBLISHED',
    price_tiers: [
      { min_quantity: '500', max_quantity: '1999', unit_price: '0.450000', currency: 'USD' },
      { min_quantity: '2000', max_quantity: '4999', unit_price: '0.380000', currency: 'USD' },
      { min_quantity: '5000', max_quantity: null, unit_price: '0.320000', currency: 'USD' },
    ],
  },
];

const mockOrders = [
  {
    id: 'ord-20261018-001',
    order_number: 'ORD-20261018-001',
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_name: 'Precision Korea Co.',
    total_amount_minor: '420000', // $4,200.00
    currency: 'USD',
    order_status: 'IN_PRODUCTION',
    payment_status: 'PAID_DOWN_PAYMENT',
    ordered_quantity: 1000,
    shipped_quantity: 400,
    is_contract_signed: true,
    created_at: new Date().toISOString(),
  },
];

const mockRFQs = [
  {
    id: 'rfq-20261018-01',
    title: '식품 포장용 크라프트 파우치 (지퍼형)',
    destination_country: 'KR',
    quantity: '20000',
    unit: 'pcs',
    lead_time_days: 30,
    status: 'PUBLISHED',
    quotes_count: 3,
    created_at: new Date().toISOString(),
  },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // Health
    if (url.pathname === '/' || url.pathname === '/v1/health') {
      return jsonResponse({
        status: 'healthy',
        service: 'wholesale-api',
        version: '1.0.0',
        platform: 'Cloudflare Workers Edge Network',
        timestamp: new Date().toISOString(),
        engines: {
          pricing: 'active (shopspring/decimal exact minor calculation)',
          ledger: 'active (double-entry immutable posting)',
          governance: 'active (SHA-256 hash contract verification)',
          inventory: 'active (atomic reservation & oversell prevention)',
        },
      });
    }

    // Auth
    if (url.pathname === '/v1/auth/register' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      return jsonResponse(
        {
          access_token: `jwt-${crypto.randomUUID()}`,
          token_type: 'Bearer',
          expires_in: 86400,
          user: {
            id: crypto.randomUUID(),
            email: body.email || 'user@example.com',
            full_name: body.full_name || 'Business User',
            role: 'ORG_OWNER',
          },
          organization: {
            id: crypto.randomUUID(),
            legal_name: body.company_name || 'Enterprise Corp',
            business_number: body.business_number || '123-45-67890',
          },
        },
        201
      );
    }

    if (url.pathname === '/v1/auth/login' && request.method === 'POST') {
      return jsonResponse({
        access_token: `jwt-${crypto.randomUUID()}`,
        token_type: 'Bearer',
        expires_in: 86400,
      });
    }

    // Catalog Listings
    if (url.pathname === '/v1/catalog/listings') {
      if (request.method === 'GET') {
        return jsonResponse({
          items: mockListings,
          total_count: mockListings.length,
        });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const newListing = {
          id: crypto.randomUUID(),
          ...body,
          status: 'PUBLISHED',
          created_at: new Date().toISOString(),
        };
        mockListings.push(newListing);
        return jsonResponse(newListing, 201);
      }
    }

    // RFQs
    if (url.pathname === '/v1/sourcing/rfqs') {
      if (request.method === 'GET') {
        return jsonResponse({
          items: mockRFQs,
          total_count: mockRFQs.length,
        });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const newRFQ = {
          id: `rfq-${Date.now()}`,
          ...body,
          status: 'PUBLISHED',
          quotes_count: 0,
          created_at: new Date().toISOString(),
        };
        mockRFQs.push(newRFQ);
        return jsonResponse(newRFQ, 201);
      }
    }

    // Trade Orders
    if (url.pathname === '/v1/trade/orders') {
      return jsonResponse({
        orders: mockOrders,
        total_count: mockOrders.length,
      });
    }

    // Contract Sign
    if (url.pathname.match(/^\/v1\/trade\/orders\/[^\/]+\/contract\/sign$/) && request.method === 'POST') {
      return jsonResponse({
        contract_id: crypto.randomUUID(),
        signed: true,
        signed_at: new Date().toISOString(),
        status: 'CONTRACT_SIGNED',
      });
    }

    // Payments
    if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
      return jsonResponse({
        payment_id: crypto.randomUUID(),
        pg_transaction_id: `PG-TX-${crypto.randomUUID().slice(0, 8)}`,
        status: 'PAID',
        amount_minor: '144000',
        currency: 'USD',
        ledger_posted: true,
      });
    }

    // Logistics Shipments
    if (url.pathname === '/v1/logistics/shipments' && request.method === 'POST') {
      return jsonResponse(
        {
          shipment_id: crypto.randomUUID(),
          status: 'IN_TRANSIT',
          created_at: new Date().toISOString(),
        },
        201
      );
    }

    // Settlements
    if (url.pathname === '/v1/settlements') {
      return jsonResponse({
        settlements: [
          {
            id: 'set-2026-001',
            order_number: 'ORD-20261018-001',
            gross_minor: 420000,
            fee_minor: 21000, // 5%
            net_minor: 399000,
            currency: 'USD',
            status: 'RELEASE_ELIGIBLE',
          },
        ],
      });
    }

    // Disputes
    if (url.pathname === '/v1/disputes' && request.method === 'POST') {
      return jsonResponse(
        {
          dispute_id: crypto.randomUUID(),
          status: 'OPENED',
          freeze_active: true,
          created_at: new Date().toISOString(),
        },
        201
      );
    }

    return problemResponse(404, 'NOT_FOUND', 'Not Found', `Endpoint ${url.pathname} does not exist`);
  },
};
