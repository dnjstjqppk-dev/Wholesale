<template>
  <div class="order-calculator-card">
    <!-- Mode Switcher: Alibaba Multi-SKU Matrix vs Single Quick -->
    <div class="order-mode-tabs">
      <button
        type="button"
        class="mode-tab-btn"
        :class="{ active: orderMode === 'MATRIX' }"
        @click="orderMode = 'MATRIX'"
      >
        📊 다차원 SKU 일괄 발주 (Multi-SKU Matrix)
      </button>
      <button
        type="button"
        class="mode-tab-btn"
        :class="{ active: orderMode === 'SINGLE' }"
        @click="orderMode = 'SINGLE'"
      >
        ⚡ 단일 규격 빠른 주문 (Single)
      </button>
    </div>

    <!-- Multi-SKU Matrix Table (Alibaba Standard) -->
    <div v-if="orderMode === 'MATRIX'" class="sku-matrix-container">
      <div class="matrix-hint">
        <span>※ 여러 규격/옵션의 수량을 한 번에 입력하여 <strong>총 발주 수량 합산 기준의 도매 우대 구간 단가</strong>를 일괄 적용받으세요.</span>
      </div>
      <table class="sku-matrix-table">
        <thead>
          <tr>
            <th>규격 및 사양 (Spec / Variant)</th>
            <th>구간 단가 (Unit Price)</th>
            <th>가용 재고 (Stock)</th>
            <th class="th-qty">발주 수량 (Order Qty)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in productVariants" :key="v.id" class="sku-row">
            <td class="td-spec">
              <strong class="sku-name">{{ v.name }}</strong>
              <span class="sku-code">SKU: {{ v.sku }}</span>
            </td>
            <td class="td-price">
              <span class="sku-price">{{ formatMoney(activeUnitPrice) }}</span>
              <span class="sku-unit">/ {{ product?.unit || 'pcs' }}</span>
            </td>
            <td class="td-stock">
              <span class="stock-pill">가용 {{ (v.stock || 5000).toLocaleString() }}개</span>
            </td>
            <td class="td-qty">
              <div class="matrix-qty-wrap">
                <button type="button" class="m-step-btn" @click="decrementVariantQty(v.id)">-</button>
                <input
                  type="number"
                  min="0"
                  :step="product?.quantity_step || 10"
                  :value="variantQuantities[v.id] || 0"
                  class="m-qty-input"
                  @input="onInputVariantQty(v.id, ($event.target as HTMLInputElement).value)"
                />
                <button type="button" class="m-step-btn" @click="incrementVariantQty(v.id)">+</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="matrix-aggregate-bar">
        <div class="agg-item">
          <span>합산 총 발주 수량:</span>
          <strong class="agg-qty">{{ effectiveOrderQty }} {{ product?.unit || 'pcs' }}</strong>
        </div>
        <div class="agg-item">
          <span>최소 발주(MOQ {{ product?.moq || 100 }}) 상태:</span>
          <span :class="effectiveOrderQty >= (Number(product?.moq) || 100) ? 'moq-ok' : 'moq-warn'">
            {{ effectiveOrderQty >= (Number(product?.moq) || 100) ? '✓ MOQ 충족' : `⚠️ ${(Number(product?.moq) || 100) - effectiveOrderQty}개 부족` }}
          </span>
        </div>
      </div>
    </div>

    <!-- Single Quick Stepper -->
    <div v-else class="calc-row">
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
        <span>적용 구간 단가 (Tier Unit Price)</span>
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
            <label>무역 인도조건 (Incoterms)</label>
            <select v-model="selectedIncoterms" @change="calculateLandedCost">
              <option value="FOB">FOB (본선인도조건 - 부산항)</option>
              <option value="CIF">CIF (운임보험료포함 - 도착항)</option>
              <option value="DDP">DDP (관세지급인도 - 문앞배송)</option>
              <option value="EXW">EXW (공장인도조건 - 제조사출고)</option>
              <option value="CFR">CFR (운임포함인도 - 도착항)</option>
            </select>
          </div>
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
          <div class="cargo-specs-bar">
            <span>📦 화물 용적: <strong>{{ landedCargoSpec?.total_cbm || '0.50' }} CBM</strong></span>
            <span>⚖️ 총 중량: <strong>{{ landedCargoSpec?.gross_weight_kg || '45.0' }} kg</strong></span>
            <span v-if="landedCargoSpec?.is_fcl_recommended" class="fcl-rec-pill">💡 FCL 컨테이너 추천</span>
          </div>
          <div class="res-row">
            <span>해상/항공 추정 운임 ({{ selectedIncoterms }}):</span>
            <strong>{{ formatMoney(landedCostData.freight_estimate) }}</strong>
          </div>
          <div v-if="Number(landedCostData.origin_inland_freight) > 0" class="res-row">
            <span>공장-선적항 내륙운임:</span>
            <strong>{{ formatMoney(landedCostData.origin_inland_freight) }}</strong>
          </div>
          <div class="res-row">
            <span>적하보험료 (0.3%):</span>
            <strong>{{ formatMoney(landedCostData.marine_insurance) }}</strong>
          </div>
          <div class="res-row">
            <span>예상 수입관세 ({{ landedCostData.duty_rate }}):</span>
            <strong>{{ formatMoney(landedCostData.customs_duty) }}</strong>
          </div>
          <div v-if="Number(landedCostData.import_vat) > 0" class="res-row">
            <span>수입 부가세 ({{ landedCostData.vat_rate }}):</span>
            <strong>{{ formatMoney(landedCostData.import_vat) }}</strong>
          </div>
          <div class="res-row total-landed">
            <span>개당 예상 착하원가 (Landed Cost):</span>
            <strong class="unit-landed">{{ formatMoney(landedCostData.unit_landed_cost) }} / {{ product?.unit }}</strong>
          </div>
        </div>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="action-buttons-group">
      <button class="btn-add-cart" :disabled="!!quantityError || addingCart" @click="handleAddToCart">
        🛒 {{ addingCart ? '담는 중...' : (orderMode === 'MATRIX' ? '선택 규격 일괄 장바구니 담기' : '도매 장바구니 담기') }}
      </button>
      <button class="btn-start-trade-order" :disabled="!!quantityError" @click="handleInstantOrder">
        📝 {{ orderMode === 'MATRIX' ? '선택 규격 일괄 발주서 작성' : '즉시 도매 발주서 생성' }}
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
import { ref, computed, watch, onMounted } from 'vue';
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

const orderMode = ref<'MATRIX' | 'SINGLE'>('MATRIX');
const orderQty = ref(Number(props.product?.moq) || 100);
const quantityError = ref('');
const addingCart = ref(false);
const requestingSample = ref(false);

const showLandedCost = ref(false);
const selectedIncoterms = ref('FOB');
const shippingDestination = ref('US');
const shippingMethod = ref('SEA_LCL');
const landedCostData = ref<any>(null);
const landedCargoSpec = ref<any>(null);

// Multi-SKU Variants Setup
const productVariants = computed(() => {
  if (props.product?.variants && props.product.variants.length > 0) {
    return props.product.variants;
  }
  return [
    { id: `${props.product?.id || 'p'}-v1`, name: '표준 표준형 (Standard Spec)', sku: 'SKU-STD-01', stock: 5000 },
    { id: `${props.product?.id || 'p'}-v2`, name: '고강도 강화형 (Reinforced Pro)', sku: 'SKU-PRO-02', stock: 3200 },
    { id: `${props.product?.id || 'p'}-v3`, name: '수출 맞춤팩 (Export Custom Pack)', sku: 'SKU-EXP-03', stock: 1800 },
  ];
});

const variantQuantities = ref<Record<string, number>>({});

function initVariantQuantities() {
  const moq = Number(props.product?.moq) || 100;
  const qMap: Record<string, number> = {};
  productVariants.value.forEach((v: any, idx: number) => {
    qMap[v.id] = idx === 0 ? moq : 0;
  });
  variantQuantities.value = qMap;
}

watch(() => props.product, () => {
  initVariantQuantities();
}, { immediate: true });

const matrixTotalQty = computed(() => {
  return Object.values(variantQuantities.value).reduce((sum, q) => sum + (q || 0), 0);
});

const effectiveOrderQty = computed(() => {
  return orderMode.value === 'MATRIX' ? matrixTotalQty.value : orderQty.value;
});

function formatMoney(usdVal: string | number) {
  return formatCurrency(usdVal, (props.currency as SupportedCurrency) || 'KRW');
}

const currentTierIndex = computed(() => {
  if (!props.product?.price_tiers) return 0;
  const qty = effectiveOrderQty.value;
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
  const total = price * effectiveOrderQty.value;
  return total.toFixed(2);
});

const downPaymentAmount = computed(() => {
  const total = parseFloat(subtotalAmount.value);
  return (total * 0.3).toFixed(2);
});

const estimatedLeadTimeDays = computed(() => {
  const baseDays = props.product?.lead_time_days || 14;
  if (effectiveOrderQty.value > 2000) return baseDays + 7;
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

function onInputVariantQty(varId: string, val: string) {
  const num = Math.max(0, parseInt(val, 10) || 0);
  variantQuantities.value[varId] = num;
  validateQty();
}

function incrementVariantQty(varId: string) {
  const step = parseInt(props.product?.quantity_step, 10) || 10;
  const cur = variantQuantities.value[varId] || 0;
  variantQuantities.value[varId] = cur + step;
  validateQty();
}

function decrementVariantQty(varId: string) {
  const step = parseInt(props.product?.quantity_step, 10) || 10;
  const cur = variantQuantities.value[varId] || 0;
  variantQuantities.value[varId] = Math.max(0, cur - step);
  validateQty();
}

function validateQty() {
  const moq = parseInt(props.product?.moq, 10) || 1;
  const step = parseInt(props.product?.quantity_step, 10) || 1;
  const qty = effectiveOrderQty.value;

  if (qty < moq) {
    quantityError.value = `최소 발주수량(MOQ ${moq}) 미만입니다. 현재 ${qty}개 선택됨.`;
    return;
  }

  if (step > 1 && (qty - moq) % step !== 0) {
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
        incoterms: selectedIncoterms.value,
        quantity: effectiveOrderQty.value || 100,
        unit_price: activeUnitPrice.value,
        unit_cbm: props.product?.unit_cbm || 0.005,
        unit_weight_kg: props.product?.unit_weight_kg || 0.45,
      }),
    });
    landedCostData.value = res.cost_breakdown;
    landedCargoSpec.value = res.cargo_spec;
  } catch (err) {
    console.warn('Landed cost calculation error:', err);
  }
}

async function handleAddToCart() {
  addingCart.value = true;
  try {
    if (orderMode.value === 'MATRIX') {
      const activeVariants = productVariants.value.filter((v: any) => (variantQuantities.value[v.id] || 0) > 0);
      for (const v of activeVariants) {
        await apiRequest('/cart/items', {
          method: 'POST',
          body: JSON.stringify({
            listing_id: props.product.id,
            variant_id: v.id,
            quantity: variantQuantities.value[v.id],
          }),
        });
      }
      alert(`[다차원 SKU 일괄 장바구니 담기 완료]\n${activeVariants.length}개 규격(총 ${effectiveOrderQty.value}개)이 도매 카트에 담겼습니다.`);
    } else {
      await apiRequest('/cart/items', {
        method: 'POST',
        body: JSON.stringify({
          listing_id: props.product.id,
          quantity: orderQty.value,
        }),
      });
      alert(`'${props.product.title}' 품목이 도매 카트에 ${orderQty.value}${props.product.unit} 담겼습니다.`);
    }
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
      quantity: String(effectiveOrderQty.value),
      unit_price: activeUnitPrice.value,
      mode: orderMode.value,
      incoterms: selectedIncoterms.value,
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
.order-mode-tabs {
  display: flex;
  gap: 8px;
  background: #F8FAFC;
  padding: 4px;
  border-radius: 8px;
  border: 1px solid #E2E8F0;
}
.mode-tab-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  background: transparent;
  color: #64748B;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.mode-tab-btn.active {
  background: #C2410C;
  color: #FFFFFF;
  box-shadow: 0 2px 4px rgba(194, 65, 12, 0.2);
}
.sku-matrix-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.matrix-hint {
  font-size: 11px;
  color: #64748B;
  background: #FFF7ED;
  border: 1px solid #FFEDD5;
  padding: 8px 12px;
  border-radius: 6px;
}
.sku-matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.sku-matrix-table th {
  background: #F8FAFC;
  color: #475569;
  font-weight: 700;
  text-align: left;
  padding: 8px 10px;
  border-bottom: 2px solid #E2E8F0;
}
.sku-matrix-table th.th-qty {
  text-align: right;
}
.sku-row {
  border-bottom: 1px solid #F1F5F9;
}
.sku-row:hover {
  background: #FFFDF9;
}
.sku-row td {
  padding: 10px 10px;
  vertical-align: middle;
}
.td-spec {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sku-name {
  color: #0F172A;
  font-size: 12px;
}
.sku-code {
  font-family: monospace;
  font-size: 10px;
  color: #94A3B8;
}
.sku-price {
  font-weight: 700;
  color: #C2410C;
}
.sku-unit {
  font-size: 10px;
  color: #64748B;
}
.stock-pill {
  font-size: 11px;
  color: #15803D;
  background: #DCFCE7;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}
.td-qty {
  text-align: right;
}
.matrix-qty-wrap {
  display: inline-flex;
  align-items: center;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  overflow: hidden;
}
.m-step-btn {
  background: #F1F5F9;
  border: none;
  width: 28px;
  height: 28px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.m-step-btn:hover {
  background: #E2E8F0;
}
.m-qty-input {
  width: 60px;
  height: 28px;
  border: none;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: #0F172A;
}
.matrix-aggregate-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  font-size: 12px;
}
.agg-qty {
  color: #C2410C;
  font-size: 14px;
  margin-left: 6px;
}
.moq-ok {
  color: #15803D;
  font-weight: 700;
}
.moq-warn {
  color: #DC2626;
  font-weight: 700;
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
.cargo-specs-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  background: #FFF7ED;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #FFEDD5;
  font-size: 11px;
  color: #9A3412;
  margin-bottom: 8px;
  align-items: center;
}
.fcl-rec-pill {
  background: #DCFCE7;
  color: #15803D;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
}
</style>
