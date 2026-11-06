<template>
  <div class="ws-page ws-page-wide home">
    <!-- Marketplace hero: category nav + promo banner + buyer card -->
    <section class="ali-hero">
      <nav class="ali-cats" aria-label="주요 산업 대분류">
        <p class="ali-cats-head"><WsIcon name="menu" :size="14" /> All Categories</p>
        <router-link
          v-for="cat in categories"
          :key="cat.id"
          :to="`/${currentLocale}/${currentCurrency}/catalog?category=${cat.id}`"
          @mouseenter="selectedCategory = cat"
        >
          <WsIcon :name="catIcon(cat.id)" :size="15" /> {{ cat.name.split(' (')[0] }} <span aria-hidden="true">›</span>
        </router-link>
      </nav>
      <div class="ali-banner">
        <div class="ali-banner-text">
          <p class="ali-kicker"><WsIcon name="shield" :size="13" /> Trade Assurance 보안 연동</p>
          <h1>글로벌 무역 안심 거래,<br />선급금 30% 에스크로 보호</h1>
          <p>계약서 전자서명 · 제3자 품질 검수 · 선하증권 확인까지</p>
          <div class="ali-banner-cta">
            <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="ws-btn ws-btn-accent ws-btn-lg">도매 카탈로그 탐색</router-link>
            <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="ws-btn ws-btn-outline-accent ws-btn-lg">무료 RFQ 견적 요청</router-link>
          </div>
        </div>
        <div class="ali-banner-proof">
          <div><b>100%</b><span>에스크로 대금 보호</span></div>
          <div><b>48h</b><span>즉시출고 선적</span></div>
          <div><b>24h</b><span>RFQ 복수 견적</span></div>
        </div>
      </div>
      <aside class="ali-side">
        <div class="ali-signin">
          <span class="ws-avatar"><WsIcon name="building" :size="18" /></span>
          <p><b>안녕하세요, 바이어님</b><span>기업 계정으로 더 많은 혜택을 받으세요</span></p>
          <router-link :to="`/${currentLocale}/${currentCurrency}/login`" class="ws-btn ws-btn-accent ws-btn-block">로그인 / 가입</router-link>
        </div>
        <div class="ali-rfq">
          <p><b>찾는 품목이 없나요?</b><span>RFQ 발행 후 24시간 내 복수 견적 수신</span></p>
          <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="ws-btn ws-btn-outline-accent ws-btn-block ws-btn-sm">RFQ 무료 발행</router-link>
        </div>
        <ul class="ali-protect">
          <li><WsIcon name="lock" :size="14" /> 에스크로 안심 결제</li>
          <li><WsIcon name="truck" :size="14" /> Incoterms® 2020</li>
          <li><WsIcon name="search" :size="14" /> SGS 인증 제조사</li>
        </ul>
      </aside>
    </section>

    <!-- Category tiles -->
    <nav class="ws-cat-tiles home-cats" aria-label="주요 산업 대분류">
      <router-link
        v-for="cat in categories.slice(0, 6)"
        :key="cat.id"
        :to="`/${currentLocale}/${currentCurrency}/catalog?category=${cat.id}`"
        class="ws-cat-tile"
        @mouseenter="selectedCategory = cat"
      >
        <span class="ws-cat-tile-icon"><WsIcon :name="catIcon(cat.id)" :size="19" /></span>
        <b>{{ cat.name.split(' (')[0] }}</b>
        <span>직거래관 입장 ›</span>
      </router-link>
    </nav>

    <!-- Trust bar -->
    <div class="ws-trustbar">
      <span class="ws-trustbar-item"><WsIcon name="lock" :size="16" /> 에스크로 안심 결제 — 납품 완료까지 정산금 보관</span>
      <span class="ws-trustbar-item"><WsIcon name="truck" :size="16" /> Incoterms® 2020 — FOB / CIF / DDP 실시간 운임</span>
      <span class="ws-trustbar-item"><WsIcon name="search" :size="16" /> SGS / TÜV 인증 제조사만 입점</span>
    </div>

    <!-- Fast RFQ band -->
    <section class="rfq-band">
      <div class="rfq-band-text">
        <span class="ws-badge ws-badge-brand">10초 완성</span>
        <h2>원스톱 빠른 RFQ 발행</h2>
        <p>원하는 품목을 적으시면 24시간 내 복수 견적을 제공합니다.</p>
      </div>
      <form class="rfq-band-form" @submit.prevent="submitFastRfq">
        <input v-model="fastRfq.title" type="text" placeholder="필요한 품목 (예: SUS304 텀블러 5,000개)" required />
        <input v-model.number="fastRfq.quantity" type="number" placeholder="수량" min="1" required class="rfq-qty" />
        <select v-model="fastRfq.unit" class="rfq-unit">
          <option value="pcs">pcs</option>
          <option value="sets">sets</option>
          <option value="kg">kg</option>
          <option value="rolls">rolls</option>
        </select>
        <button type="submit" class="ws-btn ws-btn-accent" :disabled="submittingRfq">
          {{ submittingRfq ? '발행 중...' : '견적 요청 발행' }} <WsIcon v-if="!submittingRfq" name="bolt" :size="14" />
        </button>
      </form>
    </section>

    <!-- Top ranking -->
    <section class="ws-section">
      <div class="ws-section-head">
        <h2 class="ws-section-title">글로벌 도매 인기 랭킹</h2>
        <router-link :to="`/${currentLocale}/${currentCurrency}/catalog?sort=rating`" class="ws-section-more">전체 랭킹 보기 ›</router-link>
      </div>
      <p class="section-lead">월간 발주량·바이어 재구매율 기준 최상위 품목</p>
      <div class="rank-grid">
        <article v-for="(product, idx) in topRankingProducts" :key="product.id" class="p-card" @click="goToProduct(product.id)">
          <div class="p-media">
            <span class="rank-tag" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
            <img :src="product.thumbnail || product.images[0]" :alt="product.title" loading="lazy" />
            <span v-if="product.trade_assurance" class="ta-tag"><WsIcon name="shield" :size="12" /> TA</span>
          </div>
          <div class="p-body">
            <h3 :title="product.title">{{ product.title }}</h3>
            <p class="p-price"><span class="ws-price-dark ws-price-dark-lg">{{ formatMoney(product.price_tiers[0]?.unit_price) }}</span> <span class="ws-muted">/ {{ product.unit }}</span></p>
            <p class="p-meta"><span class="ws-moq">MOQ: <b>{{ product.moq }} {{ product.unit }}</b></span> · <WsIcon name="star" :size="12" class="ws-star" /> {{ product.rating }} ({{ product.reviews_count }})</p>
            <p class="p-sup">{{ product.supplier_name.split(' (')[0] }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- Ready to ship + Sample center -->
    <section class="ws-section duo">
      <div class="ws-card duo-card">
        <div class="ws-card-head">
          <h3><WsIcon name="bolt" :size="16" class="h-ico" /> Ready to Ship</h3>
          <router-link :to="`/${currentLocale}/${currentCurrency}/catalog?incoterm=FOB`" class="ws-section-more">더보기 ›</router-link>
        </div>
        <p class="ws-card-sub">공장 실재고 보유 · 48시간 내 선적항 발송</p>
        <div class="mini-list">
          <div v-for="item in readyToShipProducts" :key="item.id" class="mini-row" @click="goToProduct(item.id)">
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" loading="lazy" />
            <div class="ws-list-main">
              <p class="ws-list-title">{{ item.title }}</p>
              <p class="ws-list-sub">리드타임 {{ item.lead_time_days }}일</p>
            </div>
            <b class="ws-price-dark">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</b>
          </div>
        </div>
      </div>
      <div class="ws-card duo-card">
        <div class="ws-card-head">
          <h3><WsIcon name="flask" :size="16" class="h-ico" /> Sample Center</h3>
          <router-link :to="`/${currentLocale}/${currentCurrency}/catalog`" class="ws-section-more">샘플 찾기 ›</router-link>
        </div>
        <p class="ws-card-sub">대량 발주 전 1~5개 단위 유료 규격 샘플</p>
        <div class="mini-list">
          <div v-for="item in sampleProducts" :key="item.id" class="mini-row" @click="goToProduct(item.id)">
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" loading="lazy" />
            <div class="ws-list-main">
              <p class="ws-list-title">{{ item.title }}</p>
              <p class="ws-list-sub">샘플 발송 {{ item.sample_lead_time_days }}일 이내</p>
            </div>
            <b class="ws-price-dark">{{ formatMoney(item.sample_price) }}</b>
          </div>
        </div>
      </div>
    </section>

    <!-- Verified supplier -->
    <section class="ws-section">
      <div class="showcase">
        <div class="showcase-info">
          <p class="ws-hero-eyebrow show-eyebrow"><WsIcon name="factory" :size="14" /> Verified Manufacturer</p>
          <h2>Precision Korea Co., Ltd.</h2>
          <p class="show-sub">산업용 스테인리스 정밀 브레이징 용기·고압 밸브 전문 제조사</p>
          <div class="show-stats">
            <div><b>15,000 m²</b><span>공장 부지</span></div>
            <div><b>8개 라인</b><span>자동화 설비</span></div>
            <div><b>14명</b><span>품질 검수원</span></div>
            <div><b>$12.5M+</b><span>연간 수출</span></div>
            <div><b>99.2%</b><span>문의 응답률</span></div>
          </div>
          <div class="show-cta">
            <router-link :to="`/${currentLocale}/${currentCurrency}/suppliers/11111111-1111-1111-1111-111111111111`" class="ws-btn ws-btn-accent">공장 VR 투어·전용관 열기</router-link>
            <router-link :to="`/${currentLocale}/${currentCurrency}/messages`" class="ws-btn ws-btn-secondary ws-btn-lg">제조사 1:1 직통 문의</router-link>
          </div>
        </div>
        <div class="show-products">
          <div v-for="p in supplierFeaturedProducts" :key="p.id" class="show-p" @click="goToProduct(p.id)">
            <img :src="p.thumbnail || p.images[0]" :alt="p.title" loading="lazy" />
            <p :title="p.title">{{ p.title }}</p>
            <b>{{ formatMoney(p.price_tiers[0]?.unit_price) }}</b>
          </div>
        </div>
      </div>
    </section>

    <!-- Category shelves -->
    <section class="ws-section">
      <div class="ws-section-head">
        <h2 class="ws-section-title">5대 핵심 산업 기획전</h2>
      </div>
      <p class="section-lead">산업기계 · 전자부품 · 패키징 · 주방생활 · 화학원자재 25개 소분류 직거래</p>
      <div class="ws-tabs">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="ws-tab"
          :class="{ 'ws-tab-active': activeShelfCat === cat.id }"
          @click="activeShelfCat = cat.id"
        >
          <WsIcon :name="catIcon(cat.id)" :size="14" /> {{ cat.name.split(' (')[0] }}
        </button>
      </div>
      <div class="rank-grid">
        <article v-for="item in currentShelfProducts" :key="item.id" class="p-card" @click="goToProduct(item.id)">
          <div class="p-media">
            <img :src="item.thumbnail || item.images[0]" :alt="item.title" loading="lazy" />
            <span v-if="item.trade_assurance" class="ta-tag"><WsIcon name="shield" :size="12" /> TA</span>
          </div>
          <div class="p-body">
            <span class="ws-badge ws-badge-outline sub-tag">{{ item.sub_category }}</span>
            <h3 :title="item.title">{{ item.title }}</h3>
            <p class="p-price"><span class="ws-price-dark ws-price-dark-lg">{{ formatMoney(item.price_tiers[0]?.unit_price) }}</span> <span class="ws-muted">/ {{ item.unit }}</span></p>
            <p class="p-meta"><span class="ws-moq">MOQ: <b>{{ item.moq }} {{ item.unit }}</b></span> · {{ item.incoterms }}</p>
          </div>
        </article>
      </div>
    </section>

    <!-- CTA band -->
    <section class="ws-section">
      <div class="ws-cta-band">
        <div>
          <h3>찾는 품목이 없으신가요? RFQ로 복수 견적을 받으세요.</h3>
          <p>검증 제조사 네트워크에 한 번 발행하면 24시간 내 경쟁 견적이 도착합니다.</p>
        </div>
        <router-link :to="`/${currentLocale}/${currentCurrency}/sourcing/rfq/new`" class="ws-btn ws-btn-accent ws-btn-lg">RFQ 발행하기</router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { apiRequest } from '../api';
import { formatCurrency, SupportedLocale, SupportedCurrency } from '../i18n';
import WsIcon from '@packages/ui/WsIcon.vue';

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

const CAT_ICONS: Record<string, string> = {
  'CAT-IND': 'factory',
  'CAT-ELE': 'bolt',
  'CAT-PKG': 'package',
  'CAT-KIT': 'home',
  'CAT-CHM': 'flask',
};
function catIcon(id: string): any {
  return (CAT_ICONS[id] || 'tag') as any;
}

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
.home { display: flex; flex-direction: column; }
.ali-hero { display: grid; grid-template-columns: 240px minmax(0, 1fr) 264px; gap: 14px; align-items: stretch; }
.ali-cats { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 12px; padding: 8px; display: flex; flex-direction: column; box-shadow: var(--ws-shadow-card); }
.ali-cats-head { display: flex; align-items: center; gap: 8px; margin: 0; padding: 10px 12px; font-size: 13px; font-weight: 800; border-bottom: 1px solid var(--ws-border-subtle); }
.ali-cats a { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; color: var(--ws-text-2); font-size: 13px; font-weight: 600; text-decoration: none; }
.ali-cats a svg { color: var(--ws-text-faint); flex: none; }
.ali-cats a span { margin-left: auto; color: var(--ws-text-faint); }
.ali-cats a:hover { background: var(--ws-brand-faint); color: var(--ws-accent); }
.ali-cats a:hover svg { color: var(--ws-accent); }
.ali-banner { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 12px; box-shadow: var(--ws-shadow-card); padding: 34px 32px 26px; display: flex; flex-direction: column; justify-content: space-between; gap: 20px; position: relative; overflow: hidden; }
.ali-banner::after { content: ""; position: absolute; top: 0; right: 0; width: 220px; height: 100%; background: var(--ws-brand-faint); clip-path: polygon(38% 0, 100% 0, 100% 100%, 0 100%); pointer-events: none; }
.ali-banner-text { position: relative; z-index: 1; }
.ali-kicker { display: inline-flex; align-items: center; gap: 6px; margin: 0 0 12px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--ws-accent); }
.ali-banner-text h1 { margin: 0 0 10px; font-size: 32px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); line-height: 1.25; }
.ali-banner-text > p { margin: 0 0 20px; font-size: 14px; color: var(--ws-text-muted); }
.ali-banner-cta { display: flex; gap: 10px; flex-wrap: wrap; }
.ali-banner-proof { position: relative; z-index: 1; display: flex; gap: 32px; border-top: 1px solid var(--ws-border-subtle); padding-top: 16px; }
.ali-banner-proof b { display: block; font-size: 19px; font-variant-numeric: tabular-nums; }
.ali-banner-proof span { font-size: 11px; color: var(--ws-text-muted); font-weight: 600; }
.ali-side { display: flex; flex-direction: column; gap: 12px; }
.ali-signin, .ali-rfq { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: 12px; padding: 16px; box-shadow: var(--ws-shadow-card); }
.ali-signin { display: flex; flex-direction: column; gap: 10px; align-items: stretch; text-align: center; }
.ali-signin .ws-avatar { margin: 0 auto; }
.ali-signin p, .ali-rfq p { margin: 0; display: flex; flex-direction: column; gap: 2px; }
.ali-signin b, .ali-rfq b { font-size: 14px; }
.ali-signin span, .ali-rfq span { font-size: 12px; color: var(--ws-text-muted); }
.ali-rfq { display: flex; flex-direction: column; gap: 10px; background: var(--ws-brand-faint); border-color: var(--ws-brand-light); }
.ali-protect { list-style: none; margin: 0; padding: 4px 6px; display: flex; flex-direction: column; gap: 8px; font-size: 12px; font-weight: 600; color: var(--ws-text-2); }
.ali-protect li { display: flex; align-items: center; gap: 8px; }
.ali-protect svg { color: var(--ws-success); }
.home-cats { margin-top: 20px; }
.section-lead { margin: -8px 0 16px; font-size: var(--ws-fs-sm); color: var(--ws-text-muted); }

/* Fast RFQ band */
.rfq-band { display: grid; grid-template-columns: 280px minmax(0, 1fr); gap: 24px; align-items: center; background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: var(--ws-radius-lg); box-shadow: var(--ws-shadow-card); padding: 22px 26px; margin-top: 20px; }
.rfq-band-text h2 { margin: 8px 0 4px; font-size: var(--ws-fs-xl); font-weight: 800; letter-spacing: var(--ws-tracking-tight); }
.rfq-band-text p { margin: 0; font-size: var(--ws-fs-sm); color: var(--ws-text-muted); }
.rfq-band-form { display: grid; grid-template-columns: minmax(0, 1fr) 90px 90px auto; gap: 10px; }
.rfq-band-form input, .rfq-band-form select { border: 1px solid var(--ws-border); border-radius: 8px; padding: 11px 12px; font-size: 14px; font-family: var(--ws-font); color: var(--ws-text); background: #fff; }
.rfq-band-form input:focus, .rfq-band-form select:focus { outline: none; border-color: var(--ws-border-focus); box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15); }

/* Product cards */
.rank-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.p-card { background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: var(--ws-radius-card); overflow: hidden; cursor: pointer; box-shadow: var(--ws-shadow-card); transition: border-color 120ms ease; }
.p-card:hover { border-color: var(--ws-brand); }
.p-media { position: relative; aspect-ratio: 4 / 3; background: var(--ws-surface-muted); }
.p-media img { width: 100%; height: 100%; object-fit: cover; display: block; }
.rank-tag { position: absolute; top: 10px; left: 10px; min-width: 28px; height: 28px; padding: 0 8px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; background: #191919; color: #fff; font-size: 13px; font-weight: 900; }
.rank-tag.rank-1 { background: var(--ws-accent); }
.rank-tag.rank-2, .rank-tag.rank-3 { background: #525252; }
.ta-tag { position: absolute; bottom: 10px; left: 10px; display: inline-flex; align-items: center; gap: 4px; background: rgb(11 28 48 / 0.82); color: #7dd3fc; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 9999px; }
.p-body { padding: 14px 14px 16px; }
.p-body h3 { margin: 0 0 8px; font-size: 14px; font-weight: 700; line-height: 1.45; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 40px; }
.p-price { margin: 0 0 6px; font-size: 13px; }
.p-meta { margin: 0 0 6px; font-size: 12px; color: var(--ws-text-muted); display: flex; align-items: center; gap: 4px; }
.p-sup { margin: 0; font-size: 12px; color: var(--ws-text-2); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sub-tag { margin-bottom: 8px; }

/* Duo */
.duo { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.duo-card .h-ico { color: var(--ws-brand); vertical-align: -3px; }
.mini-list { display: flex; flex-direction: column; }
.mini-row { display: flex; align-items: center; gap: 12px; padding: 10px 4px; border-bottom: 1px solid var(--ws-border-subtle); cursor: pointer; border-radius: 6px; }
.mini-row:last-child { border-bottom: 0; }
.mini-row:hover { background: var(--ws-brand-faint); }
.mini-row img { width: 52px; height: 52px; object-fit: cover; border-radius: 8px; background: var(--ws-surface-muted); flex: none; }

/* Showcase */
.showcase { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 28px; background: #fff; border: 1px solid var(--ws-border-subtle); border-radius: var(--ws-radius-lg); box-shadow: var(--ws-shadow-card); padding: 36px; }
.show-eyebrow { color: var(--ws-accent); }
.showcase-info h2 { margin: 0 0 6px; font-size: 26px; font-weight: 900; letter-spacing: var(--ws-tracking-tight); }
.show-sub { margin: 0 0 20px; color: var(--ws-text-muted); font-size: 14px; }
.show-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 24px; }
.show-stats b { display: block; font-size: 17px; font-variant-numeric: tabular-nums; }
.show-stats span { font-size: 11px; color: var(--ws-text-muted); font-weight: 600; }
.show-cta { display: flex; gap: 10px; flex-wrap: wrap; }
.show-products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; align-content: start; }
.show-p { background: var(--ws-surface); border: 1px solid var(--ws-border-subtle); border-radius: 10px; padding: 10px; cursor: pointer; }
.show-p:hover { border-color: var(--ws-accent); }
.show-p img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 6px; background: var(--ws-surface-muted); }
.show-p p { margin: 8px 0 2px; font-size: 12px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.show-p b { font-size: 14px; color: var(--ws-ink-price); font-variant-numeric: tabular-nums; }

@media (max-width: 1024px) {
  .ali-hero { grid-template-columns: minmax(0, 1fr); }
  .ali-cats { display: none; }
  .ali-banner-text h1 { font-size: 26px; }
  .rank-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .duo { grid-template-columns: minmax(0, 1fr); }
  .showcase { grid-template-columns: minmax(0, 1fr); padding: 24px; }
  .rfq-band { grid-template-columns: minmax(0, 1fr); }
}
@media (max-width: 640px) {
  .rfq-band-form { grid-template-columns: minmax(0, 1fr) 80px; }
  .rfq-band-form input:first-child { grid-column: 1 / -1; }
  .rfq-band-form .ws-btn { grid-column: 1 / -1; }
  .show-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
