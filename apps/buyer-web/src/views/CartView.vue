<template>
  <div class="cart-page">
    <div class="cart-header">
      <h2>B2B 도매 발주 장바구니 (Wholesale Cart)</h2>
      <p class="subtitle">대량 발주 수량에 따라 실시간 도매 구간 단가(Tiered Pricing)가 적용됩니다.</p>
    </div>

    <div v-if="items.length === 0" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <h3>장바구니에 담긴 도매 품목이 없습니다.</h3>
      <p>수량별 할인 구간이 제공되는 도매 카탈로그에서 상품을 탐색하세요.</p>
      <router-link to="/ko/KRW/catalog" class="btn-primary">도매 카탈로그 탐색</router-link>
    </div>

    <div v-else class="cart-layout">
      <!-- Left: Item List -->
      <div class="cart-items">
        <div v-for="item in items" :key="item.id" class="cart-item-card">
          <div class="supplier-info">
            <span class="badge-sup">🏢 {{ item.supplier_name }}</span>
            <span class="badge-verified">✓ Verified</span>
            <span class="badge-ta">🛡️ Trade Assurance</span>
          </div>

          <div class="item-main">
            <div class="item-thumb">
              <span>{{ item.category }}</span>
            </div>
            <div class="item-details">
              <h4 class="item-title">{{ item.title }}</h4>
              <div class="sku-tag">SKU: {{ item.sku }} | 조건: {{ item.incoterms }}</div>

              <div class="tier-hint">
                적용 단가: <strong>${{ getUnitPrice(item) }} USD</strong> / {{ item.unit }}
                <span class="sub-tier">(MOQ: {{ item.moq }} {{ item.unit }}, 배수: {{ item.step }})</span>
              </div>
            </div>

            <div class="qty-controls">
              <label>발주 수량</label>
              <div class="qty-stepper">
                <button @click="decreaseQty(item)">-</button>
                <input v-model.number="item.quantity" type="number" :min="item.moq" :step="item.step" @change="validateQty(item)" />
                <button @click="increaseQty(item)">+</button>
              </div>
              <span class="unit-label">{{ item.unit }}</span>
            </div>

            <div class="item-subtotal">
              <span class="price-label">품목 소계</span>
              <span class="price-val">${{ getItemSubtotal(item).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
            </div>

            <button class="btn-remove" title="삭제" @click="removeItem(item.id)">✕</button>
          </div>
        </div>
      </div>

      <!-- Right: Order Summary Panel -->
      <div class="order-summary-panel">
        <div class="summary-card">
          <h3>도매 발주 요약 (Order Summary)</h3>

          <div class="summary-row">
            <span>총 발주 품목</span>
            <span>{{ items.length }}종</span>
          </div>
          <div class="summary-row">
            <span>총 발주 수량</span>
            <span>{{ totalQuantity.toLocaleString() }} pcs</span>
          </div>
          <div class="summary-row">
            <span>물품 총 공급가액 (FOB)</span>
            <span class="val">${{ totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="summary-row highlight">
            <span>선급금 에스크로 (30% Down Payment)</span>
            <span class="val orange">${{ downPaymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
          <div class="summary-row">
            <span>잔금 (70% Balance upon Inspection)</span>
            <span class="val">${{ balanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>

          <div class="trade-assurance-banner">
            <span class="shield">🛡️</span>
            <div>
              <strong>100% 무역 안심 보호</strong>
              <p>선급금 30%는 에스크로에 안전 보관되며 검수 및 선적 완료 전 공급사에 지급되지 않습니다.</p>
            </div>
          </div>

          <button class="btn-checkout" @click="proceedToCheckout">
            수주 계약서 작성 및 체크아웃 진행 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const items = ref([
  {
    id: 'cart-item-1',
    title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공 500ml)',
    sku: 'SKU-SUS304-VAC-500ML',
    category: '산업용 용기',
    supplier_name: 'Precision Korea Co., Ltd.',
    incoterms: 'FOB Busan Port',
    unit: 'pcs',
    moq: 100,
    step: 10,
    quantity: 1000,
    tiers: [
      { min: 100, max: 499, price: 5.50 },
      { min: 500, max: 999, price: 4.80 },
      { min: 1000, max: Infinity, price: 4.20 },
    ],
  },
]);

function getUnitPrice(item: any): number {
  for (const t of item.tiers) {
    if (item.quantity >= t.min && item.quantity <= t.max) {
      return t.price;
    }
  }
  return item.tiers[0].price;
}

function getItemSubtotal(item: any): number {
  return getUnitPrice(item) * item.quantity;
}

function increaseQty(item: any) {
  item.quantity += item.step;
}

function decreaseQty(item: any) {
  if (item.quantity - item.step >= item.moq) {
    item.quantity -= item.step;
  }
}

function validateQty(item: any) {
  if (item.quantity < item.moq) {
    item.quantity = item.moq;
  }
  const rem = (item.quantity - item.moq) % item.step;
  if (rem !== 0) {
    item.quantity = item.quantity - rem + item.step;
  }
}

function removeItem(id: string) {
  items.value = items.value.filter(i => i.id !== id);
}

const totalQuantity = computed(() => items.value.reduce((acc, i) => acc + i.quantity, 0));
const totalAmount = computed(() => items.value.reduce((acc, i) => acc + getItemSubtotal(i), 0));
const downPaymentAmount = computed(() => totalAmount.value * 0.30);
const balanceAmount = computed(() => totalAmount.value * 0.70);

function proceedToCheckout() {
  router.push('/ko/KRW/checkout');
}
</script>

<style scoped>
.cart-page { max-width: 1200px; margin: 0 auto; }
.cart-header h2 { font-size: 22px; color: #1E293B; margin: 0 0 6px 0; font-weight: 800; }
.subtitle { color: #64748B; font-size: 13px; margin-bottom: 24px; }

.empty-cart { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 60px 20px; text-align: center; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-cart h3 { font-size: 18px; color: #1E293B; margin-bottom: 8px; }
.empty-cart p { color: #64748B; font-size: 14px; margin-bottom: 24px; }
.btn-primary { background: #FF6600; color: #FFF; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 700; display: inline-block; }

.cart-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
.cart-items { display: flex; flex-direction: column; gap: 16px; }
.cart-item-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; }
.supplier-info { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; font-size: 12px; border-bottom: 1px solid #F1F5F9; padding-bottom: 8px; }
.badge-sup { font-weight: 700; color: #1E293B; }
.badge-verified { background: #FEF3C7; color: #B45309; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; }
.badge-ta { background: #FFF7ED; color: #C2410C; font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px; }

.item-main { display: flex; align-items: center; gap: 18px; }
.item-thumb { width: 70px; height: 70px; background: #F1F5F9; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; color: #64748B; text-align: center; font-weight: 600; }
.item-details { flex: 1; }
.item-title { font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 6px 0; }
.sku-tag { font-size: 11px; color: #64748B; margin-bottom: 6px; }
.tier-hint { font-size: 13px; color: #334155; }
.tier-hint strong { color: #FF6600; }
.sub-tier { font-size: 11px; color: #94A3B8; margin-left: 4px; }

.qty-controls { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.qty-controls label { font-size: 11px; color: #64748B; }
.qty-stepper { display: flex; align-items: center; border: 1px solid #CBD5E1; border-radius: 4px; overflow: hidden; }
.qty-stepper button { width: 28px; height: 28px; background: #F8FAFC; border: none; font-size: 14px; cursor: pointer; }
.qty-stepper input { width: 64px; height: 28px; border: none; text-align: center; font-size: 13px; font-weight: 700; outline: none; }
.unit-label { font-size: 11px; color: #64748B; }

.item-subtotal { display: flex; flex-direction: column; align-items: flex-end; min-width: 100px; }
.price-label { font-size: 11px; color: #64748B; }
.price-val { font-size: 16px; font-weight: 800; color: #1E293B; font-variant-numeric: tabular-nums; }
.btn-remove { background: transparent; border: none; color: #94A3B8; cursor: pointer; font-size: 16px; padding: 4px 8px; }
.btn-remove:hover { color: #EF4444; }

.summary-card { background: #FFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.summary-card h3 { font-size: 16px; color: #1E293B; margin: 0 0 16px 0; font-weight: 700; border-bottom: 1px solid #F1F5F9; padding-bottom: 10px; }
.summary-row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; color: #475569; }
.summary-row.highlight { font-weight: 700; border-top: 1px dashed #E2E8F0; border-bottom: 1px dashed #E2E8F0; margin: 6px 0; padding: 10px 0; }
.summary-row .val { font-weight: 700; color: #1E293B; font-variant-numeric: tabular-nums; }
.summary-row .val.orange { color: #FF6600; font-size: 15px; }

.trade-assurance-banner { display: flex; gap: 10px; background: #FFF7ED; border: 1px solid #FFEDD5; border-radius: 6px; padding: 12px; margin: 18px 0; font-size: 11px; color: #9A3412; line-height: 1.4; }
.trade-assurance-banner .shield { font-size: 20px; }
.trade-assurance-banner p { margin: 4px 0 0 0; color: #C2410C; }

.btn-checkout { width: 100%; background: #FF6600; color: #FFF; border: none; padding: 14px; border-radius: 6px; font-size: 15px; font-weight: 800; cursor: pointer; transition: background 0.15s; }
.btn-checkout:hover { background: #E65C00; }
</style>

