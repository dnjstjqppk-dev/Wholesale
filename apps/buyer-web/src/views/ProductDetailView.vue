<template>
  <div class="pdp-container">
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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import PdpGalleryAudit from '../components/PdpGalleryAudit.vue';
import PdpOrderCalculator from '../components/PdpOrderCalculator.vue';
import PdpSpecsTable from '../components/PdpSpecsTable.vue';

const router = useRouter();

const product = ref({
  id: '33333333-3333-3333-3333-333333333333',
  sku_id: 'SKU-SUS304-VAC-500ML',
  title: '산업용 초경량 스테인리스 진공 텀블러 벌크팩 (SUS304 이중 진공 500ml)',
  category_name: '산업기계 & 부품 > 산업용 용기',
  supplier_name: 'Precision Korea Co., Ltd. (글로벌정밀산업)',
  years_in_business: 12,
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

const currentTierIndex = ref(0);

function onTierChanged(idx: number) {
  currentTierIndex.value = idx;
}

function onCreateOrder(data: any) {
  alert(`도매 계약 주문서가 발급되었습니다: ${data.orderQty} ${product.value.unit} (총 공급가: $${data.subtotalAmount} USD)`);
  router.push('/ko/KRW/orders');
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
</style>
