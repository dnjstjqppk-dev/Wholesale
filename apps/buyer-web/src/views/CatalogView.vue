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
            :locale="($route.params.locale as string) || 'ko'"
            :currency="($route.params.currency as string) || 'KRW'"
            @inquiry="openInquiryModal"
          />
        </div>
      </section>
    </div>

    <!-- Inquiry Modal Component -->
    <CatalogInquiryModal
      :item="activeInquiryItem"
      @close="activeInquiryItem = null"
      @submitted="handleInquirySubmitted"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CatalogFilterSidebar from '../components/CatalogFilterSidebar.vue';
import CatalogProductCard from '../components/CatalogProductCard.vue';
import CatalogInquiryModal from '../components/CatalogInquiryModal.vue';
import { apiRequest } from '../api';

export interface CatalogItem {
  id: string;
  sku_id: string;
  title: string;
  category: string;
  category_name: string;
  supplier_name: string;
  is_verified_supplier: boolean;
  country: string;
  moq: number;
  quantity_step: number;
  unit: string;
  lead_time_days: number;
  incoterm: string;
  trade_assurance: boolean;
  customization: boolean;
  years_in_business: number;
  response_rate: string;
  price_tiers: Array<{
    min_quantity: string;
    max_quantity: string | null;
    unit_price: string;
  }>;
}

const route = useRoute();
const router = useRouter();

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
const listings = ref<CatalogItem[]>([]);
const loading = ref(true);
const fetchError = ref<string | null>(null);

const filteredListings = computed(() => {
  return listings.value.filter(item => {
    if (filterVerified.value && !item.is_verified_supplier) return false;
    if (filterTradeAssurance.value && !item.trade_assurance) return false;
    if (filterCustomization.value && !item.customization) return false;
    if (selectedCategory.value !== 'ALL' && item.category !== selectedCategory.value) return false;
    if (selectedIncoterm.value !== 'ALL' && item.incoterm !== selectedIncoterm.value) return false;
    if (selectedMoqPreset.value === '100' && item.moq > 100) return false;
    if (selectedMoqPreset.value === '500' && item.moq > 500) return false;
    if (selectedMoqPreset.value === '1000' && item.moq < 1000) return false;
    return true;
  });
});

function resetFilters() {
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

async function handleInquirySubmitted(payload: any) {
  try {
    await apiRequest('/sourcing/rfqs', {
      method: 'POST',
      body: JSON.stringify({
        title: `[견적문의] ${payload.item.title}`,
        quantity: payload.quantity,
        target_price: payload.targetPrice,
        category: payload.item.category,
      }),
    });
    alert(`[서버 접수 완료] 공급사(${payload.item.supplier_name})에 정식 견적 문의서가 암호화 전송되었습니다.`);
  } catch (err: any) {
    alert(`견적 문의 전송: ${err.message}`);
  }
  activeInquiryItem.value = null;
}

function submitQuickRfq() {
  const [lang, curr] = [(route.params.locale as string) || 'ko', (route.params.currency as string) || 'KRW'];
  router.push(`/${lang}/${curr}/sourcing/rfq/new`);
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
        trade_assurance: item.trade_assurance ?? true,
        customization: item.customization ?? true,
        incoterm: item.incoterms || item.incoterm || 'FOB',
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

onMounted(() => {
  if (route.query.category) selectedCategory.value = route.query.category as string;
  if (route.query.verified === 'true') filterVerified.value = true;
  fetchListings();
});
</script>

<style scoped>
.catalog-page { display: flex; flex-direction: column; gap: 24px; }
.hero-banner { background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-radius: 12px; padding: 32px; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; gap: 32px; }
.banner-badge { background: #FF6600; color: #FFF; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
.banner-title { font-size: 26px; font-weight: 800; margin: 0 0 10px 0; }
.banner-desc { font-size: 14px; color: #94A3B8; margin: 0 0 18px 0; max-width: 600px; line-height: 1.5; }
.banner-highlights { display: flex; gap: 16px; font-size: 12px; color: #E2E8F0; font-weight: 600; }
.banner-rfq-card { background: #FFFFFF; color: #1E293B; border-radius: 10px; padding: 20px; width: 340px; flex-shrink: 0; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
.rfq-card-head { display: flex; gap: 10px; margin-bottom: 14px; }
.rfq-icon { font-size: 24px; }
.rfq-card-head h3 { margin: 0; font-size: 15px; font-weight: 700; }
.rfq-card-head p { margin: 2px 0 0 0; font-size: 11px; color: #64748B; }
.rfq-mini-form { display: flex; flex-direction: column; gap: 10px; }
.rfq-mini-form input, .rfq-mini-form select { border: 1px solid #CBD5E1; border-radius: 6px; padding: 8px 10px; font-size: 13px; outline: none; }
.qty-row { display: flex; gap: 8px; }
.qty-row input { flex: 1; }
.btn-quick-rfq { background: #FF6600; color: #FFF; border: none; padding: 10px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; }
.catalog-main-layout { display: flex; gap: 24px; align-items: flex-start; }
.products-section { flex: 1; display: flex; flex-direction: column; gap: 16px; }
.section-toolbar { display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 20px; }
.toolbar-left h2 { margin: 0; font-size: 16px; font-weight: 800; color: #1E293B; }
.toolbar-left .count { color: #FF6600; }
.toolbar-left .sub-hint { font-size: 12px; color: #64748B; margin-top: 4px; display: block; }
.toolbar-right { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #475569; }
.sort-select { border: 1px solid #CBD5E1; border-radius: 6px; padding: 6px 10px; font-size: 13px; outline: none; background: #FFF; }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
.catalog-state-box { background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; padding: 48px 24px; text-align: center; color: #64748B; font-size: 14px; }
.loading-box { color: #0284C7; font-weight: 600; }
.error-box { background: #FEF2F2; border-color: #FCA5A5; color: #DC2626; font-weight: 600; }
.empty-box { background: #F8FAFC; color: #64748B; }
.btn-retry { margin-top: 12px; background: #FF6600; color: #FFFFFF; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; }
.btn-retry:hover { background: #EA580C; }
</style>
