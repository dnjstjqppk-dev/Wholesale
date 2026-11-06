// tests/e2e/worker_trade_cycle_test.js
// Full B2B trade cycle through the REAL secured API worker (no mocks).
// Proves every demo persona flow survives authentication, RBAC, exact
// pricing, contract hashing, escrow, split shipment, SoD payout, disputes.

const worker = (await import('../../apps/api-worker/src/index.ts')).default;

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
    throw new Error(`Trade cycle assertion failed: ${message}`);
  }
  console.log(`  PASS [${total}]: ${message}`);
  passed++;
}

const AUTH_IP = '10.2.0.1';
const API_IP = '10.2.0.2';

async function call(path, { method = 'GET', body = null, token = null, ip = API_IP, headers = {} } = {}) {
  const init = { method, headers: { ...headers, 'X-Forwarded-For': ip } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== null) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await worker.fetch(new Request(`http://worker.local${path}`, init), ENV);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json };
}

async function login(email, password) {
  const res = await call('/v1/auth/login', { method: 'POST', ip: AUTH_IP, body: { email, password } });
  assert(res.status === 200, `login ${email} succeeds (got ${res.status})`);
  return res.json.access_token;
}

console.log('================================================================');
console.log('[TRADE CYCLE TEST] Starting secured full-cycle verification');
console.log('================================================================');

// ---- 0. Persona sessions ----
const buyerToken = await login('buyer@wholesale.internal', 'Password123!');
const approverToken = await login('approver@wholesale.internal', 'Password123!');
const supplierToken = await login('supplier@wholesale.internal', 'Password123!');
const adminToken = await login('admin@wholesale.internal', 'Password123!');
const financeToken = await login('finance@wholesale.internal', 'Password123!');

// ---- 1. RFQ issue (buyer) ----
let rfqId = '';
{
  const res = await call('/v1/sourcing/rfqs', {
    method: 'POST', token: buyerToken,
    body: { title: 'Cycle test widgets', quantity: 2000, unit: 'pcs', destination_country: 'US' },
  });
  assert(res.status === 201, `RFQ created (got ${res.status})`);
  assert(res.json.buyer_contact === '[PROTECTED]', 'RFQ buyer contact masked');
  rfqId = res.json.id;
}
{
  const res = await call('/v1/sourcing/rfqs', { method: 'POST', body: { title: 'x', quantity: 1 } });
  assert(res.status === 401, `unauthenticated RFQ rejected (got ${res.status})`);
}

// ---- 2. Quote submit + revision (supplier) ----
let quoteId = '';
{
  const res = await call(`/v1/sourcing/rfqs/${rfqId}/quotes`, {
    method: 'POST', token: supplierToken,
    body: { unit_price: '4.20', lead_time_days: 14, incoterms: 'FOB Busan Port', quantity: 2000, unit: 'pcs' },
  });
  assert(res.status === 201 || res.status === 200, `quote submitted (got ${res.status})`);
  quoteId = res.json.id || res.json.quote_id;
  assert(!!quoteId, 'quote id returned');
}
{
  // Second submission supersedes as revision 2
  const res = await call(`/v1/sourcing/rfqs/${rfqId}/quotes`, {
    method: 'POST', token: supplierToken,
    body: { unit_price: '4.10', lead_time_days: 12, incoterms: 'FOB Busan Port', quantity: 2000, unit: 'pcs' },
  });
  assert(res.status === 201 || res.status === 200, `quote revision submitted (got ${res.status})`);
}
{
  const res = await call(`/v1/sourcing/rfqs/${rfqId}/quotes`, {
    method: 'POST', token: buyerToken, body: { unit_price: '1.00' },
  });
  assert(res.status === 403, `buyer cannot submit supplier quote (got ${res.status})`);
}

// ---- 3. Quote review + accept (buyer, idempotent) ----
let orderId = '';
{
  const res = await call(`/v1/sourcing/quotes/${quoteId}`, { token: buyerToken });
  assert(res.status === 200, `buyer reads own RFQ quote (got ${res.status})`);
}
{
  const res = await call(`/v1/sourcing/quotes/${quoteId}/accept`, {
    method: 'POST', token: buyerToken,
    headers: { 'Idempotency-Key': 'cycle-accept-001' },
    body: {},
  });
  assert(res.status === 201, `quote accepted, order created (got ${res.status})`);
  assert(res.json.total_amount_minor === 820000, `exact total 4.10 x 2000 = 820000 minor (got ${res.json.total_amount_minor})`);
  assert(res.json.downpayment_minor === 246000, `exact 30% downpayment 246000 (got ${res.json.downpayment_minor})`);
  assert(res.json.balance_minor === 574000, `exact 70% balance 574000 (got ${res.json.balance_minor})`);
  assert(/^[a-f0-9]{64}$/.test(res.json.contract_hash), 'order carries real SHA-256 contract hash');
  orderId = res.json.id;
}
{
  const dup = await call(`/v1/sourcing/quotes/${quoteId}/accept`, {
    method: 'POST', token: buyerToken,
    headers: { 'Idempotency-Key': 'cycle-accept-001' },
    body: {},
  });
  assert(dup.status === 409, `duplicate accept rejected by idempotency (got ${dup.status})`);
}

// ---- 4. Corporate approval (SoD) ----
{
  const bad = await call(`/v1/trade/orders/${orderId}/approve`, { method: 'POST', token: buyerToken, body: {} });
  assert(bad.status === 403, `purchaser cannot approve (got ${bad.status})`);
  const good = await call(`/v1/trade/orders/${orderId}/approve`, { method: 'POST', token: approverToken, body: {} });
  assert(good.status === 200 && good.json.approved === true, `approver approves order (got ${good.status})`);
}

// ---- 5. Contract sign (hash verified) ----
{
  const ctr = await call(`/v1/trade/orders/${orderId}/contract`, { token: buyerToken });
  assert(ctr.status === 200, `contract fetched (got ${ctr.status})`);
  const forged = await call(`/v1/trade/orders/${orderId}/contract/sign`, {
    method: 'POST', token: buyerToken, body: { document_hash: '0'.repeat(64) },
  });
  assert(forged.status === 422, `forged contract hash rejected (got ${forged.status})`);
  const signed = await call(`/v1/trade/orders/${orderId}/contract/sign`, {
    method: 'POST', token: buyerToken, body: { document_hash: ctr.json.document_hash },
  });
  assert(signed.status === 200 && signed.json.signed === true, `contract signed with verified hash (got ${signed.status})`);
}

// ---- 6. Cart with exact tier pricing ----
{
  const add = await call('/v1/cart/items', {
    method: 'POST', token: buyerToken,
    body: { listing_id: '33333333-3333-3333-3333-333333333333', quantity: 500 },
  });
  assert(add.status === 201, `cart add succeeds (got ${add.status})`);
  const line = add.json.items.find(i => i.listing_id === '33333333-3333-3333-3333-333333333333');
  assert(line && line.unit_price === '4.80' && line.total_price === '2400.00', `tier price exact: 500 x 4.80 = 2400.00 (got ${line?.unit_price} / ${line?.total_price})`);
  const below = await call('/v1/cart/items', {
    method: 'POST', token: buyerToken,
    body: { listing_id: '33333333-3333-3333-3333-333333333333', quantity: 50 },
  });
  assert(below.status === 422, `below-MOQ cart add rejected (got ${below.status})`);
  const anon = await call('/v1/cart', {});
  assert(anon.status === 401, `unauthenticated cart read rejected (got ${anon.status})`);
}

// ---- 7. Payment capture (down payment) ----
{
  const pay = await call('/v1/payments/process', {
    method: 'POST', token: buyerToken,
    body: { order_id: orderId, payment_type: 'DOWN_PAYMENT' },
  });
  assert(pay.status === 200 && pay.json.status === 'PAID', `down payment captured (got ${pay.status})`);
  assert(pay.json.amount_minor === 246000, `captured amount exact 246000 (got ${pay.json.amount_minor})`);
}

// ---- 8. Split shipment with cumulative bound ----
{
  const s1 = await call('/v1/logistics/shipments', {
    method: 'POST', token: supplierToken, body: { order_id: orderId, dispatch_quantity: 800 },
  });
  assert(s1.status === 201 || s1.status === 200, `first split shipment accepted (got ${s1.status})`);
  const over = await call('/v1/logistics/shipments', {
    method: 'POST', token: supplierToken, body: { order_id: orderId, dispatch_quantity: 1300 },
  });
  assert(over.status === 422, `cumulative overflow rejected (got ${over.status})`);
  const s2 = await call('/v1/logistics/shipments', {
    method: 'POST', token: supplierToken, body: { order_id: orderId, dispatch_quantity: 1200 },
  });
  assert(s2.status === 201 || s2.status === 200, `final split shipment completes order (got ${s2.status})`);
  const buyerShip = await call('/v1/logistics/shipments', {
    method: 'POST', token: buyerToken, body: { order_id: orderId, dispatch_quantity: 1 },
  });
  assert(buyerShip.status === 403, `buyer cannot dispatch shipments (got ${buyerShip.status})`);
}

// ---- 9. Delivery confirm → settlement eligible ----
let settlementId = '';
{
  const done = await call(`/v1/trade/orders/${orderId}/confirm-delivery`, { method: 'POST', token: buyerToken, body: {} });
  assert(done.status === 200, `delivery confirmed (got ${done.status})`);
  const list = await call('/v1/settlements', { token: supplierToken });
  assert(list.status === 200, `supplier reads settlements (got ${list.status})`);
  const mine = list.json.settlements.find(s => s.order_id === orderId);
  assert(mine && mine.status === 'RELEASE_ELIGIBLE', 'settlement released to eligible after delivery');
  assert(mine.fee_minor === 41000 && mine.net_minor === 779000, `exact 5% fee 41000 / net 779000 (got ${mine.fee_minor} / ${mine.net_minor})`);
  settlementId = mine.id;
}

// ---- 10. Payout: supplier requests, dual admin control dispatches ----
{
  const req = await call(`/v1/settlements/${settlementId}/payout`, { method: 'POST', token: supplierToken, body: {} });
  assert(req.status === 200 && req.json.status === 'PAYOUT_REQUESTED', `supplier payout stays a request (got ${req.status} / ${req.json.status})`);
  assert(!req.json.bank_transfer_ref, 'supplier request dispatches no wire');
  const ap = await call(`/v1/settlements/${settlementId}/approve`, { method: 'POST', token: adminToken, body: {} });
  assert(ap.status === 200, `admin stage-1 approval (got ${ap.status})`);
  const selfDispatch = await call(`/v1/settlements/${settlementId}/payout`, { method: 'POST', token: adminToken, body: {} });
  assert(selfDispatch.status === 409, `same-admin dispatch blocked by SoD (got ${selfDispatch.status})`);
  const wire = await call(`/v1/settlements/${settlementId}/payout`, { method: 'POST', token: financeToken, body: {} });
  assert(wire.status === 200 && wire.json.status === 'PAYOUT_DISPATCHED', `second officer dispatches wire (got ${wire.status})`);
  assert(!!wire.json.bank_transfer_ref, 'dispatch returns wire reference');
}

// ---- 11. Dispute freezes settlement, arbitration resolves ----
{
  const disp = await call('/v1/disputes', {
    method: 'POST', token: buyerToken,
    body: { order_id: orderId, requested_amount_minor: 100000, reason: 'CYCLE_TEST defect claim' },
  });
  assert(disp.status === 201, `dispute opened (got ${disp.status})`);
  assert(disp.json.escrow_frozen_minor === 820000, `full escrow frozen 820000 (got ${disp.json.escrow_frozen_minor})`);
  const frozen = await call('/v1/settlements', { token: adminToken });
  const mine = frozen.json.settlements.find(s => s.order_id === orderId);
  assert(mine && mine.status === 'HELD_DISPUTE_FREEZE', 'settlement auto-frozen on dispute');
  const arb = await call(`/v1/disputes/${disp.json.id}/arbitrate`, {
    method: 'POST', token: adminToken,
    body: { buyer_refund_minor: 100000, supplier_release_minor: 720000, resolution: 'PARTIAL_REFUND' },
  });
  assert(arb.status === 200 && arb.json.status === 'RESOLVED', `arbitration resolves dispute (got ${arb.status})`);
  const buyerArb = await call(`/v1/disputes/${disp.json.id}/arbitrate`, {
    method: 'POST', token: buyerToken, body: { buyer_refund_minor: 1, supplier_release_minor: 1 },
  });
  assert(buyerArb.status === 403, `buyer cannot arbitrate (got ${buyerArb.status})`);
}

// ---- 12. Catalog governance: review queue + ownership ----
{
  const reg = await call('/v1/auth/register', {
    method: 'POST', ip: AUTH_IP,
    body: { email: 'rival@supplier.test', password: 'RivalStrongPass123!', company_name: 'Rival Parts Ltd.', business_number: '999-99-99999', role_capability: 'SUPPLIER' },
  });
  assert(reg.status === 201, `second supplier registers (got ${reg.status})`);
  const rivalToken = reg.json.access_token;
  const own = await call('/v1/catalog/listings/rival-x', { method: 'PUT', token: rivalToken, body: { title: 'hijack' } });
  assert(own.status === 404, `PUT unknown listing is 404 (got ${own.status})`);
  const hijack = await call('/v1/catalog/listings/33333333-3333-3333-3333-333333333333', { method: 'PUT', token: rivalToken, body: { title: 'hijack' } });
  assert(hijack.status === 403, `supplier cannot edit another org listing (got ${hijack.status})`);
  const create = await call('/v1/catalog/listings', {
    method: 'POST', token: rivalToken,
    body: { title: 'Rival test widget', moq: '100', quantity_step: '10', unit: 'pcs', status: 'PUBLISHED', price_tiers: [{ min_quantity: '100', max_quantity: null, unit_price: '9.990000', currency: 'USD' }] },
  });
  assert(create.status === 201, `supplier creates listing (got ${create.status})`);
  assert(create.json.status === 'UNDER_REVIEW', `new listing forced into review queue (got ${create.json.status})`);
  assert(create.json.trade_assurance === false, 'new listing has no auto trade-assurance badge');
  const mod = await call(`/v1/admin/moderation/listings/${create.json.id}/review`, {
    method: 'POST', token: adminToken, body: { action: 'APPROVE' },
  });
  assert(mod.status === 200 && mod.json.status === 'PUBLISHED', `admin approves listing (got ${mod.status})`);
  const buyerCreate = await call('/v1/catalog/listings', {
    method: 'POST', token: buyerToken,
    body: { title: 'x', moq: '1', price_tiers: [] },
  });
  assert(buyerCreate.status === 403, `buyer cannot create listings (got ${buyerCreate.status})`);
}

// ---- 13. Admin surface + KYC checksum ----
{
  const dashBuyer = await call('/v1/admin/dashboard', { token: buyerToken });
  assert(dashBuyer.status === 403, `buyer blocked from admin dashboard (got ${dashBuyer.status})`);
  const dash = await call('/v1/admin/dashboard', { token: adminToken });
  assert(dash.status === 200, `admin dashboard loads (got ${dash.status})`);
  const kycBad = await call('/v1/verification/business-tax-id', {
    method: 'POST', token: supplierToken, body: { tax_id: '123-45-67890' },
  });
  assert(kycBad.status === 422, `invalid NTS checksum rejected (got ${kycBad.status})`);
  const kycGood = await call('/v1/verification/business-tax-id', {
    method: 'POST', token: supplierToken, body: { tax_id: '123-45-67891', company_name: 'Cycle Test Co.' },
  });
  assert(kycGood.status === 200 && kycGood.json.is_valid === true, `valid NTS checksum verified (got ${kycGood.status})`);
}

// ---- 14. Messenger tenancy ----
{
  const thread = await call('/v1/inquiries', {
    method: 'POST', token: buyerToken,
    body: { listing_title: 'cycle widget', message: 'bulk quote please', sender_role: 'PLATFORM_ADMIN' },
  });
  assert(thread.status === 201, `inquiry thread created (got ${thread.status})`);
  assert(thread.json.messages[0].sender_role === 'BUYER_PURCHASER', 'message sender taken from session, not body');
  const msg = await call(`/v1/inquiries/${thread.json.id}/messages`, {
    method: 'POST', token: supplierToken, body: { content: 'quote sent' },
  });
  assert(msg.status === 201, `supplier replies in thread (got ${msg.status})`);
  const anon = await call('/v1/inquiries', {});
  assert(anon.status === 401, `unauthenticated inquiry list rejected (got ${anon.status})`);
}

console.log('================================================================');
console.log(`[TRADE CYCLE TEST] RESULTS: ${passed}/${total} PASSED (100% OK)`);
console.log('================================================================');
