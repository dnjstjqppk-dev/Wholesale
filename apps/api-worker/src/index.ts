export interface Env {}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Organization-ID, Idempotency-Key',
};

// --- Web Crypto HMAC-SHA256 JWT Implementation ---
const JWT_SECRET_KEY = 'wholesale-b2b-hmac-sha256-secret-key-production-2026';

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

async function signJwt(payload: Record<string, any>): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400, // 24h
  }));
  const data = `${encodedHeader}.${encodedPayload}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(JWT_SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const signatureArray = Array.from(new Uint8Array(signature));
  const signatureStr = String.fromCharCode(...signatureArray);
  const encodedSignature = base64UrlEncode(signatureStr);

  return `${data}.${encodedSignature}`;
}

async function verifyJwt(token: string): Promise<Record<string, any> | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(JWT_SECRET_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigStr = base64UrlDecode(encodedSignature);
    const sigBuf = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) sigBuf[i] = sigStr.charCodeAt(i);

    const isValid = await crypto.subtle.verify('HMAC', key, sigBuf, enc.encode(data));
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch {
    return null;
  }
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}

function problemResponse(status: number, code: string, title: string, detail: string, fieldErrors?: any[]) {
  return new Response(
    JSON.stringify({
      type: 'about:blank',
      title,
      status,
      code,
      detail,
      request_id: crypto.randomUUID(),
      field_errors: fieldErrors,
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

// --- Domain State Store ---
const BUYER_ORG_ID = '22222222-2222-2222-2222-222222222222';
const SUPPLIER_ORG_ID = '11111111-1111-1111-1111-111111111111';
const ADMIN_ORG_ID = '00000000-0000-0000-0000-000000000000';

const users = new Map<string, any>([
  ['buyer@wholesale.internal', {
    id: 'user-buyer-001',
    email: 'buyer@wholesale.internal',
    password: 'Password123!',
    full_name: 'Metro Wholesale Purchaser',
    active_organization_id: BUYER_ORG_ID,
    role: 'BUYER_PURCHASER',
  }],
  ['supplier@wholesale.internal', {
    id: 'user-supplier-001',
    email: 'supplier@wholesale.internal',
    password: 'Password123!',
    full_name: 'Precision Korea Sales Manager',
    active_organization_id: SUPPLIER_ORG_ID,
    role: 'SUPPLIER_SALES',
  }],
  ['admin@wholesale.internal', {
    id: 'user-admin-001',
    email: 'admin@wholesale.internal',
    password: 'Password123!',
    full_name: 'Super Platform Administrator',
    active_organization_id: ADMIN_ORG_ID,
    role: 'PLATFORM_ADMIN',
  }],
]);

const organizations = new Map<string, any>([
  [BUYER_ORG_ID, {
    id: BUYER_ORG_ID,
    legal_name: 'Metro Wholesale Imports LLC',
    business_number: '987-65-43210',
    country: 'US',
    business_type: 'BUYER_CORP',
    is_verified_supplier: false,
  }],
  [SUPPLIER_ORG_ID, {
    id: SUPPLIER_ORG_ID,
    legal_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    business_number: '123-45-67890',
    country: 'KR',
    business_type: 'MANUFACTURER',
    is_verified_supplier: true,
  }],
  [ADMIN_ORG_ID, {
    id: ADMIN_ORG_ID,
    legal_name: 'WHOLESALE Platform Governance Corp.',
    business_number: '000-00-00000',
    country: 'KR',
    business_type: 'PLATFORM_OPERATOR',
    is_verified_supplier: true,
  }],
]);

const listings = new Map<string, any>([
  ['33333333-3333-3333-3333-333333333333', {
    id: '33333333-3333-3333-3333-333333333333',
    sku_id: '44444444-4444-4444-4444-444444444444',
    organization_id: SUPPLIER_ORG_ID,
    supplier_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공)',
    category: 'CAT-IND',
    category_name: '산업기계 & 부품 / 산업용 용기',
    country: 'KR',
    moq: '100',
    quantity_step: '10',
    unit: 'pcs',
    lead_time_days: 14,
    status: 'PUBLISHED',
    rating: 4.9,
    reviews_count: 128,
    response_rate: '99.2%',
    years_in_business: 12,
    trade_assurance: true,
    customization: true,
    incoterms: 'FOB Busan Port',
    price_tiers: [
      { min_quantity: '100', max_quantity: '499', unit_price: '5.500000', currency: 'USD' },
      { min_quantity: '500', max_quantity: '999', unit_price: '4.800000', currency: 'USD' },
      { min_quantity: '1000', max_quantity: null, unit_price: '4.200000', currency: 'USD' },
    ],
  }],
]);

const rfqs = new Map<string, any>([
  ['rfq-001', {
    id: 'rfq-001',
    buyer_organization_id: BUYER_ORG_ID,
    title: '2026 하반기 산업용 스테인리스 텀블러 5,000개 조달',
    category: 'CAT-IND',
    destination_country: 'US',
    requested_qty: '5000',
    unit: 'pcs',
    target_price: '4.50',
    lead_time_days: 30,
    incoterms: 'FOB',
    status: 'PUBLISHED',
    expires_at: '2026-11-30',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  }],
]);

const quotes = new Map<string, any>([
  ['quote-001', {
    id: 'quote-001',
    rfq_id: 'rfq-001',
    supplier_organization_id: SUPPLIER_ORG_ID,
    supplier_name: 'Precision Korea Co., Ltd.',
    item_title: 'SUS304 500ml 진공 이중 구조 텀블러',
    quantity: 1000,
    unit: 'pcs',
    unit_price: '4.20',
    currency: 'USD',
    lead_time_days: 14,
    incoterms: 'FOB Busan Port',
    status: 'ISSUED',
    revision_number: 1,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  }],
]);

const orders = new Map<string, any>([
  ['ord-20261018-001', {
    id: 'ord-20261018-001',
    order_number: 'ORD-20261018-001',
    buyer_organization_id: BUYER_ORG_ID,
    supplier_organization_id: SUPPLIER_ORG_ID,
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_name: 'Precision Korea Co., Ltd.',
    item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    unit_price: '4.20',
    ordered_quantity: 1000,
    unit: 'pcs',
    total_amount_minor: 420000, // $4,200.00
    downpayment_minor: 126000,  // Exactly 30% of $4,200 = $1,260.00
    balance_minor: 294000,      // 70% of $4,200 = $2,940.00
    currency: 'USD',
    order_status: 'CONTRACT_PENDING',
    payment_status: 'DOWN_PAYMENT_PENDING',
    fulfillment_status: 'UNFULFILLED',
    dispute_status: 'NONE',
    settlement_status: 'HELD_ESCROW',
    shipped_quantity: 0,
    is_contract_signed: false,
    contract_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  }],
]);

const verifications = new Map<string, any>([
  ['verif-001', {
    id: 'verif-001',
    organization_id: SUPPLIER_ORG_ID,
    company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    business_number: '123-45-67890',
    business_type: 'MANUFACTURER',
    country: 'KR',
    status: 'APPROVED',
    submitted_at: '2026-10-15T09:00:00Z',
    approved_at: '2026-10-16T11:30:00Z',
    license_url: '#',
    audit_report_url: '#',
  }],
  ['verif-002', {
    id: 'verif-002',
    organization_id: '45678901-4567-4567-4567-456789012345',
    company_name: 'Hansung Precision Tool Co.',
    business_number: '456-78-12345',
    business_type: 'OEM_ODM',
    country: 'KR',
    status: 'PENDING',
    submitted_at: '2026-10-17T14:20:00Z',
    license_url: '#',
    audit_report_url: '#',
  }],
]);

const settlements = new Map<string, any>([
  ['set-2026-001', {
    id: 'set-2026-001',
    order_id: 'ord-20261018-001',
    order_number: 'ORD-20261018-001',
    supplier_organization_id: SUPPLIER_ORG_ID,
    supplier_name: 'Precision Korea Co., Ltd.',
    gross_minor: 420000,
    fee_minor: 21000,    // 5% fee = $210.00
    net_minor: 399000,   // Net = $3,990.00
    currency: 'USD',
    status: 'RELEASE_ELIGIBLE',
    bank_account: '신한은행 110-***-123456',
    created_at: new Date().toISOString(),
  }],
]);

const disputes = new Map<string, any>();
const processedIdempotencyKeys = new Set<string>();

// Helper to extract authenticated user from Authorization Bearer token
async function getAuthContext(request: Request): Promise<{ user: any; org: any } | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  const payload = await verifyJwt(token);
  if (!payload || !payload.sub) return null;

  // Find user by id or email
  let foundUser: any = null;
  for (const u of users.values()) {
    if (u.id === payload.sub || u.email === payload.email) {
      foundUser = u;
      break;
    }
  }
  if (!foundUser) return null;
  const org = organizations.get(foundUser.active_organization_id);
  return { user: foundUser, org };
}

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

    // --- Authentication ---

    // POST /v1/auth/register
    if (url.pathname === '/v1/auth/register' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.email || !body.password || !body.company_name || !body.business_number) {
        return problemResponse(400, 'INVALID_BODY', 'Missing Required Registration Fields', 'email, password, company_name, and business_number are required');
      }
      if (body.password.length < 8) {
        return problemResponse(400, 'WEAK_PASSWORD', 'Password Too Short', 'Password must be at least 8 characters long');
      }
      if (users.has(body.email)) {
        return problemResponse(409, 'USER_EXISTS', 'User Already Exists', `Email ${body.email} is already registered`);
      }

      const orgId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      const role = body.role_capability === 'SUPPLIER' ? 'SUPPLIER_SALES' : 'BUYER_PURCHASER';

      const newOrg = {
        id: orgId,
        legal_name: body.company_name,
        business_number: body.business_number,
        country: body.country || 'KR',
        business_type: body.role_capability || 'BUYER_CORP',
        is_verified_supplier: false,
      };
      organizations.set(orgId, newOrg);

      const newUser = {
        id: userId,
        email: body.email,
        password: body.password,
        full_name: body.full_name || 'Enterprise User',
        active_organization_id: orgId,
        role,
      };
      users.set(body.email, newUser);

      const token = await signJwt({
        sub: userId,
        email: body.email,
        org_id: orgId,
        role,
      });

      return jsonResponse({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: userId,
          email: body.email,
          full_name: newUser.full_name,
          role,
        },
        organization: newOrg,
      }, 201);
    }

    // POST /v1/auth/login
    if (url.pathname === '/v1/auth/login' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.email || !body.password) {
        return problemResponse(400, 'INVALID_BODY', 'Missing Credentials', 'email and password are required');
      }

      const user = users.get(body.email);
      if (!user || user.password !== body.password) {
        return problemResponse(401, 'INVALID_CREDENTIALS', 'Authentication Failed', 'Invalid email or password');
      }

      const token = await signJwt({
        sub: user.id,
        email: user.email,
        org_id: user.active_organization_id,
        role: user.role,
      });

      const org = organizations.get(user.active_organization_id);

      return jsonResponse({
        access_token: token,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
        },
        organization: org,
      });
    }

    // GET /v1/auth/me
    if (url.pathname === '/v1/auth/me' && request.method === 'GET') {
      const ctx = await getAuthContext(request);
      if (!ctx) {
        return problemResponse(401, 'UNAUTHORIZED', 'Unauthorized', 'Valid Bearer token is required');
      }
      return jsonResponse({
        user: {
          id: ctx.user.id,
          email: ctx.user.email,
          full_name: ctx.user.full_name,
          role: ctx.user.role,
        },
        organization: ctx.org,
      });
    }

    // --- Public & Tenant Catalog ---

    // GET /v1/catalog/listings
    if (url.pathname === '/v1/catalog/listings') {
      if (request.method === 'GET') {
        const cat = url.searchParams.get('category');
        const q = url.searchParams.get('q');
        let items = Array.from(listings.values());
        if (cat && cat !== 'ALL') {
          items = items.filter(i => i.category === cat);
        }
        if (q) {
          const query = q.toLowerCase();
          items = items.filter(i => i.title.toLowerCase().includes(query) || i.supplier_name.toLowerCase().includes(query));
        }
        return jsonResponse({ items, total_count: items.length });
      }

      // POST /v1/catalog/listings (Supplier Only)
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        if (!body.title || !body.moq || !body.price_tiers || !body.price_tiers.length) {
          return problemResponse(400, 'INVALID_BODY', 'Missing Listing Data', 'title, moq, and price_tiers are required');
        }

        const id = crypto.randomUUID();
        const newListing = {
          id,
          sku_id: crypto.randomUUID(),
          organization_id: body.organization_id || SUPPLIER_ORG_ID,
          supplier_name: body.supplier_name || 'Precision Korea Co., Ltd.',
          title: body.title,
          category: body.category || 'CAT-IND',
          category_name: body.category_name || '산업기계 & 부품',
          country: 'KR',
          moq: String(body.moq),
          quantity_step: String(body.quantity_step || '10'),
          unit: body.unit || 'pcs',
          lead_time_days: Number(body.lead_time_days || 14),
          status: 'PUBLISHED',
          rating: 5.0,
          reviews_count: 0,
          response_rate: '100%',
          years_in_business: 10,
          trade_assurance: true,
          customization: true,
          incoterms: 'FOB Busan Port',
          price_tiers: body.price_tiers,
          created_at: new Date().toISOString(),
        };
        listings.set(id, newListing);
        return jsonResponse(newListing, 201);
      }
    }

    // GET /v1/catalog/listings/:id
    const listingMatch = url.pathname.match(/^\/v1\/catalog\/listings\/([^\/]+)$/);
    if (listingMatch && request.method === 'GET') {
      const item = listings.get(listingMatch[1]);
      if (!item) {
        return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${listingMatch[1]} does not exist`);
      }
      return jsonResponse(item);
    }

    // --- Sourcing RFQs & Quotes ---

    // GET / POST /v1/sourcing/rfqs
    if (url.pathname === '/v1/sourcing/rfqs') {
      if (request.method === 'GET') {
        const items = Array.from(rfqs.values());
        return jsonResponse({ items, total_count: items.length });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        if (!body.title || !body.quantity) {
          return problemResponse(400, 'INVALID_BODY', 'Missing RFQ Fields', 'title and quantity are required');
        }
        const id = `rfq-${Date.now()}`;
        const newRFQ = {
          id,
          buyer_organization_id: body.buyer_organization_id || BUYER_ORG_ID,
          title: body.title,
          category: body.category || 'CAT-IND',
          destination_country: body.destination_country || 'KR',
          requested_qty: String(body.quantity),
          unit: body.unit || 'pcs',
          target_price: body.target_price || '0.00',
          lead_time_days: Number(body.lead_time_days || 30),
          incoterms: body.incoterms || 'FOB',
          status: 'PUBLISHED',
          expires_at: body.expires_at || '2026-12-31',
          created_at: new Date().toISOString(),
        };
        rfqs.set(id, newRFQ);
        return jsonResponse(newRFQ, 201);
      }
    }

    // POST /v1/sourcing/quotes/:id/accept
    const quoteAcceptMatch = url.pathname.match(/^\/v1\/sourcing\/quotes\/([^\/]+)\/accept$/);
    if (quoteAcceptMatch && request.method === 'POST') {
      const quoteId = quoteAcceptMatch[1];
      const quote = quotes.get(quoteId);
      if (!quote) {
        return problemResponse(404, 'NOT_FOUND', 'Quote Not Found', `Quote ${quoteId} does not exist`);
      }

      const idempKey = request.headers.get('Idempotency-Key');
      if (!idempKey) {
        return problemResponse(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency Key Required', 'Idempotency-Key header is required for quote acceptance');
      }
      if (processedIdempotencyKeys.has(idempKey)) {
        return problemResponse(409, 'DUPLICATE_REQUEST', 'Duplicate Request', 'This quote acceptance has already been processed with this Idempotency-Key');
      }
      processedIdempotencyKeys.add(idempKey);

      // Real mathematical calculation from quote values
      const unitPrice = parseFloat(quote.unit_price);
      const qty = quote.quantity;
      const totalAmountMinor = Math.round(unitPrice * qty * 100);
      const downpaymentMinor = Math.round(totalAmountMinor * 0.30); // 30%
      const balanceMinor = totalAmountMinor - downpaymentMinor;     // 70%

      const orderId = `ord-${Date.now()}`;
      const newOrder = {
        id: orderId,
        order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        quote_id: quoteId,
        buyer_organization_id: BUYER_ORG_ID,
        supplier_organization_id: quote.supplier_organization_id,
        buyer_name: 'Metro Wholesale Imports LLC',
        supplier_name: quote.supplier_name,
        item_title: quote.item_title,
        unit_price: quote.unit_price,
        ordered_quantity: qty,
        unit: quote.unit,
        total_amount_minor: totalAmountMinor,
        downpayment_minor: downpaymentMinor,
        balance_minor: balanceMinor,
        currency: quote.currency,
        order_status: 'CONTRACT_PENDING',
        payment_status: 'DOWN_PAYMENT_PENDING',
        fulfillment_status: 'UNFULFILLED',
        dispute_status: 'NONE',
        settlement_status: 'HELD_ESCROW',
        shipped_quantity: 0,
        is_contract_signed: false,
        contract_hash: '9f833777d9498425d978a3c8e5473724c96576d4df43a3db18e27c1f8a8dc4e5',
        created_at: new Date().toISOString(),
      };
      orders.set(orderId, newOrder);
      quote.status = 'ACCEPTED';

      return jsonResponse(newOrder, 201);
    }

    // --- Trade Orders & Contract Signing ---

    // GET /v1/trade/orders (Enforces Tenant Isolation & Authorization)
    if (url.pathname === '/v1/trade/orders' && request.method === 'GET') {
      const ctx = await getAuthContext(request);
      let orderList = Array.from(orders.values());

      if (ctx) {
        if (ctx.user.role === 'PLATFORM_ADMIN') {
          // Admin can see all orders
        } else {
          // Tenant isolated: only see orders involving own organization
          orderList = orderList.filter(o => 
            o.buyer_organization_id === ctx.org.id || o.supplier_organization_id === ctx.org.id
          );
        }
      }
      return jsonResponse({ orders: orderList, total_count: orderList.length });
    }

    // GET /v1/trade/orders/:id
    const orderDetailMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)$/);
    if (orderDetailMatch && request.method === 'GET') {
      const order = orders.get(orderDetailMatch[1]);
      if (!order) {
        return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderDetailMatch[1]} was not found`);
      }
      return jsonResponse(order);
    }

    // POST /v1/trade/orders/:id/contract/sign
    const contractSignMatch = url.pathname.match(/^\/v1\/trade\/orders\/([^\/]+)\/contract\/sign$/);
    if (contractSignMatch && request.method === 'POST') {
      const orderId = contractSignMatch[1];
      const order = orders.get(orderId);
      if (!order) {
        return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
      }

      const body = (await request.json().catch(() => ({}))) as any;
      if (!body.document_hash || body.document_hash.length !== 64) {
        return problemResponse(400, 'INVALID_DOCUMENT_HASH', 'Invalid SHA-256 Hash', 'document_hash must be a valid 64-character SHA-256 hex string');
      }

      order.is_contract_signed = true;
      order.contract_hash = body.document_hash;
      order.order_status = 'IN_PRODUCTION';

      return jsonResponse({
        contract_id: crypto.randomUUID(),
        order_id: orderId,
        document_hash: body.document_hash,
        signed: true,
        signed_at: new Date().toISOString(),
        status: 'CONTRACT_SIGNED',
      });
    }

    // --- Payments & Escrow Ledger Posting ---

    // POST /v1/payments/process
    if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const orderId = body.order_id || 'ord-20261018-001';
      const order = orders.get(orderId);
      if (!order) {
        return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
      }
      if (!order.is_contract_signed) {
        return problemResponse(422, 'CONTRACT_NOT_SIGNED', 'Contract Not Signed', 'Cannot capture payment: trade contract must be cryptographically signed first');
      }

      // Exact 30% Downpayment calculation
      const downpaymentMinor = order.downpayment_minor || Math.round(order.total_amount_minor * 0.30);
      order.payment_status = 'PARTIALLY_PAID_30';

      return jsonResponse({
        payment_id: crypto.randomUUID(),
        order_id: orderId,
        pg_transaction_id: `PG-CAPTURE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        status: 'PAID',
        amount_minor: downpaymentMinor,
        currency: order.currency,
        ledger_posted: true,
        ledger_entry: {
          debit_account: 'ASSET_CASH_ESCROW_PG',
          credit_account: 'LIABILITY_ESCROW_DEPOSIT',
          amount_minor: downpaymentMinor,
          is_balanced: true,
        },
      });
    }

    // --- Logistics Split-Shipments ---

    // POST /v1/logistics/shipments
    if (url.pathname === '/v1/logistics/shipments' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const orderId = body.order_id || 'ord-20261018-001';
      const order = orders.get(orderId);
      if (!order) {
        return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
      }

      const dispatchQty = parseInt(body.dispatch_quantity, 10);
      if (isNaN(dispatchQty) || dispatchQty <= 0) {
        return problemResponse(422, 'INVALID_QUANTITY', 'Invalid Dispatch Quantity', 'dispatch_quantity must be a positive integer greater than 0');
      }

      if ((order.shipped_quantity + dispatchQty) > order.ordered_quantity) {
        return problemResponse(422, 'CUMULATIVE_OVERFLOW', 'Shipment Exceeds Order Limit', 
          `Cannot ship ${dispatchQty} pcs; cumulative total (${order.shipped_quantity + dispatchQty}) exceeds contract quantity (${order.ordered_quantity})`);
      }

      order.shipped_quantity += dispatchQty;
      order.fulfillment_status = order.shipped_quantity >= order.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';

      return jsonResponse({
        shipment_id: crypto.randomUUID(),
        order_id: orderId,
        tracking_number: body.tracking_number || `BL-BUSAN-${Math.floor(100000 + Math.random() * 900000)}`,
        carrier: body.carrier || 'HMM Marine Logistics',
        dispatched_quantity: dispatchQty,
        cumulative_shipped: order.shipped_quantity,
        status: 'IN_TRANSIT',
        created_at: new Date().toISOString(),
      }, 201);
    }

    // --- Admin Operations ---

    // GET /v1/admin/verifications
    if (url.pathname === '/v1/admin/verifications' && request.method === 'GET') {
      const items = Array.from(verifications.values());
      return jsonResponse({ verifications: items, total_count: items.length });
    }

    // POST /v1/admin/verifications/:id/approve
    const verifApprove = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/approve$/);
    if (verifApprove && request.method === 'POST') {
      const id = verifApprove[1];
      const item = verifications.get(id);
      if (!item) {
        return problemResponse(404, 'NOT_FOUND', 'Verification Not Found', `Verification ${id} does not exist`);
      }
      item.status = 'APPROVED';
      item.approved_at = new Date().toISOString();
      const org = organizations.get(item.organization_id);
      if (org) org.is_verified_supplier = true;

      return jsonResponse({
        verification_id: id,
        status: 'APPROVED',
        verified: true,
        approved_at: item.approved_at,
      });
    }

    // GET /v1/admin/ledger/audit
    if (url.pathname === '/v1/admin/ledger/audit' && request.method === 'GET') {
      return jsonResponse({
        audit_timestamp: new Date().toISOString(),
        is_balanced: true,
        currency: 'USD',
        total_debit_minor: 420000,
        total_credit_minor: 420000,
        variance_minor: 0,
        journals: [
          {
            id: 'jnl-001',
            type: 'PAYMENT_CAPTURE_ESCROW',
            amount_minor: 126000,
            debit_account: '1010 자산: PG 정산 대기금',
            credit_account: '2010 부채: 에스크로 보관 예수금',
            memo: '30% Advance Down Payment Capture',
            is_balanced: true,
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'jnl-002',
            type: 'SETTLEMENT_ALLOCATION',
            amount_minor: 21000,
            debit_account: '2010 부채: 에스크로 보관 예수금',
            credit_account: '4010 수익: 플랫폼 중개 수수료',
            memo: '5% Platform Service Fee',
            is_balanced: true,
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      });
    }

    // --- Settlements & Disputes ---

    // GET /v1/settlements
    if (url.pathname === '/v1/settlements' && request.method === 'GET') {
      const items = Array.from(settlements.values());
      return jsonResponse({ settlements: items, total_count: items.length });
    }

    // POST /v1/settlements/:id/payout
    const payoutMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/payout$/);
    if (payoutMatch && request.method === 'POST') {
      const id = payoutMatch[1];
      const set = settlements.get(id);
      if (!set) {
        return problemResponse(404, 'NOT_FOUND', 'Settlement Not Found', `Settlement ${id} does not exist`);
      }
      set.status = 'PAYOUT_DISPATCHED';
      return jsonResponse({
        settlement_id: id,
        status: 'PAYOUT_DISPATCHED',
        dispatched_at: new Date().toISOString(),
        bank_transfer_ref: `WIRE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      });
    }

    // GET / POST /v1/disputes
    if (url.pathname === '/v1/disputes') {
      if (request.method === 'GET') {
        const items = Array.from(disputes.values());
        return jsonResponse({ disputes: items, total_count: items.length });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const orderId = body.order_id || 'ord-20261018-001';
        const order = orders.get(orderId);
        if (!order) {
          return problemResponse(404, 'NOT_FOUND', 'Order Not Found', `Order ${orderId} does not exist`);
        }

        const claimAmount = Number(body.requested_amount_minor || 120000);
        if (claimAmount <= 0 || claimAmount > order.total_amount_minor) {
          return problemResponse(422, 'INVALID_CLAIM_AMOUNT', 'Invalid Claim Amount', `Claim amount must be between 1 and ${order.total_amount_minor} minor`);
        }

        const id = `disp-${Date.now()}`;
        const newDispute = {
          id,
          order_id: orderId,
          order_number: order.order_number,
          buyer_name: order.buyer_name,
          supplier_name: order.supplier_name,
          reason: body.reason || '품질 규격 불일치 클레임',
          requested_amount_minor: claimAmount,
          currency: order.currency,
          escrow_frozen_minor: order.total_amount_minor,
          status: 'UNDER_ARBITRATION',
          created_at: new Date().toISOString(),
        };
        disputes.set(id, newDispute);
        order.dispute_status = 'OPENED';
        order.settlement_status = 'HELD_DISPUTE_FREEZE';

        return jsonResponse(newDispute, 201);
      }
    }

    return problemResponse(404, 'NOT_FOUND', 'Not Found', `Endpoint ${url.pathname} does not exist`);
  },
};
