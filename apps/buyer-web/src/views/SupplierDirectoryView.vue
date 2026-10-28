<template>
  <div class="supplier-directory-page">
    <!-- Header Banner -->
    <div class="directory-hero">
      <div class="hero-inner">
        <h2>글로벌 공인 제조사 및 공급사 디렉토리 (Verified Suppliers)</h2>
        <p>
          SGS, TÜV, Bureau Veritas의 현장 실사 및 공장 설비 검증을 완료한 신뢰할 수 있는 B2B 제조 공급사를 검색하고 1:1 상담하세요.
        </p>
        <div class="search-bar-wrap">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="공급사명, 주력 생산 품목 또는 기술 키워드를 검색하세요..."
            @keyup.enter="applyFilters"
          />
          <button class="btn-search" @click="applyFilters">공급사 검색</button>
        </div>
      </div>
    </div>

    <!-- Main Content: Filters + Supplier Grid -->
    <div class="directory-body">
      <!-- Sidebar Filters -->
      <aside class="filter-sidebar">
        <div class="filter-group">
          <h4>산업 분야 (Categories)</h4>
          <div class="category-options">
            <label
              class="cat-radio"
              :class="{ active: selectedCategory === 'ALL' }"
              @click="setCategory('ALL')"
            >
              전체 산업군
            </label>
            <label
              v-for="cat in categories"
              :key="cat.id"
              class="cat-radio"
              :class="{ active: selectedCategory === cat.id }"
              @click="setCategory(cat.id)"
            >
              {{ cat.icon }} {{ cat.name.split(' (')[0] }}
            </label>
          </div>
        </div>

        <div class="filter-group">
          <h4>공급사 검증 및 보증 (Badges)</h4>
          <label class="checkbox-label">
            <input v-model="verifiedOnly" type="checkbox" @change="applyFilters" />
            <span>✓ Verified Supplier (공장 실사 완료)</span>
          </label>
          <label class="checkbox-label">
            <input v-model="tradeAssuranceOnly" type="checkbox" @change="applyFilters" />
            <span>🛡️ Trade Assurance (에스크로 보호)</span>
          </label>
        </div>

        <div class="filter-group">
          <h4>국제 품질 인증 (Certifications)</h4>
          <div class="cert-chips">
            <button
              v-for="cert in ['ISO 9001', 'CE', 'FDA', 'FSC', 'RoHS']"
              :key="cert"
              class="chip-btn"
              :class="{ active: selectedCert === cert }"
              @click="toggleCert(cert)"
            >
              {{ cert }}
            </button>
          </div>
        </div>

        <div class="filter-group">
          <h4>최소 평점 (Rating)</h4>
          <select v-model.number="minRating" class="select-box" @change="applyFilters">
            <option :value="0">전체 평점</option>
            <option :value="4.5">★ 4.5 이상</option>
            <option :value="4.8">★ 4.8 이상 (최우수 공급사)</option>
          </select>
        </div>

        <button class="btn-reset" @click="resetFilters">필터 초기화</button>
      </aside>

      <!-- Results Area -->
      <main class="results-area">
        <div class="results-toolbar">
          <div class="counts">
            총 <strong>{{ suppliers.length }}</strong>개의 검증된 글로벌 제조사가 확인되었습니다.
          </div>
          <div class="view-switch">
            <button
              class="btn-icon"
              :class="{ active: viewMode === 'grid' }"
              @click="viewMode = 'grid'"
            >
              ⊞ 바둑판형
            </button>
            <button
              class="btn-icon"
              :class="{ active: viewMode === 'list' }"
              @click="viewMode = 'list'"
            >
              ☰ 목록형
            </button>
          </div>
        </div>

        <div v-if="loading" class="loading-state">
          공급사 네트워크를 조회 중입니다...
        </div>

        <div v-else-if="suppliers.length === 0" class="empty-state">
          <p>검색 조건과 일치하는 공급사가 없습니다. 필터를 재설정해 보세요.</p>
        </div>

        <!-- Supplier Grid View -->
        <div v-else-if="viewMode === 'grid'" class="supplier-grid">
          <div v-for="sup in suppliers" :key="sup.id" class="supplier-card">
            <div class="card-cover">
              <img :src="sup.banner_image" :alt="sup.company_name" class="cover-img" />
              <div class="badges-overlay">
                <span v-if="sup.is_verified_supplier" class="badge-verified">✓ Verified Supplier</span>
                <span v-if="sup.trade_assurance" class="badge-ta">🛡️ Trade Assurance</span>
              </div>
            </div>

            <div class="card-content">
              <div class="header-row">
                <h3 class="company-name">
                  <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`">
                    {{ sup.company_name }}
                  </router-link>
                </h3>
              </div>
              <p class="company-slogan">{{ sup.slogan }}</p>

              <!-- Metrics -->
              <div class="metric-tags">
                <span class="tag">⭐ {{ sup.rating }} ({{ sup.reviews_count }})</span>
                <span class="tag">⚡ 응답률: {{ sup.response_rate }}</span>
                <span class="tag">🕒 업력: {{ sup.years_in_business }}년</span>
                <span class="tag">🏭 면적: {{ sup.factory_size }}</span>
              </div>

              <!-- Main Products -->
              <div class="main-products">
                <span class="label">주력 생산 품목:</span>
                <div class="prod-badges">
                  <span v-for="(p, idx) in sup.main_products.slice(0, 3)" :key="idx" class="prod-badge">
                    {{ p }}
                  </span>
                </div>
              </div>

              <!-- Certs & Audit Agency -->
              <div class="cert-row">
                <span class="agency">실사기관: <strong>{{ sup.inspection_agency }}</strong></span>
                <div class="certs-list">
                  <span v-for="c in sup.certifications" :key="c" class="cert-item">{{ c }}</span>
                </div>
              </div>

              <div class="card-actions">
                <router-link
                  :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`"
                  class="btn-visit"
                >
                  미니사이트 방문 (Storefront)
                </router-link>
                <router-link
                  :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new?supplier=${sup.organization_id}`"
                  class="btn-inquire"
                >
                  견적 요청 (RFQ)
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Supplier List View -->
        <div v-else class="supplier-list">
          <div v-for="sup in suppliers" :key="sup.id" class="supplier-row-card">
            <img :src="sup.banner_image" :alt="sup.company_name" class="row-thumb" />
            <div class="row-details">
              <div class="row-title-bar">
                <h3>
                  <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`">
                    {{ sup.company_name }}
                  </router-link>
                </h3>
                <div class="badges">
                  <span v-if="sup.is_verified_supplier" class="badge-verified">✓ Verified</span>
                  <span v-if="sup.trade_assurance" class="badge-ta">🛡️ Trade Assurance</span>
                </div>
              </div>
              <p class="slogan">{{ sup.slogan }}</p>
              <div class="meta-row">
                <span>평점: <strong>⭐ {{ sup.rating }}</strong></span>
                <span>응답률: <strong>{{ sup.response_rate }}</strong></span>
                <span>업력: <strong>{{ sup.years_in_business }}년</strong></span>
                <span>연매출: <strong>{{ sup.total_revenue_usd }}</strong></span>
                <span>수출 비중: <strong>{{ sup.export_percentage }}</strong></span>
                <span>실사기관: <strong>{{ sup.inspection_agency }}</strong></span>
              </div>
              <div class="prods-inline">
                <strong>주력 품목:</strong> {{ sup.main_products.join(', ') }}
              </div>
            </div>
            <div class="row-actions">
              <router-link
                :to="`/${currentLocale}/${currentCurrency}/suppliers/${sup.organization_id}`"
                class="btn-visit"
              >
                스토어 방문
              </router-link>
              <router-link
                :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new?supplier=${sup.organization_id}`"
                class="btn-inquire"
              >
                1:1 견적 요청
              </router-link>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { apiRequest } from '../api';

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
.supplier-directory-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 16px 80px;
}

.directory-hero {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: white;
  border-radius: 12px;
  padding: 40px 32px;
  margin-top: 20px;
  margin-bottom: 30px;
}

.hero-inner {
  max-width: 800px;
}

.hero-inner h2 {
  font-size: 28px;
  font-weight: 800;
  margin: 0 0 12px 0;
}

.hero-inner p {
  font-size: 15px;
  color: #94a3b8;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.search-bar-wrap {
  display: flex;
  gap: 8px;
  max-width: 650px;
}

.search-bar-wrap input {
  flex: 1;
  padding: 12px 16px;
  border-radius: 6px;
  border: none;
  font-size: 15px;
}

.btn-search {
  background: #d64000;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.btn-search:hover {
  background: #e65c00;
}

.directory-body {
  display: flex;
  gap: 28px;
}

.filter-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.filter-group h4 {
  font-size: 15px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid #e2e8f0;
}

.category-options {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-radio {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.cat-radio:hover {
  background: #f1f5f9;
}

.cat-radio.active {
  background: #ffedd5;
  color: #c2410c;
  font-weight: 700;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  margin-bottom: 8px;
  cursor: pointer;
}

.cert-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip-btn {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 9999px;
  border: 1px solid #cbd5e1;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.chip-btn.active {
  background: #0284c7;
  color: white;
  border-color: #0284c7;
}

.select-box {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
}

.btn-reset {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
  color: #64748b;
  cursor: pointer;
}

.results-area {
  flex: 1;
}

.results-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.counts {
  font-size: 14px;
  color: #475569;
}

.view-switch {
  display: flex;
  gap: 6px;
}

.btn-icon {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn-icon.active {
  background: #d64000;
  color: white;
  border-color: #d64000;
}

.supplier-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.supplier-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
}

.card-cover {
  position: relative;
  height: 160px;
  background: #f8fafc;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.badges-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 6px;
}

.badge-verified {
  background: #0284c7;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.badge-ta {
  background: #cc3d00;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 4px;
}

.card-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.company-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.company-name a {
  color: #0f172a;
  text-decoration: none;
}

.company-name a:hover {
  color: #d64000;
}

.company-slogan {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.metric-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.metric-tags .tag {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  color: #334155;
}

.main-products {
  font-size: 12px;
  margin-bottom: 12px;
}

.main-products .label {
  color: #64748b;
  display: block;
  margin-bottom: 4px;
}

.prod-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.prod-badge {
  background: #f1f5f9;
  color: #1e293b;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
}

.cert-row {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid #f1f5f9;
  font-size: 11px;
  margin-bottom: 14px;
}

.cert-row .agency {
  color: #475569;
  display: block;
  margin-bottom: 4px;
}

.certs-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cert-item {
  background: #ecfdf5;
  color: #065f46;
  padding: 1px 5px;
  border-radius: 3px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-visit {
  flex: 1;
  text-align: center;
  padding: 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  color: #334155;
}

.btn-inquire {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #d64000;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  color: white;
}

/* List View */
.supplier-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.supplier-row-card {
  display: flex;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  gap: 16px;
  align-items: center;
}

.row-thumb {
  width: 140px;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.row-details {
  flex: 1;
}

.row-title-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.row-title-bar h3 {
  margin: 0;
  font-size: 16px;
}

.row-title-bar a {
  color: #0f172a;
  text-decoration: none;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  font-size: 12px;
  color: #64748b;
  margin: 6px 0;
}

.prods-inline {
  font-size: 12px;
  color: #334155;
}

.row-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 160px;
  flex-shrink: 0;
}

/* Mobile & Tablet Responsive Layout */
@media (max-width: 992px) {
  .directory-body {
    flex-direction: column !important;
  }
  .filter-sidebar {
    width: 100% !important;
  }
}

@media (max-width: 640px) {
  .directory-hero {
    padding: 24px 18px !important;
  }
  .directory-hero h2 {
    font-size: 20px !important;
  }
  .search-bar-wrap {
    flex-direction: column;
  }
  .supplier-grid {
    grid-template-columns: 1fr !important;
  }
  .supplier-row-card {
    flex-direction: column;
    align-items: stretch;
  }
  .row-thumb {
    width: 100% !important;
    height: 140px !important;
  }
  .row-actions {
    width: 100% !important;
    flex-direction: row !important;
  }
}
</style>

