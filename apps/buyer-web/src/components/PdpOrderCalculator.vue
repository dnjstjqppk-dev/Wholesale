<template>
  <div class="order-calculator-card">
    <div class="calc-row">
      <div class="qty-field">
        <label>발주 수량 (Order Quantity)</label>
        <div class="qty-input-wrap">
          <button class="step-btn" @click="decrementQty">-</button>
          <input
            :value="orderQty"
            type="number"
            :min="product.moq"
            :step="product.quantity_step"
            @input="onInputQty(($event.target as HTMLInputElement).value)"
          />
          <button class="step-btn" @click="incrementQty">+</button>
          <span class="unit-text">{{ product.unit }}</span>
        </div>
      </div>
      <div class="rules-hint">
        <span>최소 발주(MOQ): <strong>{{ product.moq }} {{ product.unit }}</strong></span>
        <span>발주 단위(Step): <strong>{{ product.quantity_step }} {{ product.unit }} 배수</strong></span>
      </div>
    </div>

    <p v-if="quantityError" class="calc-err">{{ quantityError }}</p>

    <!-- Real-Time Calculation Matrix -->
    <div class="calc-summary-panel">
      <div class="summary-line">
        <span>적용 구간 단가 (Unit Price)</span>
        <span class="num">${{ activeUnitPrice }} / {{ product.unit }}</span>
      </div>
      <div class="summary-line">
        <span>예상 생산 소요 납기 (Lead Time)</span>
        <span class="num">{{ estimatedLeadTimeDays }}일 (발주 확정 후)</span>
      </div>
      <div class="summary-line">
        <span>선급금 에스크로 (30% Down Payment)</span>
        <span class="num">${{ downPaymentAmount }}</span>
      </div>
      <div class="summary-line total">
        <span>총 발주 공급가액 (USD)</span>
        <span class="num total-price">${{ subtotalAmount }}</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons-group">
      <button class="btn-start-trade-order" :disabled="!!quantityError" @click="$emit('create-order', { orderQty, activeUnitPrice, subtotalAmount })">
        📝 즉시 도매 발주서 생성 (Trade Contract)
      </button>
      <button class="btn-sample-request" @click="$emit('request-sample')">
        📦 유료 샘플 신청 ($25)
      </button>
      <router-link to="/ko/KRW/sourcing/rfq/new" class="btn-custom-rfq">
        ✍️ 사양 맞춤 RFQ 요청
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const props = defineProps<{
  product: any;
}>();

const emit = defineEmits<{
  (e: 'tier-changed', tierIndex: number): void;
  (e: 'create-order', data: any): void;
  (e: 'request-sample'): void;
}>();

const orderQty = ref(props.product.moq || 100);
const quantityError = ref('');

const currentTierIndex = computed(() => {
  const qty = orderQty.value;
  for (let i = 0; i < props.product.price_tiers.length; i++) {
    const t = props.product.price_tiers[i];
    const max = t.max_quantity || Infinity;
    if (qty >= t.min_quantity && qty <= max) {
      return i;
    }
  }
  return 0;
});

const activeUnitPrice = computed(() => {
  const t = props.product.price_tiers[currentTierIndex.value];
  return t ? t.unit_price : '0.00';
});

const subtotalAmount = computed(() => {
  const price = parseFloat(activeUnitPrice.value);
  const total = price * orderQty.value;
  return total.toFixed(2);
});

const downPaymentAmount = computed(() => {
  const total = parseFloat(subtotalAmount.value);
  return (total * 0.3).toFixed(2);
});

const estimatedLeadTimeDays = computed(() => {
  if (orderQty.value > 2000) return props.product.lead_time_days + 10;
  if (orderQty.value > 500) return props.product.lead_time_days + 5;
  return props.product.lead_time_days;
});

function validate() {
  if (orderQty.value < props.product.moq) {
    quantityError.value = `최소 발주 수량(MOQ)은 ${props.product.moq} ${props.product.unit} 이상이어야 합니다.`;
  } else if ((orderQty.value - props.product.moq) % props.product.quantity_step !== 0) {
    quantityError.value = `발주 단위는 ${props.product.quantity_step} ${props.product.unit} 배수여야 합니다.`;
  } else {
    quantityError.value = '';
    emit('tier-changed', currentTierIndex.value);
  }
}

function onInputQty(val: string) {
  orderQty.value = parseInt(val, 10) || 0;
  validate();
}

function incrementQty() {
  orderQty.value += props.product.quantity_step;
  validate();
}

function decrementQty() {
  if (orderQty.value - props.product.quantity_step >= props.product.moq) {
    orderQty.value -= props.product.quantity_step;
    validate();
  }
}
</script>

<style scoped>
.order-calculator-card { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 22px; }
.calc-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
.qty-field label { display: block; font-size: 13px; font-weight: 700; color: #1E293B; margin-bottom: 8px; }
.qty-input-wrap { display: flex; align-items: center; gap: 8px; }
.step-btn { width: 34px; height: 34px; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 4px; font-size: 18px; font-weight: 700; cursor: pointer; }
.qty-input-wrap input { width: 120px; height: 34px; border: 1px solid #CBD5E1; border-radius: 4px; text-align: center; font-size: 16px; font-weight: 700; color: #1E293B; outline: none; }
.unit-text { font-size: 14px; font-weight: 600; color: #64748B; }
.rules-hint { font-size: 12px; color: #64748B; display: flex; flex-direction: column; gap: 4px; text-align: right; }
.calc-err { color: #DC2626; font-size: 12px; margin: 0 0 14px 0; font-weight: 600; }
.calc-summary-panel { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
.summary-line { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; color: #475569; }
.summary-line .num { font-weight: 700; color: #1E293B; font-variant-numeric: tabular-nums; }
.summary-line.total { border-top: 1px solid #CBD5E1; margin-top: 8px; padding-top: 10px; font-size: 16px; font-weight: 800; color: #1E293B; }
.summary-line.total .total-price { color: #FF6600; font-size: 20px; }
.action-buttons-group { display: flex; flex-direction: column; gap: 10px; }
.btn-start-trade-order { background: #FF6600; color: #FFF; border: none; padding: 14px; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; transition: background 0.15s; }
.btn-start-trade-order:hover { background: #E65C00; }
.btn-start-trade-order:disabled { background: #CBD5E1; cursor: not-allowed; }
.btn-sample-request { background: #1E293B; color: #FFF; border: none; padding: 12px; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; }
.btn-custom-rfq { background: #FFF; border: 1px solid #CBD5E1; color: #1E293B; text-align: center; text-decoration: none; padding: 11px; border-radius: 8px; font-size: 13px; font-weight: 700; }
.btn-custom-rfq:hover { border-color: #FF6600; color: #FF6600; }
</style>

