<template>
  <div class="ws-page ws-page-wide">
    <div class="ws-page-head">
      <p class="ws-eyebrow">Wholesale Cart</p>
      <h1 class="ws-page-title">도매 발주 장바구니</h1>
      <p class="ws-page-sub">발주 수량에 따라 실시간 도매 구간 단가(Tiered Pricing)가 적용됩니다.</p>
    </div>

    <div class="ws-steps">
      <div class="ws-step ws-step-active"><span class="ws-step-num">1</span><span class="ws-step-label">장바구니</span></div>
      <div class="ws-step"><span class="ws-step-num">2</span><span class="ws-step-label">계약·체크아웃</span></div>
      <div class="ws-step"><span class="ws-step-num">3</span><span class="ws-step-label">에스크로 결제</span></div>
    </div>

    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 140px"></div>
      <div class="ws-skeleton" style="height: 140px"></div>
    </div>

    <div v-else-if="items.length === 0" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="cart" :size="24" /></span>
      <h3>장바구니에 담긴 도매 품목이 없습니다</h3>
      <p>수량별 할인 구간이 제공되는 도매 카탈로그에서 상품을 탐색하세요.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="ws-btn ws-btn-accent">도매 카탈로그 탐색</router-link>
    </div>

    <div v-else class="cart-grid">
      <div class="ws-stack">
        <article v-for="item in items" :key="item.id" class="ws-card ws-card-pad-sm cart-row">
          <div class="cart-sup">
            <span class="ws-cluster" style="gap: 8px">
              <WsIcon name="building" :size="15" />
              <b>{{ item.supplier_name }}</b>
            </span>
            <span class="ws-cluster" style="gap: 6px">
              <span class="ws-badge ws-badge-success">Verified</span>
              <span class="ws-badge ws-badge-brand"><WsIcon name="shield" :size="12" /> TA</span>
            </span>
          </div>
          <div class="cart-main">
            <img
              :src="item.image || 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=300&q=80'"
              :alt="item.title"
              class="cart-thumb"
            />
            <div class="ws-list-main">
              <p class="ws-list-title">{{ item.title }}</p>
              <p class="ws-list-sub">{{ item.incoterms || 'FOB Busan Port' }} · 납기 {{ item.lead_time_days }}일</p>
              <p class="cart-unit">적용 단가 <b class="ws-price-dark">{{ formatMoney(item.unit_price) }}</b> / {{ item.unit }}</p>
            </div>
            <div class="qty-box">
              <span class="qty-label">발주 수량 ({{ item.unit }})</span>
              <div class="stepper">
                <button aria-label="수량 감소" @click="changeQty(item, -10)">−</button>
                <input v-model.number="item.quantity" type="number" min="10" step="10" @change="updateItemQty(item)" />
                <button aria-label="수량 증가" @click="changeQty(item, 10)">+</button>
              </div>
            </div>
            <div class="subtotal">
              <span class="qty-label">품목 소계</span>
              <b class="ws-figure">{{ formatMoney(item.total_price) }}</b>
            </div>
            <button class="ws-icon-btn cart-remove" title="삭제" aria-label="품목 삭제" @click="removeItem(item.id)"><WsIcon name="x" :size="15" /></button>
          </div>
        </article>
      </div>

      <aside class="ws-card summary">
        <h3 class="ws-card-title">발주 요약</h3>
        <p class="ws-card-sub">Order Summary</p>
        <dl class="sum-rows">
          <div><dt>총 발주 품목</dt><dd>{{ items.length }}종</dd></div>
          <div><dt>총 발주 수량</dt><dd class="ws-figure">{{ totalQuantity.toLocaleString() }} pcs</dd></div>
          <div><dt>물품 총 공급가액</dt><dd class="ws-figure">{{ formatMoney(totalAmount) }}</dd></div>
          <div class="em"><dt>선급금 에스크로 (30%)</dt><dd class="ws-price-dark ws-figure">{{ formatMoney(downPaymentAmount) }}</dd></div>
          <div><dt>잔금 (검수 후 70%)</dt><dd class="ws-figure">{{ formatMoney(balanceAmount) }}</dd></div>
        </dl>
        <div class="ws-banner ws-banner-info ta-note">
          <WsIcon name="shield" :size="16" />
          <div><b>Trade Assurance 100% 보호</b><p>선급금은 에스크로 보관되며 검수·선적 완료 전 지급되지 않습니다.</p></div>
        </div>
        <button class="ws-btn ws-btn-accent ws-btn-block ws-btn-lg" @click="proceedToCheckout">계약서 작성·체크아웃 →</button>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

const router = useRouter();
const route = useRoute();

const currentLocale = computed<SupportedLocale>(() => {
  const loc = (route.params.locale as string) || 'ko';
  return ['ko', 'en', 'zh', 'ja'].includes(loc) ? (loc as SupportedLocale) : 'ko';
});

const currentCurrency = computed<SupportedCurrency>(() => {
  const cur = (route.params.currency as string) || 'KRW';
  return ['KRW', 'USD', 'CNY', 'JPY'].includes(cur) ? (cur as SupportedCurrency) : 'KRW';
});

function formatMoney(usdVal: string | number) {
  return formatCurrency(usdVal, currentCurrency.value);
}

const loading = ref(true);
const items = ref<any[]>([]);

async function loadCart() {
  loading.value = true;
  try {
    const res = await apiRequest('/cart');
    items.value = res.items || [];
  } catch (err) {
    console.warn('Failed to load cart:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadCart();
});

const totalQuantity = computed(() => {
  return items.value.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
});

const totalAmount = computed(() => {
  return items.value.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
});

const downPaymentAmount = computed(() => {
  return totalAmount.value * 0.3;
});

const balanceAmount = computed(() => {
  return totalAmount.value * 0.7;
});

async function changeQty(item: any, delta: number) {
  const newQty = Math.max(10, (item.quantity || 100) + delta);
  item.quantity = newQty;
  await updateItemQty(item);
}

async function updateItemQty(item: any) {
  try {
    const res = await apiRequest(`/cart/items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity: item.quantity }),
    });
    if (res?.item) {
      item.unit_price = res.item.unit_price;
      item.total_price = res.item.total_price;
    }
  } catch (err: any) {
    alert(`수량 변경 실패: ${err.message}`);
    loadCart();
  }
}

async function removeItem(cartItemId: string) {
  try {
    await apiRequest(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
    items.value = items.value.filter(i => i.id !== cartItemId);
  } catch (err: any) {
    alert(`품목 삭제 실패: ${err.message}`);
  }
}

function proceedToCheckout() {
  router.push(`/${currentLocale.value}/${currentCurrency.value}/checkout`);
}
</script>

<style scoped>
.cart-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 16px; align-items: start; }
.cart-sup { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding-bottom: 12px; margin-bottom: 12px; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.cart-main { display: grid; grid-template-columns: 84px minmax(0, 1fr) 150px 130px 36px; gap: 16px; align-items: center; }
.cart-thumb { width: 84px; height: 84px; object-fit: cover; border-radius: 8px; border: 1px solid var(--ws-border-subtle); background: var(--ws-surface-muted); }
.cart-unit { margin: 6px 0 0; font-size: 13px; color: var(--ws-text-2); }
.qty-label { font-size: 11px; font-weight: 700; color: var(--ws-text-muted); }
.qty-box { display: flex; flex-direction: column; gap: 6px; }
.stepper { display: flex; border: 1px solid var(--ws-border); border-radius: 8px; overflow: hidden; }
.stepper button { width: 34px; height: 36px; border: 0; background: var(--ws-surface-muted); font-size: 16px; font-weight: 800; cursor: pointer; color: var(--ws-text-2); }
.stepper button:hover { background: var(--ws-surface-hover); }
.stepper input { width: 100%; min-width: 0; border: 0; border-left: 1px solid var(--ws-border-subtle); border-right: 1px solid var(--ws-border-subtle); text-align: center; font-size: 14px; font-weight: 800; font-family: var(--ws-font); padding: 6px 4px; }
.stepper input:focus { outline: none; background: var(--ws-brand-faint); }
.subtotal { display: flex; flex-direction: column; gap: 6px; text-align: right; }
.subtotal b { font-size: 17px; }
.cart-remove { align-self: start; }
.summary { position: sticky; top: 84px; }
.sum-rows { margin: 0 0 8px; }
.sum-rows div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.sum-rows div:last-child { border-bottom: 0; }
.sum-rows dt { color: var(--ws-text-2); }
.sum-rows dd { margin: 0; font-weight: 800; }
.sum-rows .em dd { font-size: 16px; }
.ta-note { margin: 12px 0 16px; }
.ta-note p { margin: 4px 0 0; font-size: 12px; }
@media (max-width: 1024px) {
  .cart-grid { grid-template-columns: minmax(0, 1fr); }
  .summary { position: static; }
}
@media (max-width: 640px) {
  .cart-main { grid-template-columns: 64px minmax(0, 1fr); }
  .cart-thumb { width: 64px; height: 64px; }
  .qty-box, .subtotal { grid-column: 1 / -1; }
  .subtotal { text-align: left; }
  .cart-remove { position: absolute; }
  .cart-row { position: relative; }
  .cart-remove { top: 12px; right: 12px; }
}
</style>
