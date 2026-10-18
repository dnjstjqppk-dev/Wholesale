/// <reference lib="dom" />
// apps/api-worker/src/store.ts
// Cloudflare Edge Local Fallback Cache (Active when CORE_API_URL is disconnected)
// Primary Persistent Authority: Core Go Backend (services/api) + PostgreSQL 17 (001_initial_schema.sql)

export const BUYER_ORG_ID = '22222222-2222-2222-2222-222222222222';
export const SUPPLIER_ORG_ID = '11111111-1111-1111-1111-111111111111';
export const ADMIN_ORG_ID = '00000000-0000-0000-0000-000000000000';

export const users = new Map<string, any>([
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

export const organizations = new Map<string, any>([
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

export const listings = new Map<string, any>([
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

export const rfqs = new Map<string, any>([
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

export const quotes = new Map<string, any>([
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
    revisions: [
      {
        revision_number: 1,
        unit_price: '4.20',
        lead_time_days: 14,
        incoterms: 'FOB Busan Port',
        status: 'ISSUED',
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ],
  }],
]);

export const orders = new Map<string, any>([
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

export const verifications = new Map<string, any>([
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

export const settlements = new Map<string, any>([
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

export const disputes = new Map<string, any>();
export const processedIdempotencyKeys = new Set<string>();

