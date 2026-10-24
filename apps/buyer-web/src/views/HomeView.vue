<template>
  <div class="home-view">
    <!-- Hero Section: Sidebar + Banner Carousel + Fast RFQ Widget -->
    <section class="hero-section">
      <div class="hero-container">
        <!-- Categories Quick Menu -->
        <aside class="hero-categories">
          <div class="category-header">
            <span class="icon">📁</span>
            <strong>주요 산업 대분류</strong>
          </div>
          <ul class="cat-list">
            <li
              v-for="cat in categories"
              :key="cat.id"
              class="cat-item"
              :class="{ active: selectedCategory?.id === cat.id }"
              @mouseenter="selectedCategory = cat"
            >
              <router-link :to="`/${currentLocale}/${currentCurrency}/catalog?category=${cat.id}`" class="cat-link">
                <span class="cat-icon">{{ cat.icon }}</span>
                <span class="cat-title">{{ cat.name.split(' (')[0] }}</span>
                <span class="arrow">›</span>
              </router-link>
            </li>
          </ul>
        </aside>

        <!-- Main Banner Carousel -->
        <div class="hero-banner">
          <div class="banner-slide">
            <div class="banner-badge">🛡️ Alibaba Trade Assurance 보안 연동</div>
            <h1 class="banner-title">글로벌 무역 안심 거래<br>선급금 30% 에스크로 보호</h1>
            <p class="banner-desc">
              계약서 전자서명부터 제3자 품질 검수, 선적 선하증권(B/L) 확인까지<br>
              완벽한 분할출고 및 에스크로 결제 보호 시스템을 경험하세요.
            </p>
            <div class="banner-actions">
              <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="btn-primary">
                도매 카탈로그 탐색하기
              </router-link>
              <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="btn-secondary">
                무료 RFQ 견적 요청
              </router-link>
            </div>
          </div>

          <div class="hero-guarantees">
            <div class="guarantee-item">
              <span class="g-icon">🔒</span>
              <div>
                <strong>에스크로 안심 결제</strong>
                <p>납품 완료 시까지 정산금 플랫폼 보관</p>
              </div>
            </div>
            <div class="guarantee-item">
              <span class="g-icon">🚢</span>
              <div>
                <strong>Incoterms® 2020 지원</strong>
                <p>FOB / CIF / DDP 실시간 운임 견적</p>
              </div>
            </div>
            <div class="guarantee-item">
              <span class="g-icon">🔍</span>
              <div>
                <strong>공장 실사 및 품질 검수</strong>
                <p>SGS / TÜV 인증 제조사만 입점</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Fast RFQ Widget & User Box -->
        <div class="hero-rfq-box">
          <div class="user-greeting-card">
            <div class="user-avatar-circle">🏢</div>
            <div class="user-info">
              <span class="welcome-text">환영합니다, 구매사님!</span>
              <strong class="user-name">Metro Wholesale</strong>
              <span class="badge-buyer">인증 구매기업</span>
            </div>
          </div>

          <div class="quick-rfq-card">
            <div class="card-head">
              <span class="badge-fast">10초 완성</span>
              <h3>원스톱 빠른 RFQ 발행</h3>
            </div>
            <p class="card-sub">원하는 품목을 적으시면 24시간 내 복수 견적 제공</p>

            <form class="fast-rfq-form" @submit.prevent="submitFastRfq">
              <input
                v-model="fastRfq.title"
                type="text"
                placeholder="필요한 품목 (예: SUS304 텀블러 5,000개)"
                required
              />
              <div class="qty-row">
                <input
                  v-model.number="fastRfq.quantity"
                  type="number"
                  placeholder="수량"
                  min="1"
                  required
                />
                <select v-model="fastRfq.unit">
                  <option value="pcs">pcs (개)</option>
                  <option value="sets">sets (세트)</option>
                  <option value="kg">kg (킬로그램)</option>
                  <option value="rolls">rolls (롤)</option>
                </select>
              </div>
              <button type="submit" class="btn-fast-rfq" :disabled="submittingRfq">
                {{ submittingRfq ? '발행 중...' : '견적 요청서 즉시 발행 ⚡' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <!-- Top Ranking (산업별 인기 품목) -->
    <section class="section-block">
      <div class="section-header">
        <div class="title-with-icon">
          <span class="section-icon">🏆</span>
          <div>
            <h2>Top Ranking: 글로벌 도매 인기 랭킹</h2>
            <p>월간 발주량 및 바이어 재구매율 기준 최상위 도매 품목</p>
          </div>
        </div>
        <router-link :to="`/${currentLocale}/${currentCurrency}/catalog?sort=rating`" class="more-link">
          전체 랭킹 보기 ›
        </router-link>
      </div>

      <div class="product-grid">
        <div
          v-for="(product, idx) in topRankingProducts"
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <div class="card-media">
            <span class="rank-badge" :class="`rank-${idx + 1}`">Top {{ idx + 1 }}</span>
            <img :src="product.thumbnail || product.images[0]" :alt="product.title" class="product-img" />
            <span v-if="product.trade_assurance" class="ta-badge">🛡️ Trade Assurance</span>
          </div>
          <div class="card-body">
            <h4 class="product-title" :title="product.title">{{ product.title }}</h4>
            <div class="price-tier-row">
              <span class="price">{{ formatMoney(product.price_tiers[0]?.unit_price) }}</span>
              <span class="unit">/ {{ product.unit }}</span>
            </div>
            <div class="meta-row">
              <span class="moq">MOQ: {{ product.moq }} {{ product.unit }}</span>
              <span class="rating">⭐ {{ product.rating }} ({{ product.reviews_count }})</span>
            </div>
            <div class="supplier-info">
              <span class="sup-flag">🇰🇷</span>
              <span class="sup-name">{{ product.supplier_name.split(' (')[0] }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Ready to Ship & Sample Center (2-Column Feature) -->
    <section class="section-block two-col-section">
      <div class="col-box ready-to-ship-box">
        <div class="box-head">
          <div class="head-text">
            <span class="badge-red">빠른 선적</span>
            <h3>⚡ Ready to Ship (즉시 출고관)</h3>
            <p>공장 실재고 보유, 48시간 내 선적항 발송 가능 품목</p>
          </div>
          <router-link :to="`/${currentLocale}/${currentCurrency}/catalog?incoterm=FOB`" class="btn-sm">
            더보기 ›
          </router-link>
        </div>
        <div class="mini-grid">
          <div
            v-for="item in readyToShipProducts"
            :key="item.id"
            class="mini-card"
            @click="goToProduct(item.id)"
          >
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" class="mini-img" />
            <div class="mini-body">
              <h5 class="mini-title">{{ item.title }}</h5>
              <div class="mini-price">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</div>
              <div class="mini-moq">리드타임: {{ item.lead_time_days }}일</div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-box sample-center-box">
        <div class="box-head">
          <div class="head-text">
            <span class="badge-blue">사전 품질 확인</span>
            <h3>🧪 Sample Center (샘플 전용관)</h3>
            <p>대량 발주 전 1~5개 단위 유료 규격 샘플 지원</p>
          </div>
          <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="btn-sm">
            샘플 찾기 ›
          </router-link>
        </div>
        <div class="mini-grid">
          <div
            v-for="item in sampleProducts"
            :key="item.id"
            class="mini-card"
            @click="goToProduct(item.id)"
          >
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" class="mini-img" />
            <div class="mini-body">
              <h5 class="mini-title">{{ item.title }}</h5>
              <div class="mini-price">샘플가: {{ formatMoney(item.sample_price) }}</div>
              <div class="mini-moq">샘플 발송: {{ item.sample_lead_time_days }}일 이내</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Verified Suppliers Showcase -->
    <section class="section-block verified-suppliers-section">
      <div class="section-header">
        <div class="title-with-icon">
          <span class="section-icon">🏭</span>
          <div>
            <h2>Verified Supplier: 인증 제조기업 쇼케이스</h2>
            <p>SGS / TÜV 제3자 현장 실사 및 ISO 9001 품질 인증 제조사</p>
          </div>
        </div>
        <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/11111111-1111-1111-1111-111111111111`" class="more-link">
          공급사 미니사이트 방문 ›
        </router-link>
      </div>

      <div class="supplier-showcase-card">
        <div class="supplier-main-info">
          <div class="sup-brand-header">
            <h3>Precision Korea Co., Ltd. (글로벌정밀산업)</h3>
            <span class="v-pill">✓ Verified Manufacturer (ISO 9001 / CE)</span>
          </div>
          <p class="sup-tagline">산업용 스테인리스 정밀 브레이징 용기 및 고압 밸브 전문 제조사</p>
          <div class="sup-stats-row">
            <div class="stat">
              <strong>15,000 m²</strong>
              <span>공장 부지 면적</span>
            </div>
            <div class="stat">
              <strong>8개 라인</strong>
              <span>자동화 생산 설비</span>
            </div>
            <div class="stat">
              <strong>14명</strong>
              <span>품질 검수원 (QC)</span>
            </div>
            <div class="stat">
              <strong>$12.5M+</strong>
              <span>연간 해외 수출 실적</span>
            </div>
            <div class="stat">
              <strong>99.2%</strong>
              <span>인콰이어리 응답률</span>
            </div>
          </div>
          <div class="sup-actions">
            <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/11111111-1111-1111-1111-111111111111`" class="btn-storefront">
              공장 VR 투어 및 전용관 열기 🏭
            </router-link>
            <router-link :to="`/${currentLocale}/${currentCurrency}/messages`" class="btn-inquiry">
              제조사 1:1 직통 문의 💬
            </router-link>
          </div>
        </div>

        <div class="supplier-products-row">
          <div
            v-for="p in supplierFeaturedProducts"
            :key="p.id"
            class="sup-p-card"
            @click="goToProduct(p.id)"
          >
            <img :src="p.thumbnail || p.images[0]" :alt="p.title" />
            <span class="p-title">{{ p.title }}</span>
            <strong class="p-price">{{ formatMoney(p.price_tiers[0]?.unit_price) }}</strong>
          </div>
        </div>
      </div>
    </section>

    <!-- 5 Major Categories Showcase Grid -->
    <section class="section-block category-shelves-section">
      <div class="section-header">
        <div class="title-with-icon">
          <span class="section-icon">📦</span>
          <div>
            <h2>5대 핵심 산업 카테고리 기획전</h2>
            <p>산업기계, 전자부품, 패키징, 주방생활, 화학원자재 25개 소분류 직거래</p>
          </div>
        </div>
      </div>

      <div class="category-tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="cat-tab-btn"
          :class="{ active: activeShelfCat === cat.id }"
          @click="activeShelfCat = cat.id"
        >
          <span>{{ cat.icon }}</span> {{ cat.name.split(' (')[0] }}
        </button>
      </div>

      <div class="shelf-product-grid">
        <div
          v-for="item in currentShelfProducts"
          :key="item.id"
          class="product-card"
          @click="goToProduct(item.id)"
        >
          <div class="card-media">
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" class="product-img" />
            <span v-if="item.trade_assurance" class="ta-badge">🛡️ Trade Assurance</span>
          </div>
          <div class="card-body">
            <span class="sub-badge">{{ item.sub_category }}</span>
            <h4 class="product-title" :title="item.title">{{ item.title }}</h4>
            <div class="price-tier-row">
              <span class="price">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</span>
              <span class="unit">/ {{ item.unit }}</span>
            </div>
            <div class="meta-row">
              <span class="moq">MOQ: {{ item.moq }} {{ item.unit }}</span>
              <span class="incoterm">{{ item.incoterms }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';

const route = useRoute();
const router = useRouter();

const currentLocale = computed<SupportedLocale>(() => {
  const loc = (route.params.locale as string) || 'ko';
  return ['ko', 'en', 'zh', 'ja'].includes(loc) ? (loc as SupportedLocale) : 'ko';
});

const currentCurrency = computed<SupportedCurrency>(() => {
  const cur = (route.params.currency as string) || 'KRW';
  return ['KRW', 'USD', 'CNY', 'JPY'].includes(cur) ? (cur as SupportedCurrency) : 'KRW';
});

function formatMoney(usdAmount: string | number) {
  return formatCurrency(usdAmount, currentCurrency.value);
}

const categories = ref<any[]>([]);
const selectedCategory = ref<any>(null);
const allProducts = ref<any[]>([]);
const activeShelfCat = ref('CAT-IND');
const submittingRfq = ref(false);

const fastRfq = ref({
  title: '',
  quantity: 1000,
  unit: 'pcs',
});

const topRankingProducts = computed(() => {
  return allProducts.value.slice(0, 6);
});

const readyToShipProducts = computed(() => {
  return allProducts.value.filter(p => p.lead_time_days <= 14).slice(0, 4);
});

const sampleProducts = computed(() => {
  return allProducts.value.filter(p => p.sample_price).slice(0, 4);
});

const supplierFeaturedProducts = computed(() => {
  return allProducts.value.filter(p => p.organization_id === '11111111-1111-1111-1111-111111111111').slice(0, 4);
});

const currentShelfProducts = computed(() => {
  return allProducts.value.filter(p => p.category === activeShelfCat.value).slice(0, 8);
});

async function loadData() {
  try {
    const [catRes, prodRes] = await Promise.all([
      apiRequest('/catalog/categories'),
      apiRequest('/catalog/listings'),
    ]);
    categories.value = catRes?.categories || [];
    if (categories.value.length > 0) {
      selectedCategory.value = categories.value[0];
    }
    allProducts.value = prodRes?.items || [];
  } catch (err) {
    console.warn('Failed to load initial catalog data:', err);
  }
}

function goToProduct(id: string) {
  router.push(`/${currentLocale.value}/${currentCurrency.value}/products/${id}`);
}

async function submitFastRfq() {
  if (!fastRfq.value.title) return;
  submittingRfq.value = true;
  try {
    const res = await apiRequest('/sourcing/rfqs', {
      method: 'POST',
      body: JSON.stringify({
        title: fastRfq.value.title,
        quantity: fastRfq.value.quantity,
        unit: fastRfq.value.unit,
        category: 'CAT-IND',
        destination_country: 'KR',
      }),
    });
    alert(`RFQ가 성공적으로 발행되었습니다!\n발행 번호: ${res.id}\n공급사 견적이 도착하면 알림을 드립니다.`);
    fastRfq.value.title = '';
  } catch (err: any) {
    alert(`RFQ 발행 실패: ${err.message}`);
  } finally {
    submittingRfq.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 60px;
}

/* Hero Section */
.hero-section {
  background: #FFF;
  border-bottom: 1px solid #E2E8F0;
  padding: 16px 0 24px;
}
.hero-container {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 16px;
  display: grid;
  grid-template-columns: 260px 1fr 300px;
  gap: 16px;
}

/* Category Sidebar */
.hero-categories {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
}
.category-header {
  background: #0F172A;
  color: #FFF;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.cat-item {
  border-bottom: 1px solid #F1F5F9;
}
.cat-item:hover, .cat-item.active {
  background: #FFF7ED;
}
.cat-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: #334155;
  text-decoration: none;
  font-size: 13px;
  font-weight: 500;
  gap: 10px;
}
.cat-link .arrow {
  margin-left: auto;
  color: #94A3B8;
  font-weight: bold;
}
.cat-item:hover .cat-link {
  color: #EA580C;
}

/* Hero Banner */
.hero-banner {
  background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
  border-radius: 8px;
  padding: 32px 36px 20px;
  color: #FFF;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}
.banner-badge {
  display: inline-block;
  background: rgba(234, 88, 12, 0.2);
  color: #FB923C;
  border: 1px solid #EA580C;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 14px;
}
.banner-title {
  font-size: 28px;
  line-height: 1.3;
  margin: 0 0 12px;
  font-weight: 800;
}
.banner-desc {
  font-size: 14px;
  line-height: 1.6;
  color: #CBD5E1;
  margin: 0 0 24px;
}
.banner-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}
.btn-primary {
  background: #FF6A00;
  color: #FFF;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 700;
  font-size: 14px;
}
.btn-primary:hover {
  background: #E55E00;
}
.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #FFF;
  border: 1px solid rgba(255, 255, 255, 0.25);
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}
.hero-guarantees {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
.guarantee-item {
  display: flex;
  gap: 10px;
  align-items: center;
}
.g-icon {
  font-size: 20px;
}
.guarantee-item strong {
  display: block;
  font-size: 12px;
  color: #F8FAFC;
}
.guarantee-item p {
  margin: 2px 0 0;
  font-size: 11px;
  color: #94A3B8;
}

/* Fast RFQ Box */
.hero-rfq-box {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.user-greeting-card {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-avatar-circle {
  width: 44px;
  height: 44px;
  background: #E0E7FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.user-info {
  display: flex;
  flex-direction: column;
}
.welcome-text {
  font-size: 11px;
  color: #64748B;
}
.user-name {
  font-size: 13px;
  color: #0F172A;
}
.badge-buyer {
  display: inline-block;
  background: #DCFCE7;
  color: #166534;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  margin-top: 2px;
  width: fit-content;
}

.quick-rfq-card {
  background: #FFF;
  border: 1px solid #FED7AA;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(251, 146, 60, 0.08);
}
.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.badge-fast {
  background: #EA580C;
  color: #FFF;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
}
.card-head h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0F172A;
}
.card-sub {
  font-size: 11px;
  color: #64748B;
  margin: 0 0 12px;
}
.fast-rfq-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.fast-rfq-form input, .fast-rfq-form select {
  padding: 8px 10px;
  border: 1px solid #CBD5E1;
  border-radius: 6px;
  font-size: 12px;
  box-sizing: border-box;
}
.qty-row {
  display: grid;
  grid-template-columns: 1fr 90px;
  gap: 8px;
}
.btn-fast-rfq {
  background: #EA580C;
  color: #FFF;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
}
.btn-fast-rfq:hover {
  background: #C2410C;
}

/* Sections */
.section-block {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0 16px;
  box-sizing: border-box;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
  border-bottom: 2px solid #F1F5F9;
  padding-bottom: 10px;
}
.title-with-icon {
  display: flex;
  align-items: center;
  gap: 12px;
}
.section-icon {
  font-size: 28px;
}
.title-with-icon h2 {
  font-size: 18px;
  font-weight: 800;
  margin: 0;
  color: #0F172A;
}
.title-with-icon p {
  font-size: 12px;
  color: #64748B;
  margin: 4px 0 0;
}
.more-link {
  color: #EA580C;
  font-weight: 700;
  font-size: 13px;
  text-decoration: none;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 14px;
}
.product-card {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}
.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  border-color: #EA580C;
}
.card-media {
  position: relative;
  width: 100%;
  padding-top: 100%;
  background: #F8FAFC;
}
.product-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.rank-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #DC2626;
  color: #FFF;
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 4px;
  z-index: 2;
}
.rank-1 { background: #DC2626; }
.rank-2 { background: #EA580C; }
.rank-3 { background: #F59E0B; }
.ta-badge {
  position: absolute;
  bottom: 6px;
  left: 6px;
  background: rgba(15, 23, 42, 0.85);
  color: #38BDF8;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.card-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.product-title {
  font-size: 12px;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.price-tier-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.price-tier-row .price {
  font-size: 15px;
  font-weight: 800;
  color: #EA580C;
}
.price-tier-row .unit {
  font-size: 11px;
  color: #64748B;
}
.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #64748B;
}
.supplier-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #475569;
  border-top: 1px solid #F1F5F9;
  padding-top: 6px;
  margin-top: 4px;
}
.sup-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Two Column Section */
.two-col-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.col-box {
  background: #FFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 20px;
}
.box-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.badge-red {
  background: #FEE2E2;
  color: #B91C1C;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.badge-blue {
  background: #E0E7FF;
  color: #3730A3;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
}
.head-text h3 {
  margin: 6px 0 2px;
  font-size: 16px;
  font-weight: 800;
  color: #0F172A;
}
.head-text p {
  margin: 0;
  font-size: 12px;
  color: #64748B;
}
.btn-sm {
  font-size: 12px;
  color: #EA580C;
  text-decoration: none;
  font-weight: 700;
}
.mini-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.mini-card {
  border: 1px solid #F1F5F9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}
.mini-card:hover {
  border-color: #CBD5E1;
}
.mini-img {
  width: 100%;
  height: 100px;
  object-fit: cover;
}
.mini-body {
  padding: 6px;
}
.mini-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mini-price {
  font-size: 12px;
  font-weight: 700;
  color: #EA580C;
  margin-top: 2px;
}
.mini-moq {
  font-size: 10px;
  color: #94A3B8;
}

/* Verified Supplier Showcase */
.supplier-showcase-card {
  background: #FFF;
  border: 1px solid #CBD5E1;
  border-radius: 8px;
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.sup-brand-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.sup-brand-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #0F172A;
}
.v-pill {
  background: #DCFCE7;
  color: #15803D;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}
.sup-tagline {
  color: #475569;
  font-size: 13px;
  margin: 0 0 16px;
}
.sup-stats-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: #F8FAFC;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
}
.stat strong {
  display: block;
  font-size: 14px;
  color: #0F172A;
  font-weight: 800;
}
.stat span {
  font-size: 10px;
  color: #64748B;
}
.sup-actions {
  display: flex;
  gap: 10px;
}
.btn-storefront {
  background: #0F172A;
  color: #FFF;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}
.btn-inquiry {
  background: #FFF7ED;
  color: #EA580C;
  border: 1px solid #FED7AA;
  padding: 8px 16px;
  border-radius: 6px;
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
}
.supplier-products-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.sup-p-card {
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}
.sup-p-card:hover {
  border-color: #EA580C;
}
.sup-p-card img {
  width: 100%;
  height: 120px;
  object-fit: cover;
}
.sup-p-card .p-title {
  font-size: 11px;
  font-weight: 600;
  padding: 6px 6px 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sup-p-card .p-price {
  font-size: 12px;
  color: #EA580C;
  padding: 0 6px 6px;
}

/* Category Shelves */
.category-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  overflow-x: auto;
}
.cat-tab-btn {
  background: #FFF;
  border: 1px solid #CBD5E1;
  padding: 8px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}
.cat-tab-btn.active {
  background: #EA580C;
  color: #FFF;
  border-color: #EA580C;
}
.shelf-product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.sub-badge {
  display: inline-block;
  background: #F1F5F9;
  color: #475569;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}
</style>

