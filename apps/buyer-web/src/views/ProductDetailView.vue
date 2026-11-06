<template>
  <div class="ws-page ws-page-wide">
    <div v-if="loading" class="ws-stack">
      <div class="ws-skeleton" style="height: 22px; width: 40%"></div>
      <div class="pdp-loading-grid">
        <div class="ws-skeleton" style="height: 420px"></div>
        <div class="ws-skeleton" style="height: 420px"></div>
      </div>
    </div>
    <div v-else-if="fetchError || !product" class="ws-empty">
      <span class="ws-empty-icon"><WsIcon name="alert" :size="24" /></span>
      <h3>{{ fetchError || '요청하신 도매 상품을 찾을 수 없습니다.' }}</h3>
      <p>상품 번호를 확인하시거나 카탈로그에서 다시 검색해 보세요.</p>
      <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="ws-btn ws-btn-secondary">카탈로그 목록으로 이동</router-link>
    </div>
    <div v-else class="pdp">
      <nav class="crumbs" aria-label="breadcrumb">
        <router-link :to="`/${currentLocale}/${currentCurrency}/`">홈</router-link>
        <span aria-hidden="true">›</span>
        <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`">도매 카탈로그</router-link>
        <span aria-hidden="true">›</span>
        <span>{{ product.category_name }}</span>
        <span aria-hidden="true">›</span>
        <b>{{ product.title }}</b>
      </nav>

      <div class="pdp-grid">
        <PdpGalleryAudit
          :product="product"
          :locale="currentLocale"
          :currency="currentCurrency"
        />

        <div class="pdp-info">
          <div class="sup-strip">
            <router-link
              :to="`/${currentLocale}/${currentCurrency}/suppliers/${product.organization_id || '11111111-1111-1111-1111-111111111111'}`"
              class="sup-link"
            >
              <span class="ws-avatar ws-avatar-sm ws-avatar-brand">{{ (product.supplier_name || 'V').slice(0, 1) }}</span>
              <b>{{ product.supplier_name }}</b>
            </router-link>
            <span class="ws-muted ws-small">{{ product.years_in_business || 12 }} yrs</span>
            <span v-if="product.verified_supplier" class="ws-badge ws-badge-success">Verified</span>
            <span class="ws-badge ws-badge-navy ta-strip"><WsIcon name="shield" :size="12" /> Trade Assurance</span>
          </div>

          <h1 class="pdp-title">{{ product.title }}</h1>

          <div class="ws-card ws-card-pad-sm tier-card">
            <div class="ws-split tier-head">
              <b>수량 구간별 도매 공급 단가</b>
              <span class="ws-badge ws-badge-outline">{{ product.incoterms || 'FOB Busan Port' }}</span>
            </div>
            <table class="ws-tier-table">
              <thead>
                <tr><th>수량 구간</th><th style="text-align: right">단가 / {{ product.unit }}</th><th></th></tr>
              </thead>
              <tbody>
                <tr
                  v-for="(tier, idx) in product.price_tiers"
                  :key="idx"
                  :class="{ 'ws-tier-best': currentTierIndex === idx }"
                >
                  <td>{{ tier.min_quantity }} ~ {{ tier.max_quantity || '+' }} {{ product.unit }}</td>
                  <td style="text-align: right">{{ formatMoney(tier.unit_price) }}</td>
                  <td style="text-align: right"><span v-if="currentTierIndex === idx" class="ws-badge ws-badge-brand">적용 중</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <PdpOrderCalculator
            :product="product"
            :locale="currentLocale"
            :currency="currentCurrency"
            @tier-changed="onTierChanged"
            @open-inquiry="showInquiryModal = true"
          />
        </div>
      </div>

      <PdpSpecsTable
        :sku-id="product.sku_id"
        :specifications="product.specifications"
      />

      <CatalogInquiryModal
        v-if="showInquiryModal"
        :item="product"
        @close="showInquiryModal = false"
      />
    </div>
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
import WsIcon from '@packages/ui/WsIcon.vue';

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
.pdp-loading-grid { display: grid; grid-template-columns: 480px minmax(0, 1fr); gap: 28px; }
.crumbs { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 13px; color: var(--ws-text-muted); margin-bottom: 18px; }
.crumbs a { color: var(--ws-text-2); text-decoration: none; font-weight: 600; }
.crumbs a:hover { color: var(--ws-brand); }
.crumbs b { color: var(--ws-text); font-weight: 700; }
.pdp-grid { display: grid; grid-template-columns: 480px minmax(0, 1fr); gap: 28px; align-items: start; margin-bottom: 28px; }
.pdp-info { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.sup-strip { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 10px 14px; }
.sup-link { display: inline-flex; align-items: center; gap: 9px; text-decoration: none; color: var(--ws-text); font-size: 14px; }
.sup-link:hover b { color: var(--ws-brand); }
.ta-strip { margin-left: auto; }
.pdp-title { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: var(--ws-tracking-tight); line-height: 1.4; }
.tier-head { margin-bottom: 10px; font-size: 14px; }
@media (max-width: 1024px) {
  .pdp-grid, .pdp-loading-grid { grid-template-columns: minmax(0, 1fr); }
  .ta-strip { margin-left: 0; }
}
</style>
