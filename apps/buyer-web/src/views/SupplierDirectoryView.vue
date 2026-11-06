<template>
  <div class="ws-page ws-page-wide">
    <section class="ws-hero dir-hero">
      <p class="ws-hero-eyebrow"><WsIcon name="factory" :size="14" /> Verified Suppliers</p>
      <h1 class="ws-hero-title">글로벌 공인 제조사 디렉토리</h1>
      <p class="ws-hero-sub">SGS·TÜV·Bureau Veritas 현장 실사 완료 제조사를 검색하고 1:1 상담하세요.</p>
      <div class="ws-hero-search">
        <input v-model="searchQuery" type="text" placeholder="공급사명·주력 품목·기술 키워드 검색..." @keyup.enter="applyFilters" />
        <button @click="applyFilters">검색</button>
      </div>
    </section>

    <div class="ws-layout-side dir-body">
      <aside class="ws-card ws-card-pad-sm filters">
        <div class="f-group">
          <h4>산업 분야</h4>
          <div class="ws-stack-sm">
            <button class="ws-tag" :class="{ 'ws-tag-active': selectedCategory === 'ALL' }" @click="setCategory('ALL')">전체 산업군</button>
            <button
              v-for="cat in categories"
              :key="cat.id"
              class="ws-tag"
              :class="{ 'ws-tag-active': selectedCategory === cat.id }"
              @click="setCategory(cat.id)"
            >
              {{ cat.name.split(' (')[0] }}
            </button>
          </div>
        </div>
        <div class="f-group">
          <h4>검증·보증</h4>
          <label class="ws-check"><input v-model="verifiedOnly" type="checkbox" @change="applyFilters" /> Verified Supplier (공장 실사)</label>
          <label class="ws-check"><input v-model="tradeAssuranceOnly" type="checkbox" @change="applyFilters" /> Trade Assurance (에스크로)</label>
        </div>
        <div class="f-group">
          <h4>국제 품질 인증</h4>
          <div class="ws-cluster" style="gap: 6px">
            <button
              v-for="cert in ['ISO 9001', 'CE', 'FDA', 'FSC', 'RoHS']"
              :key="cert"
              class="ws-tag"
              :class="{ 'ws-tag-active': selectedCert === cert }"
              @click="toggleCert(cert)"
            >
              {{ cert }}
            </button>
          </div>
        </div>
        <div class="f-group">
          <h4>최소 평점</h4>
          <select v-model.number="minRating" class="ws-input" @change="applyFilters">
            <option :value="0">전체 평점</option>
            <option :value="4.5">★ 4.5 이상</option>
            <option :value="4.8">★ 4.8 이상 (최우수)</option>
          </select>
        </div>
        <button class="ws-btn ws-btn-ghost ws-btn-sm ws-btn-block" @click="resetFilters">필터 초기화</button>
      </aside>

      <main>
        <div class="ws-split results-bar">
          <p class="ws-small">총 <b>{{ suppliers.length }}</b>개 검증 제조사</p>
          <span class="ws-cluster" style="gap: 6px">
            <button class="ws-btn ws-btn-sm" :class="viewMode === 'grid' ? 'ws-btn-navy' : 'ws-btn-secondary'" @click="viewMode = 'grid'"><WsIcon name="layout" :size="13" /> 그리드</button>
            <button class="ws-btn ws-btn-sm" :class="viewMode === 'list' ? 'ws-btn-navy' : 'ws-btn-secondary'" @click="viewMode = 'list'"><WsIcon name="menu" :size="13" /> 목록</button>
          </span>
        </div>

        <div v-if="loading" class="ws-stack">
          <div class="ws-skeleton" style="height: 180px"></div>
          <div class="ws-skeleton" style="height: 180px"></div>
        </div>

        <div v-else-if="suppliers.length === 0" class="ws-empty">
          <span class="ws-empty-icon"><WsIcon name="factory" :size="24" /></span>
          <h3>조건에 맞는 공급사가 없습니다</h3>
          <p>필터를 재설정해 보세요.</p>
          <button class="ws-btn ws-btn-secondary" @click="resetFilters">필터 초기화</button>
        </div>

        <div v-else-if="viewMode === 'grid'" class="sup-grid">
          <article v-for="sup in suppliers" :key="sup.id" class="ws-card ws-card-pad-sm sup-card">
            <div class="sup-cover">
              <img :src="sup.banner_image" :alt="sup.company_name" loading="lazy" />
              <span class="ws-cluster sup-badges" style="gap: 6px">
                <span v-if="sup.is_verified_supplier" class="ws-badge ws-badge-success">Verified</span>
                <span v-if="sup.trade_assurance" class="ws-badge ws-badge-brand"><WsIcon name="shield" :size="12" /> TA</span>
              </span>
            </div>
            <h3>
              <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`">{{ sup.company_name }}</router-link>
            </h3>
            <p class="ws-small ws-muted slogan">{{ sup.slogan }}</p>
            <div class="metric-line">
              <span>★ {{ sup.rating }} ({{ sup.reviews_count }})</span>
              <span>응답률 {{ sup.response_rate }}</span>
              <span>업력 {{ sup.years_in_business }}년</span>
            </div>
            <div class="ws-cluster prod-line" style="gap: 6px">
              <span v-for="(p, idx) in sup.main_products.slice(0, 3)" :key="idx" class="ws-badge ws-badge-outline">{{ p }}</span>
            </div>
            <p class="ws-small ws-muted">실사기관 <b>{{ sup.inspection_agency }}</b> · {{ sup.certifications.join(' · ') }}</p>
            <div class="ws-cluster sup-cta" style="gap: 8px">
              <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`" class="ws-btn ws-btn-secondary ws-btn-sm">미니사이트 방문</router-link>
              <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new?supplier=${sup.organization_id}`" class="ws-btn ws-btn-primary ws-btn-sm">견적 요청</router-link>
            </div>
          </article>
        </div>

        <div v-else class="ws-stack">
          <article v-for="sup in suppliers" :key="sup.id" class="ws-card ws-card-pad-sm sup-row">
            <img :src="sup.banner_image" :alt="sup.company_name" loading="lazy" />
            <div class="ws-list-main">
              <h3>
                <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`">{{ sup.company_name }}</router-link>
              </h3>
              <p class="ws-small ws-muted slogan">{{ sup.slogan }}</p>
              <p class="ws-small meta-line">
                평점 <b>★ {{ sup.rating }}</b> · 응답률 <b>{{ sup.response_rate }}</b> · 업력 <b>{{ sup.years_in_business }}년</b> ·
                연매출 <b>{{ sup.total_revenue_usd }}</b> · 수출 비중 <b>{{ sup.export_percentage }}</b> · 실사 <b>{{ sup.inspection_agency }}</b>
              </p>
              <p class="ws-small"><b>주력 품목:</b> {{ sup.main_products.join(', ') }}</p>
            </div>
            <div class="row-cta">
              <span v-if="sup.is_verified_supplier" class="ws-badge ws-badge-success">Verified</span>
              <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`" class="ws-btn ws-btn-secondary ws-btn-sm">스토어 방문</router-link>
              <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new?supplier=${sup.organization_id}`" class="ws-btn ws-btn-primary ws-btn-sm">1:1 견적 요청</router-link>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';
import WsIcon from '@packages/ui/WsIcon.vue';

const route = useRoute();
const currentLocale = ref<string>((route.params.locale as string) || 'ko');
const currentCurrency = ref<string>((route.params.currency as string) || 'KRW');

const loading = ref(true);
const suppliers = ref<any[]>([]);
const categories = ref<any[]>([]);
const viewMode = ref<'grid' | 'list'>('grid');

const searchQuery = ref('');
const selectedCategory = ref('ALL');
const verifiedOnly = ref(false);
const tradeAssuranceOnly = ref(false);
const selectedCert = ref('');
const minRating = ref(0);

async function fetchCategories() {
  try {
    const res = await apiRequest('/catalog/categories');
    categories.value = res.categories || [];
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function fetchSuppliers() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.set('q', searchQuery.value);
    if (selectedCategory.value !== 'ALL') params.set('category', selectedCategory.value);
    if (verifiedOnly.value) params.set('verified_only', 'true');
    if (tradeAssuranceOnly.value) params.set('trade_assurance', 'true');
    if (selectedCert.value) params.set('cert', selectedCert.value);
    if (minRating.value > 0) params.set('min_rating', String(minRating.value));

    const res = await apiRequest(`/catalog/suppliers?${params.toString()}`);
    suppliers.value = res.items || [];
  } catch (err) {
    console.error('Failed to load suppliers', err);
  } finally {
    loading.value = false;
  }
}

function setCategory(catId: string) {
  selectedCategory.value = catId;
  fetchSuppliers();
}

function toggleCert(cert: string) {
  if (selectedCert.value === cert) {
    selectedCert.value = '';
  } else {
    selectedCert.value = cert;
  }
  fetchSuppliers();
}

function applyFilters() {
  fetchSuppliers();
}

function resetFilters() {
  searchQuery.value = '';
  selectedCategory.value = 'ALL';
  verifiedOnly.value = false;
  tradeAssuranceOnly.value = false;
  selectedCert.value = '';
  minRating.value = 0;
  fetchSuppliers();
}

onMounted(async () => {
  await fetchCategories();
  await fetchSuppliers();
});
</script>

<style scoped>
.dir-hero { margin-bottom: 20px; }
.dir-body { align-items: start; }
.filters { position: sticky; top: 84px; display: flex; flex-direction: column; gap: 18px; }
.f-group h4 { margin: 0 0 10px; font-size: 13px; font-weight: 800; }
.f-group .ws-tag { justify-content: flex-start; }
.f-group .ws-check { margin-bottom: 8px; }
.results-bar { margin-bottom: 14px; }
.results-bar p { margin: 0; }
.sup-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.sup-cover { position: relative; border-radius: 8px; overflow: hidden; background: var(--ws-surface-muted); aspect-ratio: 16 / 7; margin-bottom: 12px; }
.sup-cover img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sup-badges { position: absolute; left: 10px; bottom: 10px; }
.sup-card h3, .sup-row h3 { margin: 0 0 4px; font-size: 16px; font-weight: 800; }
.sup-card h3 a, .sup-row h3 a { color: var(--ws-text); text-decoration: none; }
.sup-card h3 a:hover, .sup-row h3 a:hover { color: var(--ws-brand); }
.slogan { margin: 0 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.metric-line { display: flex; gap: 12px; flex-wrap: wrap; font-size: 12px; font-weight: 700; color: var(--ws-text-2); margin-bottom: 10px; }
.prod-line { margin-bottom: 10px; }
.sup-cta { margin-top: 12px; }
.sup-row { display: grid; grid-template-columns: 200px minmax(0, 1fr) auto; gap: 16px; align-items: start; }
.sup-row img { width: 200px; height: 130px; object-fit: cover; border-radius: 8px; background: var(--ws-surface-muted); }
.meta-line { margin: 0 0 6px; }
.row-cta { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
@media (max-width: 1024px) {
  .filters { position: static; }
  .sup-grid { grid-template-columns: minmax(0, 1fr); }
  .sup-row { grid-template-columns: minmax(0, 1fr); }
  .sup-row img { width: 100%; height: 160px; }
}
</style>
