<template>
  <div class="catalog-page">
    <!-- Hero Banner (Trade Assurance & Sourcing Highlights) -->
    <section class="hero-banner">
      <div class="banner-content">
        <div class="banner-badge">🛡️ TRADE ASSURANCE 무역보증</div>
        <h1 class="banner-title">주문 결제부터 납기·통관까지 100% 안전 보호</h1>
        <p class="banner-desc">
          에스크로 안전 결제, 생산 지연 보상, 규격 불일치 시 100% 환불, SGS/TÜV 공인 실사 검수 지원
        </p>
        <div class="banner-highlights">
          <span class="hl-item">✓ 선급금 30% / 잔금 70% 분할 결제</span>
          <span class="hl-item">✓ SHA-256 전자계약서 법적 효력</span>
          <span class="hl-item">✓ 복식부기 실시간 무결성 원장 분개</span>
        </div>
      </div>
      <div class="banner-rfq-card">
        <div class="rfq-card-head">
          <span class="rfq-icon">⚡</span>
          <div>
            <h3>원클릭 RFQ 빠른 견적</h3>
            <p>1분 만에 도매 견적을 요청하고 복수 공급사 견적을 비교하세요</p>
          </div>
        </div>
        <div class="rfq-mini-form">
          <input v-model="quickRfqItem" type="text" placeholder="조달 희망 품목 (예: CNC 알루미늄 가공품)" />
          <div class="qty-row">
            <input v-model.number="quickRfqQty" type="number" placeholder="필요 수량" />
            <select v-model="quickRfqUnit">
              <option value="pcs">pcs (개)</option>
              <option value="kg">kg (킬로그램)</option>
              <option value="sets">sets (세트)</option>
            </select>
          </div>
          <button class="btn-quick-rfq" @click="submitQuickRfq">견적 요청 제출</button>
        </div>
      </div>
    </section>

    <!-- Active Search Keyword Pill -->
    <div v-if="keywordFilter" class="active-query-bar">
      <span>🔍 검색 키워드: <strong>"{{ keywordFilter }}"</strong></span>
      <button class="btn-clear-q" @click="clearKeyword">✕ 검색어 해제</button>
    </div>

    <!-- Main Marketplace Catalog Area -->
    <div class="catalog-main-layout">
      <!-- Left Filter Sidebar Component -->
      <CatalogFilterSidebar
        v-model:filterVerified="filterVerified"
        v-model:filterTradeAssurance="filterTradeAssurance"
        v-model:filterCustomization="filterCustomization"
        v-model:selectedMoqPreset="selectedMoqPreset"
        v-model:selectedCategory="selectedCategory"
        v-model:selectedIncoterm="selectedIncoterm"
        @reset="resetFilters"
      />

      <!-- Right Product Cards Section -->
      <section class="products-section">
        <div class="section-toolbar">
          <div class="toolbar-left">
            <h2>도매 상품 및 생산 라인 목록 <span class="count">({{ filteredListings.length }}건)</span></h2>
            <span class="sub-hint">※ 발주 수량에 따라 수량 구간별 도매 단가(Tiered Pricing)가 즉시 적용됩니다.</span>
          </div>
          <div class="toolbar-right">
            <label class="sort-label">정렬 기준:</label>
            <select v-model="sortOrder" class="sort-select">
              <option value="recommended">추천순 (인증공장 우선)</option>
              <option value="moq_asc">최소발주수량(MOQ) 낮은순</option>
              <option value="price_asc">단가 낮은순</option>
              <option value="lead_asc">단납기 출고순</option>
            </select>
          </div>
        </div>

        <!-- Loading & Error States -->
        <div v-if="loading" class="catalog-state-box loading-box">
          <p>도매 상품 및 제조사 카탈로그를 서버에서 불러오는 중입니다...</p>
        </div>
        <div v-else-if="fetchError" class="catalog-state-box error-box">
          <p class="error-msg">⚠️ {{ fetchError }}</p>
          <button class="btn-retry" @click="fetchListings">다시 시도</button>
        </div>
        <div v-else-if="filteredListings.length === 0" class="catalog-state-box empty-box">
          <p>선택하신 조건에 일치하는 도매 상품이 없습니다.</p>
          <button class="btn-retry" @click="resetFilters">필터 초기화</button>
        </div>
        <!-- High-Density Product Grid -->
        <div v-else class="product-grid">
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

    <!-- Inquiry Modal Component -->
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

const route = useRoute();
const router = useRouter();

const keywordFilter = ref('');
const filterVerified = ref(false);
const filterTradeAssurance = ref(false);
const filterCustomization = ref(false);
const selectedMoqPreset = ref('all');
const selectedCategory = ref('ALL');
const selectedIncoterm = ref('ALL');
const sortOrder = ref('recommended');

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
      const matchText = `${item.title} ${item.supplier_name} ${item.category_name} ${item.sub_category || ''}`.toLowerCase();
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
.catalog-page { display: flex; flex-direction: column; gap: 24px; }
.hero-banner { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 12px; padding: 32px; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; gap: 32px; }
.banner-content { max-width: 660px; }
.banner-badge { display: inline-block; background: rgba(255, 102, 0, 0.2); border: 1px solid #D64000; color: #FF8533; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 4px; margin-bottom: 12px; }
.banner-title { font-size: 28px; font-weight: 800; margin: 0 0 10px 0; line-height: 1.3; }
.banner-desc { font-size: 14px; color: #CBD5E1; margin: 0 0 18px 0; }
.banner-highlights { display: flex; gap: 16px; font-size: 12px; color: #38BDF8; font-weight: 600; }

.banner-rfq-card { background: #FFFFFF; color: #1E293B; border-radius: 10px; padding: 20px; width: 380px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.rfq-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.rfq-icon { font-size: 24px; }
.rfq-card-head h3 { margin: 0; font-size: 16px; font-weight: 800; }
.rfq-card-head p { margin: 2px 0 0 0; font-size: 11px; color: #64748B; }
.rfq-mini-form { display: flex; flex-direction: column; gap: 8px; }
.rfq-mini-form input, .rfq-mini-form select { border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; font-size: 13px; }
.qty-row { display: grid; grid-template-columns: 2fr 1fr; gap: 8px; }
.btn-quick-rfq { background: #D64000; color: #FFF; border: none; border-radius: 6px; padding: 10px; font-weight: 700; cursor: pointer; }

.active-query-bar { display: flex; justify-content: space-between; align-items: center; background: #FFF7ED; border: 1px solid #FDBA74; padding: 10px 16px; border-radius: 8px; font-size: 13px; color: #9A3412; }
.btn-clear-q { background: #FFF; border: 1px solid #FB923C; color: #C2410C; border-radius: 4px; padding: 4px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }

.catalog-main-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
.products-section { display: flex; flex-direction: column; gap: 16px; }
.section-toolbar { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; display: flex; justify-content: space-between; align-items: center; }
.toolbar-left h2 { margin: 0; font-size: 16px; font-weight: 800; color: #1E293B; }
.toolbar-left .count { color: #D64000; }
.sub-hint { font-size: 12px; color: #64748B; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.sort-label { font-size: 12px; color: #64748B; font-weight: 600; }
.sort-select { border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 10px; font-size: 12px; }

.product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.catalog-state-box { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 48px 24px; text-align: center; color: #475569; font-size: 14px; }
.error-box .error-msg { color: #DC2626; font-weight: 700; margin-bottom: 12px; }
.btn-retry { background: #1E293B; color: #FFF; border: none; border-radius: 6px; padding: 8px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Responsive Mobile & Tablet Layout */
@media (max-width: 992px) {
  .hero-banner {
    flex-direction: column;
    padding: 24px 20px;
    gap: 20px;
  }
  .banner-rfq-card {
    width: 100%;
    box-sizing: border-box;
  }
  .catalog-main-layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .banner-title {
    font-size: 20px;
  }
  .product-grid {
    grid-template-columns: 1fr !important;
  }
  .section-toolbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .toolbar-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
