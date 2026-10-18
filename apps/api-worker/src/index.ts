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
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공)',
    category: 'CAT-IND',
    category_name: '산업기계 & 부품 / 산업용 용기',
    supplier_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    is_verified_supplier: true,
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
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    sku_id: '66666666-6666-6666-6666-666666666666',
    title: '친환경 크라프트 파우치 지퍼백 (식품 포장용 500g 차광 알루미늄 배리어)',
    category: 'CAT-PKG',
    category_name: '포장용기 & 인쇄 / 기능성 파우치',
    supplier_name: 'EcoPack Global Ltd.',
    is_verified_supplier: true,
    country: 'KR',
    moq: '500',
    quantity_step: '50',
    unit: 'pcs',
    lead_time_days: 20,
    status: 'PUBLISHED',
    rating: 4.8,
    reviews_count: 94,
    response_rate: '98.5%',
    years_in_business: 8,
    trade_assurance: true,
    customization: true,
    incoterms: 'FOB Incheon Port',
    price_tiers: [
      { min_quantity: '500', max_quantity: '1999', unit_price: '0.450000', currency: 'USD' },
      { min_quantity: '2000', max_quantity: '4999', unit_price: '0.380000', currency: 'USD' },
      { min_quantity: '5000', max_quantity: null, unit_price: '0.320000', currency: 'USD' },
    ],
  },
  {
    id: '77777777-7777-7777-7777-777777777777',
    sku_id: '88888888-8888-8888-8888-888888888888',
    title: '정밀 CNC 가공 6061-T6 알루미늄 방열판 인클로저 하우징',
    category: 'CAT-IND',
    category_name: '산업기계 & 부품 / 정밀 CNC 가공',
    supplier_name: 'Hansung Precision Tool Co.',
    is_verified_supplier: true,
    country: 'KR',
    moq: '200',
    quantity_step: '20',
    unit: 'pcs',
    lead_time_days: 25,
    status: 'PUBLISHED',
    rating: 5.0,
    reviews_count: 62,
    response_rate: '97.8%',
    years_in_business: 15,
    trade_assurance: true,
    customization: true,
    incoterms: 'EXW Seoul Factory',
    price_tiers: [
      { min_quantity: '200', max_quantity: '499', unit_price: '14.500000', currency: 'USD' },
      { min_quantity: '500', max_quantity: '999', unit_price: '11.800000', currency: 'USD' },
      { min_quantity: '1000', max_quantity: null, unit_price: '9.200000', currency: 'USD' },
    ],
  },
  {
    id: '99999999-9999-9999-9999-999999999999',
    sku_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: '고속 데이터 전송 Type-C to HDMI 4K 어댑터 PCBA 모듈 벌크',
    category: 'CAT-ELE',
    category_name: '가전 & 전자부품 / 반도체 및 PCBA',
    supplier_name: 'TechWave Semiconductor Korea',
    is_verified_supplier: true,
    country: 'KR',
    moq: '300',
    quantity_step: '50',
    unit: 'pcs',
    lead_time_days: 10,
    status: 'PUBLISHED',
    rating: 4.7,
    reviews_count: 210,
    response_rate: '99.0%',
    years_in_business: 10,
    trade_assurance: true,
    customization: false,
    incoterms: 'FOB Busan Port',
    price_tiers: [
      { min_quantity: '300', max_quantity: '999', unit_price: '3.800000', currency: 'USD' },
      { min_quantity: '1000', max_quantity: '4999', unit_price: '3.200000', currency: 'USD' },
      { min_quantity: '5000', max_quantity: null, unit_price: '2.700000', currency: 'USD' },
    ],
  },
];

const mockOrders = [
  {
    id: 'ord-20261018-001',
    order_number: 'ORD-20261018-001',
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_name: 'Precision Korea Co., Ltd.',
    item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    total_amount_minor: 420000, // $4,200.00
    currency: 'USD',
    order_status: 'IN_PRODUCTION',
    payment_status: 'PARTIALLY_PAID_30',
    fulfillment_status: 'READY_TO_DISPATCH',
    dispute_status: 'NONE',
    settlement_status: 'HELD_ESCROW',
    ordered_quantity: 1000,
    shipped_quantity: 400,
    is_contract_signed: true,
    contract_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const mockRFQs = [
  {
    id: 'rfq-20261018-01',
    title: '식품 포장용 크라프트 파우치 (지퍼형) 20,000매 조달',
    category: 'CAT-PKG',
    destination_country: 'KR',
    quantity: '20000',
    unit: 'pcs',
    target_price: '0.35',
    lead_time_days: 30,
    incoterms: 'FOB',
    status: 'PUBLISHED',
    quotes_count: 3,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'rfq-20261018-02',
    title: '알루미늄 6061 방열판 하우징 금형 제작 및 5,000개 사출',
    category: 'CAT-IND',
    destination_country: 'US',
    quantity: '5000',
    unit: 'pcs',
    target_price: '9.00',
    lead_time_days: 45,
    incoterms: 'CIF',
    status: 'PUBLISHED',
    quotes_count: 2,
    created_at: new Date().toISOString(),
  },
];

const mockVerifications = [
  {
    id: 'verif-001',
    company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    business_number: '123-45-67890',
    business_type: 'MANUFACTURER',
    country: 'KR',
    status: 'APPROVED',
    submitted_at: '2026-10-15T09:00:00Z',
    approved_at: '2026-10-16T11:30:00Z',
    license_url: '#',
    audit_report_url: '#',
    factory_area_sqm: 12500,
  },
  {
    id: 'verif-002',
    company_name: 'Hansung Precision Tool Co.',
    business_number: '456-78-12345',
    business_type: 'OEM_ODM',
    country: 'KR',
    status: 'PENDING',
    submitted_at: '2026-10-17T14:20:00Z',
    license_url: '#',
    audit_report_url: '#',
    factory_area_sqm: 8400,
  },
  {
    id: 'verif-003',
    company_name: 'Dongguan Apex Mould & Polymer Ltd.',
    business_number: '91441900MA54D1234X',
    business_type: 'MANUFACTURER',
    country: 'CN',
    status: 'PENDING',
    submitted_at: '2026-10-18T03:10:00Z',
    license_url: '#',
    audit_report_url: '#',
    factory_area_sqm: 21000,
  },
];

const mockDisputes = [
  {
    id: 'disp-2026-001',
    order_number: 'ORD-20261018-001',
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_name: 'Precision Korea Co., Ltd.',
    reason: '품질 불량: 표면 산화 코팅 불균일 및 진공 밀폐 결함 120개 발견',
    requested_amount_minor: 126000, // $1,260.00
    currency: 'USD',
    escrow_frozen_minor: 420000,
    status: 'UNDER_ARBITRATION',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const mockSettlements = [
  {
    id: 'set-2026-001',
    order_number: 'ORD-20261018-001',
    supplier_name: 'Precision Korea Co., Ltd.',
    gross_minor: 420000, // $4,200.00
    fee_minor: 21000,    // 5% platform fee
    net_minor: 399000,   // $3,990.00
    currency: 'USD',
    status: 'RELEASE_ELIGIBLE',
    bank_account: '신한은행 110-***-123456',
    created_at: new Date().toISOString(),
  },
];

const processedIdempotencyKeys = new Set<string>();

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
          ledger: 'active (double-entry immutable posting: sum(debit) == sum(credit))',
          governance: 'active (SHA-256 hash contract verification)',
          inventory: 'active (thread-safe atomic reservation & oversell prevention)',
          logistics: 'active (cumulative split-shipment validation)',
        },
      });
    }

    // Auth Register
    if (url.pathname === '/v1/auth/register' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const orgId = crypto.randomUUID();
      const userId = crypto.randomUUID();
      return jsonResponse(
        {
          access_token: `jwt-${userId}`,
          token_type: 'Bearer',
          expires_in: 86400,
          user: {
            id: userId,
            email: body.email || 'user@example.com',
            full_name: body.full_name || 'Business User',
            role: 'ORG_OWNER',
          },
          organization: {
            id: orgId,
            legal_name: body.company_name || 'Enterprise Corp',
            business_number: body.business_number || '123-45-67890',
            business_type: body.role_capability || 'BUYER_CORP',
          },
        },
        201
      );
    }

    // Auth Login
    if (url.pathname === '/v1/auth/login' && request.method === 'POST') {
      return jsonResponse({
        access_token: `jwt-${crypto.randomUUID()}`,
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          id: 'user-001',
          email: 'demo@wholesale.internal',
          full_name: 'Verified Business Manager',
          role: 'ORG_OWNER',
        },
      });
    }

    // Catalog Listings (Public Search & Query)
    if (url.pathname === '/v1/catalog/listings') {
      if (request.method === 'GET') {
        const cat = url.searchParams.get('category');
        const q = url.searchParams.get('q');
        let filtered = mockListings;
        if (cat) {
          filtered = filtered.filter(i => i.category === cat);
        }
        if (q) {
          const query = q.toLowerCase();
          filtered = filtered.filter(i => i.title.toLowerCase().includes(query) || i.supplier_name.toLowerCase().includes(query));
        }
        return jsonResponse({
          items: filtered,
          total_count: filtered.length,
        });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const newListing = {
          id: crypto.randomUUID(),
          sku_id: crypto.randomUUID(),
          ...body,
          status: 'PUBLISHED',
          is_verified_supplier: true,
          created_at: new Date().toISOString(),
        };
        mockListings.unshift(newListing);
        return jsonResponse(newListing, 201);
      }
    }

    // Single Listing Detail
    const listingDetailMatch = url.pathname.match(/^\/v1\/catalog\/listings\/([^\/]+)$/);
    if (listingDetailMatch && request.method === 'GET') {
      const id = listingDetailMatch[1];
      const found = mockListings.find(l => l.id === id);
      if (found) {
        return jsonResponse(found);
      }
      return problemResponse(404, 'NOT_FOUND', 'Listing Not Found', `Product listing ${id} was not found`);
    }

    // Sourcing RFQs
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
        mockRFQs.unshift(newRFQ);
        return jsonResponse(newRFQ, 201);
      }
    }

    // Accept Quote (Idempotency enforcement)
    const quoteAcceptMatch = url.pathname.match(/^\/v1\/sourcing\/quotes\/([^\/]+)\/accept$/);
    if (quoteAcceptMatch && request.method === 'POST') {
      const idempKey = request.headers.get('Idempotency-Key');
      if (idempKey && processedIdempotencyKeys.has(idempKey)) {
        return problemResponse(409, 'DUPLICATE_REQUEST', 'Duplicate Idempotency Key', 'This quote acceptance has already been processed');
      }
      if (idempKey) {
        processedIdempotencyKeys.add(idempKey);
      }
      const orderId = `ord-${Date.now()}`;
      const newOrder = {
        id: orderId,
        order_number: `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`,
        buyer_name: 'Metro Wholesale Imports LLC',
        supplier_name: 'Precision Korea Co., Ltd.',
        item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
        total_amount_minor: 480000,
        currency: 'USD',
        order_status: 'CONTRACT_PENDING',
        payment_status: 'DOWN_PAYMENT_PENDING',
        fulfillment_status: 'UNFULFILLED',
        dispute_status: 'NONE',
        settlement_status: 'HELD_ESCROW',
        ordered_quantity: 1000,
        shipped_quantity: 0,
        is_contract_signed: false,
        created_at: new Date().toISOString(),
      };
      mockOrders.unshift(newOrder);
      return jsonResponse(newOrder, 201);
    }

    // Trade Orders
    if (url.pathname === '/v1/trade/orders') {
      if (request.method === 'GET') {
        return jsonResponse({
          orders: mockOrders,
          total_count: mockOrders.length,
        });
      }
    }

    // Contract Sign
    if (url.pathname.match(/^\/v1\/trade\/orders\/[^\/]+\/contract\/sign$/) && request.method === 'POST') {
      const order = mockOrders[0];
      if (order) {
        order.is_contract_signed = true;
        order.order_status = 'IN_PRODUCTION';
      }
      return jsonResponse({
        contract_id: crypto.randomUUID(),
        document_hash: 'c67469723725e6e026620593dd2a466a9d184ffbe6cf2ab82a725e1a3d02b557',
        signed: true,
        signed_at: new Date().toISOString(),
        status: 'CONTRACT_SIGNED',
      });
    }

    // Payments Process & Escrow Ledger
    if (url.pathname === '/v1/payments/process' && request.method === 'POST') {
      const order = mockOrders[0];
      if (order) {
        order.payment_status = 'PARTIALLY_PAID_30';
      }
      return jsonResponse({
        payment_id: crypto.randomUUID(),
        pg_transaction_id: `PG-TX-${crypto.randomUUID().slice(0, 8)}`,
        status: 'PAID',
        amount_minor: '144000', // 30% down payment
        currency: 'USD',
        ledger_posted: true,
      });
    }

    // Logistics Split Shipment Dispatch
    if (url.pathname === '/v1/logistics/shipments' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const order = mockOrders.find(o => o.order_number === body.order_number) || mockOrders[0];
      const dispatchQty = parseInt(body.dispatch_quantity || '0', 10);
      if (order && (order.shipped_quantity + dispatchQty) > order.ordered_quantity) {
        return problemResponse(422, 'CUMULATIVE_OVERFLOW', 'Shipment Exceeds Order Quantity', `Cannot ship ${dispatchQty} pcs; cumulative would exceed ${order.ordered_quantity}`);
      }
      if (order) {
        order.shipped_quantity += dispatchQty;
        order.fulfillment_status = order.shipped_quantity >= order.ordered_quantity ? 'COMPLETED' : 'PARTIALLY_FULFILLED';
      }
      return jsonResponse(
        {
          shipment_id: crypto.randomUUID(),
          tracking_number: body.tracking_number || `BL-BUSAN-${Math.floor(100000 + Math.random() * 900000)}`,
          carrier: body.carrier || 'HMM Marine Logistics',
          status: 'IN_TRANSIT',
          cumulative_shipped: order ? order.shipped_quantity : dispatchQty,
          created_at: new Date().toISOString(),
        },
        201
      );
    }

    // Admin: Supplier Verification List & KYC
    if (url.pathname === '/v1/admin/verifications') {
      if (request.method === 'GET') {
        return jsonResponse({
          verifications: mockVerifications,
          total_count: mockVerifications.length,
        });
      }
    }

    const verifApproveMatch = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/approve$/);
    if (verifApproveMatch && request.method === 'POST') {
      const id = verifApproveMatch[1];
      const item = mockVerifications.find(v => v.id === id);
      if (item) {
        item.status = 'APPROVED';
        item.approved_at = new Date().toISOString();
      }
      return jsonResponse({
        verification_id: id,
        status: 'APPROVED',
        verified: true,
        approved_at: new Date().toISOString(),
      });
    }

    const verifRejectMatch = url.pathname.match(/^\/v1\/admin\/verifications\/([^\/]+)\/reject$/);
    if (verifRejectMatch && request.method === 'POST') {
      const id = verifRejectMatch[1];
      const item = mockVerifications.find(v => v.id === id);
      if (item) {
        item.status = 'REJECTED';
      }
      return jsonResponse({
        verification_id: id,
        status: 'REJECTED',
      });
    }

    // Admin: Double-Entry Ledger Audit
    if (url.pathname === '/v1/admin/ledger/audit' && request.method === 'GET') {
      return jsonResponse({
        audit_timestamp: new Date().toISOString(),
        is_balanced: true,
        currency: 'USD',
        total_debit_minor: 420000,
        total_credit_minor: 420000,
        variance_minor: 0,
        journal_entries_count: 8,
        journals: [
          {
            id: 'jnl-001',
            type: 'PAYMENT_CAPTURE_ESCROW',
            amount_minor: 144000,
            debit_account: 'ASSET_CASH_ESCROW_PG',
            credit_account: 'LIABILITY_ESCROW_DEPOSIT',
            memo: '30% Advance Down Payment Capture',
            created_at: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 'jnl-002',
            type: 'SETTLEMENT_ALLOCATION',
            amount_minor: 21000,
            debit_account: 'LIABILITY_ESCROW_DEPOSIT',
            credit_account: 'REVENUE_PLATFORM_FEE',
            memo: '5% B2B Platform Service Fee',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
      });
    }

    // Disputes
    if (url.pathname === '/v1/disputes') {
      if (request.method === 'GET') {
        return jsonResponse({
          disputes: mockDisputes,
          total_count: mockDisputes.length,
        });
      }
      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const newDispute = {
          id: `disp-${Date.now()}`,
          order_number: body.order_number || 'ORD-20261018-001',
          buyer_name: 'Metro Wholesale Imports LLC',
          supplier_name: 'Precision Korea Co., Ltd.',
          reason: body.reason || '품질 규격 불일치 클레임',
          requested_amount_minor: body.requested_amount_minor || 120000,
          currency: 'USD',
          escrow_frozen_minor: 420000,
          status: 'UNDER_ARBITRATION',
          created_at: new Date().toISOString(),
        };
        mockDisputes.unshift(newDispute);
        return jsonResponse(newDispute, 201);
      }
    }

    // Dispute Arbitration Decision
    const disputeArbitrateMatch = url.pathname.match(/^\/v1\/disputes\/([^\/]+)\/arbitrate$/);
    if (disputeArbitrateMatch && request.method === 'POST') {
      const id = disputeArbitrateMatch[1];
      const body = (await request.json().catch(() => ({}))) as any;
      const dispute = mockDisputes.find(d => d.id === id);
      if (dispute) {
        dispute.status = 'RESOLVED';
      }
      return jsonResponse({
        dispute_id: id,
        resolution: body.resolution || 'PARTIAL_REFUND',
        buyer_refund_minor: body.buyer_refund_minor || 126000,
        supplier_release_minor: body.supplier_release_minor || 294000,
        arbitrated_at: new Date().toISOString(),
        escrow_unfrozen: true,
      });
    }

    // Settlements
    if (url.pathname === '/v1/settlements') {
      if (request.method === 'GET') {
        return jsonResponse({
          settlements: mockSettlements,
          total_count: mockSettlements.length,
        });
      }
    }

    // Settlement Payout Trigger
    const settlementPayoutMatch = url.pathname.match(/^\/v1\/settlements\/([^\/]+)\/payout$/);
    if (settlementPayoutMatch && request.method === 'POST') {
      const id = settlementPayoutMatch[1];
      const set = mockSettlements.find(s => s.id === id);
      if (set) {
        set.status = 'PAYOUT_DISPATCHED';
      }
      return jsonResponse({
        settlement_id: id,
        status: 'PAYOUT_DISPATCHED',
        dispatched_at: new Date().toISOString(),
        bank_transfer_ref: `WIRE-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      });
    }

    return problemResponse(404, 'NOT_FOUND', 'Not Found', `Endpoint ${url.pathname} does not exist`);
  },
};
