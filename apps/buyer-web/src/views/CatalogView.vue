<template>
  <div class="ws-page ws-page-wide">
    <!-- Assurance strip -->
    <section class="assure-strip">
      <div class="assure-text">
        <p class="ws-hero-eyebrow"><WsIcon name="shield" :size="14" /> Trade Assurance 무역보증</p>
        <h1>주문 결제부터 납기·통관까지 100% 안전 보호</h1>
        <p>에스크로 안전 결제 · 생산 지연 보상 · 규격 불일치 100% 환불 · SGS/TÜV 공인 실사 검수</p>
      </div>
      <div class="assure-card">
        <b><WsIcon name="bolt" :size="15" class="b-ico" /> 원클릭 RFQ 빠른 견적</b>
        <p>1분 만에 견적을 요청하고 복수 공급사 견적을 비교하세요</p>
        <input v-model="quickRfqItem" type="text" placeholder="조달 희망 품목 (예: CNC 알루미늄 가공품)" />
        <div class="assure-row">
          <input v-model.number="quickRfqQty" type="number" placeholder="필요 수량" />
          <select v-model="quickRfqUnit">
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="sets">sets</option>
          </select>
        </div>
        <button class="ws-btn ws-btn-primary ws-btn-block" @click="submitQuickRfq">견적 요청 제출</button>
      </div>
    </section>

    <!-- Active keyword -->
    <div v-if="keywordFilter" class="ws-banner ws-banner-info keyword-bar">
      <WsIcon name="search" :size="15" />
      <span>검색 키워드: <b>"{{ keywordFilter }}"</b></span>
      <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="clearKeyword"><WsIcon name="x" :size="13" /> 검색어 해제</button>
    </div>

    <div class="ws-layout-side catalog-layout">
      <CatalogFilterSidebar
        v-model:filterVerified="filterVerified"
        v-model:filterTradeAssurance="filterTradeAssurance"
        v-model:filterCustomization="filterCustomization"
        v-model:selectedMoqPreset="selectedMoqPreset"
        v-model:selectedCategory="selectedCategory"
        v-model:selectedIncoterm="selectedIncoterm"
        v-model:selectedMaterial="selectedMaterial"
        v-model:selectedCertification="selectedCertification"
        v-model:selectedLeadTime="selectedLeadTime"
        :facets="serverFacets"
        @reset="resetFilters"
      />

      <section class="results">
        <div v-if="hasActiveFilters" class="chips-bar">
          <span class="chips-label">적용된 조건</span>
          <button v-if="filterVerified" class="chip-x" @click="filterVerified = false">인증 공장 <WsIcon name="x" :size="12" /></button>
          <button v-if="filterTradeAssurance" class="chip-x" @click="filterTradeAssurance = false">무역보증 <WsIcon name="x" :size="12" /></button>
          <button v-if="filterCustomization" class="chip-x" @click="filterCustomization = false">맞춤제작 <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedCategory !== 'ALL'" class="chip-x" @click="selectedCategory = 'ALL'">카테고리: {{ selectedCategory }} <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedMaterial !== 'ALL'" class="chip-x" @click="selectedMaterial = 'ALL'">재질: {{ selectedMaterial }} <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedCertification !== 'ALL'" class="chip-x" @click="selectedCertification = 'ALL'">인증: {{ selectedCertification }} <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedLeadTime !== 'ALL'" class="chip-x" @click="selectedLeadTime = 'ALL'">출고 ≤ {{ selectedLeadTime }}일 <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedMoqPreset !== 'all'" class="chip-x" @click="selectedMoqPreset = 'all'">MOQ ≤ {{ selectedMoqPreset }} <WsIcon name="x" :size="12" /></button>
          <button v-if="selectedIncoterm !== 'ALL'" class="chip-x" @click="selectedIncoterm = 'ALL'">인도조건: {{ selectedIncoterm }} <WsIcon name="x" :size="12" /></button>
          <button class="ws-btn ws-btn-ghost ws-btn-sm" @click="resetFilters">전체 초기화</button>
        </div>

        <div class="ws-split results-head">
          <div>
            <h2 class="ws-section-title">도매 상품 목록 <span class="ws-muted">({{ filteredListings.length }}건)</span></h2>
            <p class="results-hint">발주 수량에 따라 수량 구간별 도매 단가(Tiered Pricing)가 즉시 적용됩니다.</p>
          </div>
          <label class="sort-box">
            <span>정렬</span>
            <select v-model="sortOrder" class="ws-input">
              <option value="recommended">추천순 (인증공장 우선)</option>
              <option value="moq_asc">MOQ 낮은순</option>
              <option value="price_asc">단가 낮은순</option>
              <option value="lead_asc">단납기 출고순</option>
            </select>
          </label>
        </div>

        <div v-if="loading" class="ws-stack">
          <div class="ws-skeleton" style="height: 120px"></div>
          <div class="ws-skeleton" style="height: 120px"></div>
          <div class="ws-skeleton" style="height: 120px"></div>
        </div>
        <div v-else-if="fetchError" class="ws-banner ws-banner-danger">
          <WsIcon name="alert" :size="16" />
          <div><b>{{ fetchError }}</b><br /><button class="ws-btn ws-btn-secondary ws-btn-sm" style="margin-top: 8px" @click="fetchListings">다시 시도</button></div>
        </div>
        <div v-else-if="filteredListings.length === 0" class="ws-empty">
          <span class="ws-empty-icon"><WsIcon name="search" :size="24" /></span>
          <h3>조건에 맞는 상품이 없습니다</h3>
          <p>필터 조건을 조정하거나 초기화해 보세요.</p>
          <button class="ws-btn ws-btn-secondary" @click="resetFilters">필터 초기화</button>
        </div>
        <div v-else class="results-grid">
          <CatalogProductCard
            v-for="item in filteredListings"
            :key="item.id"
            :item="item"
            :locale="(route.params.locale as string) || 'ko'"
            :currency="(route.params.currency as string) || 'KRW'"
            @inquiry="openInquiryModal"
          />
        </div>
      </section>
    </div>

    <CatalogInquiryModal
      :item="activeInquiryItem"
      @close="activeInquiryItem = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CatalogFilterSidebar from '../components/CatalogFilterSidebar.vue';
import CatalogProductCard from '../components/CatalogProductCard.vue';
import CatalogInquiryModal from '../components/CatalogInquiryModal.vue';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const route = useRoute();
const router = useRouter();

const keywordFilter = ref('');
const filterVerified = ref(false);
const filterTradeAssurance = ref(false);
const filterCustomization = ref(false);
const selectedMoqPreset = ref('all');
const selectedCategory = ref('ALL');
const selectedIncoterm = ref('ALL');
const selectedMaterial = ref('ALL');
const selectedCertification = ref('ALL');
const selectedLeadTime = ref('ALL');
const sortOrder = ref('recommended');
const serverFacets = ref<any>({});

const hasActiveFilters = computed(() => {
  return (
    filterVerified.value ||
    filterTradeAssurance.value ||
    filterCustomization.value ||
    selectedCategory.value !== 'ALL' ||
    selectedIncoterm.value !== 'ALL' ||
    selectedMaterial.value !== 'ALL' ||
    selectedCertification.value !== 'ALL' ||
    selectedLeadTime.value !== 'ALL' ||
    selectedMoqPreset.value !== 'all'
  );
});

const quickRfqItem = ref('');
const quickRfqQty = ref(1000);
const quickRfqUnit = ref('pcs');

const activeInquiryItem = ref<any>(null);
const listings = ref<any[]>([]);
const loading = ref(true);
const fetchError = ref<string | null>(null);

const filteredListings = computed(() => {
  const list = listings.value.filter(item => {
    if (keywordFilter.value) {
      const q = keywordFilter.value.toLowerCase();
      const matchText = `${item.title} ${item.supplier_name} ${item.category_name} ${item.sub_category || ''} ${JSON.stringify(item.specifications || [])}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    if (filterVerified.value && !item.verified_supplier && !item.is_verified_supplier) return false;
    if (filterTradeAssurance.value && !item.trade_assurance) return false;
    if (filterCustomization.value && !item.customization) return false;
    if (selectedCategory.value !== 'ALL' && item.category !== selectedCategory.value) return false;
    if (selectedIncoterm.value !== 'ALL' && !String(item.incoterm || item.incoterms).includes(selectedIncoterm.value)) return false;
    if (selectedMoqPreset.value === '100' && item.moq > 100) return false;
    if (selectedMoqPreset.value === '500' && item.moq > 500) return false;
    if (selectedMoqPreset.value === '1000' && item.moq < 1000) return false;

    // Material spec filter
    if (selectedMaterial.value !== 'ALL') {
      const mat = selectedMaterial.value.toLowerCase().split(' ')[0];
      const specText = JSON.stringify(item.specifications || []).toLowerCase() + item.title.toLowerCase();
      if (!specText.includes(mat)) return false;
    }

    // Certification filter
    if (selectedCertification.value !== 'ALL') {
      const cert = selectedCertification.value.toLowerCase();
      const specText = JSON.stringify(item.specifications || []).toLowerCase();
      if (!specText.includes(cert)) return false;
    }

    // Lead time filter
    if (selectedLeadTime.value !== 'ALL') {
      const maxDays = Number(selectedLeadTime.value);
      if ((Number(item.lead_time_days) || 14) > maxDays) return false;
    }

    return true;
  });

  return [...list].sort((a, b) => {
    if (sortOrder.value === 'moq_asc') return (Number(a.moq) || 0) - (Number(b.moq) || 0);
    if (sortOrder.value === 'price_asc') {
      const pa = parseFloat(a.price_tiers?.[0]?.unit_price || '0');
      const pb = parseFloat(b.price_tiers?.[0]?.unit_price || '0');
      return pa - pb;
    }
    if (sortOrder.value === 'lead_asc') return (Number(a.lead_time_days) || 14) - (Number(b.lead_time_days) || 14);
    return (b.verified_supplier ? 1 : 0) - (a.verified_supplier ? 1 : 0);
  });
});

function clearKeyword() {
  keywordFilter.value = '';
  const loc = (route.params.locale as string) || 'ko';
  const cur = (route.params.currency as string) || 'KRW';
  router.replace(`/${loc}/${cur}/catalog`);
}

function resetFilters() {
  keywordFilter.value = '';
  filterVerified.value = false;
  filterTradeAssurance.value = false;
  filterCustomization.value = false;
  selectedMoqPreset.value = 'all';
  selectedCategory.value = 'ALL';
  selectedIncoterm.value = 'ALL';
  selectedMaterial.value = 'ALL';
  selectedCertification.value = 'ALL';
  selectedLeadTime.value = 'ALL';
}

function openInquiryModal(item: any) {
  activeInquiryItem.value = item;
}

function submitQuickRfq() {
  const [lang, curr] = [(route.params.locale as string) || 'ko', (route.params.currency as string) || 'KRW'];
  router.push({
    path: `/${lang}/${curr}/sourcing/rfq/new`,
    query: {
      title: quickRfqItem.value || undefined,
      qty: String(quickRfqQty.value || 1000),
      unit: quickRfqUnit.value,
    },
  });
}

async function fetchListings() {
  loading.value = true;
  fetchError.value = null;
  try {
    const res = await apiRequest('/catalog/listings');
    if (res && res.facets) {
      serverFacets.value = res.facets;
    }
    if (res && Array.isArray(res.items)) {
      listings.value = res.items.map((item: any) => ({
        ...item,
        moq: Number(item.moq) || 100,
        quantity_step: Number(item.quantity_step) || 10,
        years_in_business: Number(item.years_in_business) || 10,
        verified_supplier: item.verified_supplier ?? item.is_verified_supplier ?? true,
        is_verified_supplier: item.verified_supplier ?? item.is_verified_supplier ?? true,
        trade_assurance: item.trade_assurance ?? true,
        customization: Boolean(item.customization),
        incoterm: item.incoterms || item.incoterm || 'FOB Busan Port',
        category_name: item.category_name || item.category || '산업기계 & 부품',
        supplier_name: item.supplier_name || 'Verified Supplier Co.',
        price_tiers: (item.price_tiers || []).map((t: any) => ({
          min_quantity: String(t.min_quantity),
          max_quantity: t.max_quantity ? String(t.max_quantity) : null,
          unit_price: typeof t.unit_price === 'number' ? t.unit_price.toFixed(2) : String(t.unit_price),
        })),
      }));
    } else {
      listings.value = [];
    }
  } catch (err: any) {
    fetchError.value = `카탈로그 서버 통신 오류: ${err.message || '네트워크 연결 실패'}`;
  } finally {
    loading.value = false;
  }
}

function syncRouteQuery() {
  if (route.query.category) selectedCategory.value = route.query.category as string;
  if (route.query.q !== undefined) keywordFilter.value = (route.query.q as string) || '';
  if (route.query.verified === 'true') filterVerified.value = true;
}

watch(() => route.query, () => {
  syncRouteQuery();
}, { deep: true });

onMounted(() => {
  syncRouteQuery();
  fetchListings();
});
</script>

<style scoped>
.assure-strip { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 24px; align-items: center; background: var(--ws-navy-ink); color: #fff; border-radius: var(--ws-radius-lg); padding: 32px; margin-bottom: 20px; }
.assure-strip .ws-hero-eyebrow { color: #fbbf24; }
.assure-text h1 { margin: 0 0 8px; font-size: 26px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); line-height: 1.35; }
.assure-text p { margin: 0; color: #b9c6da; font-size: 14px; }
.assure-card { background: #fff; color: var(--ws-text); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 10px; }
.assure-card b { font-size: 15px; display: flex; align-items: center; gap: 8px; }
.assure-card .b-ico { color: var(--ws-brand); }
.assure-card p { margin: 0; font-size: 12px; color: var(--ws-text-muted); }
.assure-card input, .assure-card select { border: 1px solid var(--ws-border); border-radius: 8px; padding: 10px 12px; font-size: 13px; font-family: var(--ws-font); }
.assure-row { display: grid; grid-template-columns: 1fr 110px; gap: 8px; }
.keyword-bar { align-items: center; }
.keyword-bar .ws-btn { margin-left: auto; }
.catalog-layout { margin-top: 4px; }
.chips-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
.chips-label { font-size: 12px; font-weight: 800; color: var(--ws-text-muted); }
.chip-x { display: inline-flex; align-items: center; gap: 6px; background: var(--ws-navy); color: #fff; border: 0; border-radius: 9999px; padding: 5px 8px 5px 12px; font-size: 12px; font-weight: 700; cursor: pointer; font-family: var(--ws-font); }
.chip-x:hover { background: var(--ws-navy-dark); }
.results-head { align-items: flex-end; margin-bottom: 16px; }
.results-hint { margin: 4px 0 0; font-size: 12px; color: var(--ws-text-muted); }
.sort-box { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700; color: var(--ws-text-muted); }
.sort-box .ws-input { width: auto; font-size: 13px; padding: 8px 10px; }
.results-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
@media (max-width: 1024px) {
  .assure-strip { grid-template-columns: minmax(0, 1fr); padding: 24px; }
  .results-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .results-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
