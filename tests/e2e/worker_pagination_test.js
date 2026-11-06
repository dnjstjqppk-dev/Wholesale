// tests/e2e/worker_pagination_test.js
// List pagination/search/filter invariants on the REAL worker.
// Standard: ?page=1-based & ?page_size=1..100 (default 50); meta keys on every list.

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
    throw new Error(`Pagination assertion failed: ${message}`);
  }
  console.log(`  PASS [${total}]: ${message}`);
  passed++;
}

async function call(path, { method = 'GET', body = null, token = null, ip = '10.3.0.1', headers = {} } = {}) {
  const init = { method, headers: { ...headers, 'X-Forwarded-For': ip } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== null) {
    init.headers['Content-Type'] = 'application/json';
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }
  const res = await worker.fetch(new Request(`http://worker.local${path}`, init), ENV);
  return { status: res.status, json: JSON.parse(await res.text()) };
}

function assertMeta(json, where) {
  for (const k of ['page', 'page_size', 'total_count', 'total_pages', 'has_next']) {
    assert(k in (json || {}), `${where} exposes meta.${k}`);
  }
}

console.log('================================================================');
console.log('[PAGINATION TEST] Starting list pagination invariants');
console.log('================================================================');

const login = await call('/v1/auth/login', { method: 'POST', body: { email: 'buyer@wholesale.internal', password: 'Password123!' } });
assert(login.status === 200, 'buyer login succeeds');
const buyer = login.json.access_token;
const adminLogin = await call('/v1/auth/login', { method: 'POST', body: { email: 'admin@wholesale.internal', password: 'Password123!' } });
const admin = adminLogin.json.access_token;

// ---- 1. Catalog listings: slicing + meta + invalid params ----
{
  const p1 = await call('/v1/catalog/listings?page=1&page_size=5');
  assert(p1.status === 200, `listings page 1 ok (got ${p1.status})`);
  assert(p1.json.items.length === 5, `page_size=5 returns 5 items (got ${p1.json.items.length})`);
  assert(p1.json.total_count === 25, `total_count covers full set (got ${p1.json.total_count})`);
  assert(p1.json.total_pages === 5 && p1.json.has_next === true, 'meta total_pages=5, has_next=true');
  assertMeta(p1.json, 'listings');
  const p5 = await call('/v1/catalog/listings?page=5&page_size=5');
  assert(p5.json.items.length === 5 && p5.json.has_next === false, 'last page full, has_next=false');
  const p6 = await call('/v1/catalog/listings?page=6&page_size=5');
  assert(p6.json.items.length === 0 && p6.json.total_count === 25, 'out-of-range page returns empty items');
  const ids1 = new Set(p1.json.items.map(i => i.id));
  const ids2 = new Set((await call('/v1/catalog/listings?page=2&page_size=5')).json.items.map(i => i.id));
  assert([...ids1].every(id => !ids2.has(id)), 'pages do not overlap');
  for (const bad of ['?page=0', '?page=-1', '?page=abc', '?page_size=0', '?page_size=101', '?page_size=abc']) {
    const r = await call(`/v1/catalog/listings${bad}`);
    assert(r.status === 400, `invalid pagination ${bad} rejected (got ${r.status})`);
  }
  const q = await call('/v1/catalog/listings?q=sus');
  assert(q.json.total_count === 3, `keyword search narrows set to 3 (got ${q.json.total_count})`);
  const cat = await call('/v1/catalog/listings?category=CAT-IND&page_size=50');
  assert(cat.json.items.length > 0 && cat.json.items.every(i => i.category === 'CAT-IND'), 'category filter preserved with pagination');
}

// ---- 2. RFQ list: create + paginate + search ----
{
  for (let i = 1; i <= 3; i++) {
    const r = await call('/v1/sourcing/rfqs', {
      method: 'POST', token: buyer,
      body: { title: `Pagination probe widget ${i} zxq${i}`, quantity: 100 + i, unit: 'pcs' },
    });
    assert(r.status === 201, `probe RFQ ${i} created (got ${r.status})`);
  }
  const p = await call('/v1/sourcing/rfqs?page=1&page_size=2', { token: buyer });
  assert(p.json.items.length === 2 && p.json.has_next === true, 'rfq page slices to 2 with has_next');
  assertMeta(p.json, 'rfqs');
  const q = await call('/v1/sourcing/rfqs?q=zxq2', { token: buyer });
  assert(q.json.total_count === 1 && q.json.items[0].title.includes('zxq2'), 'rfq keyword search finds probe');
  const miss = await call('/v1/sourcing/rfqs?q=no-such-rfq-zzz', { token: buyer });
  assert(miss.json.total_count === 0 && miss.json.items.length === 0, 'rfq search miss returns empty');
}

// ---- 3. Orders: paginate + search + auth preserved ----
{
  const p = await call('/v1/trade/orders?page=1&page_size=1', { token: buyer });
  assert(p.status === 200 && p.json.orders.length <= 1, 'orders page_size=1 returns at most 1');
  assertMeta(p.json, 'orders');
  const q = await call('/v1/trade/orders?q=ORD-20261018', { token: buyer });
  assert(q.json.total_count >= 1, 'order search finds seed order');
  const anon = await call('/v1/trade/orders?page=1&page_size=1');
  assert(anon.status === 401, `unauthenticated orders page rejected (got ${anon.status})`);
}

// ---- 4. Remaining lists expose the same meta ----
{
  const checks = [
    ['/v1/settlements', buyer],
    ['/v1/disputes', buyer],
    ['/v1/inquiries', buyer],
    ['/v1/storage/documents', buyer],
    ['/v1/admin/audit-logs', admin],
    ['/v1/admin/verifications', admin],
    ['/v1/admin/moderation/listings', admin],
    ['/v1/settlements/reconciliations', admin],
  ];
  for (const [p, tok] of checks) {
    const r = await call(`${p}?page=1&page_size=2`, { token: tok });
    assert(r.status === 200, `${p} paged ok (got ${r.status})`);
    assertMeta(r.json, p);
  }
}

console.log('================================================================');
console.log(`[PAGINATION TEST] RESULTS: ${passed}/${total} PASSED (100% OK)`);
console.log('================================================================');
