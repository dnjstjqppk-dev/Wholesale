<template>
  <div v-if="loading" class="pdp-state-box loading-box">
    <p>도매 상품 상세 사양 및 제조사 공급가 정보를 서버에서 실시간 조회 중입니다...</p>
  </div>
  <div v-else-if="fetchError || !product" class="pdp-state-box error-box">
    <p class="error-msg">⚠️ {{ fetchError || '요청하신 도매 상품을 찾을 수 없습니다.' }}</p>
    <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="btn-back">카탈로그 목록으로 이동</router-link>
  </div>
  <div v-else class="pdp-container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link :to="`/${currentLocale}/${currentCurrency}/`">홈</router-link>
      <span class="sep">></span>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`">도매 카탈로그</router-link>
      <span class="sep">></span>
      <span>{{ product.category_name }}</span>
      <span class="sep">></span>
      <span class="current">{{ product.title }}</span>
    </nav>

    <!-- Top Main Grid (Gallery & Order Control) -->
    <div class="pdp-main-grid">
      <!-- Left Column: Real Image Gallery & Factory Audit -->
      <PdpGalleryAudit
        :product="product"
        :locale="currentLocale"
        :currency="currentCurrency"
      />

      <!-- Right Column: Product Title, Tiered Pricing, Interactive Calculator -->
      <div class="info-col">
        <!-- Supplier Header -->
        <div class="supplier-header-banner">
          <div class="sup-meta-left">
            <span class="sup-flag">🇰🇷</span>
            <router-link
              :to="`/${currentLocale}/${currentCurrency}/suppliers/${product.organization_id || '11111111-1111-1111-1111-111111111111'}`"
              class="sup-name"
            >
              {{ product.supplier_name }}
            </router-link>
            <span class="sup-years">{{ product.years_in_business || 12 }} yrs</span>
            <span v-if="product.verified_supplier" class="v-badge">✓ Verified</span>
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
            <span class="incoterm-tag">{{ product.incoterms || 'FOB Busan Port' }}</span>
          </div>
          <div class="bracket-grid">
            <div
              v-for="(tier, idx) in product.price_tiers"
              :key="idx"
              class="bracket-col"
              :class="{ highlighted: currentTierIndex === idx }"
            >
              <div class="bracket-qty">{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ product.unit }}</div>
              <div class="bracket-price">{{ formatMoney(tier.unit_price) }}</div>
              <div v-if="currentTierIndex === idx" class="active-badge">적용 중</div>
            </div>
          </div>
        </div>

        <!-- Interactive Order Calculator & MOQ Rules -->
        <PdpOrderCalculator
          :product="product"
          :locale="currentLocale"
          :currency="currentCurrency"
          @tier-changed="onTierChanged"
          @open-inquiry="showInquiryModal = true"
        />
      </div>
    </div>

    <!-- Technical Specifications Matrix -->
    <PdpSpecsTable
      :sku-id="product.sku_id"
      :specifications="product.specifications"
    />

    <!-- Inquiry Modal -->
    <CatalogInquiryModal
      v-if="showInquiryModal"
      :item="product"
      @close="showInquiryModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import PdpGalleryAudit from '../components/PdpGalleryAudit.vue';
import PdpOrderCalculator from '../components/PdpOrderCalculator.vue';
import PdpSpecsTable from '../components/PdpSpecsTable.vue';
import CatalogInquiryModal from '../components/CatalogInquiryModal.vue';

const route = useRoute();
const loading = ref(true);
const fetchError = ref<string | null>(null);
const product = ref<any>(null);
const currentTierIndex = ref(0);
const showInquiryModal = ref(false);

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
      product.value = res;
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
</script>

<style scoped>
.pdp-container {
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 16px 40px;
}
.breadcrumb {
  font-size: 13px;
  color: #64748B;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}
.breadcrumb a {
  color: #475569;
  text-decoration: none;
}
.breadcrumb a:hover {
  color: #EA580C;
}
.breadcrumb .sep {
  color: #CBD5E1;
}
.breadcrumb .current {
  color: #1E293B;
  font-weight: 600;
}

.pdp-main-grid {
  display: grid;
  grid-template-columns: 500px 1fr;
  gap: 36px;
  align-items: flex-start;
}
.info-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.supplier-header-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 8px 14px;
}
.sup-meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.sup-name {
  font-weight: 700;
  color: #1E293B;
  text-decoration: none;
}
.sup-name:hover {
  color: #EA580C;
}
.sup-years {
  color: #64748B;
  font-size: 11px;
}
.v-badge {
  background: #DCFCE7;
  color: #15803D;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
}
.trade-guard-badge {
  background: #FFF7ED;
  border: 1px solid #FDBA74;
  color: #C2410C;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.pdp-title {
  font-size: 22px;
  font-weight: 800;
  color: #0F172A;
  margin: 0;
  line-height: 1.4;
}

.tier-bracket-box {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 10px;
  padding: 18px;
}
.bracket-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}
.bracket-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}
.incoterm-tag {
  background: #F1F5F9;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}
.bracket-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.bracket-col {
  background: #F8FAFC;
  border: 2px solid #E2E8F0;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  position: relative;
}
.bracket-col.highlighted {
  border-color: #EA580C;
  background: #FFF7ED;
}
.bracket-qty {
  font-size: 12px;
  color: #475569;
  margin-bottom: 6px;
}
.bracket-price {
  font-size: 20px;
  font-weight: 800;
  color: #1E293B;
  font-variant-numeric: tabular-nums;
}
.bracket-col.highlighted .bracket-price {
  color: #EA580C;
}
.active-badge {
  position: absolute;
  top: -10px;
  right: 12px;
  background: #EA580C;
  color: #FFF;
  font-size: 10px;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 4px;
}
.pdp-state-box {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 48px 24px;
  text-align: center;
  font-size: 14px;
}
.pdp-state-box.loading-box {
  color: #0284C7;
  font-weight: 600;
}
.pdp-state-box.error-box {
  background: #FEF2F2;
  border-color: #FCA5A5;
  color: #DC2626;
  font-weight: 600;
}
.btn-back {
  display: inline-block;
  margin-top: 14px;
  background: #1E293B;
  color: #FFFFFF;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 13px;
}
.btn-back:hover {
  background: #EA580C;
}
</style>
