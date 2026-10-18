<template>
  <div class="pdp-container">
    <div class="breadcrumb">
      카탈로그 > 주방용품/산업용기 > {{ product.title }}
    </div>

    <div class="pdp-grid">
      <div class="pdp-media">
        <div class="main-image-placeholder">
          <span>제조사 공급 규격 실물 이미지</span>
        </div>
        <div class="spec-table">
          <h4>산업용 공급 스펙 (Specifications)</h4>
          <div class="spec-row"><span>제조 국가</span><span>대한민국 (KR)</span></div>
          <div class="spec-row"><span>표준 납기</span><span>발주일로부터 {{ product.lead_time_days }}일 (FOB 기준)</span></div>
          <div class="spec-row"><span>최소 발주(MOQ)</span><span>{{ product.moq }} {{ product.unit }} (발주단위: {{ product.quantity_step }})</span></div>
          <div class="spec-row"><span>샘플 제공</span><span>유료 샘플 제공 (본 주문 시 공제)</span></div>
        </div>
      </div>

      <div class="pdp-info">
        <div class="supplier-card">
          <div class="sup-head">
            <span class="sup-name">{{ product.supplier_name }}</span>
            <span class="verified-pill">✓ 공장 실사 완료 (Verified)</span>
          </div>
          <p class="sup-meta">사업자등록번호: 123-45-67890 · ISO 9001 / 14001 인증</p>
        </div>

        <h1 class="pdp-title">{{ product.title }}</h1>

        <!-- Tiered Pricing Table -->
        <div class="tiered-pricing-box">
          <h3>수량 구간별 도매 공급 단가 (FOB 기준)</h3>
          <div class="tier-columns">
            <div
              v-for="(tier, idx) in product.price_tiers"
              :key="idx"
              class="tier-col"
              :class="{ active: currentTierIndex === idx }"
            >
              <div class="tier-range">{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ product.unit }}</div>
              <div class="tier-price">${{ tier.unit_price }}</div>
            </div>
          </div>
        </div>

        <!-- Order Quantity Matrix -->
        <div class="order-box">
          <div class="qty-control">
            <label>발주 희망 수량 (MOQ: {{ product.moq }}, Step: {{ product.quantity_step }})</label>
            <div class="input-wrap">
              <input v-model.number="orderQty" type="number" :min="product.moq" :step="product.quantity_step" @input="recalculate" />
              <span class="unit">{{ product.unit }}</span>
            </div>
            <p v-if="validationError" class="err-msg">{{ validationError }}</p>
          </div>

          <div class="summary-box">
            <div class="sum-row"><span>적용 단가</span><span class="val">${{ activeUnitPrice }}</span></div>
            <div class="sum-row"><span>공급가액 소계</span><span class="val">${{ subtotalAmount }}</span></div>
            <div class="sum-row total"><span>결제 예정 총액 (USD)</span><span class="val total-val">${{ subtotalAmount }}</span></div>
          </div>

          <div class="actions">
            <button class="btn-primary" :disabled="!!validationError" @click="handlePlaceOrder">
              도매 발주서 생성 (Order)
            </button>
            <router-link to="/ko/KRW/sourcing/rfq/new" class="btn-secondary">
              맞춤 규격 RFQ 문의
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const product = ref({
  id: '33333333-3333-3333-3333-333333333333',
  title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩',
  supplier_name: 'Precision Korea (글로벌정밀산업)',
  moq: 100,
  quantity_step: 10,
  unit: 'pcs',
  lead_time_days: 14,
  price_tiers: [
    { min_quantity: 100, max_quantity: 499, unit_price: '5.50' },
    { min_quantity: 500, max_quantity: 999, unit_price: '4.80' },
    { min_quantity: 1000, max_quantity: null, unit_price: '4.20' },
  ],
});

const orderQty = ref(100);
const validationError = ref('');

const currentTierIndex = computed(() => {
  const qty = orderQty.value;
  for (let i = 0; i < product.value.price_tiers.length; i++) {
    const t = product.value.price_tiers[i];
    const max = t.max_quantity || Infinity;
    if (qty >= t.min_quantity && qty <= max) return i;
  }
  return -1;
});

const activeUnitPrice = computed(() => {
  const idx = currentTierIndex.value;
  return idx >= 0 ? product.value.price_tiers[idx].unit_price : '0.00';
});

const subtotalAmount = computed(() => {
  const price = parseFloat(activeUnitPrice.value);
  return (price * orderQty.value).toFixed(2);
});

function recalculate() {
  if (orderQty.value < product.value.moq) {
    validationError.value = `최소 발주 수량(${product.value.moq}${product.value.unit}) 이상이어야 합니다.`;
    return;
  }
  const diff = orderQty.value - product.value.moq;
  if (diff % product.value.quantity_step !== 0) {
    validationError.value = `수량은 ${product.value.quantity_step}${product.value.unit} 단위 배수여야 합니다.`;
    return;
  }
  validationError.value = '';
}

function handlePlaceOrder() {
  router.push('/ko/KRW/orders');
}
</script>

<style scoped>
.pdp-container { max-width: 1200px; margin: 0 auto; }
.breadcrumb { font-size: 13px; color: #64748B; margin-bottom: 20px; }
.pdp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
.main-image-placeholder { height: 360px; background: #E2E8F0; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748B; font-weight: 600; margin-bottom: 24px; }
.spec-table { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 16px; }
.spec-table h4 { margin: 0 0 12px 0; font-size: 14px; color: #172B4D; }
.spec-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #42526E; }
.supplier-card { background: #F8FAFC; border: 1px solid #D8E0EB; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
.sup-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.sup-name { font-weight: 700; color: #172B4D; font-size: 14px; }
.verified-pill { background: #DCFCE7; color: #15803D; font-size: 11px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.sup-meta { font-size: 12px; color: #64748B; margin: 0; }
.pdp-title { font-size: 24px; color: #172B4D; margin: 0 0 20px 0; line-height: 1.3; }
.tiered-pricing-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.tiered-pricing-box h3 { font-size: 14px; margin: 0 0 12px 0; color: #172B4D; }
.tier-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.tier-col { border: 1px solid #D8E0EB; border-radius: 6px; padding: 10px; text-align: center; }
.tier-col.active { border-color: #C2410C; background: #FFEDD5; }
.tier-range { font-size: 12px; color: #42526E; margin-bottom: 4px; }
.tier-price { font-size: 18px; font-weight: 700; color: #172B4D; font-variant-numeric: tabular-nums; }
.tier-col.active .tier-price { color: #C2410C; }
.order-box { background: #FFF; border: 1px solid #D8E0EB; border-radius: 8px; padding: 20px; }
.qty-control { margin-bottom: 20px; }
.qty-control label { display: block; font-size: 13px; font-weight: 600; color: #172B4D; margin-bottom: 8px; }
.input-wrap { display: flex; align-items: center; gap: 8px; }
.input-wrap input { width: 140px; padding: 8px 12px; font-size: 16px; border: 1px solid #D8E0EB; border-radius: 4px; }
.input-wrap .unit { font-size: 14px; color: #64748B; }
.err-msg { color: #B91C1C; font-size: 12px; margin-top: 6px; }
.summary-box { background: #F8FAFC; border-radius: 6px; padding: 14px; margin-bottom: 20px; }
.sum-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
.sum-row.total { border-top: 1px solid #D8E0EB; margin-top: 8px; padding-top: 8px; font-size: 15px; font-weight: 700; }
.total-val { color: #C2410C; }
.actions { display: flex; gap: 12px; }
.btn-primary { flex: 1; background: #C2410C; color: #FFF; border: none; padding: 12px; border-radius: 6px; font-weight: 700; font-size: 15px; cursor: pointer; }
.btn-primary:disabled { background: #CBD5E1; cursor: not-allowed; }
.btn-secondary { padding: 12px 18px; border: 1px solid #D8E0EB; border-radius: 6px; text-decoration: none; color: #172B4D; font-weight: 600; font-size: 14px; }
</style>

