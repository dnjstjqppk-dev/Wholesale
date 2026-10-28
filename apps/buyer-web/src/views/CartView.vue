<template>
  <div class="cart-page">
    <div class="cart-header">
      <h2>B2B 도매 발주 장바구니 (Wholesale Cart)</h2>
      <p class="subtitle">대량 발주 수량에 따라 실시간 도매 구간 단가(Tiered Pricing)가 적용됩니다.</p>
    </div>

    <div v-if="loading" class="cart-state-box loading-box">
      <p>도매 장바구니 품목을 서버에서 불러오는 중입니다...</p>
    </div>

    <div v-else-if="items.length === 0" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <h3>장바구니에 담긴 도매 품목이 없습니다.</h3>
      <p>수량별 할인 구간이 제공되는 도매 카탈로그에서 상품을 탐색하세요.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="btn-primary">
        도매 카탈로그 탐색
      </router-link>
    </div>

    <div v-else class="cart-layout">
      <!-- Left: Item List -->
      <div class="cart-items">
        <div v-for="item in items" :key="item.id" class="cart-item-card">
          <div class="supplier-info">
            <span class="badge-sup">🏢 {{ item.supplier_name }}</span>
            <span class="badge-verified">✓ Verified Manufacturer</span>
            <span class="badge-ta">🛡️ Trade Assurance</span>
          </div>

          <div class="item-main">
            <div class="item-thumb">
              <img
                :src="item.image || 'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&w=300&q=80'"
                :alt="item.title"
                class="thumb-img"
              />
            </div>
            <div class="item-details">
              <h4 class="item-title">{{ item.title }}</h4>
              <div class="sku-tag">조건: {{ item.incoterms || 'FOB Busan Port' }} | 납기: {{ item.lead_time_days }}일</div>
              <div class="tier-hint">
                적용 단가: <strong>{{ formatMoney(item.unit_price) }}</strong> / {{ item.unit }}
              </div>
            </div>

            <div class="qty-controls">
              <label>발주 수량</label>
              <div class="qty-stepper">
                <button @click="changeQty(item, -10)">-</button>
                <input
                  v-model.number="item.quantity"
                  type="number"
                  min="10"
                  step="10"
                  @change="updateItemQty(item)"
                />
                <button @click="changeQty(item, 10)">+</button>
              </div>
              <span class="unit-label">{{ item.unit }}</span>
            </div>

            <div class="item-subtotal">
              <span class="price-label">품목 소계</span>
              <span class="price-val">{{ formatMoney(item.total_price) }}</span>
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
            <span>물품 총 공급가액</span>
            <span class="val">{{ formatMoney(totalAmount) }}</span>
          </div>
          <div class="summary-row highlight">
            <span>선급금 에스크로 (30% Down Payment)</span>
            <span class="val orange">{{ formatMoney(downPaymentAmount) }}</span>
          </div>
          <div class="summary-row">
            <span>잔금 (70% Balance upon Inspection)</span>
            <span class="val">{{ formatMoney(balanceAmount) }}</span>
          </div>

          <div class="trade-assurance-banner">
            <span class="shield">🛡️</span>
            <div>
              <strong>100% 무역 안심 보호 (Trade Assurance)</strong>
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
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';

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
.cart-page {
  max-width: 1320px;
  margin: 0 auto;
  padding: 24px 16px 60px;
}
.cart-header h2 {
  font-size: 22px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 6px;
}
.subtitle {
  font-size: 13px;
  color: #64748B;
  margin: 0 0 24px;
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 28px;
  align-items: flex-start;
}
.cart-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cart-item-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.supplier-info {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 10px;
  margin-bottom: 14px;
}
.badge-sup {
  font-weight: 700;
  color: #334155;
}
.badge-verified {
  background: #DCFCE7;
  color: #15803D;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
}
.badge-ta {
  background: #FFF7ED;
  color: #CC3D00;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}

.item-main {
  display: grid;
  grid-template-columns: 80px 1fr 140px 140px 32px;
  gap: 16px;
  align-items: center;
}
.item-thumb {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #E2E8F0;
}
.thumb-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.item-details h4 {
  margin: 0 0 6px;
  font-size: 14px;
  font-weight: 700;
  color: #1E293B;
  line-height: 1.35;
}
.sku-tag {
  font-size: 11px;
  color: #64748B;
  margin-bottom: 4px;
}
.tier-hint {
  font-size: 12px;
  color: #475569;
}
.tier-hint strong {
  color: #CC3D00;
}

.qty-controls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.qty-controls label {
  font-size: 11px;
  color: #64748B;
  font-weight: 600;
}
.qty-stepper {
  display: flex;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  overflow: hidden;
}
.qty-stepper button {
  background: #F1F5F9;
  border: none;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-weight: bold;
}
.qty-stepper input {
  width: 50px;
  border: none;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
}
.unit-label {
  font-size: 11px;
  color: #94A3B8;
}

.item-subtotal {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.price-label {
  font-size: 11px;
  color: #64748B;
}
.price-val {
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
}
.btn-remove {
  background: none;
  border: none;
  color: #94A3B8;
  font-size: 16px;
  cursor: pointer;
}
.btn-remove:hover {
  color: #DC2626;
}

/* Summary Card */
.order-summary-panel {
  position: sticky;
  top: 20px;
}
.summary-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}
.summary-card h3 {
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
  margin: 0 0 16px;
  border-bottom: 1px solid #F1F5F9;
  padding-bottom: 10px;
}
.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
  margin-bottom: 10px;
}
.summary-row .val {
  font-weight: 700;
  color: #0F172A;
}
.summary-row.highlight {
  background: #FFF7ED;
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid #CC3D00;
}
.summary-row .orange {
  color: #CC3D00;
  font-weight: 800;
}
.trade-assurance-banner {
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 6px;
  padding: 10px;
  display: flex;
  gap: 8px;
  margin: 16px 0;
}
.trade-assurance-banner strong {
  font-size: 12px;
  color: #15803D;
  display: block;
}
.trade-assurance-banner p {
  margin: 2px 0 0;
  font-size: 10px;
  color: #166534;
  line-height: 1.4;
}
.btn-checkout {
  width: 100%;
  background: #FF6A00;
  color: #FFF;
  border: none;
  padding: 14px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}
.btn-checkout:hover {
  background: #E55E00;
}

.empty-cart, .cart-state-box {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}
.btn-primary {
  display: inline-block;
  background: #FF6A00;
  color: #FFF;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  font-size: 13px;
  margin-top: 14px;
}

@media (max-width: 960px) {
  .cart-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  .order-summary-panel {
    position: static;
  }
}

@media (max-width: 640px) {
  .cart-page {
    padding: 16px 12px 40px;
  }
  .supplier-info {
    flex-wrap: wrap;
    gap: 6px;
  }
  .item-main {
    grid-template-columns: 70px 1fr;
    gap: 12px;
  }
  .item-thumb {
    width: 70px;
    height: 70px;
  }
  .item-details {
    grid-column: 2;
  }
  .qty-controls {
    grid-column: 1 / span 2;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    background: #F8FAFC;
    padding: 8px 12px;
    border-radius: 6px;
  }
  .item-subtotal {
    grid-column: 1;
    align-items: flex-start;
  }
  .btn-remove {
    grid-column: 2;
    justify-self: flex-end;
  }
}
</style>
