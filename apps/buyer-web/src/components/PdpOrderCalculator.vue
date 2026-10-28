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
            :min="product?.moq || 100"
            :step="product?.quantity_step || 10"
            @input="onInputQty(($event.target as HTMLInputElement).value)"
          />
          <button class="step-btn" @click="incrementQty">+</button>
          <span class="unit-text">{{ product?.unit || 'pcs' }}</span>
        </div>
      </div>
      <div class="rules-hint">
        <span>최소 발주(MOQ): <strong>{{ product?.moq }} {{ product?.unit }}</strong></span>
        <span>발주 단위(Step): <strong>{{ product?.quantity_step || 10 }} {{ product?.unit }} 배수</strong></span>
      </div>
    </div>

    <p v-if="quantityError" class="calc-err">{{ quantityError }}</p>

    <!-- Real-Time Calculation Matrix -->
    <div class="calc-summary-panel">
      <div class="summary-line">
        <span>적용 구간 단가 (Unit Price)</span>
        <span class="num">{{ formatMoney(activeUnitPrice) }} / {{ product?.unit }}</span>
      </div>
      <div class="summary-line">
        <span>예상 생산 소요 납기 (Lead Time)</span>
        <span class="num">{{ estimatedLeadTimeDays }}일 (선적항 출고 기준)</span>
      </div>
      <div class="summary-line">
        <span>선급금 에스크로 (30% Down Payment)</span>
        <span class="num highlight">{{ formatMoney(downPaymentAmount) }}</span>
      </div>
      <div class="summary-line total">
        <span>총 발주 공급가액 (Subtotal)</span>
        <span class="num total-price">{{ formatMoney(subtotalAmount) }}</span>
      </div>
    </div>

    <!-- Live Landed Cost Calculator Widget -->
    <div class="landed-cost-widget">
      <div class="widget-header" @click="showLandedCost = !showLandedCost">
        <span class="w-icon">🚢</span>
        <strong>예상 총 도입원가 (Landed Cost) 산출기</strong>
        <span class="toggle-icon">{{ showLandedCost ? '▲ 닫기' : '▼ 계산하기' }}</span>
      </div>

      <div v-if="showLandedCost" class="widget-body">
        <div class="landed-form-grid">
          <div>
            <label>도착국가 (Destination)</label>
            <select v-model="shippingDestination" @change="calculateLandedCost">
              <option value="US">미국 (United States)</option>
              <option value="KR">대한민국 (South Korea)</option>
              <option value="JP">일본 (Japan)</option>
              <option value="DE">독일 (Germany)</option>
            </select>
          </div>
          <div>
            <label>운송 방식 (Shipping Method)</label>
            <select v-model="shippingMethod" @change="calculateLandedCost">
              <option value="SEA_FCL">해상 FCL (컨테이너 만재)</option>
              <option value="SEA_LCL">해상 LCL (소량 혼적)</option>
              <option value="AIR">항공 화물 (Air Cargo)</option>
              <option value="EXPRESS">특송 (DHL/FedEx Express)</option>
            </select>
          </div>
        </div>

        <div v-if="landedCostData" class="landed-results">
          <div class="res-row">
            <span>해상/항공 추정 운임:</span>
            <strong>{{ formatMoney(landedCostData.freight_estimate) }}</strong>
          </div>
          <div class="res-row">
            <span>적하보험료 (0.3%):</span>
            <strong>{{ formatMoney(landedCostData.marine_insurance) }}</strong>
          </div>
          <div class="res-row">
            <span>예상 관세 ({{ landedCostData.duty_rate }}):</span>
            <strong>{{ formatMoney(landedCostData.customs_duty) }}</strong>
          </div>
          <div class="res-row total-landed">
            <span>개당 예상 착하원가:</span>
            <strong class="unit-landed">{{ formatMoney(landedCostData.unit_landed_cost) }} / {{ product?.unit }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons-group">
      <button class="btn-add-cart" :disabled="!!quantityError || addingCart" @click="handleAddToCart">
        🛒 {{ addingCart ? '담는 중...' : '도매 장바구니 담기' }}
      </button>
      <button class="btn-start-trade-order" :disabled="!!quantityError" @click="handleInstantOrder">
        📝 즉시 도매 발주서 생성
      </button>
    </div>

    <div class="secondary-actions-group">
      <button class="btn-sample-request" :disabled="requestingSample" @click="handleSampleOrder">
        📦 {{ requestingSample ? '주문 처리 중...' : `유료 샘플 신청 (${formatMoney(product?.sample_price || 25)})` }}
      </button>
      <button class="btn-inquiry" @click="$emit('open-inquiry')">
        💬 공급사 1:1 견적 문의
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedCurrency } from '../i18n';

const props = defineProps<{
  product: any;
  locale: string;
  currency: string;
}>();

const emit = defineEmits<{
  (e: 'tier-changed', tierIndex: number): void;
  (e: 'open-inquiry'): void;
}>();

const router = useRouter();

const orderQty = ref(Number(props.product?.moq) || 100);
const quantityError = ref('');
const addingCart = ref(false);
const requestingSample = ref(false);

const showLandedCost = ref(false);
const shippingDestination = ref('US');
const shippingMethod = ref('SEA_LCL');
const landedCostData = ref<any>(null);

function formatMoney(usdVal: string | number) {
  return formatCurrency(usdVal, (props.currency as SupportedCurrency) || 'KRW');
}

const currentTierIndex = computed(() => {
  if (!props.product?.price_tiers) return 0;
  const qty = orderQty.value;
  for (let i = 0; i < props.product.price_tiers.length; i++) {
    const t = props.product.price_tiers[i];
    const minQ = parseInt(t.min_quantity, 10);
    const maxQ = t.max_quantity ? parseInt(t.max_quantity, 10) : Infinity;
    if (qty >= minQ && qty <= maxQ) {
      return i;
    }
  }
  return 0;
});

const activeUnitPrice = computed(() => {
  if (!props.product?.price_tiers) return '0.00';
  const t = props.product.price_tiers[currentTierIndex.value];
  return t ? t.unit_price : props.product.price_tiers[0]?.unit_price || '0.00';
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
  const baseDays = props.product?.lead_time_days || 14;
  if (orderQty.value > 2000) return baseDays + 7;
  return baseDays;
});

function onInputQty(val: string) {
  const num = parseInt(val, 10);
  if (isNaN(num)) {
    quantityError.value = '수량을 정확히 입력하세요.';
    return;
  }
  orderQty.value = num;
  validateQty();
}

function incrementQty() {
  const step = parseInt(props.product?.quantity_step, 10) || 10;
  orderQty.value += step;
  validateQty();
}

function decrementQty() {
  const step = parseInt(props.product?.quantity_step, 10) || 10;
  const moq = parseInt(props.product?.moq, 10) || 10;
  if (orderQty.value - step >= moq) {
    orderQty.value -= step;
  } else {
    orderQty.value = moq;
  }
  validateQty();
}

function validateQty() {
  const moq = parseInt(props.product?.moq, 10) || 1;
  const step = parseInt(props.product?.quantity_step, 10) || 1;

  if (orderQty.value < moq) {
    quantityError.value = `최소 발주수량(MOQ ${moq}) 미만으로 주문할 수 없습니다.`;
    return;
  }

  if (step > 1 && (orderQty.value - moq) % step !== 0) {
    quantityError.value = `발주 수량은 ${step}개 배수 단위로 증감해야 합니다.`;
    return;
  }

  quantityError.value = '';
  emit('tier-changed', currentTierIndex.value);
  calculateLandedCost();
}

async function calculateLandedCost() {
  try {
    const res = await apiRequest('/logistics/quote', {
      method: 'POST',
      body: JSON.stringify({
        destination_country: shippingDestination.value,
        shipping_method: shippingMethod.value,
        quantity: orderQty.value,
        unit_price: activeUnitPrice.value,
      }),
    });
    landedCostData.value = res.cost_breakdown;
  } catch (err) {
    console.warn('Landed cost calculation error:', err);
  }
}

async function handleAddToCart() {
  addingCart.value = true;
  try {
    await apiRequest('/cart/items', {
      method: 'POST',
      body: JSON.stringify({
        listing_id: props.product.id,
        quantity: orderQty.value,
      }),
    });
    alert(`'${props.product.title}' 품목이 도매 카트에 ${orderQty.value}${props.product.unit} 담겼습니다.`);
  } catch (err: any) {
    alert(`장바구니 담기 실패: ${err.message}`);
  } finally {
    addingCart.value = false;
  }
}

function handleInstantOrder() {
  router.push({
    path: `/${props.locale}/${props.currency}/checkout`,
    query: {
      listing_id: props.product.id,
      quantity: String(orderQty.value),
      unit_price: activeUnitPrice.value,
    },
  });
}

async function handleSampleOrder() {
  requestingSample.value = true;
  try {
    const res = await apiRequest('/trade/samples', {
      method: 'POST',
      body: JSON.stringify({
        listing_id: props.product.id,
        quantity: 1,
        sample_price: props.product.sample_price || '25.00',
      }),
    });
    alert(`[유료 규격 샘플 주문 접수 완료]\n주문번호: ${res.order_number}\n샘플 단가: $${res.unit_price}\n샘플 발송 납기: ${res.lead_time_days}일`);
    router.push(`/${props.locale}/${props.currency}/orders`);
  } catch (err: any) {
    alert(`샘플 주문 실패: ${err.message}`);
  } finally {
    requestingSample.value = false;
  }
}

onMounted(() => {
  calculateLandedCost();
});
</script>

<style scoped>
.order-calculator-card {
  background: #FFFFFF;
  border: 1px solid #FED7AA;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.05);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.calc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.qty-field label {
  font-size: 13px;
  font-weight: 700;
  color: #1E293B;
  display: block;
  margin-bottom: 6px;
}
.qty-input-wrap {
  display: flex;
  align-items: center;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  overflow: hidden;
  width: fit-content;
}
.step-btn {
  background: #F1F5F9;
  border: none;
  width: 36px;
  height: 36px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}
.step-btn:hover {
  background: #E2E8F0;
}
.qty-input-wrap input {
  width: 80px;
  height: 36px;
  border: none;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #0F172A;
}
.unit-text {
  padding: 0 10px;
  font-size: 12px;
  color: #64748B;
  font-weight: 600;
  background: #F8FAFC;
  height: 36px;
  display: flex;
  align-items: center;
}
.rules-hint {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  color: #64748B;
  text-align: right;
}
.rules-hint strong {
  color: #0F172A;
}
.calc-err {
  color: #DC2626;
  font-size: 12px;
  font-weight: 700;
  margin: 0;
}
.calc-summary-panel {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-line {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #475569;
}
.summary-line .num {
  font-weight: 700;
  color: #1E293B;
}
.summary-line .highlight {
  color: #0284C7;
}
.summary-line.total {
  border-top: 1px solid #E2E8F0;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 800;
  color: #0F172A;
}
.total-price {
  font-size: 18px;
  color: #CC3D00;
}

/* Landed Cost Widget */
.landed-cost-widget {
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  overflow: hidden;
}
.widget-header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1E40AF;
}
.toggle-icon {
  margin-left: auto;
  font-size: 11px;
  font-weight: 700;
}
.widget-body {
  padding: 12px 14px;
  border-top: 1px solid #DBEAFE;
  background: #FFF;
}
.landed-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.landed-form-grid label {
  font-size: 11px;
  color: #64748B;
  display: block;
  margin-bottom: 2px;
}
.landed-form-grid select {
  width: 100%;
  padding: 6px;
  border: 1px solid #CBD5E1;
  border-radius: 4px;
  font-size: 12px;
}
.landed-results {
  background: #F8FAFC;
  padding: 10px;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}
.res-row {
  display: flex;
  justify-content: space-between;
  color: #475569;
}
.res-row.total-landed {
  border-top: 1px solid #E2E8F0;
  padding-top: 6px;
  margin-top: 4px;
  font-weight: 800;
  color: #1E293B;
}
.unit-landed {
  color: #2563EB;
}

/* Buttons */
.action-buttons-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.btn-add-cart {
  background: #FFF7ED;
  border: 1px solid #FED7AA;
  color: #CC3D00;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.btn-start-trade-order {
  background: #CC3D00;
  color: #FFF;
  border: none;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.btn-start-trade-order:hover {
  background: #C2410C;
}
.secondary-actions-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.btn-sample-request {
  background: #F1F5F9;
  border: 1px solid #CBD5E1;
  color: #334155;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
.btn-inquiry {
  background: #F8FAFC;
  border: 1px solid #CBD5E1;
  color: #475569;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}
</style>
