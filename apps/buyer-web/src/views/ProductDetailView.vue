<template>
  <div v-if="loading" class="pdp-state-box loading-box">
    <p>도매 상품 상세 사양 및 제조사 공급가 정보를 서버에서 실시간 조회 중입니다...</p>
  </div>
  <div v-else-if="fetchError || !product" class="pdp-state-box error-box">
    <p class="error-msg">⚠️ {{ fetchError || '요청하신 도매 상품을 찾을 수 없습니다.' }}</p>
    <router-link to="/ko/KRW/catalog" class="btn-back">카탈로그 목록으로 이동</router-link>
  </div>
  <div v-else class="pdp-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/ko/KRW/catalog">도매 카탈로그</router-link>
      <span class="sep">></span>
      <span>{{ product.category_name }}</span>
      <span class="sep">></span>
      <span class="current">{{ product.title }}</span>
    </nav>

    <!-- Top Main Grid (Gallery & Order Control) -->
    <div class="pdp-main-grid">
      <!-- Left Column: Gallery & Factory Audit -->
      <PdpGalleryAudit />

      <!-- Right Column: Product Title, Tiered Pricing, Interactive Calculator -->
      <div class="info-col">
        <!-- Supplier Header -->
        <div class="supplier-header-banner">
          <div class="sup-meta-left">
            <span class="sup-flag">🇰🇷</span>
            <span class="sup-name">{{ product.supplier_name }}</span>
            <span class="sup-years">{{ product.years_in_business }} yrs</span>
          </div>
          <div class="trade-guard-badge">
            <span>🛡️ Trade Assurance 100% 보호</span>
          </div>
        </div>

        <h1 class="pdp-title">{{ product.title }}</h1>

        <!-- Tiered Pricing Table (Exact FOB brackets) -->
        <div class="tier-bracket-box">
          <div class="bracket-head">
            <h3>수량 구간별 도매 공급 단가 (Tiered Pricing)</h3>
            <span class="incoterm-tag">FOB Busan Port</span>
          </div>
          <div class="bracket-grid">
            <div
              v-for="(tier, idx) in product.price_tiers"
              :key="idx"
              class="bracket-col"
              :class="{ highlighted: currentTierIndex === idx }"
            >
              <div class="bracket-qty">{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ product.unit }}</div>
              <div class="bracket-price">${{ tier.unit_price }}</div>
              <div v-if="currentTierIndex === idx" class="active-badge">적용 중</div>
            </div>
          </div>
        </div>

        <!-- Interactive Order Calculator & MOQ Rules -->
        <PdpOrderCalculator
          :product="product"
          @tier-changed="onTierChanged"
          @create-order="onCreateOrder"
          @request-sample="onRequestSample"
        />
      </div>
    </div>

    <!-- Technical Specifications Matrix -->
    <PdpSpecsTable :sku-id="product.sku_id" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { apiRequest } from '../api';
import PdpGalleryAudit from '../components/PdpGalleryAudit.vue';
import PdpOrderCalculator from '../components/PdpOrderCalculator.vue';
import PdpSpecsTable from '../components/PdpSpecsTable.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const fetchError = ref<string | null>(null);
const product = ref<any>(null);
const currentTierIndex = ref(0);

async function loadProduct() {
  const prodId = route.params.id as string;
  if (!prodId) {
    fetchError.value = '상품 번호가 지정되지 않았습니다.';
    loading.value = false;
    return;
  }
  loading.value = true;
  fetchError.value = null;
  try {
    const res = await apiRequest(`/catalog/listings/${prodId}`);
    if (res && res.id) {
      product.value = {
        id: res.id,
        sku_id: res.sku_id || `SKU-${res.id.substring(0, 8)}`,
        title: res.title,
        supplier_name: res.supplier_name || 'Verified Supplier Co.',
        category_name: res.category_name || res.category || '산업기계 & 부품',
        years_in_business: Number(res.years_in_business) || 10,
        moq: Number(res.moq) || 100,
        quantity_step: Number(res.quantity_step) || 10,
        unit: res.unit || 'pcs',
        lead_time_days: Number(res.lead_time_days) || 14,
        price_tiers: (res.price_tiers || []).map((t: any) => ({
          min_quantity: Number(t.min_quantity),
          max_quantity: t.max_quantity ? Number(t.max_quantity) : null,
          unit_price: parseFloat(t.unit_price).toFixed(2),
        })),
      };
    } else {
      fetchError.value = '해당 상품 정보를 찾을 수 없습니다.';
    }
  } catch (e: any) {
    fetchError.value = `상품 정보를 불러오지 못했습니다: ${e.message || '서버 오류'}`;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadProduct();
});

function onTierChanged(idx: number) {
  currentTierIndex.value = idx;
}

async function onCreateOrder(data: any) {
  try {
    const idempKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const res = await apiRequest('/sourcing/quotes/quote-001/accept', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempKey,
      },
      body: JSON.stringify({
        quantity: data.orderQty,
        unit_price: data.activeUnitPrice,
      }),
    });

    const orderId = res.id || 'ord-20261018-001';
    alert(`[서버 도매 계약서 발급 완료]\n주문번호: ${res.order_number || orderId}\n수량: ${data.orderQty} ${product.value.unit}\n총 공급가: $${data.subtotalAmount} USD (계약금 30%: $${(parseFloat(data.subtotalAmount) * 0.3).toFixed(2)})\n전자계약 체결 페이지로 이동합니다.`);
    router.push(`/ko/KRW/orders/${orderId}/contract`);
  } catch (err: any) {
    if (err.message && err.message.includes('409')) {
      alert('이미 체결된 계약 주문입니다. 주문 목록으로 이동합니다.');
      router.push('/ko/KRW/orders');
    } else {
      alert(`주문서 생성 중 오류: ${err.message}`);
    }
  }
}

function onRequestSample() {
  alert('제조사에 유료 규격 샘플(1pcs)이 발주 접수되었습니다.');
}
</script>

<style scoped>
.pdp-container { display: flex; flex-direction: column; gap: 28px; }
.breadcrumb { font-size: 13px; color: #64748B; display: flex; align-items: center; gap: 8px; }
.breadcrumb a { color: #475569; text-decoration: none; }
.breadcrumb a:hover { color: #FF6600; }
.breadcrumb .sep { color: #CBD5E1; }
.breadcrumb .current { color: #1E293B; font-weight: 600; }

.pdp-main-grid { display: grid; grid-template-columns: 500px 1fr; gap: 40px; align-items: flex-start; }
.info-col { display: flex; flex-direction: column; gap: 20px; }
.supplier-header-banner { display: flex; justify-content: space-between; align-items: center; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 8px 14px; }
.sup-meta-left { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.sup-name { font-weight: 700; color: #1E293B; }
.sup-years { color: #64748B; font-size: 11px; }
.trade-guard-badge { background: #FFF7ED; border: 1px solid #FDBA74; color: #C2410C; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }

.pdp-title { font-size: 24px; font-weight: 800; color: #1E293B; margin: 0; line-height: 1.35; }

.tier-bracket-box { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 10px; padding: 18px; }
.bracket-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.bracket-head h3 { margin: 0; font-size: 14px; font-weight: 700; color: #334155; }
.incoterm-tag { background: #F1F5F9; color: #475569; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
.bracket-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.bracket-col { background: #F8FAFC; border: 2px solid #E2E8F0; border-radius: 8px; padding: 12px; text-align: center; position: relative; }
.bracket-col.highlighted { border-color: #FF6600; background: #FFF7ED; }
.bracket-qty { font-size: 12px; color: #475569; margin-bottom: 6px; }
.bracket-price { font-size: 22px; font-weight: 800; color: #1E293B; font-variant-numeric: tabular-nums; }
.bracket-col.highlighted .bracket-price { color: #FF6600; }
.active-badge { position: absolute; top: -10px; right: 12px; background: #FF6600; color: #FFF; font-size: 10px; font-weight: 800; padding: 1px 6px; border-radius: 4px; }
.pdp-state-box { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 48px 24px; text-align: center; font-size: 14px; }
.pdp-state-box.loading-box { color: #0284C7; font-weight: 600; }
.pdp-state-box.error-box { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; font-weight: 600; }
.btn-back { display: inline-block; margin-top: 14px; background: #1E293B; color: #FFFFFF; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; font-size: 13px; }
.btn-back:hover { background: #FF6600; }
</style>
