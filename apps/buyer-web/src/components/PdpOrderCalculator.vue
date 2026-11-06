<template>
  <div class="ws-card calc">
    <div class="ws-tabs mode-tabs">
      <button type="button" class="ws-tab" :class="{ 'ws-tab-active': orderMode === 'MATRIX' }" @click="orderMode = 'MATRIX'">
        <WsIcon name="trend" :size="14" /> Multi-SKU 일괄 발주
      </button>
      <button type="button" class="ws-tab" :class="{ 'ws-tab-active': orderMode === 'SINGLE' }" @click="orderMode = 'SINGLE'">
        <WsIcon name="bolt" :size="14" /> 단일 규격 빠른 주문
      </button>
    </div>

    <div v-if="orderMode === 'MATRIX'">
      <p class="ws-hint matrix-hint">여러 규격 수량을 한 번에 입력하면 <b>합산 기준 도매 우대 구간 단가</b>가 일괄 적용됩니다.</p>
      <div class="ws-table-wrap">
        <div class="ws-table-scroll">
          <table class="ws-table">
            <thead>
              <tr><th>규격 / Variant</th><th class="ws-num">구간 단가</th><th class="ws-num">가용 재고</th><th class="ws-num">발주 수량</th></tr>
            </thead>
            <tbody>
              <tr v-for="v in productVariants" :key="v.id">
                <td><span class="ws-cell-main">{{ v.name }}</span><br /><span class="ws-cell-sub">SKU: {{ v.sku }}</span></td>
                <td class="ws-num"><b class="ws-price ws-figure">{{ formatMoney(activeUnitPrice) }}</b> <span class="ws-cell-sub">/ {{ product?.unit || 'pcs' }}</span></td>
                <td class="ws-num"><span class="ws-badge ws-badge-outline ws-figure">{{ (v.stock || 5000).toLocaleString() }}개</span></td>
                <td class="ws-num">
                  <span class="stepper">
                    <button type="button" aria-label="감소" @click="decrementVariantQty(v.id)">−</button>
                    <input type="number" min="0" :step="product?.quantity_step || 10" :value="variantQuantities[v.id] || 0" @input="onInputVariantQty(v.id, ($event.target as HTMLInputElement).value)" />
                    <button type="button" aria-label="증가" @click="incrementVariantQty(v.id)">+</button>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="agg-bar">
        <span class="ws-small">합산 총 발주 수량 <b class="ws-figure">{{ effectiveOrderQty }} {{ product?.unit || 'pcs' }}</b></span>
        <span v-if="effectiveOrderQty >= (Number(product?.moq) || 100)" class="ws-badge ws-badge-success">MOQ 충족</span>
        <span v-else class="ws-badge ws-badge-warning"><WsIcon name="alert" :size="12" /> {{ (Number(product?.moq) || 100) - effectiveOrderQty }}개 부족</span>
      </div>
    </div>

    <div v-else class="single-row">
      <div class="ws-field" style="margin-bottom: 0">
        <label>발주 수량 ({{ product?.unit || 'pcs' }})</label>
        <span class="stepper stepper-lg">
          <button type="button" aria-label="감소" @click="decrementQty">−</button>
          <input :value="orderQty" type="number" :min="product?.moq || 100" :step="product?.quantity_step || 10" @input="onInputQty(($event.target as HTMLInputElement).value)" />
          <button type="button" aria-label="증가" @click="incrementQty">+</button>
        </span>
      </div>
      <p class="ws-hint">MOQ <b>{{ product?.moq }}{{ product?.unit }}</b> · {{ product?.quantity_step || 10 }}{{ product?.unit }} 배수 단위</p>
    </div>

    <p v-if="quantityError" class="ws-error-text">{{ quantityError }}</p>

    <dl class="sum-rows">
      <div><dt>적용 구간 단가</dt><dd class="ws-figure">{{ formatMoney(activeUnitPrice) }} / {{ product?.unit }}</dd></div>
      <div><dt>예상 납기</dt><dd>{{ estimatedLeadTimeDays }}일 (선적항 출고 기준)</dd></div>
      <div><dt>선급금 에스크로 (30%)</dt><dd class="ws-price ws-figure">{{ formatMoney(downPaymentAmount) }}</dd></div>
      <div class="total"><dt>총 발주 공급가액</dt><dd class="ws-figure">{{ formatMoney(subtotalAmount) }}</dd></div>
    </dl>

    <div class="landed">
      <button type="button" class="landed-head" @click="showLandedCost = !showLandedCost">
        <span><WsIcon name="truck" :size="15" class="landed-ico" /> <b>총 도입원가(Landed Cost) 산출기</b></span>
        <span class="ws-small ws-muted">{{ showLandedCost ? '▲ 닫기' : '▼ 계산하기' }}</span>
      </button>
      <div v-if="showLandedCost" class="landed-body">
        <div class="ws-grid-3">
          <div class="ws-field">
            <label>인도조건</label>
            <select v-model="selectedIncoterms" @change="calculateLandedCost">
              <option value="FOB">FOB (부산항)</option>
              <option value="CIF">CIF (도착항)</option>
              <option value="DDP">DDP (문앞배송)</option>
              <option value="EXW">EXW (공장인도)</option>
              <option value="CFR">CFR (도착항)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>도착국가</label>
            <select v-model="shippingDestination" @change="calculateLandedCost">
              <option value="US">미국 (US)</option>
              <option value="KR">대한민국 (KR)</option>
              <option value="JP">일본 (JP)</option>
              <option value="DE">독일 (DE)</option>
            </select>
          </div>
          <div class="ws-field">
            <label>운송 방식</label>
            <select v-model="shippingMethod" @change="calculateLandedCost">
              <option value="SEA_FCL">해상 FCL</option>
              <option value="SEA_LCL">해상 LCL</option>
              <option value="AIR">항공 화물</option>
              <option value="EXPRESS">특송 (Express)</option>
            </select>
          </div>
        </div>
        <div v-if="landedCostData" class="landed-res">
          <p class="ws-small cargo-line">
            <WsIcon name="package" :size="13" /> {{ landedCargoSpec?.total_cbm || '0.50' }} CBM ·
            <WsIcon name="alert" :size="13" /> {{ landedCargoSpec?.gross_weight_kg || '45.0' }} kg
            <span v-if="landedCargoSpec?.is_fcl_recommended" class="ws-badge ws-badge-brand">FCL 추천</span>
          </p>
          <dl class="sum-rows">
            <div><dt>추정 운임 ({{ selectedIncoterms }})</dt><dd class="ws-figure">{{ formatMoney(landedCostData.freight_estimate) }}</dd></div>
            <div v-if="Number(landedCostData.origin_inland_freight) > 0"><dt>공장-선적항 내륙운임</dt><dd class="ws-figure">{{ formatMoney(landedCostData.origin_inland_freight) }}</dd></div>
            <div><dt>적하보험료 (0.3%)</dt><dd class="ws-figure">{{ formatMoney(landedCostData.marine_insurance) }}</dd></div>
            <div><dt>예상 수입관세 ({{ landedCostData.duty_rate }})</dt><dd class="ws-figure">{{ formatMoney(landedCostData.customs_duty) }}</dd></div>
            <div v-if="Number(landedCostData.import_vat) > 0"><dt>수입 부가세 ({{ landedCostData.vat_rate }})</dt><dd class="ws-figure">{{ formatMoney(landedCostData.import_vat) }}</dd></div>
            <div class="total"><dt>개당 착하원가</dt><dd class="ws-price ws-figure">{{ formatMoney(landedCostData.unit_landed_cost) }} / {{ product?.unit }}</dd></div>
          </dl>
        </div>
      </div>
    </div>

    <div class="cta-stack">
      <button class="ws-btn ws-btn-navy ws-btn-block" :disabled="!!quantityError || addingCart" @click="handleAddToCart">
        <WsIcon name="cart" :size="15" /> {{ addingCart ? '담는 중...' : (orderMode === 'MATRIX' ? '선택 규격 일괄 장바구니 담기' : '도매 장바구니 담기') }}
      </button>
      <button class="ws-btn ws-btn-primary ws-btn-block ws-btn-lg" :disabled="!!quantityError" @click="handleInstantOrder">
        <WsIcon name="pencil" :size="15" /> {{ orderMode === 'MATRIX' ? '선택 규격 일괄 발주서 작성' : '즉시 도매 발주서 생성' }}
      </button>
    </div>
    <div class="cta-duo">
      <button class="ws-btn ws-btn-secondary ws-btn-block ws-btn-sm" :disabled="requestingSample" @click="handleSampleOrder">
        <WsIcon name="package" :size="14" /> {{ requestingSample ? '주문 처리 중...' : `유료 샘플 신청 (${formatMoney(product?.sample_price || 25)})` }}
      </button>
      <button class="ws-btn ws-btn-secondary ws-btn-block ws-btn-sm" @click="$emit('open-inquiry')">
        <WsIcon name="chat" :size="14" /> 공급사 1:1 견적 문의
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

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
.mode-tabs { margin-bottom: 14px; }
.matrix-hint { margin: 0 0 10px; }
.agg-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
.single-row { display: flex; flex-direction: column; gap: 8px; }
.stepper { display: inline-flex; border: 1px solid var(--ws-border); border-radius: 8px; overflow: hidden; vertical-align: middle; }
.stepper button { width: 32px; height: 34px; border: 0; background: var(--ws-surface-muted); font-size: 15px; font-weight: 800; cursor: pointer; color: var(--ws-text-2); }
.stepper button:hover { background: var(--ws-surface-hover); }
.stepper input { width: 72px; border: 0; border-left: 1px solid var(--ws-border-subtle); border-right: 1px solid var(--ws-border-subtle); text-align: center; font-size: 14px; font-weight: 800; font-family: var(--ws-font); padding: 6px 4px; }
.stepper input:focus { outline: none; background: var(--ws-brand-faint); }
.stepper-lg input { width: 110px; font-size: 16px; }
.stepper-lg button { width: 40px; height: 40px; }
.sum-rows { margin: 14px 0 0; }
.sum-rows div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--ws-border-subtle); font-size: 13px; }
.sum-rows div:last-child { border-bottom: 0; }
.sum-rows dt { color: var(--ws-text-2); }
.sum-rows dd { margin: 0; font-weight: 800; }
.sum-rows .total dd { font-size: 18px; }
.landed { border: 1px solid var(--ws-border-subtle); border-radius: 10px; margin-top: 14px; }
.landed-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: var(--ws-surface-muted); border: 0; border-radius: 10px; padding: 12px 14px; cursor: pointer; font-family: var(--ws-font); font-size: 13px; color: var(--ws-text); }
.landed-ico { color: var(--ws-navy); vertical-align: -2px; }
.landed-body { padding: 14px; }
.landed-body .ws-field { margin-bottom: 10px; }
.cargo-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin: 4px 0 6px; }
.cta-stack { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
.cta-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px; }
@media (max-width: 640px) {
  .cta-duo { grid-template-columns: minmax(0, 1fr); }
}
</style>
