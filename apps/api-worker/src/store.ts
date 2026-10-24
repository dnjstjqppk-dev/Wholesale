/// <reference lib="dom" />
// apps/api-worker/src/store.ts
// Cloudflare Edge State & Local Authority Store (Alibaba.com B2B Marketplace Engine)

import { SEED_PRODUCTS, CATEGORIES, WholesaleProduct } from './seedProducts';

export { CATEGORIES };
export type { WholesaleProduct };

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
  ['approver@wholesale.internal', {
    id: 'user-buyer-002',
    email: 'approver@wholesale.internal',
    password: 'Password123!',
    full_name: 'Metro Procurement Director (Approver)',
    active_organization_id: BUYER_ORG_ID,
    role: 'BUYER_APPROVER',
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
  ['finance@wholesale.internal', {
    id: 'user-admin-002',
    email: 'finance@wholesale.internal',
    password: 'Password123!',
    full_name: 'Treasury & Finance Director',
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
    credit_limit_minor: 50000000,
    address: '450 Lexington Ave, New York, NY 10017, USA',
  }],
  [SUPPLIER_ORG_ID, {
    id: SUPPLIER_ORG_ID,
    legal_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    business_number: '123-45-67890',
    country: 'KR',
    business_type: 'MANUFACTURER',
    is_verified_supplier: true,
    address: '128 Sandan-ro, Gangseo-gu, Busan, South Korea',
    rating: 4.9,
    response_rate: '99.2%',
    years_in_business: 12,
  }],
  [ADMIN_ORG_ID, {
    id: ADMIN_ORG_ID,
    legal_name: 'WHOLESALE Platform Governance Corp.',
    business_number: '000-00-00000',
    country: 'KR',
    business_type: 'PLATFORM_OPERATOR',
    is_verified_supplier: true,
    address: 'Teheran-ro 521, Gangnam-gu, Seoul, South Korea',
  }],
]);

// Initialize listings with all 25 rich B2B products across 5 major categories
export const listings = new Map<string, any>();
for (const prod of SEED_PRODUCTS) {
  listings.set(prod.id, { ...prod });
}

export const rfqs = new Map<string, any>([
  ['rfq-001', {
    id: 'rfq-001',
    buyer_organization_id: BUYER_ORG_ID,
    buyer_name: 'Metro Wholesale Imports LLC',
    is_contact_masked: true,
    title: '2026 하반기 산업용 스테인리스 텀블러 5,000개 조달',
    category: 'CAT-IND',
    sub_category: '산업용 용기 & 스테인리스',
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
    item_title: 'SUS304 500ml 진공 이중 구조 텀블러 벌크팩',
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
    requester_user_id: 'user-buyer-001',
    approver_user_id: null,
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_name: 'Precision Korea Co., Ltd.',
    item_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공)',
    listing_id: '33333333-3333-3333-3333-333333333333',
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
    incoterms: 'FOB Busan Port',
    shipping_address: '450 Lexington Ave, New York, NY 10017, USA',
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
    rejection_reason: null,
    license_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    audit_report_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    facilities_sqm: 15000,
    production_lines: 8,
    qc_inspectors: 14,
    annual_export_usd: '12,500,000+',
    certificates: ['ISO 9001:2015', 'CE Machinery Directive', 'FDA GRAS Food Contact', 'RoHS 2.0'],
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
    approved_at: null,
    rejection_reason: null,
    license_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    audit_report_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    facilities_sqm: 8500,
    production_lines: 4,
    qc_inspectors: 6,
    annual_export_usd: '4,800,000+',
    certificates: ['ISO 9001:2015'],
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
    first_approver_id: null,
    first_approved_at: null,
    dispatched_by: null,
    bank_account: '신한은행 110-***-123456 (예금주: 글로벌정밀산업)',
    created_at: new Date().toISOString(),
  }],
]);

export const disputes = new Map<string, any>();
export const processedIdempotencyKeys = new Set<string>();

// Carts store: Map<buyer_org_id, CartItem[]>
export interface CartItem {
  id: string;
  listing_id: string;
  sku_id: string;
  title: string;
  category: string;
  image: string;
  unit: string;
  quantity: number;
  unit_price: string;
  currency: string;
  total_price: string;
  supplier_name: string;
  supplier_organization_id: string;
  lead_time_days: number;
  incoterms: string;
  selected_options?: Record<string, string>;
}
export const carts = new Map<string, CartItem[]>([
  [BUYER_ORG_ID, [
    {
      id: 'cart-item-default-1',
      listing_id: '33333333-3333-3333-3333-333333333333',
      sku_id: '44444444-4444-4444-4444-444444444444',
      title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공)',
      category: 'CAT-IND',
      image: 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=400&q=80',
      unit: 'pcs',
      quantity: 500,
      unit_price: '4.80',
      currency: 'USD',
      total_price: '2400.00',
      supplier_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
      supplier_organization_id: SUPPLIER_ORG_ID,
      lead_time_days: 14,
      incoterms: 'FOB Busan Port',
    },
  ]],
]);

// Inquiries / 1:1 Messenger threads
export interface MessageThread {
  id: string;
  buyer_organization_id: string;
  buyer_name: string;
  supplier_organization_id: string;
  supplier_name: string;
  listing_id?: string;
  listing_title?: string;
  subject: string;
  status: 'OPEN' | 'REPLIED' | 'CLOSED';
  messages: Array<{
    id: string;
    sender_id: string;
    sender_name: string;
    sender_role: string;
    content: string;
    attachment_url?: string;
    quote_card?: any;
    sent_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

export const inquiries = new Map<string, MessageThread>([
  ['inq-001', {
    id: 'inq-001',
    buyer_organization_id: BUYER_ORG_ID,
    buyer_name: 'Metro Wholesale Imports LLC',
    supplier_organization_id: SUPPLIER_ORG_ID,
    supplier_name: 'Precision Korea Co., Ltd.',
    listing_id: '33333333-3333-3333-3333-333333333333',
    listing_title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
    subject: '로고 레이저 각인 MOQ 및 포장 박스 맞춤 제작 문의',
    status: 'REPLIED',
    messages: [
      {
        id: 'msg-001',
        sender_id: 'user-buyer-001',
        sender_name: 'Metro Wholesale Purchaser',
        sender_role: 'BUYER_PURCHASER',
        content: '안녕하세요. 500개 주문 시 외관 레이저 각인 및 개별 크라프트 박스 인쇄가 가능한가요? 리드타임도 확인 부탁드립니다.',
        sent_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'msg-002',
        sender_id: 'user-supplier-001',
        sender_name: 'Precision Korea Sales Manager',
        sender_role: 'SUPPLIER_SALES',
        content: '네, 500개 수량부터 맞춤 레이저 로고와 개별 박스 인쇄 지원 가능합니다. 납기는 14일 소요되며 FOB 부산 조건입니다.',
        sent_at: new Date(Date.now() - 3600000 * 20).toISOString(),
      },
    ],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 20).toISOString(),
  }],
]);

// Inventory Ledger: SKU -> Balance
export interface InventoryBalance {
  sku_id: string;
  title: string;
  on_hand: number;
  reserved: number;
  available: number;
  safety_stock: number;
  warehouse: string;
  unit: string;
  updated_at: string;
}

export const inventoryBalances = new Map<string, InventoryBalance>([
  ['44444444-4444-4444-4444-444444444444', {
    sku_id: '44444444-4444-4444-4444-444444444444',
    title: 'SUS304 진공 텀블러 벌크팩 (500ml)',
    on_hand: 12500,
    reserved: 1000,
    available: 11500,
    safety_stock: 2000,
    warehouse: '부산 제1물류센터 (Busan Port Logistics Hub)',
    unit: 'pcs',
    updated_at: new Date().toISOString(),
  }],
  ['sku-ele-001', {
    sku_id: 'sku-ele-001',
    title: '140W PD 3.1 3포트 GaN 충전기',
    on_hand: 8400,
    reserved: 500,
    available: 7900,
    safety_stock: 1000,
    warehouse: '인천 항공물류센터 (Incheon Airport Hub)',
    unit: 'pcs',
    updated_at: new Date().toISOString(),
  }],
  ['sku-pkg-001', {
    sku_id: 'sku-pkg-001',
    title: '100% 생분해 에코 크라프트 택배봉투',
    on_hand: 55000,
    reserved: 5000,
    available: 50000,
    safety_stock: 10000,
    warehouse: '부산 제2포장물류창고',
    unit: 'pcs',
    updated_at: new Date().toISOString(),
  }],
]);

// Supplier Mini-site / Storefront customization
export const supplierStorefronts = new Map<string, any>([
  [SUPPLIER_ORG_ID, {
    organization_id: SUPPLIER_ORG_ID,
    company_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
    slogan: '글로벌 최고 수준의 정밀 프레스 및 스테인리스 가공 전문 제조사',
    year_established: 2014,
    business_type: 'MANUFACTURER',
    total_revenue_usd: '$25M - $50M',
    export_percentage: '85%',
    main_markets: ['North America (45%)', 'Europe (30%)', 'East Asia (25%)'],
    banner_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1600&q=80',
    video_tour_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    certifications: [
      { name: 'ISO 9001:2015', issued_by: 'SGS Korea', valid_thru: '2027-12-31' },
      { name: 'CE Compliance', issued_by: 'TÜV Rheinland', valid_thru: '2028-06-30' },
      { name: 'FDA Food Contact', issued_by: 'FDA Approved Lab', valid_thru: '2027-08-15' },
    ],
    production_equipment: [
      { name: '500-Ton Hydraulic Cold Forming Press', count: 4 },
      { name: 'VMC-850 3-Axis CNC Machine Center', count: 12 },
      { name: 'Continuous Vacuum Brazing Furnace', count: 2 },
      { name: 'Automatic Powder Coating Line', count: 1 },
    ],
    showcase_product_ids: [
      '33333333-3333-3333-3333-333333333333',
      'ind-prod-002',
      'ind-prod-003',
      'ele-prod-001',
    ],
  }],
]);

// Audit Logs Store
export interface AuditLogEntry {
  id: string;
  action: string;
  actor_id: string;
  actor_role: string;
  target_type: string;
  target_id: string;
  details: string;
  timestamp: string;
  ip_address: string;
}

export const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    action: 'ORGANIZATION_VERIFIED',
    actor_id: 'user-admin-001',
    actor_role: 'PLATFORM_ADMIN',
    target_type: 'ORGANIZATION',
    target_id: SUPPLIER_ORG_ID,
    details: 'Precision Korea Co., Ltd. Verified Supplier Status Approved',
    timestamp: '2026-10-16T11:30:00Z',
    ip_address: '10.0.4.12',
  },
  {
    id: 'audit-002',
    action: 'ORDER_CONTRACT_CREATED',
    actor_id: 'user-buyer-001',
    actor_role: 'BUYER_PURCHASER',
    target_type: 'TRADE_ORDER',
    target_id: 'ord-20261018-001',
    details: 'Trade contract generated with SHA-256 hash c6746972...',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    ip_address: '192.168.1.100',
  },
];

export function logAudit(
  action: string,
  actorId: string,
  actorRole: string,
  targetType: string,
  targetId: string,
  details: string
) {
  auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    actor_id: actorId,
    actor_role: actorRole,
    target_type: targetType,
    target_id: targetId,
    details,
    timestamp: new Date().toISOString(),
    ip_address: '127.0.0.1',
  });
}

// Bulk Upload Import Jobs
export const importJobs = new Map<string, any>();

// Daily PG Reconciliations
export const reconciliations: any[] = [
  {
    id: 'rec-20261017',
    date: '2026-10-17',
    status: 'BALANCED',
    currency: 'USD',
    pg_captured_minor: 126000,
    ledger_debit_minor: 126000,
    discrepancy_minor: 0,
    matched_records: 1,
    unmatched_records: 0,
    performed_at: '2026-10-18T00:05:00Z',
  },
];
