import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import ts from 'typescript';
import * as vueRouter from 'vue-router';

const routerUrl = new URL('../src/router/index.ts', import.meta.url);
const require = createRequire(routerUrl);

// Exercise the actual route configuration without a browser or rendering views.
function createRouter() {
  const exports = {};
  const components = new Map();
  const { outputText } = ts.transpileModule(readFileSync(routerUrl, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  runInNewContext(outputText, {
    exports,
    require(id) {
      if (id === 'vue-router') {
        return { ...vueRouter, createWebHistory: vueRouter.createMemoryHistory };
      }
      if (id.endsWith('.vue')) {
        assert.ok(existsSync(new URL(id, routerUrl)), `Missing view: ${id}`);
        if (!components.has(id)) components.set(id, { default: { name: id } });
        return components.get(id);
      }
      return require(id);
    },
  });
  return exports.default;
}

test('direct routes retain their destination when a locale prefix is added', () => {
  const router = createRouter();
  const paths = router.getRoutes()
    .map(record => record.path)
    .filter(path => path !== '/' && !path.startsWith('/:'));
  for (const locale of ['ko', 'en', 'zh', 'ja']) {
    for (const currency of ['KRW', 'USD', 'CNY', 'JPY']) {
      for (const path of paths) {
        const directPath = path.replace(':orgId', 'supplier-123').replace(':id', 'item-123');
        const direct = router.resolve(directPath);
        const localized = router.resolve(`/${locale}/${currency}${directPath}?q=steel#details`);
        assert.equal(localized.matched.at(-1)?.redirect, undefined, localized.path);
        assert.equal(localized.matched.at(-1)?.components.default,
          direct.matched.at(-1)?.components.default, localized.path);
        assert.equal(localized.params.locale, locale);
        assert.equal(localized.params.currency, currency);
        assert.equal(localized.query.q, 'steel');
        assert.equal(localized.hash, '#details');
      }
    }
  }
});

test('named routes preserve dynamic IDs and canonical paths', () => {
  const router = createRouter();
  for (const [name, suffix] of [
    ['buyer-profile', 'my-alibaba/profile'],
    ['supplier-directory', 'suppliers'],
    ['rfq-list', 'sourcing/rfqs'],
    ['rfq-create', 'sourcing/rfq/new'],
    ['quote-review', 'sourcing/quotes/item-123'],
    ['order-detail', 'orders/item-123'],
  ]) {
    const params = { locale: 'en', currency: 'USD' };
    if (suffix.includes('item-123')) params.id = 'item-123';
    assert.equal(router.resolve({ name, params }).path, `/en/USD/${suffix}`);
  }
});

test('static routes do not collide with dynamic detail routes', () => {
  const router = createRouter();
  assert.equal(router.resolve('/en/USD/rfqs/new').name, 'rfq-create');
  assert.equal(router.resolve('/en/USD/orders/123/contract').name, 'contract-sign');
  assert.equal(router.resolve('/en/USD/orders/123/dispute').name, 'dispute-create');
  assert.equal(router.resolve('/en/USD/suppliers/123').name, 'supplier-storefront');
});

test('unsupported locales, currencies and unknown paths redirect home', async () => {
  const router = createRouter();
  for (const path of ['/', '/fr/USD/catalog', '/en/EUR/catalog', '/en/USD/missing']) {
    await router.push(path);
    assert.equal(router.currentRoute.value.path, '/ko/KRW/');
    assert.equal(router.currentRoute.value.name, 'home');
  }
});
