// tests/security/security_test.js
// API Worker security invariant suite. Executes the REAL worker modules
// (apps/api-worker/src/*.ts) via Node type-stripping — no mocks, no doubles.
// Covers: auth bypass, credential storage, JWT integrity, webhook HMAC,
// rate limiting, registration policy, pricing exactness.

import crypto from 'node:crypto';

const worker = (await import('../../apps/api-worker/src/index.ts')).default;
const store = await import('../../apps/api-worker/src/store.ts');
const pricing = await import('../../apps/api-worker/src/pricing.ts');

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
    throw new Error(`Security assertion failed: ${message}`);
  }
  console.log(`  PASS [${total}]: ${message}`);
  passed++;
}

async function call(path, { method = 'GET', body = null, token = null, ip = '10.0.0.1', headers = {} } = {}) {
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
  return { status: res.status, json, text };
}

console.log('================================================================');
console.log('[SECURITY TEST] Starting API Worker security invariants');
console.log('================================================================');

// 1. Unknown email must NOT authenticate (no auto-registration on login).
{
  const res = await call('/v1/auth/login', {
    method: 'POST', ip: '10.0.1.1',
    body: { email: 'ghost-attacker@example.com', password: 'anything-works' },
  });
  assert(res.status === 401, `unknown email login rejected with 401 (got ${res.status})`);
  assert(!store.users.has('ghost-attacker@example.com'), 'unknown email login creates no account');
}

// 2. Control: wrong password for a seed account is rejected.
{
  const res = await call('/v1/auth/login', {
    method: 'POST', ip: '10.0.1.2',
    body: { email: 'buyer@wholesale.internal', password: 'WrongPassword999!' },
  });
  assert(res.status === 401, `wrong password rejected with 401 (got ${res.status})`);
}

// 3. Control: correct seed credentials authenticate and mint a token.
let buyerToken = '';
{
  const res = await call('/v1/auth/login', {
    method: 'POST', ip: '10.0.1.3',
    body: { email: 'buyer@wholesale.internal', password: 'Password123!' },
  });
  assert(res.status === 200, `seed buyer login succeeds (got ${res.status})`);
  assert(typeof res.json?.access_token === 'string' && res.json.access_token.split('.').length === 3, 'login mints a 3-part JWT');
  buyerToken = res.json.access_token;
}

// 4. Seed credentials are stored as PBKDF2 hashes, never plaintext.
{
  for (const [email, user] of store.users.entries()) {
    if (!email.endsWith('@wholesale.internal')) continue;
    assert(!('password' in user), `seed user ${email} has no plaintext password field`);
    assert(
      typeof user.password_hash === 'string' && user.password_hash.startsWith('pbkdf2-sha256$100000$'),
      `seed user ${email} stores a PBKDF2 password hash`,
    );
  }
}

// 5. Payment webhook without any signature must NOT be accepted.
{
  const res = await call('/v1/payments/webhook', {
    method: 'POST', ip: '10.0.1.4',
    body: { eventType: 'PAYMENT_APPROVED', order_id: 'ord-20261018-001' },
  });
  const accepted = res.status === 200 && res.json?.signature_verified === true;
  assert(!accepted, `unsigned webhook is not accepted (got ${res.status})`);
  assert(res.status === 401 || res.status === 503, `unsigned webhook rejected (got ${res.status})`);
}

// 6. Payment webhook with a forged signature must NOT be accepted.
{
  const raw = JSON.stringify({ eventType: 'PAYMENT_APPROVED', order_id: 'ord-20261018-001' });
  const res = await call('/v1/payments/webhook', {
    method: 'POST', ip: '10.0.1.5', body: raw,
    headers: {
      'X-Webhook-Timestamp': String(Math.floor(Date.now() / 1000)),
      'X-Webhook-Signature': '0'.repeat(64),
    },
  });
  const accepted = res.status === 200 && res.json?.signature_verified === true;
  assert(!accepted, `forged-signature webhook is not accepted (got ${res.status})`);
}

// 7. Payment webhook with a valid HMAC signature IS processed.
{
  const raw = JSON.stringify({ eventType: 'PAYMENT_APPROVED', order_id: 'ord-20261018-001' });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac('sha256', ENV.PAYMENT_WEBHOOK_SECRET).update(`${timestamp}.${raw}`).digest('hex');
  const res = await call('/v1/payments/webhook', {
    method: 'POST', ip: '10.0.1.6', body: raw,
    headers: { 'X-Webhook-Timestamp': timestamp, 'X-Webhook-Signature': signature },
  });
  assert(res.status === 200, `valid-signature webhook processed (got ${res.status})`);
  assert(res.json?.signature_verified === true, 'valid-signature webhook reports signature_verified=true');
}

// 8. Auth endpoints are rate limited per client IP.
{
  let saw429 = false;
  for (let i = 0; i < 35; i++) {
    const res = await call('/v1/auth/login', {
      method: 'POST', ip: '10.0.9.9',
      body: { email: 'buyer@wholesale.internal', password: `Wrong-${i}-Password!` },
    });
    if (res.status === 429) { saw429 = true; break; }
  }
  assert(saw429, 'burst of 35 auth attempts from one IP triggers 429');
}

// 9. Demo role-switcher endpoint must not exist.
{
  const res = await call('/v1/auth/switch-role', {
    method: 'POST', ip: '10.0.1.7', body: { role: 'BUYER_APPROVER' },
  });
  assert(res.status === 404, `demo switch-role endpoint removed (got ${res.status})`);
}

// 10. Control: tampered JWT is rejected on authenticated endpoints.
{
  const tampered = buyerToken.slice(0, -2) + (buyerToken.endsWith('aa') ? 'bb' : 'aa');
  const res = await call('/v1/auth/me', { ip: '10.0.1.8', token: tampered });
  assert(res.status === 401, `tampered JWT rejected with 401 (got ${res.status})`);
  const ok = await call('/v1/auth/me', { ip: '10.0.1.8', token: buyerToken });
  assert(ok.status === 200, `valid JWT accepted on /v1/auth/me (got ${ok.status})`);
}

// 11. Duplicate registration is rejected with 409.
{
  const res = await call('/v1/auth/register', {
    method: 'POST', ip: '10.0.1.9',
    body: {
      email: 'buyer@wholesale.internal', password: 'AnotherStrongPass123!',
      company_name: 'Duplicate Corp', business_number: '000-00-00000',
    },
  });
  assert(res.status === 409, `duplicate email registration rejected with 409 (got ${res.status})`);
}

// 12. Weak registration passwords are rejected.
{
  const res = await call('/v1/auth/register', {
    method: 'POST', ip: '10.0.1.10',
    body: {
      email: 'newbuyer@example.com', password: 'short8!!',
      company_name: 'New Buyer Corp', business_number: '111-11-11111',
    },
  });
  assert(res.status === 400, `weak password registration rejected with 400 (got ${res.status})`);
}

// 13. Exact decimal pricing: USD 2.345678 x 125 -> 29321 minor; KRW 0.5 x 1 -> 1 minor.
{
  const usd = pricing.moneyMinor('2.345678', 125, 'USD');
  assert(usd === 29321, `USD 2.345678 x 125 = 29321 minor (got ${usd})`);
  const krw = pricing.moneyMinor('0.5', 1, 'KRW');
  assert(krw === 1, `KRW 0.5 x 1 = 1 minor (got ${krw})`);
  const listing = {
    status: 'PUBLISHED', moq: '100', order_step: 10, unit: 'pcs',
    price_tiers: [
      { min_quantity: '100', max_quantity: '499', unit_price: '5.500000', currency: 'USD' },
      { min_quantity: '500', max_quantity: '999', unit_price: '4.800000', currency: 'USD' },
      { min_quantity: '1000', max_quantity: null, unit_price: '4.200000', currency: 'USD' },
    ],
  };
  const q = pricing.priceListing(listing, 500);
  assert(q.unit_price === '4.800000' && q.total_amount_minor === 240000, 'tier [500,999) prices 500 units at 4.80 exact (240000 minor)');
  let below = false;
  try { pricing.priceListing(listing, 90); } catch (e) { below = e?.code === 'BELOW_MOQ'; }
  assert(below, 'quantity below MOQ raises BELOW_MOQ');
}

console.log('================================================================');
console.log(`[SECURITY TEST] RESULTS: ${passed}/${total} PASSED (100% OK)`);
console.log('================================================================');
